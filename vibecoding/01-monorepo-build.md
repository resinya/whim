# 01 · 这个 monorepo 怎么打包

目标：把 `pnpm build:naive` 这一条命令**一层层剥开**，看完你应该能回答「为什么要从根目录跑」「产物为什么在那儿」。

---

## 1. 先搞明白仓库的形状

普通项目：一个文件夹一个 `package.json` 一个 `src`。

这个仓库：**一个 git 仓库里塞了几十个 `package.json`**。谁是「一个包」由根目录的 `pnpm-workspace.yaml` 定义（✅ 读代码确认）：

```yaml
packages:
  - apps/*
  - packages/*
  - packages/@core/base/*
  - internal/*
  - scripts/*
  - playground
```

意思是「这些目录下每个含 `package.json` 的子文件夹都是一个独立包」。挑几个认识一下：

| 位置 | 包名 | 角色 |
| --- | --- | --- |
| `apps/web-naive` | `@vben/web-naive` | **应用**：能被打开、被部署成网站的那个 |
| `apps/backend-mock` | `@vben/backend-mock` | 假后端：本地开发时装作有接口 |
| `packages/utils` | `@vben/utils` | **库**：工具函数，被应用 import |
| `packages/@core/base/design` | `@vben-core/design` | 库：样式与主题基础 |
| `internal/vite-config` | `@vben/vite-config` | 库：所有应用共用的打包配置 |
| `playground` | `@vben/playground` | 上游的演示应用，保留未维护 |

### 包之间怎么互相引用

`apps/web-naive/package.json` 里的依赖写成这样（✅ 读代码确认）：

```json
"dependencies": {
  "@vben/utils": "workspace:*"
}
```

`workspace:*` 的意思是：**别去 npm 下载，去这个仓库里找**。你写 `@vben/utils`，pnpm 就把它指向 `packages/utils` 文件夹。

> 版本号也集中管理：`pnpm-workspace.yaml` 里有个 `catalog:` 段落，把 `vue`、`vite`、`naive-ui` 这些第三方库的版本写在一处，各包写 `"naive-ui": "catalog:"` 表示「版本听根目录的」。这样不会出现两个不同版本的 Vue。

### 结论：总账都在根目录

应用想打包，需要知道：workspace 名单（根目录的 `pnpm-workspace.yaml`）、包的先后顺序（根目录的 `turbo.json`）、统一版本号（根目录的 catalog）。**这些「总账」全在根目录。**

---

## 2. 一条命令，三层套娃

### 第 0 层：`pnpm install`（装依赖）

在根目录执行，做四件事：

1. 读 `pnpm-workspace.yaml`，知道有哪些包；
2. 从 `.npmrc` 里配的镜像（`registry.npmmirror.com`）下载第三方库；
3. 把内部包的互相引用做成 `node_modules` 软链接；
4. 跑根 `package.json` 的 `postinstall`：`pnpm -r run --if-present stub`。

**第 4 条值得单独说。** `stub`（桩）是部分内部包的小脚本，作用是「不真正打包，也让 import 能找到源码」。✅ 读代码确认：下面这 8 个包都有 `stub`：

```
internal/vite-config                  internal/node-utils
internal/lint-configs/oxlint-config   internal/lint-configs/oxfmt-config
internal/lint-configs/eslint-config   scripts/vsh          scripts/turbo-run
packages/@core/base/shared
```

所以「装依赖」这一步本身就有副作用、会顺手准备一些包——这也是「必须在根目录装」的原因之一。

### 第 1 层：`pnpm build:naive` 展开成什么

根 `package.json` 里有两行（✅ 读代码确认）：

```json
"build": "cross-env NODE_OPTIONS=--max-old-space-size=8192 turbo build",
"build:naive": "pnpm run build --filter=@vben/web-naive"
```

`build:naive` 的意思是「跑 `build` 脚本，额外带上 `--filter=@vben/web-naive`」。参数追加到命令末尾，**真正执行的是**：

```bash
cross-env NODE_OPTIONS=--max-old-space-size=8192 turbo build --filter=@vben/web-naive
```

