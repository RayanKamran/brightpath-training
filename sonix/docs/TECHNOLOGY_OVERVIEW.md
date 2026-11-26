# Technology Overview — DMS Sonix

---

## What Is DMS Sonix?

DMS Sonix is a cloud-native **Dealer Management System (DMS)** built by DMS. Dealerships use a DMS as their central business system — managing parts inventory, service work orders, sales and F&I, rentals, accounting, and customer relationships.

---

## Technology Stack

| Concern | Technology | Version | Notes |
|---|---|---|---|
| Monorepo | **Nx** | see `nx.json` | Orchestrates builds, tests, tasks across all apps and libs |
| Backend API | **NestJS** | see `package.json` | Module-based Node.js framework; controllers, services, guards, interceptors |
| Database (app data) | **RavenDB** | see `docker-compose.yml` | Document database for all application data (`ids_db`) |
| Database (auth) | **PostgreSQL** | see `docker-compose.yml` | Logto auth store (`logto_db`) — never touched by app code directly |
| Frontend framework | **React 19** | see `package.json` | Functional components and hooks only |
| Frontend routing | **React Router 7** | see `package.json` | SSR disabled; `clientLoader` for data fetching; middleware for auth/location |
| UI components | **Material UI (MUI) v7** | see `package.json` | Component library and theming system |
| Server state | **TanStack Query v5** | see `package.json` | `useQuery` / `useMutation` for API data; per-domain query functions |
| Form management | **React Hook Form + Valibot** | see `package.json` | RHF for form state; Valibot for schema-based validation |
| Auth (OIDC) | **Logto** | see `docker-compose.yml` | Self-hosted OIDC provider; manages users, roles, organizations (= locations) |
| Linting + formatting | **Biome** | see `biome.jsonc` | Single tool replacing ESLint + Prettier; fast, opinionated |
| Build (backend) | **Webpack** | see `apps/sonix-apis/webpack.config.js` | Used for NestJS backend bundle |
| Build (frontend) | **Vite** | see `apps/client-web/vite.config.ts` | Fast dev server and production build for React |
| Testing (backend) | **Vitest** | see `package.json` | Unit + integration tests for NestJS services and controllers |
| Testing (frontend E2E) | **Playwright** | see `package.json` | Browser-level E2E tests for auth flows and UI interactions |
| Dev email | **Mailpit** | see `docker-compose.yml` | Catches all outbound email during local development |
| Shared contracts | **@dms/data-models** | `libs/shared/data-models/` | Single barrel export for all DTOs and shared types used by both apps |
| Language | **TypeScript** | ~5.9 | Strict mode; used everywhere |
| Runtime | **Node.js** | 22 LTS | v24 is not yet compatible with all dependencies |

---

## Why These Technologies?

**RavenDB** — fits NestJS (DI, entity classes) and enables document-oriented modeling that matches the domain well (parts carry embedded vendor and inventory data; no joins needed). `SafeRepository` wrapper adds safety rails to prevent unbounded queries.

**REST (not GraphQL/gRPC)** — the domain is CRUD-heavy with straightforward access patterns. REST is easy to document with Swagger, test with Postman/Vitest, and reason about per-endpoint.

**Nx monorepo** — shared types (`@dms/data-models`) require coordinated changes across backend and frontend. Nx provides a dependency graph, consistent task orchestration, and affected-build detection for CI efficiency.

**Logto** — OIDC standards compliance, self-hosting, and organization support that maps to the product's location scoping. Backend validates JWTs server-side; frontend uses the Logto React SDK.

**TanStack Query** — built-in caching, background refetching, loading/error states, and a consistent pattern across all API calls. Paired with per-domain query functions under each feature's `queries/` folder.

**MUI** — broad, accessible component set with a robust theming system. Accelerates delivery of consistent screens without a custom UI kit.

**Playwright** — fast, cross-browser, and reliable for end-to-end flows across auth boundaries. Integrates well with Nx task orchestration.

**Biome** — replaces both ESLint and Prettier with a single fast tool. Pre-commit hook enforces all rules before any commit lands.

---

## Multi-Tenancy Model

A **tenant** in this system is a **Location** (a dealership location or branch).

- Logto **Organizations** implement the tenancy at the identity layer
- DMS database **Location documents** are the business-layer tenant record
- All location-scoped data is physically stored with a `locationId` field (or embedded `locations[]` array for entities shared across locations)
- Users can belong to multiple Locations and switch context in the UI
- API calls use **location-scoped tokens** (org tokens from Logto) that carry the active `locationId`

The UI term is always "Location". "Logto Organization" is an implementation detail that developers see but users do not.

---

## Service URLs (Local Development)

| Service | URL | Notes |
|---|---|---|
| React Web UI | http://localhost:3004 | `npm run dev:web` |
| NestJS API | http://localhost:3000 | `npm run dev:apis` |
| NestJS Swagger / OpenAPI | http://localhost:3000/api/docs | Interactive API explorer |
| Logto App (auth server) | http://localhost:3001 | OIDC endpoints |
| Logto Admin Console | http://localhost:3002 | Manage users, orgs, roles |
| RavenDB Studio | http://localhost:3333 | Database explorer |
| Mailpit (dev email) | http://localhost:8025 | Catches all outbound email |

## Local Infrastructure (Docker)

`docker-compose.yml` runs three services. Start with: `docker-compose up -d`

| Service | Container Port | Host Port | Purpose |
|---|---|---|---|
| RavenDB | 3333 | 3333 | Application database (`ids_db`) |
| Logto | 3001, 3002 | 3001, 3002 | Auth server + admin console |
| Mailpit | 8025 (web), 1025 (SMTP) | 8025, 1025 | Dev email catch-all |

---

## Shared Library — `@dms/data-models`

`libs/shared/data-models/` is the single source of shared types used by both `sonix-apis` and `client-web`.

- **Always import from `@dms/data-models`** — never duplicate types locally
- Single intentional barrel export (`index.ts`)
- Contains: request/response DTOs, shared enums, shared type aliases

The frontend's Vite config stubs backend-only packages (`class-validator`, `class-transformer`, `@nestjs/swagger`, `reflect-metadata`) that the shared DTOs import, so they can be used in the browser without CJS/ESM failures.
