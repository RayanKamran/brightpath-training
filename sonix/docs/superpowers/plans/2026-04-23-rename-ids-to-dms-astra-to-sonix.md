# Rename IDS→DMS and Astra→Sonix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename all occurrences of the brand "IDS" to "DMS" and the app name "Astra" to "Sonix" across the entire monorepo — including directory names, package names, import paths, env vars, class names, UI strings, and documentation.

**Architecture:** The rename touches six layers in dependency order: (1) shared libs renaming, (2) app directory + package renames, (3) internal import path updates, (4) env var and config updates, (5) UI string / locale updates, (6) documentation updates. Each task is self-contained and can be committed independently.

**Tech Stack:** Nx monorepo, NestJS (sonix-apis → sonix-apis), React Router v7 (client-web), TypeScript, Vitest, Biome linter

---

## Rename Map

| Old | New | Where |
|-----|-----|-------|
| `sonix-apis` | `sonix-apis` | directory name, nx target references |
| `sonix-apis-e2e` | `sonix-apis-e2e` | directory name |
| `@ids-ai-skeleton/sonix-apis` | `@dms-sonix/sonix-apis` | package names |
| `@ids-ai-skeleton/sonix-apis-e2e` | `@dms-sonix/sonix-apis-e2e` | package names |
| `@ids-ai-skeleton/client-web` | `@dms-sonix/client-web` | package names |
| `@ids-ai-skeleton/client-web-e2e` | `@dms-sonix/client-web-e2e` | package names |
| `@ids-ai-skeleton/source` | `@dms-sonix/source` | custom condition in exports |
| `@dms/data-models` | `@dms/data-models` | package name + import paths |
| `@ids/testing-helpers` | `@dms/testing-helpers` | package name + import paths |
| `IDS_ASTRA_APIS_PORT` | `DMS_SONIX_APIS_PORT` | env var |
| `IDS_API_URL` | `DMS_API_URL` | env var |
| `IdsBaseResponseDto` | `DmsBaseResponseDto` | class name |
| `ids-base.dto.ts` | `dms-base.dto.ts` | file name |
| `DMS Sonix` | `DMS Sonix` | UI strings, docs titles |
| `IDS` (standalone brand) | `DMS` | comments, docs |
| `Astra` (standalone brand) | `Sonix` | comments, docs |
| `IdsLogoImage` | `DmsLogoImage` | component name + file |
| `ids-logo-2025.svg` | `dms-logo-2025.svg` | asset file names |
| `urn:ids:` | `urn:dms:` | error URN prefix in data-models |
| `DMSMOD-` | `DMSMOD-` | JIRA ticket references in docs |
| `dms-sonix.atlassian.net` | `dms-sonix.atlassian.net` | doc URLs |
| `ids_dms` | `dms_sonix` | RavenDB database name in .env.example |

---

## File Map

**Directories to rename:**
- `apps/sonix-apis/` → `apps/sonix-apis/`
- `apps/sonix-apis-e2e/` → `apps/sonix-apis-e2e/`
- `apps/sonix-apis-e2e/src/sonix-apis/` → `apps/sonix-apis-e2e/src/sonix-apis/`

**Files to rename:**
- `libs/shared/data-models/src/lib/common/ids-base.dto.ts` → `dms-base.dto.ts`
- `apps/client-web/app/components/IdsLogoImage.tsx` → `DmsLogoImage.tsx`
- `apps/client-web/public/ids-logo-2025.svg` → `dms-logo-2025.svg`
- `apps/client-web/public/ids-logo-2025-DARK.svg` → `dms-logo-2025-DARK.svg`
- `apps/sonix-apis-e2e/src/sonix-apis/sonix-apis.test.ts` → `sonix-apis.test.ts`

**Files to modify (content only):**

*Shared libs:*
- `libs/shared/data-models/package.json`
- `libs/shared/data-models/vitest.config.ts`
- `libs/shared/data-models/src/lib/common/dms-base.dto.ts` (renamed from ids-base.dto.ts)
- `libs/shared/data-models/src/lib/common/problem-detail.dto.ts`
- `libs/shared/data-models/src/index.ts` (re-export path)
- `libs/shared/testing-helpers/package.json`