| 片段 | 作用 |
| --- | --- |
| `cross-env` | 环境变量写法跨平台通用（Windows/Mac/Linux） |
| `NODE_OPTIONS=--max-old-space-size=8192` | 把 Node 内存上限抬到 8GB。大项目打包吃内存，默认上限可能不够 |
| `turbo build` | **交给 turbo 总调度**，不是直接跑 vite |
| `--filter=@vben/web-naive` | 只针对这个包，以及它依赖的东西 |

### 第 2 层：turbo 按依赖图决定先后

根目录 `turbo.json`（✅ 读代码确认）：

```json
"tasks": {
  "build": {
    "dependsOn": ["^build"],
    "outputs": ["dist/**", "dist.zip", ".vitepress/dist/**", ...]
  }
}
```

**`"^build"` 是整个仓库最核心的一行。** `^` 读作「我上面那些包」，整句意思是：

> 要 build 一个包，先把**它在 workspace 里依赖的包** build 完。

于是 turbo 画出一张图，从叶子往根跑：

```
@vben-core/design ──build──▶ 产物
@vben/utils ────────▶
        │
        ▼
@vben/web-naive ────build──▶ apps/web-naive/dist
```

**证据**：这个仓库的构建日志里会出现 `@vben-core/design:build` 这个你从没直接跑过的任务，就是被 turbo 顺图拉起来的；那次 turbo 一共排了 5 个任务。**✅ 读代码 + 日志确认**

`outputs` 那行是给**缓存**用的：turbo 记下「这些是产物」，下次源码没变就直接跳过（本地第二次打包飞快就是这个原因）。

### 第 3 层：应用自己怎么打包（vite build）

轮到 `@vben/web-naive` 时，它自己的脚本是（✅ 读代码确认）：

```json
"build": "pnpm vite build --mode production"
```

- **`vite build`**：从 `index.html` 出发，顺着 `import` 关系，把所有 JS/CSS 合并、压缩、加哈希文件名，吐到 `dist/`。
- **`--mode production`**：告诉 Vite 按生产环境读配置，也就是去读 `apps/web-naive/.env.production`。这个文件直接决定线上长什么样：

```ini
VITE_BASE=/                    # 网站部署在根路径
VITE_GLOB_API_URL=https://...  # 线上接口地址
VITE_ROUTER_HISTORY=hash       # 路由模式（详见 03-routing.md）
VITE_ARCHIVER=true             # 打包完再压一个 dist.zip
```

- **产物在哪**：`apps/web-naive/dist`。✅ 读代码确认：`internal/vite-config` 这套共用配置**没有覆盖 `outDir`**，用的是 Vite 默认值 `dist`。

### 一个容易误解的点：库的产物其实没被用上

那些 `@vben/*` 包虽然被 turbo 先 build 了一遍，但**应用最终是把它们的源码直接编进产物的**。

证据在它们的 `exports` 字段——把开发和生产两个条件**都指向源码**（✅ 读代码确认）：

```json
// packages/utils/package.json
"exports": { ".": { "types": "./src/index.ts", "default": "./src/index.ts" } }

// packages/@core/base/design/package.json
".": {
  "types": "./src/index.ts",
  "development": "./src/index.ts",
  "production": "./src/index.ts",
  "default": "./dist/design.css"   // ← 只有这个分支指向产物
}
```

所以 turbo 先 build 它们，是**仓库把依赖顺序定成了这样**（也让 `default` 分支的产物存在），不等于应用非用那个产物不可。

---

## 3. 打包结果长什么样

```
apps/web-naive/dist/
├── index.html          ← 唯一的一张「壳」页面
├── assets/
│   ├── index-a1b2c3.js ← 应用代码
│   └── index-d4e5f6.css
├── favicon.ico
└── scenarios/h5/...    ← public 里的静态文件原样复制
apps/web-naive/dist.zip  ← VITE_ARCHIVER=true 额外压的，Vercel 用不到
```

> **记住一句话：不管有多少页面、多少条路由，打包出来永远只有这一个 `index.html`。** 这句话是理解 [03-routing.md](./03-routing.md) 的前提。

