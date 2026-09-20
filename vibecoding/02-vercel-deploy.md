# 02 · 部署到 Vercel

前置：先看 [01-monorepo-build.md](./01-monorepo-build.md)，那里解释了「构建产物是什么」。这篇讲「怎么把产物变成网站」。

---

## 1. Vercel 到底是什么

把它想成一个**自动帮你跑命令、然后把某个文件夹挂到全世界的服务器**：

```
你的 GitHub 仓库
      │ ① 装依赖（pnpm install）
      │ ② 跑构建命令（pnpm build:naive）
      │ ③ 拿走产物文件夹（apps/web-naive/dist）
      ▼
   Vercel 的 CDN ──▶ 全世界的浏览器
```

**第 ③ 步之后，你的项目就变成了一堆静态文件（HTML/JS/CSS/图片）。Vercel 不执行你的 Node 代码，不跑 `src`，也不会跑 `apps/backend-mock`。** 浏览器拿到的只有那一个 `index.html` 加几个 JS，剩下的活全在浏览器里干。

（Vercel 也能跑后端代码，叫 Serverless Functions，但这个项目没用上。）

---

## 2. 四个设置项

Vercel 建项目时能填的东西，本质就四个：

| 设置项 | 作用 | 这个项目填什么 |
| --- | --- | --- |
| **Root Directory** | 从哪个目录算「项目根」（决定用哪个 `package.json`、命令在哪执行、`vercel.json` 从哪读） | **留空 = 仓库根目录** |
| **Install Command** | 怎么装依赖 | 不用填，Vercel 看到 `pnpm-lock.yaml` 会自己用 pnpm |
| **Build Command** | 跑什么命令构建 | `pnpm build:naive` |
| **Output Directory** | 构建完把哪个文件夹当网站 | `apps/web-naive/dist` |

后三个已经写进根目录的 `vercel.json`，所以**界面上什么都不用填**：

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "pnpm build:naive",
  "outputDirectory": "apps/web-naive/dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

逐行翻译：

| 字段 | 含义 |
| --- | --- |
| `$schema` | 给编辑器用的提示，让 VS Code 能补全和校验。**不影响部署**（✅ 已核官方 schema，此字段允许） |
| `framework: "vite"` | 告诉 Vercel「这是 Vite 项目」，别乱猜。下面两行已写死，它猜什么都不影响 |
| `buildCommand` | 构建命令，就是 01 篇剥过的那条 |
| `outputDirectory` | 产物文件夹，**相对仓库根目录** |
| `rewrites` | 路由兜底，详见 [03-routing.md](./03-routing.md) |

---

## 3. 为什么 Root Directory 必须留根目录

Root Directory 一个设置同时决定三件事：

1. **默认构建命令用谁的**：留根 → 用根 `package.json` 的脚本；填 `apps/web-naive` → 用子目录的 `build` 脚本（`vite build --mode production`），**绕开 turbo 那条链**。
2. **命令在哪个目录执行**：留根 → 在仓库根跑；填子目录 → 在子目录跑。
3. **`vercel.json` 从哪读**：它必须待在 Root Directory 里，填了子目录就得把文件挪进去。

所以准确的说法是：

> **留根目录，是为了让 Vercel 走「仓库里定义好、本地也跑得通」的那条路（turbo 全量编排），而不是让 Vercel 用子目录脚本另走一条没人验证过的路。**

📖 **官方文档口径**：Vercel 对 monorepo/workspace 有自动识别，装依赖的层级有它自己的一套推断。所以不要断言「填子目录一定失败」——只是没必要去赌。

---

## 4. `--frozen-lockfile` 是什么（第 5 条注意事项）

`pnpm-lock.yaml` 是**版本清单**：记录上次安装时每个库精确的版本号和校验值，保证你、我、Vercel 装出来的东西一模一样。

| 模式 | 行为 |
| --- | --- |
| `pnpm install` | 按清单装；清单和 `package.json` 对不上时，**顺手把清单更新掉** |
| `pnpm install --frozen-lockfile`（冻结） | 只按清单装，**一个字都不许改**；发现对不上直接报错罢工 |

Vercel 为了构建可复现**可能会用冻结模式**。此时若你改了 `package.json` / `pnpm-workspace.yaml` 却没提交同步过的 lockfile，构建第一步就挂，报错里带 `OUTDATED_LOCKFILE` 字样。

**两种修法**：

