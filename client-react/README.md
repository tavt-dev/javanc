# JavaNC Frontend

React + TypeScript + Vite frontend for the JavaNC Quarkus services.

## Runtime Contract

- Backend source of truth: `../docs/backend-api-contract.md`.
- Do not rename or normalize backend paths in components.
- Keep HTTP calls inside `src/features/*/api`.
- Keep backend compatibility quirks inside API adapters or mappers.
- Components and pages should consume normalized data from hooks.
- Public response wrapper is always `ApiResponse<T>`: `{ success, message, data }`.

## Setup

```bash
npm install
npm run dev
```

The dev server runs on `http://localhost:3000` by default.

API base URL:

```bash
VITE_API_BASE_URL=http://localhost:8080
```

If `VITE_API_BASE_URL` is empty, Vite proxies supported service paths to the gateway at `http://localhost:8080`.

## Scripts

```bash
npm run lint
npm run test:run
npm run build
npm run test:e2e
npm run quality
```

## i18n

- i18n is initialized in `src/i18n/index.ts`.
- Default and fallback locale is Vietnamese (`vi`).
- Copy lives in `src/i18n/locales/vi.ts`.
- New visible UI text should use `useTranslation()` or `i18n.t(...)` in test utilities.
- Avoid adding new hardcoded English copy to page, layout, dialog, empty, loading, error, toast, or form states.

## Frontend Contract Rules

- Never call `apiClient` directly from a page/component.
- Never expose raw legacy fields beyond adapters when a safer normalized shape is possible.
- Keep React Query keys namespaced by feature.
- Invalidate caches through feature key helpers instead of ad hoc strings.
- Use shared state components for loading, retry, empty, and destructive confirmation flows.
- Keep form validation in feature schemas and clean payloads before sending them to API functions.

## Testing Strategy

- Unit/API tests verify endpoint paths, query params, multipart field names, response normalization, stores, route guards, and error handling.
- Component tests cover shared state components, layout controls, dialogs, notification interactions, and form behavior.
- E2E tests use Playwright mocks in `e2e/mocks/api.ts` and cover auth/RBAC plus core role workspaces.

Before merging frontend changes, run:

```bash
npm run lint
npm run test:run
npm run build
npm run test:e2e
```