*Root config:*
- `tsconfig.base.json`
- `package.json`
- `.env.example`
- `docker-compose.yml`

*App package.json files:*
- `apps/sonix-apis/package.json`
- `apps/sonix-apis-e2e/package.json`
- `apps/client-web/package.json`
- `apps/client-web-e2e/package.json`

*App configs:*
- `apps/sonix-apis/vitest.config.ts`
- `apps/sonix-apis-e2e/vitest.config.ts`
- `apps/sonix-apis-e2e/tsconfig.json`
- `apps/client-web/vite.config.ts`
- `apps/client-web-e2e/playwright.config.ts`
- `apps/sonix-apis/src/main.ts`

*Source files (import paths & class references):*
- `apps/sonix-apis/src/part/dto/part-base.dto.ts`
- `apps/client-web/app/components/Layout.tsx`
- `apps/client-web/app/stubs/class-transformer.stub.ts`
- `apps/client-web/app/stubs/class-validator.stub.ts`
- `apps/client-web/app/stubs/nestjs-swagger.stub.ts`
- All `@dms/data-models` imports in `apps/sonix-apis/src/**` (~20 files)
- All `@dms/data-models` imports in `apps/client-web/app/**` (~5 files)
- All `@dms/data-models` imports in `apps/client-web-e2e/**`
- All `@dms/data-models` imports in `database/seeds/**`
- All `@ids/testing-helpers` imports in `scripts/get-api-token.ts`

*Scripts:*
- `scripts/build.ts`
- `scripts/dev.ts`
- `scripts/e2e.ts`
- `scripts/reset-from-scratch.ts`
- `scripts/sync-from-logto.ts`
- `scripts/sync-locations.ts`
- `scripts/tools.ts`
- `scripts/logto.ts`
- `database/seeds/api-client.ts`

*UI strings / locales:*
- `apps/client-web/app/root.tsx`
- `apps/client-web/app/theme.ts`
- `apps/client-web/app/locales/en/common.json`
- `apps/client-web/app/locales/fr/common.json`
- `apps/client-web/app/locales/en/home.json`
- `apps/client-web/app/locales/fr/home.json`

*Documentation:*
- `docs/ARCHITECTURE.md`
- `docs/CODING_STANDARD.md`
- `docs/DESIGN_STANDARD.md`
- `docs/TECHNOLOGY_OVERVIEW.md`
- `docs/features/parts/part-list.md`
- `docs/features/parts/part-create.md`
- `docs/features/money/money-implementation-plan.md`
- `apps/client-web/public/README.md`
- `apps/sonix-apis/src/location/LOCATIONS_CACHE.md`

---

## Task 1: Rename shared `@dms/data-models` → `@dms/data-models`

**Files:**
- Modify: `libs/shared/data-models/package.json`
- Rename + Modify: `libs/shared/data-models/src/lib/common/ids-base.dto.ts` → `dms-base.dto.ts`
- Modify: `libs/shared/data-models/src/lib/common/problem-detail.dto.ts`
- Modify: `libs/shared/data-models/src/index.ts` (if it re-exports ids-base.dto)
- Modify: `libs/shared/data-models/vitest.config.ts`

- [ ] **Step 1: Update data-models package name**

In `libs/shared/data-models/package.json`, change:
```json
{
  "name": "@dms/data-models",
  "exports": {
    ".": {
      "@dms-sonix/source": "./src/index.ts",
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "default": "./dist/index.js"
    }
  }
}
```
(All other fields remain unchanged.)

- [ ] **Step 2: Rename ids-base.dto.ts to dms-base.dto.ts**

```bash
mv libs/shared/data-models/src/lib/common/ids-base.dto.ts \
   libs/shared/data-models/src/lib/common/dms-base.dto.ts
```

- [ ] **Step 3: Update class name inside dms-base.dto.ts**

