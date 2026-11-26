# Coding Standards — DMS Sonix

> Applies to all code in `apps/sonix-apis/` and `apps/client-web/`. Read this before writing any code.

---

## TypeScript

- Strict mode is on (`strict: true`) — no implicit `any`, no `any` casts without justification
- Use `type` for aliases, unions, intersections; use `interface` (with `I` prefix) for class contracts / DI tokens
- `const` by default; `let` only when reassignment is required; never `var`
- Named exports everywhere; **default exports only for React page/route components**
- Shared DTOs and types: import exclusively from `@dms/data-models` (single barrel). Never duplicate types locally.

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Class | PascalCase | `PartService` |
| Interface | `I` + PascalCase | `IPartRepository` |
| Type alias | PascalCase | `PartSearchCriteria` |
| Function / method | camelCase | `findPartById` |
| Variable | camelCase | `partNumber` |
| Constant | camelCase (not ALL_CAPS) | `defaultPageSize` |
| Private class member | `_` prefix | `_session` |
| File (backend) | kebab-case | `part.service.ts` |
| File (React component) | PascalCase | `PartList.tsx` |
| Enum | PascalCase | `PartStatus` |
| Enum value | PascalCase | `PartStatus.Active` |
| React hook | `use` prefix | `usePartForm` |

---

## General Code Style

- Always use braces around `if`/`else`/`for`/`while` bodies — even single-line
- No barrel re-export index files (no `export * from './...'`) except `@dms/data-models`
- No comments explaining WHAT code does — names do that. Comment only the WHY (non-obvious constraint, subtle invariant, workaround)
- No half-finished implementations; no dead code; remove unused imports immediately
- No error handling for scenarios that can't happen — trust internal code and framework guarantees

---

## Backend — NestJS

### Class Structure

- Explicit access modifiers on **all** class members: `private`, `protected`, `public`
- Private members: `_` prefix — `private _session: IDocumentSession`
- Traditional methods (`findAll() {}`) not arrow properties (`findAll = () => {}`) on classes
- Constructor injection: declare with access modifier in constructor params

```typescript
@Injectable()
export class PartService {
  constructor(
    private readonly _repository: PartRepository,
    private readonly _cache: LocationsCacheService,
  ) {}

  async findAll(criteria: PartSearchCriteria): Promise<PartListResponse> {
    // ...
  }
}
```

### Layer Responsibilities

| Layer | Responsibility |
|---|---|
| Controller | Accept + validate DTOs; delegate to service; no business logic |
| Service | All business logic; depends on repositories and other services |
| Repository | Data access only; no business logic |
| Guard | Cross-cutting security (authentication, authorization) |
| Interceptor | Cross-cutting transforms (pagination, logging) |

### DTO Patterns

- Request DTOs: class with `class-validator` decorators + `@ApiProperty()` for Swagger
- Response DTOs: plain classes; mapped via `toDto()` mapper in service
- Separate create vs update DTOs when field requirements differ (e.g. `partNumber` required on create, omitted on update)
- Never expose entity internals (database IDs, internal flags) directly in response DTOs

### Three-Way PATCH Semantics

For partial update endpoints (`PATCH`):
- **Absent field** (not sent) → skip — do not modify the field
- **`null` value** → clear the field (set to `null` / delete)
- **Present value** → update with the new value

### Error Handling — RFC 9457 Problem Details

All API errors must conform to RFC 9457 (Problem Details):

```json
{
  "type": "urn:dms:part:not-found",
  "title": "Part not found",
  "status": 404,
  "detail": "No part with number 'ABC-123' exists."
}
```

DMS URN format: `urn:dms:{domain}:{reason}` — e.g. `urn:dms:part:not-found`, `urn:dms:vendor:duplicate-vendor-number`

Standard status codes:
- `400` — validation failure
- `401` — unauthenticated
- `403` — forbidden (authenticated but no permission)
- `404` — not found
- `409` — conflict (duplicate, optimistic lock)
- `422` — unprocessable (business rule violation)

---

## Backend — RavenDB

### Core Philosophy

Design documents for read screens, not for normalization:

> **Put all the data you need for a Details screen into one document.**

A document is well-designed if the Details screen loads with a single `session.load(id)` call. If you need multiple loads or queries, reconsider the structure.

### Embed vs. Reference

**Embed when:**
- The child is owned by the parent (no independent lifecycle)
- The child is always loaded with the parent
- The collection is bounded (5–10 vendors on a part — fine; 10,000 transactions — not fine)
- You need atomic parent + child updates

**Reference + Snapshot when:**
- The child is a shared, independent entity (Vendor, Location)
- You need to display child fields without loading the child document

```typescript
// GOOD — snapshot embeds what the UI needs
type PartVendor = {
  vendor: {id: string; vendorNumber: string; name: string}; // snapshot
  vendorPartNumber?: string;
  isPrimary: boolean;
  cost?: Money;
};
```

Snapshots may become stale when the source document changes. Refresh them with a background patch scoped to affected documents.

### Document ID Conventions

Use natural, human-readable IDs:

```
parts/BRAKE-PAD-D1092        ✅ natural key
vendors/CLINCHTECH            ✅ natural key
locations/MAIN                ✅ natural key
bins/MAIN/A-12-3              ✅ hierarchical scoping
orders/ORD-2026-00123         ✅ sequential with prefix
```

Rules:
- Lowercase collection names with `/` separator
- For location-scoped entities: `{collection}/{locationId}/{naturalKey}`
- Never GUIDs as primary IDs — they make debugging and URLs opaque