1. 正统：本地跑一次 `pnpm install`，把更新后的 `pnpm-lock.yaml` 一起提交；
2. 应急：Vercel 项目设置里把 Install Command 改成 `pnpm install --no-frozen-lockfile`。

⚠️ **这个仓库当前有隐患**：`git status` 显示 `pnpm-lock.yaml` 有未提交的改动（删掉了约 596 行已无人引用的 catalog 条目）。推送前最好确认它和 `pnpm-workspace.yaml` 是一致的。

📖 Vercel 是否默认用冻结模式，我没能拿到确切措辞（Vercel 文档站是 JS 动态渲染的，抓不到正文）。所以上面写成条件句：**无论默认是不是冻结模式，这条建议都成立。**

---

## 5. 上线流程

```
① 本地跑起来
   pnpm install
   pnpm dev:naive            → http://localhost:5888   账号 resin / 123456

② 本地确认能打包（别把没验证的东西推上去）
   pnpm build:naive
   检查 apps/web-naive/dist/index.html 是否存在

③ 推代码
   git add -A && git commit -m "..." && git push
   顺手看一眼 git status 里的 pnpm-lock.yaml

④ Vercel → Add New… → Project → 选中仓库 → Import
   Root Directory 留空（= 仓库根目录）
   Build / Output / Install 三项都别填，vercel.json 里已写好
   → Deploy

⑤ 拿到 https://xxx.vercel.app，验证三件事
   · 首页能打开、不白屏
   · 能登录（不行见下表「线上登录失败」）
   · 进 /#/demos/parallax 后按 F5 刷新 → 正常，不是 404

⑥ 以后改代码：push 即自动重新构建
```

---

## 6. 出错对照表

| 现象 | 原因 | 怎么办 |
| --- | --- | --- |
| 构建第一步挂，报 `OUTDATED_LOCKFILE` / `frozen-lockfile` | 冻结模式 + lockfile 与配置不同步 | 本地 `pnpm install` 后提交 lockfile；或 Install Command 改 `pnpm install --no-frozen-lockfile` |
| 构建到一半内存不足 / OOM | 打包确实吃内存 | 项目设置里换更大的 Build Machine（免费版规格有限） |
| 线上能开但登录失败 | 生产接口 `VITE_GLOB_API_URL` 指向的公共 mock 服务，不认 `resin/admin/jack` 这份账号（账号定义在 `apps/backend-mock/utils/mock-data.ts`） | 自己部署一份 `backend-mock`，再把 `VITE_GLOB_API_URL` 指过去 |
| 子页面刷新 404 | 生产变成 history 模式但没有 rewrite | 检查 `.env.production` 的 `VITE_ROUTER_HISTORY` 与 `vercel.json` 的 `rewrites`（见 03 篇） |
| 整站白屏 / 静态资源 404 | 网站不在根路径，但 `VITE_BASE` 是 `/` | 只有部署到子路径才需要改 `VITE_BASE`；Vercel 上保持 `/` |
| 打包慢，还多出个 `dist.zip` | `VITE_ARCHIVER=true` | 在 `.env.production` 里改成 `false` |
| 点进某个 demo 是空白页 | 那 4 个页面本来就是空壳（`permission-control`、`map-visualization`、`webrtc`、`frontend-security`） | 正常，等实现 |

---

## 7. 本地开发时那个假后端在哪

✅ 读代码确认：`apps/backend-mock` 是一个 Nitro 服务，**跑在 5320 端口**，接口前缀 `/api`。它不是单独启动的——`internal/vite-config/src/plugins/nitro-mock.ts` 这个 Vite 插件会在开发服务器起来时把它拉起来（前提是 `.env.development` 里 `VITE_NITRO_MOCK=true`）。所以：

- 开发时接口地址 `VITE_GLOB_API_URL=/api`，由 Vite 代理转发到 `http://localhost:5320`；
- 5320 被占用时它会**跳过启动**（插件里先 `get-port` 探测）；
- 它是**独立服务，不包含在 Vercel 静态部署里**。

---

## 8. 可信度说明

- ✅ 仓库相关结论都来自读配置/源码。
- 📖 Vercel 的默认行为属于官方文档口径；文档站正文抓不到，所以措辞保守。
- ⚠️ 我没能真正跑一次部署，也没能跑完本地构建（沙箱限制）。**上线流程的第 ② 步就是让你自己把这一环补上。**
