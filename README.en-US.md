# Whim

> A personal log of demo implementations and things I'm learning.

This repo is where I keep the front-end bits and pieces I build while practicing — component usage, interaction
effects, layout/adaptation tricks — in a form that actually runs and can be looked at. I run it locally day to day
and deploy it to Vercel so I can browse it anytime; it doubles as an archive of my learning notes.

It started from the `vue-vben-admin` 5.7.0 monorepo:

- The monorepo package is still named `vben-admin-monorepo` (upstream), but **the app that is actually used and
  deployed is `apps/web-naive`** (its UI title is Resin Admin).
- The other upstream demo apps (`web-antd` / `web-ele` / `web-tdesign` / `docs`, …) have been removed. Only the
  Naive UI app and a Nitro mock backend remain.
- `playground` is the upstream playground app; it's kept around but not maintained.

[中文](./README.md) | **English**

## Demos

Finished:

| Route               | Demo             | What it covers                                                                                                                                                      |
| ------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/demos/naive`      | Naive UI         | Buttons, Message, Notification and other components, grouped with NCard                                                                                              |
| `/demos/table`      | Table            | A basic NDataTable (No / Title / Length columns)                                                                                                                     |
| `/demos/form`       | Forms            | The field types available in the form adapter (ApiSelect, ApiTreeSelect, Radio/Checkbox, date, TextArea, …), plus modal/inline forms                                 |
| `/demos/array-form` | Array editor     | An array editor built on `useVbenForm` (VbenFormFieldArray): rows can be added/removed, every cell reuses a form component and is validated individually              |
| `/demos/h5`         | H5 page building | A 750px-design mobile adaptation approach. The preview runs in its own iframe, so its viewport and root font size don't leak into the admin pages (static pages live in `apps/web-naive/public/scenarios/h5/`) |
| `/demos/parallax`   | Parallax scroll  | Three parallax layers, differential displacement and pinned-section reveals. All offsets are computed from scroll progress — no animation library — and it respects `prefers-reduced-motion` |

Placeholders (routes exist, the views are still empty — room to fill them in later):

| Route                        | Demo              |
| ---------------------------- | ----------------- |
| `/demos/permission-control`  | Permission control |
| `/demos/map-visualization`   | Map visualization |
| `/demos/webrtc`              | WebRTC            |
| `/demos/frontend-security`   | Front-end security |

Beyond the demos, the framework's own workspace/analytics dashboards, profile and login pages are all still there
and are handy as references.

## Getting Started

Requirements: Node `^22.18.0` or `^24.12.0`, and pnpm `>= 11` (the `packageManager` field pins pnpm 11.16.0).

```bash
pnpm install
pnpm dev:naive
```

Then open http://localhost:5888. In development the Nitro mock backend is started alongside the app
(`VITE_NITRO_MOCK=true`).

The accounts come from the local mock backend, `apps/backend-mock/utils/mock-data.ts`:

| Username | Password | Role  |
| -------- | -------- | ----- |
| `resin`  | `123456` | super |
| `admin`  | `123456` | admin |
| `jack`   | `123456` | user  |

The login page selects Resin by default and fills in `123456` for you.

## Common Commands

| Command                | Description                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| `pnpm dev:naive`       | Start the Naive UI app (mock backend included)                                                |
| `pnpm build:naive`     | Build into `apps/web-naive/dist` (turbo builds the workspace packages it depends on first)     |
| `pnpm dev:play`        | Start the upstream playground app                                                             |
| `pnpm build:play`      | Build the playground app                                                                      |
| `pnpm lint` / `format` | oxlint / oxfmt check and format                                                               |
| `pnpm check`           | Circular deps, dependency check, type check and spell check                                    |
| `pnpm test:unit`       | Run the vitest unit tests                                                                     |
| `pnpm clean`           | Remove build output                                                                            |

Note: `package.json` still contains leftovers like `build:antd`, `dev:ele` and `build:docs`. They point at the
upstream apps that were deleted here, so they won't run.

## Project Layout

```
apps/web-naive         The app itself; src/views/demos holds every demo
  src/router/routes/modules/demos.ts   where demo routes are registered
apps/backend-mock      Local Nitro mock backend (accounts, menus and table data in utils/mock-data.ts)
packages/@core         Core framework packages (kept from upstream)
packages/*             Shared utils, theming, stores, … (kept from upstream)
internal/vite-config   Internal build and lint configuration
playground             Upstream playground app
vercel.json            Vercel deployment configuration
vibecoding/            Study notes (build mechanics, deployment, routing)
```

## Notes

The reasoning behind the build setup, the Vercel deployment details and hash-vs-history routing lives in
[`vibecoding/`](./vibecoding/) (currently written in Chinese):

- [How this monorepo builds](./vibecoding/01-monorepo-build.md)
- [Deploying to Vercel](./vibecoding/02-vercel-deploy.md)
- [Routing: hash vs history](./vibecoding/03-routing.md)

## Deploying to Vercel

Push to GitHub, import the repo in Vercel, and you're done — the deployment settings live in `vercel.json` at the
repo root:

- Build command: `pnpm build:naive`
- Output directory: `apps/web-naive/dist`
- Node version: taken from the `engines` field in `package.json`
- `rewrites`: every path falls back to `/index.html`

Things that are easy to get wrong:

1. **Keep the Root Directory at the repo root** — don't set it to `apps/web-naive`. The `buildCommand`
   (`pnpm build:naive`) is a script from the root `package.json` that relies on turbo to walk the whole workspace
   dependency chain. Point the Root Directory at the sub-directory and Vercel will instead use that sub-directory's
   own `build` script, bypassing the path this repo is verified on. `vercel.json` also has to live under the Root
   Directory, so keeping it at the root is the least fiddly option.
2. **About that `rewrites` entry:** it sends any path that doesn't match a static file back to `/index.html`, which
   is what makes history routing work. Production currently uses `VITE_ROUTER_HISTORY=hash` (see
   `apps/web-naive/.env.production`), so URLs look like `/#/demos/parallax` and the browser never asks the server
   for `/demos/parallax` at all — the rewrite is unused today. It's there so that switching to history routing later
   needs no Vercel-side change.
3. **Which mock service login depends on:** the production API URL is `VITE_GLOB_API_URL` in
   `apps/web-naive/.env.production`, currently pointing at a public mock service. Whether login works online depends
   on whether that service knows this account data (the accounts are defined in
   `apps/backend-mock/utils/mock-data.ts`). If you want full control, deploy `backend-mock` yourself and point
   `VITE_GLOB_API_URL` at it.
4. **Consider turning the archive step off:** `VITE_ARCHIVER=true` in `.env.production` zips the build output into a
   `dist.zip` after every build. Vercel has no use for it — setting it to `false` saves a compression pass.
5. **If you hit a stale-lockfile error:** run `pnpm install` locally and commit the updated `pnpm-lock.yaml`, or set
   the project's Install Command to `pnpm install --no-frozen-lockfile` in the Vercel dashboard.

`apps/backend-mock` is a standalone Nitro service and is not part of this static deployment.

## Tech Stack

Vue 3, Vite, TypeScript, Naive UI, Pinia, Vue Router, Tailwind CSS 4, Turbo + pnpm workspaces, Nitro (mock backend).

## License

MIT, inherited from the upstream vue-vben-admin project — see [LICENSE](./LICENSE).
