# Architecture — DMS Sonix

> Read `docs/TECHNOLOGY_OVERVIEW.md` first for context on the technology choices.

---

## Monorepo Structure

```
/harness-workshop (Nx monorepo)
├── apps/
│   ├── sonix-apis/           # NestJS backend API
│   │   └── src/
│   │       ├── main.ts       # Bootstrap; global prefix /api; global guards + interceptors
│   │       ├── app.module.ts # Root module; registers all domain modules
│   │       ├── auth/         # JWT guard, validator, Logto integration
│   │       ├── common/       # Shared: SafeRepository, pagination interceptor, base entities
│   │       ├── global/       # Global-scope providers (RavenDB session factory, cache)
│   │       ├── location/     # Location domain (admin)
│   │       ├── part/         # Part domain (inventory)
│   │       ├── user/         # User domain (profile, context endpoint)
│   │       ├── vendor/       # Vendor domain
│   │       └── bin/          # Bin domain
│   ├── sonix-apis-e2e/       # Backend E2E/integration tests
│   ├── client-web/           # React SSR frontend
│   │   └── app/              # See Frontend Folder Structure below
│   └── client-web-e2e/       # Playwright E2E tests
├── libs/
│   └── shared/
│       ├── data-models/      # Shared DTOs and types (@dms/data-models)
│       └── testing-helpers/  # Shared test utilities
├── database/                 # Seeders and seed runner
├── scripts/                  # Dev utility scripts
├── docker-compose.yml        # RavenDB, Logto, Mailpit
├── biome.jsonc               # Linting and formatting
└── nx.json, package.json     # Nx workspace configuration
```

---

## Backend Architecture (NestJS)

### Domain Module Pattern

Each domain folder under `apps/sonix-apis/src/` follows this structure:

```
part/
├── part.module.ts
├── part.controller.ts      # HTTP endpoints; validates DTOs; delegates to service
├── part.service.ts         # Business logic; RavenDB access via SafeRepository
├── part.mapper.ts          # Entity → DTO transformations
├── entities/
│   └── part.entity.ts      # Part + all embedded types (PartVendor, PartLocation, etc.)
├── dto/
│   ├── create-part.dto.ts
│   ├── update-part.dto.ts
│   └── part-list-query.dto.ts
└── indexes/
    └── parts-search.index.ts   # RavenDB JavaScript index for the list screen
```

### Request Lifecycle

```
HTTP Request
  → NestJS Middleware (if any)
  → AccessTokenGuard (validates JWT; attaches req.auth)
  → Global Interceptors (PaginationInterceptor — enforces query limits)
  → Controller (validates DTOs; calls service)
  → Service (business logic)
  → SafeRepository (RavenDB)
  → Response
```

### Authentication (Backend)