Open `libs/shared/data-models/src/lib/common/dms-base.dto.ts`.
Change:
```typescript
export class IdsBaseResponseDto {
```
To:
```typescript
export class DmsBaseResponseDto {
```

- [ ] **Step 4: Update URNs in problem-detail.dto.ts**

In `libs/shared/data-models/src/lib/common/problem-detail.dto.ts`, change every `urn:ids:` to `urn:dms:`:
```typescript
  VALIDATION: 'urn:dms:error:validation',
  UNAUTHORIZED: 'urn:dms:error:unauthorized',
  FORBIDDEN: 'urn:dms:error:forbidden',
  NOT_FOUND: 'urn:dms:error:not-found',
  CONFLICT: 'urn:dms:error:conflict',
  TOO_MANY_REQUESTS: 'urn:dms:error:too-many-requests',
  INTERNAL: 'urn:dms:error:internal',
  SERVICE_UNAVAILABLE: 'urn:dms:error:service-unavailable',
```

- [ ] **Step 5: Update vitest config**

In `libs/shared/data-models/vitest.config.ts`, change:
```typescript
name: '@dms/data-models',
```

- [ ] **Step 6: Update barrel index if it imports from ids-base.dto**

Check and update `libs/shared/data-models/src/index.ts`: if it contains `from './lib/common/ids-base.dto'`, change to `from './lib/common/dms-base.dto'`. Also update any re-export of `IdsBaseResponseDto` → `DmsBaseResponseDto`.

- [ ] **Step 7: Commit**

```bash
git add libs/shared/data-models/
git commit -m "refactor: rename @dms/data-models to @dms/data-models, IdsBaseResponseDto to DmsBaseResponseDto"
```

---

## Task 2: Rename shared `@ids/testing-helpers` → `@dms/testing-helpers`

**Files:**
- Modify: `libs/shared/testing-helpers/package.json`

- [ ] **Step 1: Update testing-helpers package name**

In `libs/shared/testing-helpers/package.json`, change:
```json
{
  "name": "@dms/testing-helpers",
  "exports": {
    ".": {
      "@dms-sonix/source": "./src/index.ts",
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "default": "./dist/index.js"
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add libs/shared/testing-helpers/package.json
git commit -m "refactor: rename @ids/testing-helpers to @dms/testing-helpers"
```

---

## Task 3: Update root workspace config

**Files:**
- Modify: `tsconfig.base.json`
- Modify: `package.json`

- [ ] **Step 1: Update tsconfig.base.json**

In `tsconfig.base.json`, change:
```json
{
  "compilerOptions": {
    "customConditions": ["@dms-sonix/source"],
    "paths": {
      "@dms/data-models": ["./libs/shared/data-models/src/index.ts"],
      "@dms/testing-helpers": ["./libs/shared/testing-helpers/src/index.ts"]
    }
  }
}
```

- [ ] **Step 2: Update root package.json test scripts**

In `package.json`, the `test:all`, `test:apis`, `build`, and `typecheck` scripts reference project names by their Nx target name (e.g., `nx test sonix-apis`). These will need to be updated in Task 5 after the directory rename. For now, update only the `build:` script comment that references `@dms/data-models`:

In `scripts/build.ts` (referenced from package.json), `@dms/data-models` → `@dms/data-models`. That is covered in Task 7.

- [ ] **Step 3: Commit**

```bash
git add tsconfig.base.json
git commit -m "refactor: update tsconfig paths from @ids/* to @dms/*"
```

---

## Task 4: Rename app directories

> **Note:** Renaming directories in an Nx workspace also requires updating all internal references. This task renames the directories; Tasks 5–6 update the content.

- [ ] **Step 1: Rename sonix-apis directory**

```bash
mv apps/sonix-apis apps/sonix-apis
```

- [ ] **Step 2: Rename sonix-apis-e2e directory and nested test folder**

```bash
mv apps/sonix-apis-e2e apps/sonix-apis-e2e
mv apps/sonix-apis-e2e/src/sonix-apis apps/sonix-apis-e2e/src/sonix-apis
```

- [ ] **Step 3: Rename the e2e test file**

