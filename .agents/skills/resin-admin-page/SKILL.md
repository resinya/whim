---
name: resin-admin-page
description: Create basic content pages for the Resin Admin web-naive app with Naive UI, local routes, and complete zh-CN/en-US translations. Use when adding a non-CRUD page or menu to this project; do not use for API, Mock, Store, backend, or CRUD work.
---

# Resin Admin Page

Create a complete, navigable basic page in `apps/web-naive`. Read
[references/page-conventions.md](references/page-conventions.md) before editing.

## Confirm the request

Before creating files, confirm all of these values with the user unless they
already supplied them:

- Chinese page name
- English page name
- URL path
- parent menu, or an explicit choice of a top-level menu
- menu icon
- page purpose and intended content

Also resolve the module slug from the selected parent or ask for it when a
top-level page does not make the module clear. Do not create placeholder
content when the page purpose is ambiguous.

## Workflow

1. Inspect the target route module, view directory, and both locale directories.
2. Check the proposed route name, full path, component path, and locale keys for
   conflicts. Never overwrite a conflicting route, page, or translation; report
   the exact conflict and ask the user to choose a new value.
3. Create the page with Vue 3, TypeScript, the shared `Page` wrapper, and Naive
   UI components. Use the existing Vben adapters when the requested content
   needs forms, modals, or tables.
4. Add matching zh-CN and en-US messages. Every user-visible string must use
   `$t()`, including descriptions, actions, empty states, and notifications.
5. Add the route to the appropriate module. Do not edit the route collector.
6. Validate the result and report the page path, menu placement, changed files,
   and checks run.

## Boundaries

- Create basic content pages only. Do not add API clients, Mock handlers, Pinia
  stores, backend code, or CRUD behavior.
- Use the dependencies already present in `@vben/web-naive`; do not install a
  component library or package.
- Do not rename or rewrite framework identifiers such as `@vben/*`,
  `VbenForm`, `useVbenForm`, or `useVbenModal`.
- Keep changes inside `apps/web-naive` unless the user explicitly expands the
  scope.

## Completion checks

- Confirm the route component exists and route names and full paths are unique.
- Confirm every new translation key exists in both language files with the same
  object shape.
- Search the new Vue files for hardcoded user-visible Chinese or English text.
- Run `pnpm --filter @vben/web-naive typecheck` from the repository root.
- Inspect the final diff to ensure no API, Mock, Store, backend, dependency, or
  unrelated files changed.