`dist.zip` 是 `VITE_ARCHIVER=true` 的产物。✅ 读代码确认：实现是 `internal/vite-config/src/plugins/archiver.ts`，它把 `dist` 压成 zip 放到 `process.cwd()` 下。自建服务器传 FTP 时有用，Vercel 上用不到，可以关掉省一次压缩。

---

## 4. 为什么必须从根目录跑

因为总账（workspace 名单、依赖图、catalog 版本）全在根目录，而且 `pnpm install` 的 `postinstall` 要在全仓库范围跑 `stub`。

这也是 Vercel 上 **Root Directory 必须留仓库根目录**的原因——见 [02-vercel-deploy.md](./02-vercel-deploy.md)。

---

## 5. 自己怎么验证这些结论

```bash
pnpm install
pnpm build:naive
ls apps/web-naive/dist/index.html    # 存在 → 产物目录判断正确
```

想看得更细，可以只跑一个包，观察 turbo 排了哪些任务：

```bash
pnpm exec turbo build --filter=@vben/web-naive --dry=json
```

⚠️ **未能实测**：这篇笔记里的构建结论，来自读配置和源码，我没能在本机真正跑完一次 `pnpm build:naive`（Vite 内部调用系统命令时撞上我这边的沙箱限制，报 `spawn EPERM`）。**「产物在 `apps/web-naive/dist`」是推断，不是亲眼所见**——第 5 节两条命令你本地跑一次就能确认。

---

## 6. 附：`stub` 打桩与 tsdown 的坑

第 2 节第 0 层提到，`pnpm install` 最后会跑 `pnpm -r run --if-present stub`。有 `stub` 脚本的包一共 8 个：

```
@vben/vite-config      @vben/node-utils       @vben/eslint-config
@vben/oxfmt-config     @vben/oxlint-config    @vben/turbo-run
@vben/vsh              @vben-core/shared
```

### 其中 `@vben/vite-config` 的 stub 不能删

它的 `exports` 是：

```json
".": { "types": "./src/index.ts", "default": "./dist/index.mjs" }
```

**运行时只有 `dist/index.mjs` 一个出口**——没有像别的包那样把 `development`/`production` 指向 `src`。而 `apps/web-naive/vite.config.ts` 第一行就是：

```ts
import { defineConfig } from '@vben/vite-config';
```

所以**它必须先被打桩，应用才能打包**。这也是「装依赖失败 = 整个部署失败」的原因：`postinstall` 里任何一个 stub 挂了，`pnpm install` 就退出 1，后面什么都跑不了。

> 反例对照：`packages/utils`、`packages/@core/ui-kit/*` 的 `exports` 把 `development` 和 `production` **都指向 `src`**，那些包的打桩产物只服务于 `default` 分支（发布到 npm 的场景），本地开发和应用打包都走源码。

### 踩过的坑：废弃的 `deps.skipNodeModulesBundle`

这些 tsdown 配置里原来都写着：

```ts
deps: { skipNodeModulesBundle: true }
```

tsdown 每次都警告：

```
WARN  `deps.skipNodeModulesBundle` is deprecated. Use `deps.neverBundle: true` instead.
```

装上更新版 tsdown（如 `0.23.0`）后，这个废弃选项的行为变了：node_modules 里的依赖被卷进打桩产物，撞上某个依赖里 `import esbuild from 'esbuild'` 的 CJS/ESM 互操作，直接报 `Missing export` 让构建失败。

**已全部迁移成 `deps: { neverBundle: true }`**（8 个文件：`internal/vite-config`、`internal/node-utils`、`internal/lint-configs/eslint-config`、`packages/@core/ui-kit/` 下 5 个）。

本地实测结果——迁移后产物**字节数完全一致**，废弃警告消失：

| 包 | 迁移前 | 迁移后 |
| --- | --- | --- |
| `@vben/vite-config` | `dist/index.mjs 32.23 kB` | `32.23 kB` ✅ |
| `@vben/node-utils` | `dist/index.mjs 6.82 kB` | `6.82 kB` ✅ |
| `@vben/eslint-config` | `dist/index.mjs 24.36 kB` | `24.36 kB` ✅ |