```bash
mv apps/sonix-apis-e2e/src/sonix-apis/sonix-apis.test.ts \
   apps/sonix-apis-e2e/src/sonix-apis/sonix-apis.test.ts
```

- [ ] **Step 4: Commit directory renames**

```bash
git add -A
git commit -m "refactor: rename sonix-apis and sonix-apis-e2e directories to sonix-apis"
```

---

## Task 5: Update app package.json files

**Files:**
- Modify: `apps/sonix-apis/package.json`
- Modify: `apps/sonix-apis-e2e/package.json`
- Modify: `apps/client-web/package.json`
- Modify: `apps/client-web-e2e/package.json`

- [ ] **Step 1: Update sonix-apis/package.json**

Change `name` and all build target references:
```json
{
  "name": "@dms-sonix/sonix-apis",
  "nx": {
    "targets": {
      "serve": {
        "options": {
          "buildTarget": "@dms-sonix/sonix-apis:build"
        },
        "configurations": {
          "development": {
            "buildTarget": "@dms-sonix/sonix-apis:build:development"
          },
          "production": {
            "buildTarget": "@dms-sonix/sonix-apis:build:production"
          }
        }
      }
    }
  }
}
```
(Keep all other fields unchanged.)

- [ ] **Step 2: Update sonix-apis-e2e/package.json**

```json
{
  "name": "@dms-sonix/sonix-apis-e2e",
  "nx": {
    "implicitDependencies": ["@dms-sonix/sonix-apis"]
  }
}
```

- [ ] **Step 3: Update client-web/package.json**

```json
{
  "name": "@dms-sonix/client-web"
}
```
(All other fields remain unchanged.)

- [ ] **Step 4: Update client-web-e2e/package.json**

```json
{
  "name": "@dms-sonix/client-web-e2e",
  "nx": {
    "implicitDependencies": ["@dms-sonix/client-web"]
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/sonix-apis/package.json apps/sonix-apis-e2e/package.json \
        apps/client-web/package.json apps/client-web-e2e/package.json
git commit -m "refactor: rename npm package scopes from @ids-ai-skeleton to @dms-sonix"
```

---

## Task 6: Update app config files

**Files:**
- Modify: `apps/sonix-apis/vitest.config.ts`
- Modify: `apps/sonix-apis-e2e/vitest.config.ts`
- Modify: `apps/sonix-apis-e2e/tsconfig.json`
- Modify: `apps/client-web/vite.config.ts`
- Modify: `apps/client-web-e2e/playwright.config.ts`

- [ ] **Step 1: Update sonix-apis/vitest.config.ts**

Change:
```typescript
name: '@dms-sonix/sonix-apis',
```

- [ ] **Step 2: Update sonix-apis-e2e/vitest.config.ts**

Change:
```typescript
name: '@dms-sonix/sonix-apis-e2e',
```

- [ ] **Step 3: Update sonix-apis-e2e/tsconfig.json**

Change `outDir` from:
```json
"outDir": "out-tsc/@ids-ai-skeleton/sonix-apis-e2e"
```
To:
```json
"outDir": "out-tsc/@dms-sonix/sonix-apis-e2e"
```

- [ ] **Step 4: Update client-web/vite.config.ts**

Change:
```typescript
name: '@dms-sonix/client-web',
```
Also update the comments referencing `@dms/data-models`:
```typescript
// TODO: Remove stubs once @dms/data-models is split into sub-path exports:
//   @dms/data-models        → pure types, interfaces, Money (frontend + backend)
//   @dms/data-models/server → decorated DTOs with class-validator/swagger (backend only)
// These packages are backend-only (NestJS). The shared @dms/data-models barrel
```

- [ ] **Step 5: Update client-web-e2e/playwright.config.ts**

Change:
```typescript
command: 'npx nx run @dms-sonix/client-web:dev',
```

- [ ] **Step 6: Commit**

```bash
git add apps/sonix-apis/vitest.config.ts apps/sonix-apis-e2e/vitest.config.ts \
        apps/sonix-apis-e2e/tsconfig.json apps/client-web/vite.config.ts \
        apps/client-web-e2e/playwright.config.ts
git commit -m "refactor: update app config files with new package names"
```

