# Whim

> 个人 demo 实现与学习记录。

这个仓库用来把平时练手的前端实现（组件用法、交互效果、适配方案……）以「能跑、能看」的形式沉淀下来，
平时就在本地跑，部署到 Vercel 上方便随时翻看，也顺便当学习笔记的存档。

它基于 `vue-vben-admin` 5.7.0 的 monorepo 改造而来：

- monorepo 的包名仍是上游的 `vben-admin-monorepo`，**实际在用、会被部署的应用是 `apps/web-naive`**（界面标题为 Resin Admin）。
- 上游自带的其它示例应用（`web-antd` / `web-ele` / `web-tdesign` / `docs` 等）已经删掉，只留下 naive 版和一个 Nitro mock 后端。
- `playground` 是上游的演示应用，保留但没有在维护。

**中文** | [English](./README.en-US.md)

## Demo 一览

已经写完的：

| 路由           | Demo         | 做了什么                                                                                                     |
| -------------- | ------------ | ------------------------------------------------------------------------------------------------------------ |
| `/demos/naive` | Naive UI     | 用 NCard 分组演示按钮、Message、Notification 等组件用法                                                       |
| `/demos/table` | 表格         | NDataTable 基础表格（No / Title / Length 三列）                                                               |
| `/demos/form`  | 表单         | 表单适配器里的各类控件（ApiSelect、ApiTreeSelect、Radio/Checkbox、日期、TextArea 等），以及弹窗/内嵌表单      |
| `/demos/array-form` | 数组编辑器 | 基于 `useVbenForm` 的数组编辑器（VbenFormFieldArray）：可增删行，每个单元格复用表单组件并逐格校验 |
| `/demos/h5`    | H5 页面搭建  | 750px 设计稿的移动端适配方案；预览跑在独立 iframe 里，viewport 与根字号不会影响后台页面（静态页在 `apps/web-naive/public/scenarios/h5/`） |
| `/demos/parallax` | 视差滚动  | 三层视差 + 异速位移 + 吸附分区揭示；位移全部由滚动进度计算，没有引入动画库，并处理了「减弱动态效果」         |

占位中（路由已经建好，视图还是空的，正好留着慢慢填）：

| 路由                          | Demo     |
| ----------------------------- | -------- |
| `/demos/permission-control`   | 权限控制 |
| `/demos/map-visualization`    | 地图可视化 |
| `/demos/webrtc`               | WebRTC   |
| `/demos/frontend-security`    | 前端安全 |

除了 demos，框架自带的工作台、分析页、个人中心、登录等页面也都还在，可以直接拿来当参照。

## 快速开始

环境要求：Node `^22.18.0` 或 `^24.12.0`，pnpm `>= 11`（`packageManager` 里锁的是 pnpm 11.16.0）。

```bash
pnpm install
pnpm dev:naive
```

打开 http://localhost:5888 即可。开发模式下 Nitro mock 后端会一起启动（`VITE_NITRO_MOCK=true`）。

登录账号来自本地 mock 后端 `apps/backend-mock/utils/mock-data.ts`：

| 账号    | 密码     | 角色  |
| ------- | -------- | ----- |
| `resin` | `123456` | super |
| `admin` | `123456` | admin |
| `jack`  | `123456` | user  |

登录页默认选中 Resin，密码会自动填成 `123456`。

## 常用命令

| 命令                    | 说明                                                                     |
| ----------------------- | ------------------------------------------------------------------------ |
| `pnpm dev:naive`        | 启动 naive 应用（含 mock 后端）                                          |
| `pnpm build:naive`      | 打包到 `apps/web-naive/dist`（turbo 会先构建它依赖的 workspace 包）       |
| `pnpm dev:play`         | 启动上游 playground 应用                                                 |
| `pnpm build:play`       | 打包 playground 应用                                                     |
| `pnpm lint` / `format`  | oxlint / oxfmt 检查与格式化                                              |
| `pnpm check`            | 循环依赖、依赖检查、类型检查、拼写检查                                   |
| `pnpm test:unit`        | 跑 vitest 单测                                                           |
| `pnpm clean`            | 清理构建产物                                                             |

