# Resin Admin page conventions

Use these conventions only for `apps/web-naive`.

## Paths and naming

- Put a page at `src/views/<module>/<page>/index.vue`.
- Use lowercase kebab-case for module folders, page folders, URL segments, route
  module filenames, and locale filenames.
- Use a unique PascalCase route `name`. Derive it from the complete route, so a
  nested stock-check page can use `InventoryStockCheck`.
- Put routes in `src/router/routes/modules/<module>.ts`. The existing
  `import.meta.glob('./modules/**/*.ts')` collector loads them automatically.
- Use `#/` for imports from the application `src` directory.

For a top-level route, use an absolute kebab-case path and `order: 100` unless
the user specifies another order:

```ts
import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    name: 'SystemNotices',
    path: '/system-notices',
    component: () => import('#/views/system/notices/index.vue'),
    meta: {
      icon: 'lucide:megaphone',
      order: 100,
      title: $t('system.notices.title'),
    },
  },
];

export default routes;
```

For a child page, update the selected parent's existing route module. Use a
relative child `path`, preserve the parent's metadata and siblings, and do not
add an `order` unless the user requests one.

## Localization

Create or update matching files:

```text
src/locales/langs/zh-CN/<module>.json
src/locales/langs/en-US/<module>.json
```

Both files must have identical keys and nesting. Group page messages below the
module and page keys:

```json
{
  "notices": {
    "title": "系统公告",
    "description": "查看系统发布的公告"
  }
}
```

The English file uses the same keys with translated values. Never reuse the
Chinese value as the English translation. In route modules and Vue templates,
use keys through the application helper imported from `#/locales`.

## Basic page shape

Use this as the default structure, adapting the card content to the user's
stated purpose:

```vue
<script setup lang="ts">
import { Page } from '@vben/common-ui';

import { NCard } from 'naive-ui';

import { $t } from '#/locales';
</script>

<template>
  <Page
    :description="$t('system.notices.description')"
    :title="$t('system.notices.title')"
  >
    <NCard :title="$t('system.notices.title')">
      <!-- Build the confirmed content with localized strings. -->
    </NCard>
  </Page>
</template>
```

- Import Naive UI components by name from `naive-ui`.
- Prefer existing Tailwind utility classes for responsive spacing and grids.
- Use semantic components and avoid custom CSS when Naive UI props or existing
  utilities express the layout.
- Use `useVbenForm`, `useVbenModal`, and the VXE Table adapter only when the
  requested basic page actually needs them.

## Conflict and validation rules

- Search all route modules before adding a route name or full path.
- Resolve a child route's full path from its parent before checking duplicates.
- Check whether the view path and both locale keys already exist.
- Stop on conflicts instead of merging unrelated meanings or replacing files.
- Validate JSON syntax and matching locale shapes, then run
  `pnpm --filter @vben/web-naive typecheck`.

## Scenario checks

Use these cases to confirm the workflow remains unambiguous when updating this
skill:

1. Top-level page: `系统公告 / System Notices`, `/system-notices`, module
   `system`, page `notices`, icon `lucide:megaphone`. It creates a new route
   module, page, and two `system.json` locale files.
2. Existing-parent child: add a localized child to an existing route module. It
   preserves the parent and siblings, adds a relative path, writes the page
   under the same module, and merges matching keys into both locale files.