---

## Task 7: Update all `@ids/*` import paths in source code

This task updates every TypeScript import from `@dms/data-models` → `@dms/data-models` and `@ids/testing-helpers` → `@dms/testing-helpers`.

**Files (25+ files):**
- All `*.ts`/`*.tsx` under `apps/sonix-apis/src/`
- All `*.ts`/`*.tsx` under `apps/client-web/app/`
- `apps/client-web-e2e/src/`
- `database/seeds/`
- `scripts/get-api-token.ts`

- [ ] **Step 1: Bulk replace @dms/data-models imports**

```bash
find apps/sonix-apis/src apps/client-web/app apps/client-web-e2e/src \
     database/seeds scripts \
     -name "*.ts" -o -name "*.tsx" | \
  xargs grep -l "@dms/data-models" | \
  xargs sed -i '' "s|@dms/data-models|@dms/data-models|g"
```

- [ ] **Step 2: Bulk replace @ids/testing-helpers imports**

```bash
find scripts -name "*.ts" | \
  xargs grep -l "@ids/testing-helpers" | \
  xargs sed -i '' "s|@ids/testing-helpers|@dms/testing-helpers|g"
```

- [ ] **Step 3: Update IdsBaseResponseDto → DmsBaseResponseDto in part-base.dto.ts**

In `apps/sonix-apis/src/part/dto/part-base.dto.ts`, change:
```typescript
import {DmsBaseResponseDto} from '@dms/data-models';
// ...
export class PartBaseResponseDto extends DmsBaseResponseDto {
```

- [ ] **Step 4: Verify no @ids imports remain**

```bash
grep -rn "@ids/" apps/sonix-apis/src apps/client-web/app apps/client-web-e2e/src \
     database/seeds scripts --include="*.ts" --include="*.tsx"
```
Expected: no output.

- [ ] **Step 5: Run typecheck**

```bash
npm run typecheck
```
Expected: zero errors. Fix any that appear before continuing.

- [ ] **Step 6: Commit**

```bash
git add apps/sonix-apis/src/ apps/client-web/app/ apps/client-web-e2e/src/ \
        database/seeds/ scripts/
git commit -m "refactor: update all @ids/* imports to @dms/*"
```

---

## Task 8: Update env vars and sonix-apis main.ts

**Files:**
- Modify: `.env.example`
- Modify: `apps/sonix-apis/src/main.ts`
- Modify: `scripts/sync-from-logto.ts`
- Modify: `scripts/sync-locations.ts`
- Modify: `database/seeds/api-client.ts`

- [ ] **Step 1: Update .env.example**

In `.env.example`:
- Change `IDS_ASTRA_APIS_PORT=3000` → `DMS_SONIX_APIS_PORT=3000`
- Change `# IDS app RavenDB configuration` → `# DMS Sonix RavenDB configuration`
- Change `RAVENDB_DATABASE=ids_dms` → `RAVENDB_DATABASE=dms_sonix`
- Change header comment: `# Local development environment for DMS Sonix` → `# Local development environment for DMS Sonix`

- [ ] **Step 2: Update sonix-apis/src/main.ts**

Change:
```typescript
.setTitle('DMS Sonix API')
.setDescription('API documentation for DMS Sonix Dealership Management System')
// ...
const port = process.env.DMS_SONIX_APIS_PORT || 3000;
```

- [ ] **Step 3: Update scripts/sync-from-logto.ts**

Change:
```typescript
const API_PORT = process.env.DMS_SONIX_APIS_PORT || 3000;
```
Also update the banner line:
```typescript
console.log(`${BLUE}║  Sync Logto → DMS Database (Locations + Users)            ║${NC}`);
```

- [ ] **Step 4: Update scripts/sync-locations.ts**

Change:
```typescript
const API_PORT = process.env.DMS_SONIX_APIS_PORT || 3000;
```
Also update the banner line:
```typescript
console.log(`${BLUE}║  Sync Logto Organizations → DMS Database Locations        ║${NC}`);
```