- All routes are **protected by default** (`AccessTokenGuard` applied globally in `app.module.ts`)
- Public routes use `@Public()` decorator to opt out
- JWT from Logto is validated by `jwt-validator.ts` (using `@logto/node`)
- `req.auth` contains: `userId`, `locationId` (derived from the Logto org token's org ID, mapped via `LocationsCacheService`)

---

## Frontend Architecture (React)

### Folder Structure

```
apps/client-web/app/
├── core/                    # Application infrastructure ("plumbing")
│   ├── config/              # api.ts, auth.ts, env.ts, featureRegistry.ts
│   ├── contexts/            # React context providers (auth, location) — thin adapters over kernels
│   ├── formatters/          # Shared formatting helpers (currency, number, date)
│   ├── hooks/               # Global hooks (useNetworkStatus, useFormatCurrency, ...)
│   ├── kernel/              # authKernel.ts + locationKernel.ts (external-store singletons)
│   ├── middleware/          # authClientMiddleware.ts, routerContext.ts
│   ├── queries/             # TanStack Query setup (QueryProvider, queryClient)
│   ├── services/            # apiClient.ts, locationScopedApiClient.ts, networkMonitor.ts
│   └── storage/             # browserStorage.ts, locationStorage.ts, sessionStore.ts
├── pages/                   # Route pages and page-specific logic
│   ├── SignIn.tsx            # /sign-in (public)
│   ├── Callback.tsx          # /callback (public)
│   ├── ProtectedLayout.tsx   # Auth + location middleware wrapper
│   ├── NotFound.tsx          # 404 catch-all
│   ├── UserSettings.tsx
│   ├── parts/               # Parts feature module
│   │   ├── PartList.tsx
│   │   ├── PartDetail.tsx
│   │   ├── columns.tsx      # DataGrid column definitions
│   │   ├── hooks/
│   │   ├── queries/         # partQueries.ts, partQueryKey.ts
│   │   └── types/
│   └── locations/           # Locations feature module
│       ├── LocationList.tsx
│       ├── LocationCreate.tsx
│       └── ...
├── components/              # Shared reusable UI components
├── icons/                   # Custom SVG icon components
├── locales/                 # i18n translation files (en/, fr/)
├── app.tsx                  # Home page — feature dashboard
├── root.tsx                 # React Router root + global providers
├── routes.tsx               # Route configuration
└── theme.ts                 # MUI theme customization
```

### Feature Module Structure

Each feature with multiple pages gets its own subfolder. Everything feature-specific lives inside it:

```
pages/{feature}/
├── {Feature}List.tsx          # List page (route module + clientLoader)
├── {Feature}Create.tsx        # Create page (clientLoader + clientAction)
├── {Feature}Edit.tsx          # Edit page (clientLoader + clientAction)
├── {Feature}Form.tsx          # Shared form component
├── columns.tsx                # DataGrid column definitions
├── components/                # Feature-specific UI components
├── hooks/                     # Feature-specific hooks
├── mappers/                   # Form ↔ API data transformation
├── queries/                   # TanStack Query functions + query key factory
├── schemas/                   # Valibot validation schemas
├── styles/                    # Shared MUI sx-prop style objects
└── types/                     # Feature-specific TypeScript types
```

**Component placement:**

| What | Where |
|---|---|
| Used by 2+ features | `app/components/` |
| Used only in one feature | `pages/{feature}/components/` |
| Global infrastructure hook | `core/hooks/` |
| Feature-specific hook | `pages/{feature}/hooks/` |

### Route Configuration

Routes are defined in `routes.tsx` using React Router's builder API:

```typescript
export default [
  route('sign-in', './pages/SignIn.tsx'),         // public
  route('callback', './pages/Callback.tsx'),       // public

  layout('./pages/ProtectedLayout.tsx', [          // auth + location middleware
    layout('./components/Layout.tsx', [            // AppBar, Drawer, NetworkAlert
      index('./app.tsx'),                          // /

      ...prefix('parts', [
        index('./pages/parts/PartList.tsx'),        // /parts
        route(':partNumber', './pages/parts/PartDetail.tsx'), // /parts/:partNumber
      ]),

      route('locations', './pages/locations/LocationList.tsx'),
      route('locations/create', './pages/locations/LocationCreate.tsx'),
      route('locations/:id', './pages/locations/LocationDetail.tsx'),

      route('user-settings', './pages/UserSettings.tsx'),
      route('*', './pages/NotFound.tsx'),           // 404 catch-all
    ]),
  ]),
] satisfies RouteConfig;
```

### Provider Hierarchy

```
root.tsx
  ColorModeProvider
    ThemeProvider + CssBaseline
      LogtoProvider                ← Logto SDK
        QueryProvider              ← TanStack Query
          AuthProvider             ← syncs Logto → authKernel; exposes useAuth()
            LocationProvider       ← subscribes to authKernel; exposes useLocation()
              Outlet               ← React Router routes
```

Router context (for middleware/loaders) is wired separately:

```typescript
// entry.client.tsx
<HydratedRouter getContext={createRouterContext} />
```

`createRouterContext()` populates typed context keys accessible from middleware and `clientLoader`:
- `AUTH_KERNEL_CONTEXT`
- `LOCATION_KERNEL_CONTEXT`
- `RESOLVED_LOCATION_CONTEXT` (set by `authClientMiddleware` after both auth + location resolve)

---

## Auth Architecture (Kernel Pattern)

The auth/location system uses two **external-store kernels** in `core/kernel/`. These are plain TypeScript singletons (not React components) that own all async orchestration.

**Why kernels?** React Router middleware and `clientLoader` functions must wait for auth/location before routes continue — but Logto SDK calls only work inside React. The kernels provide a shared source of truth that React reads via `useSyncExternalStore`, middleware reads via `context.get()`, and services read directly.

### `authKernel.ts`

Owns:
- Resolved auth snapshot (profile, locations, userClaims, accessToken)
- `waitForResolvedAuth()` queue — used by `authClientMiddleware`
- Token refresh deduplication via `getValidToken()`
- Auth failure classification (error pattern → sign-out notice type)
- `_hasFailedForCurrentSession` guard (prevents retry loops after failed auth)

`AuthProvider.tsx` is a thin React adapter — it only bridges Logto SDK functions into the kernel and calls `authKernel.syncSession()` on Logto state changes.

### `locationKernel.ts`

Owns:
- Location access state and snapshot
- `waitForResolvedLocation()` queue — used by `authClientMiddleware`
- Active location selection + persistence via `localStorage`
- In-memory token cache with TTL derived from JWT `exp` claim (10-minute safety window)
- Location switch orchestration with sequence guards

Access states: `pending | ready | signed_out | tenant_access_lost`

### Auth Flow

```
User navigates to /parts
  → authClientMiddleware runs
  → await authKernel.waitForResolvedAuth()
      → AuthProvider bridges: Logto.getAccessToken() + GET /api/user/context
      → authKernel resolves: authenticated (or redirects /sign-in)
  → await locationKernel.waitForResolvedLocation()
      → LocationProvider bridges: Logto.getOrganizationToken(locationId)
      → locationKernel resolves: ready
  → middleware sets RESOLVED_LOCATION_CONTEXT
  → clientLoader runs with {locationId, locationToken}
  → route renders
```

### Sign-In Flow

1. User clicks "Sign In" → Logto hosted sign-in page
2. Logto redirects back to `/callback` with authorization code
3. `Callback.tsx` exchanges code via `useHandleSignInCallback`
4. Hard navigation to saved redirect target (or `/`)
5. `authClientMiddleware` re-runs; auth resolves as authenticated

### Sign-Out Notices

The sign-in page reads a sign-out notice from `sessionStore` and shows a banner:

| Notice | Cause |
|---|---|
| `session_expired` | `invalid_grant` during token fetch |
| `session_invalid` | `invalid_client` during token fetch |
| `no_locations_assigned` | `GET /api/user/context` returns empty locations |
| `tenant_access_lost` | Fatal location token error |
| `auth_error` | Any other auth failure |
| `server_unavailable` | Network error during `resolveAuth()` — shows Retry button, no forced sign-out |

---

## Data Flow

### Frontend → Backend (Typical List Request)

```
User opens /parts
  → clientLoader reads RESOLVED_LOCATION_CONTEXT
  → queryClient.ensureQueryData({
      queryKey: PART_QUERY_KEYS.list(locationId, criteria),
      queryFn: ({signal}) => partQueries.fetchAll({locationId, signal, token: locationToken})
    })
  → apiClient.get('/api/part?...', {token, signal})
      → GET /api/part?locationId=X&page=1&pageSize=10
      → AccessTokenGuard validates JWT
      → PaginationInterceptor enforces limits
      → PartController.findAll(criteria)
      → PartService.findAll(criteria)
      → Parts/Search index query (filtered by locationIds = locationId, isDeleted = false)
      → PagedResponseDto<PartWithInventoryResponseDto>
  → React component renders DataGrid
```

### State Management

| State Type | Tool |
|---|---|
| Server data (API responses) | TanStack Query (`useQuery`, `useMutation`) |
| Global auth state | `authKernel` → `AuthProvider` → `useAuth()` |
| Global tenant state | `locationKernel` → `LocationProvider` → `useLocation()` |
| Cross-component UI state | React Context |
| Local component state | `useState` |

### Query Key Conventions

```typescript
// Hierarchical keys enable targeted invalidation
PART_QUERY_KEYS = {
  all: (locationId) => ['parts', locationId],
  list: (locationId, criteria) => ['parts', locationId, 'list', criteria],
  detail: (partNumber) => ['parts', 'detail', partNumber],
}
```

Invalidate all part queries for the current location after create/update: `queryClient.invalidateQueries({queryKey: PART_QUERY_KEYS.all(locationId)})`

---

## Build Configuration

### SSR: Disabled

React Router is configured with SSR disabled:

```typescript
// react-router.config.ts
export default {
  ssr: false,
  prerender: ['/sign-in'],      // /sign-in is pre-rendered as static HTML at build time
  future: {v8_middleware: true},
} satisfies Config;
```

Use `clientLoader` (not `loader`) in all page components. The `/sign-in` pre-rendering runs in Node.js, so code accessing `window`/`localStorage`/`sessionStorage` at module level needs guards — use `createStorageEntry()` from `core/storage/browserStorage.ts` for all storage access.

### Adding a New Backend Endpoint

1. Add/update DTOs in `libs/shared/data-models/` if the API contract changes
2. Add controller method and service method in the domain folder
3. Apply `class-validator` decorators; keep Swagger annotations current
4. Add Vitest tests

### Adding a New UI Screen

1. Add route entry in `apps/client-web/app/routes.tsx`
2. Create page component in `apps/client-web/app/pages/{feature}/`
3. Add query functions in `pages/{feature}/queries/`
4. Add i18n keys to `locales/en/{namespace}.json` (and `fr/` as fallback)