### Multi-Tenancy: locationId Scoping

DMS Sonix is multi-tenant. A tenant = a Location (`locationId`).

- Every location-scoped entity MUST carry the location relationship (direct field or embedded `locations[]` array)
- RavenDB indexes for list/search queries MUST filter by `locationId`
- Never return cross-location data in a single API response

**Flat-array pattern for filtering:**

```typescript
// Index map — emit flat array for location filtering
locationIds: doc.locations.map(l => l.location.id)
```

```typescript
// Query — equality filter on the flat array
q.whereEquals('locationIds', 'locations/MAIN')
```

### JavaScript Indexes

One index per list screen. Pattern:

```typescript
export class Parts_Search extends AbstractJavaScriptIndexCreationTask {
  constructor() {
    super();
    this.map('parts', (doc) => ({
      query: [doc.partNumber, doc.description, ...doc.vendors.map(v => v.vendor.name)].join(' '),
      locationIds: doc.locations.map(l => l.location.id),
      isDeleted: doc.isDeleted,
      status: doc.status,
    }));
    this.index('query', FieldIndexing.Search);
    this.analyze('query', 'StandardAnalyzer');
  }
}
```

Rules:
- Combine all searchable text into a single `query` field — use `StandardAnalyzer`
- Filter fields must be flat primitives (strings, booleans) — no nested object filters
- Use `statistics()` callback to get `totalResults` — no second COUNT query needed

### Repository Pattern

- Use `SafeRepository` wrapper (never `IDocumentSession` directly in services)
- `Include()` for write flows that need to validate/snapshot a related document
- Select only fields needed — avoid loading full documents for list responses
- Ordered pagination only (no skip/take without stable ordering)

### Rollup Totals

RavenDB has no computed columns. Recalculate and store rollup totals on every write:

```typescript
// Recalculate before every saveChanges()
part.totalOnHand = part.locations.reduce((sum, l) => sum + l.numOnHand, 0);
part.totalAvailable = part.totalOnHand + part.totalOnOrder - part.totalCommitted;
```

### Embedded Types — File Conventions

Embedded sub-objects live in the **aggregate root's entity file**, not in their own files:

```
entities/
  part.entity.ts        ✅ — Part, PartVendor, PartLocation, LocationBin all here
  part-vendor.entity.ts ❌ — implies a separate collection (wrong)
```

### ACID Scope

- Single session `saveChanges()` = fully ACID across all modified documents in that session
- Patch-by-query = BASE (multiple transactions; design the patch to be idempotent)
- Never assume two separate `saveChanges()` calls are atomic with each other

### Anti-Patterns to Avoid

- **Normalization mindset** — don't create 5 collections that always load together; embed instead
- **Separate entity files for embedded types** — `part-vendor.entity.ts` implies a separate collection
- **Manual denormalization counters** — use MapReduce indexes for cross-document aggregations
- **Unbounded embedded arrays** — split by business boundary (time, location) when arrays grow without limit
- **Shared databases between applications** — each application owns its database

---

## Frontend — React

### Component Structure

- Function declarations: `export function PartList() {}` — not arrow functions for components
- Named exports for everything except page/route components (which use `export default`)
- One component per file; file name matches component name

```typescript
// pages/parts/PartList.tsx
export async function clientLoader({context}: ClientLoaderFunctionArgs) { /* ... */ }

export default function PartList() {
  return <Box>{/* ... */}</Box>;
}
```

### Hooks

- Prefix with `use`: `usePartFormOptions`, `useParts`
- Feature-specific hooks: `pages/{feature}/hooks/`
- Global hooks (used 2+ features): `core/hooks/`

### API Calls — Always Use `apiClient`

All HTTP calls to the DMS backend must go through `apiClient` (`core/services/apiClient.ts`). **Never use bare `fetch()` directly** — it bypasses error handling, token refresh, timeout, and network detection.

```typescript
import {apiClient} from 'core/services/apiClient';

const data = await apiClient.get<PartDetail>('/api/part/ABC-123', {
  token: locationToken,
  refreshToken: refreshLocationToken,
  signal,
});
```

The only legitimate exception is `networkMonitor.ts` (circular dependency — it IS the connectivity probe).

### AbortController / Signal

Pass `signal` from TanStack Query to `apiClient` so requests cancel when the component unmounts:

```typescript
queryFn: ({signal}) => partQueries.fetchAll({locationId, signal, token: locationToken})
```

### MUI Import Style

Path imports only — **never** barrel imports from `@mui/material`:

```typescript
import Button from '@mui/material/Button';     // ✅
import {Button} from '@mui/material';           // ❌
```

---

## Commit Format

```
<type>: <subject>
```

**Allowed types:** `chore` `doc` `feat` `fix` `minor` `refact` `tool` `ux`

**Subject rules:**
- Start with lowercase: `add feature` ✅, `Add feature` ❌
- Present tense: "add" not "added"
- 10–99 characters

**Examples:**
```
feat: add vendor search endpoint
fix: correct bin rollup calculation on multi-location parts
ux: improve part detail loading state with skeleton
doc: update architecture overview for auth kernel changes
```

> **Note:** If your branch tracks a JIRA ticket, the full format is `<type>(<JIRA-ID>): <subject>` where JIRA-ID is `UPPERCASE-NUMBER` (e.g. `DMSMOD-54`). The workshop simplified format above is acceptable for workshop commits.