- [ ] **Step 5: Update database/seeds/api-client.ts**

Change:
```typescript
const API_BASE_URL = process.env.DMS_API_URL || 'http://localhost:3000';
```

- [ ] **Step 6: Commit**

```bash
git add .env.example apps/sonix-apis/src/main.ts scripts/sync-from-logto.ts \
        scripts/sync-locations.ts database/seeds/api-client.ts
git commit -m "refactor: rename IDS env vars to DMS and update API descriptions"
```

---

## Task 9: Update scripts

**Files:**
- Modify: `scripts/build.ts`
- Modify: `scripts/dev.ts`
- Modify: `scripts/e2e.ts`
- Modify: `scripts/reset-from-scratch.ts`
- Modify: `scripts/tools.ts`
- Modify: `scripts/logto.ts`

- [ ] **Step 1: Update scripts/build.ts**

Replace every occurrence of `sonix-apis` with `sonix-apis` and `@dms/data-models` with `@dms/data-models`:
```bash
sed -i '' "s|sonix-apis|sonix-apis|g; s|@dms/data-models|@dms/data-models|g" scripts/build.ts
```
Also update the human-readable description strings:
- `'Build shared @dms/data-models lib'`
- `'Build client-web + sonix-apis'`
- `'Build sonix-apis only'`
- Banner text: `Building @dms/data-models...`, `Building sonix-apis...`, `✓ sonix-apis built`

- [ ] **Step 2: Update scripts/dev.ts**

```bash
sed -i '' "s|sonix-apis|sonix-apis|g" scripts/dev.ts
```
Also update human-readable strings:
- `'Start sonix-apis dev server only'`
- `[2/3] Starting sonix-apis...`
- `✗ sonix-apis exited unexpectedly...`

- [ ] **Step 3: Update scripts/e2e.ts**

```bash
sed -i '' "s|sonix-apis-e2e|sonix-apis-e2e|g" scripts/e2e.ts
```

- [ ] **Step 4: Update scripts/reset-from-scratch.ts**

```bash
sed -i '' "s|sonix-apis|sonix-apis|g" scripts/reset-from-scratch.ts
```
Verify the human-readable strings also updated (e.g., `Starting sonix-apis server...`, `✓ sonix-apis (http://localhost:3000)`).

- [ ] **Step 5: Update scripts/tools.ts**

Change:
```typescript
console.log(`\n${BOLD}${BLUE}DMS Dev Tools${NC}`);
// ...
description: 'Sync Logto organizations → DMS DB locations',
```

- [ ] **Step 6: Update scripts/logto.ts**

Change:
```typescript
description: 'Sync Logto organizations → DMS DB locations',
```

- [ ] **Step 7: Commit**

```bash
git add scripts/
git commit -m "refactor: update scripts to reference sonix-apis and DMS naming"
```

---

## Task 10: Rename and update logo component and assets

**Files:**
- Rename: `apps/client-web/app/components/IdsLogoImage.tsx` → `DmsLogoImage.tsx`
- Rename: `apps/client-web/public/ids-logo-2025.svg` → `dms-logo-2025.svg`
- Rename: `apps/client-web/public/ids-logo-2025-DARK.svg` → `dms-logo-2025-DARK.svg`
- Modify: `apps/client-web/app/components/Layout.tsx`

- [ ] **Step 1: Rename logo SVG assets**

```bash
mv apps/client-web/public/ids-logo-2025.svg apps/client-web/public/dms-logo-2025.svg
mv apps/client-web/public/ids-logo-2025-DARK.svg apps/client-web/public/dms-logo-2025-DARK.svg
```

- [ ] **Step 2: Rename the component file**

```bash
mv apps/client-web/app/components/IdsLogoImage.tsx \
   apps/client-web/app/components/DmsLogoImage.tsx
```

- [ ] **Step 3: Update DmsLogoImage.tsx content**

