# Gogo Front – Agent Guide

## Rules
- No obvious or redundant comments.
- **Do not start the dev server** — the user runs it at http://localhost:5173.
- Every interactive element gets a `data-testid` (see Test locators).
- Finish with `make test` (typecheck, lint, unit, E2E) and fix what fails.

## Start here
- **Recipes**: `docs/recipes/` has step-by-step procedures: build a feature across the API and this UI, add a feature, add a Playwright test. Use the matching one instead of improvising.
- **Reference feature**: `src/features/examples`.
- **The kit**: this repo is the admin UI. [gogo](https://github.com/nicklasos/gogo) is the API, expected next to it at `../backend`; its OpenAPI file becomes `src/api/schema.ts` through `make api-types`. [gopulse](https://github.com/nicklasos/gopulse) is the monitoring dashboard the API serves at `/_pulse`.

## Role
Admin UI starter for the **gogo** Go API (`../backend`). A new project is a copy of this one plus feature folders.

## Stack
- React 19, Vite, TypeScript (strict), Ant Design 5
- TanStack Query for server state, zustand only for the auth session
- react-router-dom (declarative `<Routes>`), i18next (en, uk)
- Native `fetch` through `src/api/client.ts` (no axios)
- Unit: `node:test` through `tsx` | E2E: Playwright with page objects, in TypeScript

## Structure
```
src/
  main.tsx  index.css  vite-env.d.ts
  app/       App, providers, queryClient, router, theme, i18n
  api/       client, errors, types, queryKeys, url
  auth/      authStore, roles, guards, LoginPage, RoleTags
  layout/    AppShell, nav (menu registry), navMatch
  shared/    components/, hooks/, utils/, lib/unsavedChanges/
  features/  <module>/{types,api,hooks}.ts + pages/ (+ components/)
  locales/{en,uk}/translation.json
tests/e2e/   specs, pages/ (page objects), helpers/
```
Import with the `@/` alias. A feature imports from `api`, `auth`, `layout` and `shared`, never from another feature.

## Adding a module
1. Run `make swagger` in gogo and `make api-types` here, then give the generated types short names in `features/<module>/types.ts` (`export type Example = InternalExampleExampleResponse`). Do not hand-write a type the backend already describes, and never edit `src/api/schema.ts`.
2. `features/<module>/api.ts` — an `xApi` object of calls built on `api` from `@/api/client`.
3. `features/<module>/hooks.ts` — `useX` queries, `useSaveX({ id?, body })`, `useDeleteX`. Mutations invalidate a key prefix from `qk`.
4. Add the keys to `api/queryKeys.ts`.
5. `features/<module>/pages/*.tsx` — pages call hooks only, never `api` directly.
6. Add the route to `app/router.tsx` as a `lazy(() => import(...))` page (default export) and the menu entry to `layout/nav.tsx`.
7. Add locale keys to both `en` and `uk`; a unit test fails when the two files have different keys.

`features/examples` is the reference for a paginated list plus a full-page editor with a markdown field; `features/users` for a table with modal forms; `features/uploads` for file upload.

## API client
- `api.get/post/put/patch/del<T>()` return the response's `data` field.
- `api.getPage<T>()` returns `{ data, pagination }` for paginated lists.
- A non-2xx response throws `ApiError` (`status`, `errorKey`, `message`, `fieldErrors`).
- A 401 triggers one shared token refresh and one retry. `skipAuthRefresh` turns that off (used by the auth calls).
- `client.ts` never imports the auth store; the store registers itself with `bindAuth`.

## Errors
- Queries and mutations show a toast from the global handler in `app/queryClient.ts`. Pass `meta: { silent: true }` when the page shows the error itself.
- The backend sends `error_key`; `shared/utils/serverErrors.ts` translates it through `errors.<key>` in the locales. Add a locale entry for every new backend key.
- Validation errors arrive as `errors: { field: [keys] }`. In a mutation's `onError`, `applyFormErrors(form, t, error, FIELDS)` shows them under their fields and returns the message for anything it could not place (or null).

## Pagination
`usePageParams()` keeps `page` / `page_size` in the URL; `useTablePagination(paging, query.data)` turns the response into the `pagination` prop of `ResponsiveTable`. Without that prop `ResponsiveTable` pages in the browser.

## Roles
- `super-admin`, `admin`, `user` (`auth/roles.ts`). `hasAnyRole` lets a super admin through everything, the same as the backend.
- Routes: wrap in `<RequireRole roles={[...]}>` or `<RequireSuperAdmin>`; both render `<Forbidden />`.
- Menus: `MAIN_NAV` (left) and `ADMIN_NAV` (right, super admins only) in `layout/nav.tsx`, each item with `roles`.
- Guards only hide UI. The backend enforces access.
- User pages: `/admin/super-admins` and `/admin/admins` (super admins), `/users` (admins and super admins). All three use `features/users/components/UserManagement.tsx`.

## Policies
- Who may do what to a record lives in `features/<module>/policy.ts` as pure functions: `canUpdateExample(user, example)`.
- They mirror the API's `internal/<module>/policy.go` and only decide what the UI offers (a hidden button, a disabled action). The API enforces the same rule and is the authority.
- Route guards (`RequireRole`) are for "this page is for these roles". A policy is for rules that depend on the record.
- Every policy has cases in `src/features/policies.test.ts`, the same cases as the API's policy test.

## Markdown
- `shared/components/markdown/MarkdownEditor` is a WYSIWYG editor whose value is markdown text. Use it as a controlled field: `<Form.Item name="body"><MarkdownEditor testId="..." /></Form.Item>`. It loads its code (about 600 kB) only when rendered.
- `MarkdownViewer` renders markdown. Raw HTML in the content is shown as text, never executed.
- `markdownToPlainText(md, max)` gives a short plain preview for table cells and cards.
- The backend stores the markdown as plain text; there is nothing markdown-specific on the API side.
- In E2E, the writing area is `getByTestId('<testId>').locator('[contenteditable="true"]')`.

## Crashes and unknown URLs
- `AppShell` wraps the routed page in an `ErrorBoundary` keyed by path and a `Suspense`: a render error shows `CrashScreen` in the content area, and navigating elsewhere clears it. `App` has a second, full-screen boundary for everything else.
- A boundary only catches render errors. Failed requests are handled by the query layer (see Errors).
- An unmatched URL renders `NotFoundPage` inside the shell; do not redirect unknown paths.

## Signed-out pages
`app/router.tsx` has two route trees: `PublicRoutes` (login, forgot/reset password, verify email) and `AppRoutes` (everything inside `AppShell`). Signed-out pages sit in `auth/AuthCard`. Any other URL shows the login form in place, so signing in lands on the page that was asked for.

## Styling
Use AntD components and tokens (`theme.useToken()`); no literal colours or ad-hoc CSS. Branding lives in `app/theme.ts`. Page skeleton: `PageStack` > `Card` > `PageHeader` + content.

## Test locators (required)
- Naming: `<entity>-<element>[-<id>]`, for example `add-user-button`, `user-email-input`, `edit-example-button-12`, `users-table`.
- AntD `Result` and `Modal` do not give the test id a visible box: wrap `Result` in a `div`, and assert on a control inside a modal.
- E2E: page objects in `tests/e2e/pages/`, `getByTestId` first. Table rows: `tr[data-row-key]`. Field errors: `aria-invalid="true"` on the input.
- No assertions on copy or on Ant Design class names.

## Commands
```bash
make typecheck
make lint         # typecheck + eslint
make test-unit    # node:test
make test-e2e     # Playwright: starts gogo --test-db on 8184 and Vite on 5175
make test         # all of the above
make api-types    # regenerate src/api/schema.ts from ../backend/docs/swagger.json
make build
```

## E2E notes
- `tests/e2e/shared-session/`: specs that share one signed-in plain user (`auth.setup.ts` writes `.auth/user.json`).
- `tests/e2e/own-session/`: specs that sign in themselves with `loginAs(page, role)`, or test the signed-out pages.
- A spec runs in the project of the folder it is in; nothing has to be registered.
- Users are seeded straight into the test database (`helpers/db-helper.ts`); emails start with `e2e-` so cleanup finds them. Use `uniqueEmail()` for users created through the UI.
- The API is started with `AUTH_RATE_LIMIT=false` and `APP_DEBUG=true` (no throttling, mail only logged).
- Emailed links cannot be read back (only a hash is stored): plant a token with `dbHelper.createEmailToken(userId, purpose)`.
- Requires `TEST_DATABASE_URL` (database name ending in `_test`) in `.env`.

## Don’t
- Don’t add project domain modules to this skeleton.
- Don’t call `fetch` or `api` from a page; go through `features/<module>/hooks.ts`.
- Don’t start `npm run dev` unless the user asks.