注意：`package.json` 里还留着 `build:antd`、`dev:ele`、`build:docs` 之类的脚本，它们指向的是上游那些已经被删掉的应用，跑不起来。

## 目录结构

```
apps/web-naive         应用本体，src/views/demos 是各个 demo
  src/router/routes/modules/demos.ts   demo 路由注册
apps/backend-mock      本地 Nitro mock 后端（账号、菜单、表格数据都在 utils/mock-data.ts）
packages/@core         框架基础包（上游保留）
packages/*             通用工具、主题、stores 等（上游保留）
internal/vite-config   构建、lint 等内部配置
playground             上游 playground 应用
vercel.json            Vercel 部署配置
vibecoding/            学习笔记（打包机制、部署细节、路由原理）
```

## 学习笔记

打包机制、Vercel 部署细节、hash/history 路由这些「为什么这么配」的内容，统一记在 [`vibecoding/`](./vibecoding/) 里：

- [这个 monorepo 怎么打包](./vibecoding/01-monorepo-build.md)
- [部署到 Vercel](./vibecoding/02-vercel-deploy.md)
- [路由：hash 与 history](./vibecoding/03-routing.md)

## 部署到 Vercel

推上 GitHub 后，在 Vercel 里 Import 这个仓库就行，部署参数都写在根目录的 `vercel.json` 里：

- 构建命令：`pnpm build:naive`
- 产物目录：`apps/web-naive/dist`
- Node 版本：读 `package.json` 的 `engines` 字段
- `rewrites`：所有路径回退到 `/index.html`

几个容易踩的点：

1. **Root Directory 保持仓库根目录**，不要设成 `apps/web-naive`。`buildCommand` 里的 `pnpm build:naive` 是根目录 `package.json` 的脚本，它靠 turbo 跑完整条 workspace 依赖链；Root Directory 一旦指到子目录，Vercel 就会改用那个子目录自己的 `build` 脚本，绕开仓库里验证过的流程。另外 `vercel.json` 必须放在 Root Directory 下，放根目录最省事。
2. **关于这条 `rewrites`**：它的作用是把「找不到对应静态文件的路径」统统交回 `/index.html`，这是 history 路由能工作的前提。本项目当前的生产配置是 `VITE_ROUTER_HISTORY=hash`（见 `apps/web-naive/.env.production`），URL 形如 `/#/demos/parallax`，浏览器压根不会去请求 `/demos/parallax`，所以这条 rewrite 现在用不上；留着是为了哪天改成 history 路由时不用再动 Vercel。
3. **线上登录依赖哪个 mock 服务**：生产接口地址在 `apps/web-naive/.env.production` 的 `VITE_GLOB_API_URL`，目前指向一个公共的 mock 服务。线上能不能登录，取决于那个服务认不认这份账号数据（账号定义在 `apps/backend-mock/utils/mock-data.ts`）。想自己掌控，就把 `backend-mock` 单独部署一份，再把 `VITE_GLOB_API_URL` 指过去。
4. **建议关掉打包压缩**：`.env.production` 里的 `VITE_ARCHIVER=true` 会在打包完再压一个 `dist.zip`，Vercel 上用不到，改成 `false` 可以省一次压缩。
5. **如果报 lockfile 过期**（`frozen-lockfile` 相关错误）：本地跑一次 `pnpm install` 把更新后的 `pnpm-lock.yaml` 一起提交；或者在 Vercel 项目设置里把 Install Command 改成 `pnpm install --no-frozen-lockfile`。

`apps/backend-mock` 是独立的 Nitro 服务，不包含在这次静态部署里。

## 技术栈

Vue 3、Vite、TypeScript、Naive UI、Pinia、Vue Router、Tailwind CSS 4、Turbo + pnpm workspace、Nitro（mock 后端）。

## License

MIT，沿用上游 vue-vben-admin，详见 [LICENSE](./LICENSE)。