Open `apps/client-web/app/components/DmsLogoImage.tsx` and change:
```typescript
interface DmsLogoImageProps {
  // (rename from IdsLogoImageProps)
}

export function DmsLogoImage({width = 200, height = 'auto', sxExtras}: DmsLogoImageProps) {
  return (
    <Box
      component="img"
      src="/dms-logo-2025.svg"
      alt="DMS Logo"
      // ...
    />
  );
}
```

- [ ] **Step 4: Update Layout.tsx**

In `apps/client-web/app/components/Layout.tsx`, change:
```typescript
import {DmsLogoImage} from './DmsLogoImage';
// ...
<DmsLogoImage
```

- [ ] **Step 5: Commit**

```bash
git add apps/client-web/app/components/ apps/client-web/public/
git commit -m "refactor: rename IdsLogoImage → DmsLogoImage and update logo asset paths"
```

---

## Task 11: Update UI strings and locale files

**Files:**
- Modify: `apps/client-web/app/root.tsx`
- Modify: `apps/client-web/app/theme.ts`
- Modify: `apps/client-web/app/locales/en/common.json`
- Modify: `apps/client-web/app/locales/fr/common.json`
- Modify: `apps/client-web/app/locales/en/home.json`
- Modify: `apps/client-web/app/locales/fr/home.json`

- [ ] **Step 1: Update root.tsx page title**

In `apps/client-web/app/root.tsx`, change:
```typescript
title: 'DMS Sonix',
```

- [ ] **Step 2: Update theme.ts comments**

In `apps/client-web/app/theme.ts`, change:
```typescript
// DMS Sonix Theme
// ...
main: mode === 'dark' ? '#42a5f5' : '#1565C0', // DMS Blue (lighter in dark mode for contrast)
// ...
main: '#3C3938', // DMS Dark Gray
```

- [ ] **Step 3: Update en/common.json**

```json
{
  "appName": "DMS Sonix",
  "errors": {
    "serverUnavailable": "You're connected to a network, but DMS Sonix is temporarily unavailable. Some features may not work correctly until the service is available again. Please try again. If the issue persists, contact your DMS administrator.",
    "unexpected": "Something went wrong... please contact your DMS administrator."
  }
}
```

- [ ] **Step 4: Update fr/common.json**

```json
{
  "appName": "DMS Sonix"
}
```

- [ ] **Step 5: Update en/home.json**

```json
{
  "welcome": "Welcome to the DMS Sonix dashboard. Select a module below to get started."
}
```

- [ ] **Step 6: Update fr/home.json**

```json
{
  "welcome": "Welcome to the DMS Sonix dashboard. Select a module below to get started."
}
```

- [ ] **Step 7: Commit**

```bash
git add apps/client-web/app/root.tsx apps/client-web/app/theme.ts \
        apps/client-web/app/locales/
git commit -m "refactor: update UI strings from DMS Sonix to DMS Sonix"
```

---

## Task 12: Update docker-compose.yml

**Files:**
- Modify: `docker-compose.yml`

- [ ] **Step 1: Update IDS comment in docker-compose.yml**

In `docker-compose.yml`, change line 83:
```yaml
ravendb_data: # Named volume for RavenDB data (DMS Sonix app)
```

- [ ] **Step 2: Commit**

```bash
git add docker-compose.yml
git commit -m "refactor: update docker-compose comment from IDS to DMS Sonix"
```

---

## Task 13: Update documentation

**Files:**
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/CODING_STANDARD.md`
- Modify: `docs/DESIGN_STANDARD.md`
- Modify: `docs/TECHNOLOGY_OVERVIEW.md`
- Modify: `docs/features/parts/part-list.md`
- Modify: `docs/features/parts/part-create.md`
- Modify: `docs/features/money/money-implementation-plan.md`
- Modify: `apps/client-web/public/README.md`
- Modify: `apps/sonix-apis/src/location/LOCATIONS_CACHE.md`

- [ ] **Step 1: Bulk rename in docs**

```bash
# Replace sonix-apis with sonix-apis in all docs
find docs apps/client-web/public apps/sonix-apis/src -name "*.md" | \
  xargs sed -i '' "s|sonix-apis|sonix-apis|g"

