# 03 · 路由：hash、history 与那条 rewrite

这是最容易「本地好好的、上线就 404」的知识点。看完你应该能回答：**为什么静态托管下刷新子页面会 404，以及那条 `rewrites` 到底在救什么。**

---

## 1. 前提：静态网站只认「文件路径」

Vercel 拿到请求后的逻辑非常死板：

> 用户要 `/xxx/yyy` → 我的 `dist` 里有没有 `xxx/yyy` 这个文件或目录？有就给，**没有就 404**。

而你的 `dist` 里**只有一个 `index.html`**（见 [01-monorepo-build.md](./01-monorepo-build.md) 第 3 节）。于是：

| 请求 | 结果 |
| --- | --- |
| `/` | `dist/index.html` 存在 ✅ |
| `/assets/index-a1b2c3.js` | 文件存在 ✅ |
| `/demos/parallax` | **`dist/demos/parallax` 不存在** ❌ 404 |

**关键点：这个 404 发生在你的 JS 还没开始跑的时候。** 文件没找到，浏览器压根没拿到应用代码，vue-router 连启动的机会都没有。

路由和服务器之间的全部误会，就在这儿。

---

## 2. 两种解法

### 解法一：hash 模式（把路径藏在 `#` 后面）

```
https://你的域名/#/demos/parallax
                 ↑ 井号是关键
```

浏览器规矩：**`#` 后面的内容（hash）永远不会发给服务器**，只属于浏览器自己。

```
浏览器实际请求服务器：  GET /              → index.html ✅
浏览器自己处理：        #/demos/parallax   → JS 读这段，渲染对应页面
```

服务器从头到尾只看到 `/`，**永远不会 404**。代价：URL 丑、SEO 不友好、部分埋点工具会漏掉路径。

### 解法二：history 模式 + rewrite 兜底

```
https://你的域名/demos/parallax
```

干净好看。但用户在地址栏敲它、或在页面里按 F5，请求**会真的打到服务器**：

```
GET /demos/parallax → Vercel: 没这个文件 → 404 💥
```

这时轮到那条 `rewrites`：

```json
"rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
```

人话：**「任何路径，找不到对应文件就一律把 `index.html` 交出去。」**

```
GET /demos/parallax
   → dist 里没这个文件
   → 走 rewrite，返回 index.html（200，不是 404）
   → 浏览器拿到应用代码，JS 启动
   → vue-router 看地址是 /demos/parallax
   → 渲染出对应页面 ✅
```

**为什么这条 `/(.*)` 不会把 JS/CSS 也吃成 `index.html`？** 因为 Vercel 是**先看有没有真实文件，没有才轮到 rewrite**。请求 `/assets/index-a1b2c3.js` 时文件命中，rewrite 根本不参与。

（📖 官方文档口径：路由顺序是 headers → redirects → middleware → rewrites → 真正的处理。所以 rewrite 靠后、拿不到不存在的东西才会兜底。）

---

## 3. 对比表

| | hash 模式 | history 模式 |
| --- | --- | --- |
| URL | `/#/demos/parallax` | `/demos/parallax` |
| 服务器看到什么 | 永远只有 `/` | 完整路径 `/demos/parallax` |
| 需要服务器配合吗 | **不需要** | 需要（rewrite / nginx `try_files` 之类） |
| 刷新子页面会 404 吗 | 不会 | **会**（没有 rewrite 时） |
| 美观 / SEO / 埋点 | 差 | 好 |
| 适合 | 静态托管、内部后台、图省事 | 面向公众的网站 |

---

## 4. 这个项目实际用的是哪个（有反转）

代码只有一句判断，`apps/web-naive/src/router/index.ts`（✅ 读代码确认）：

```ts
history:
  import.meta.env.VITE_ROUTER_HISTORY === 'hash'
    ? createWebHashHistory(import.meta.env.VITE_BASE)
    : createWebHistory(import.meta.env.VITE_BASE),
```

再看两个环境文件：

| 文件 | 有 `VITE_ROUTER_HISTORY` 吗 | 结果 |
| --- | --- | --- |
| `.env.production` | 有：`=hash` | 判断成立 → **线上 hash** |
| `.env.development` | **没有这个变量** → `undefined` | 判断不成立 → **本地 history** |

于是出现这个现象：

- 本地：`http://localhost:5888/demos/parallax`
- 线上：`https://xxx.vercel.app/#/demos/parallax`

**本地之所以怎么刷都不 404，还有第二层保险**：✅ 读代码确认，这套共用 vite 配置没改过 `appType`，用的就是 Vite 默认的 `'spa'`，**开发服务器自带「找不到文件就返回 index.html」的兜底**。

### 结论

**线上现在是 hash 模式，本来就不会 404，所以 `vercel.json` 里那条 rewrite 目前是「备着没用上」。**

它什么时候派上用场？**哪天把 `.env.production` 里的 `VITE_ROUTER_HISTORY=hash` 删掉（或改成别的），线上立刻变成 history 模式。那一刻起，如果 Vercel 上没有这条 rewrite，所有子页面一刷新就 404。** 现在配好了，到时候不用再动 Vercel。

---

## 5. 想换路由模式怎么做

**切到 history（URL 更好看）**：

1. 删掉 `apps/web-naive/.env.production` 里的 `VITE_ROUTER_HISTORY=hash`；
2. 确认 `vercel.json` 里的 `rewrites` 还在（已经在）；
3. 重新部署，然后**用线上地址刷新几个子页面**验证不 404。

**切回 hash**：把那一行加回去，重新部署。

**注意两个连带影响**：

- 换模式后，**已有书签/外链会失效**（`/demos/parallax` 和 `/#/demos/parallax` 是两套地址）；
- 若还想让本地和生产表现一致，记得两边环境文件写同一种。

---

## 6. 一句话总结

> 前端路由是**浏览器里的 JS** 在管，而静态托管只认**文件**。hash 模式让服务器永远只看到 `/`，所以不需要任何配置；history 模式把完整路径交给服务器，就必须用 rewrite 把所有「查无此文件」的请求都交回 `index.html`，让 JS 接手。