# Replace DMS Sonix with DMS Sonix
find docs apps/client-web/public apps/sonix-apis/src -name "*.md" | \
  xargs sed -i '' "s|DMS Sonix|DMS Sonix|g"

# Replace standalone IDS (brand) with DMS
find docs apps/client-web/public apps/sonix-apis/src -name "*.md" | \
  xargs sed -i '' "s|DMS Sonix|DMS Sonix|g"
find docs apps/client-web/public apps/sonix-apis/src -name "*.md" | \
  xargs sed -i '' "s|DMS|DMS|g"
find docs apps/client-web/public apps/sonix-apis/src -name "*.md" | \
  xargs sed -i '' "s|@dms/data-models|@dms/data-models|g"
```

- [ ] **Step 2: Update JIRA ticket prefix and URLs**

In `docs/features/parts/part-list.md` and `docs/features/parts/part-create.md`:
- Change `DMSMOD-` → `DMSMOD-`
- Change `dms-sonix.atlassian.net` → `dms-sonix.atlassian.net`
- Change `DMSMOD-14`, `DMSMOD-15`, `DMSMOD-59` → `DMSMOD-14`, `DMSMOD-15`, `DMSMOD-59`

```bash
find docs -name "*.md" | xargs sed -i '' "s|DMSMOD-|DMSMOD-|g; s|dms-sonix.atlassian.net|dms-sonix.atlassian.net|g"
```

- [ ] **Step 3: Update CODING_STANDARD.md URN format**

In `docs/CODING_STANDARD.md`:
- Change `urn:ids:{domain}:{reason}` → `urn:dms:{domain}:{reason}`
- Change example `urn:ids:part:not-found` → `urn:dms:part:not-found`
- Change `urn:ids:vendor:duplicate-vendor-number` → `urn:dms:vendor:duplicate-vendor-number`
- Change JIRA example `DMSMOD-54` → `DMSMOD-54`

- [ ] **Step 4: Update logo references in public/README.md**

In `apps/client-web/public/README.md`:
- Change `ids-logo-2025.svg` → `dms-logo-2025.svg`
- Change `DMS Sonix logo` → `DMS Sonix logo`
- Change `alt="IDS Logo"` → `alt="DMS Logo"`

- [ ] **Step 5: Verify no stale IDS references remain in docs**

```bash
grep -rn "\bIDS\b\|ids-ai-skeleton\|sonix-apis\|IDSMOD\|urn:ids:" docs/ apps/client-web/public/ apps/sonix-apis/src/ --include="*.md"
```
Review output. Any remaining `IDS` occurrences that are not part of a proper noun you're intentionally keeping should be fixed manually.

- [ ] **Step 6: Commit**

```bash
git add docs/ apps/client-web/public/README.md apps/sonix-apis/src/location/LOCATIONS_CACHE.md
git commit -m "docs: rename DMS Sonix → DMS Sonix and sonix-apis → sonix-apis in all documentation"
```

---

## Task 14: Final verification

- [ ] **Step 1: Run full typecheck**

```bash
npm run typecheck
```
Expected: zero errors.

- [ ] **Step 2: Run all tests**

```bash
npm run test:all
```
Expected: all tests pass.

- [ ] **Step 3: Verify no IDS/Astra references remain in source**

```bash
grep -rn "\bIDS\b\|ids-ai-skeleton\|@ids/\|sonix-apis\|IdsLogo\|IDS_ASTRA\|IDS_API\|urn:ids:\|IdsBase" \
  apps/ libs/ scripts/ database/ \
  --include="*.ts" --include="*.tsx" --include="*.json" \
  --include="*.env*" --include="*.yaml" --include="*.yml" \
  | grep -v node_modules | grep -v ".nx/" | grep -v "package-lock.json"
```
Expected: no output (or only intentional occurrences). Fix any found.

- [ ] **Step 4: Commit final cleanup if needed**

```bash
git add -A
git commit -m "refactor: final cleanup of remaining IDS/Astra references"
```
