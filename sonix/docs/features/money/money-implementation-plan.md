# Money & Multi-Currency Implementation Plan

## Overview

This plan standardises all monetary values across the application as a structured `Money` object — an integer amount in the currency's minor unit paired with an ISO 4217 currency code. This eliminates floating-point precision risk and provides first-class multi-currency support for Locations in different jurisdictions.

No database migration script is required. All developers will reset their local environments after the seed data is updated.

---

## Implementation Progress

| Status | File | Change |
|--------|------|--------|
| ✅ Done | `libs/shared/data-models/src/lib/money/money.ts` | **Create** — `Money` interface, `CurrencyCode`, all utility functions |
| ✅ Done | `apps/sonix-apis/src/common/dto/money.dto.ts` | **Create** — `MoneyDto` / `SignedMoneyDto` |
| ✅ Done | `libs/shared/data-models/src/lib/money/index.ts` | Add `money.ts` export |
| ✅ Done | `libs/shared/data-models/src/lib/location/location.interface.ts` | Add `defaultCurrency: CurrencyCode` to `DbLocation` |
| ✅ Done | `apps/sonix-apis/src/location/entities/location.entity.ts` | Add `defaultCurrency: CurrencyCode` |
| ✅ Done | `apps/sonix-apis/src/part/entities/part.entity.ts` | 4 fields → `Money` |
| ✅ Done | `apps/sonix-apis/src/part/dto/create-part.dto.ts` | 4 fields → `MoneyDto` |
| ✅ Done | `apps/sonix-apis/src/inventory/entities/inventory.entity.ts` | 7 fields → `Money` |
| ✅ Done | `apps/sonix-apis/src/inventory/dto/inventory.dto.ts` | 5 create fields + response fields → `MoneyDto` / `Money` |
| ✅ Done | `apps/client-web/app/pages/parts/queries/partQueries.ts` | 4 fields → `Money` |
| ✅ Done | `apps/client-web/app/pages/parts/PartList.tsx` | Remove local `formatCurrency`, use `formatMoney` from `@dms/data-models` |
| ✅ Done | Seed data files (`location.data.ts`, `part.data.ts`, `inventory.data.ts`) | Add `defaultCurrency` to locations; wrap all monetary values in `{ amount, currency }` |

---

## Core Design Decisions

### 1. The `Money` type

```typescript
interface Money {
  amount: number;   // integer, in minor units (cents for USD/CAD/EUR)
  currency: string; // ISO 4217 code: 'USD', 'CAD', 'EUR', etc.
}
```

- `amount` is **always an integer** — `1299` means $12.99, never `12.99`
- `currency` is a validated ISO 4217 code stored on every monetary value
- Stored as a JSON sub-object in RavenDB — no schema change required

### 2. Rates are NOT Money

Interest rates (`loanRate`), tax rates (`taxRate`), and compound rates remain **basis points** (`number`) — e.g. `699` = 6.99%. `grossMargin` remains a decimal ratio. These are not monetary values and are not changed.

### 3. Location default currency

Each `Location` gains a `defaultCurrency: string` field. When a new Quote, Inventory record, or Part price is created, its `Money` values default to the location's `defaultCurrency`. Users may override on individual records where cross-currency applies (e.g. a cross-border trade-in).

### 4. Calculation accuracy

Integer arithmetic removes floating-point representation errors, but two new categories of precision risk appear when rates are involved:

#### a) Rate application (tax, discount, interest)

Multiplying an integer amount by a percentage rate produces a non-integer result that must be rounded:

```
Tax on $123.45 at 6.25%:
  12345 cents × 625 basis points / 10000 = 771.5625 → round → 772 cents ($7.72)
```

The rule is always `Math.round()` — never `floor` or `ceil`. Consistently rounding halves up is the standard accounting convention and ensures neither party is systematically disadvantaged. The helper `applyRate(money, basisPoints)` encapsulates this.

#### b) Proration / allocation (splitting a total across items)

If a total must be split across multiple items (e.g. prorating a freight charge across three units, or splitting a discount across line items), naïve rounding on each share causes the pieces to not sum back to the whole:

```
Split $10.00 (1000 cents) three ways:
  Naïve:  333 + 333 + 333 = 999 ← off by 1 cent
  Correct: 334 + 333 + 333 = 1000 ✓
```

The solution is the **largest remainder method**: compute floor shares, calculate how many cents are left over, then distribute one extra cent to the shares with the largest fractional remainders. The helper `allocateMoney(money, ratios)` implements this and guarantees the pieces always sum to the original value.

#### c) Compound calculations (discount then tax)

Apply operations in a defined, documented order. For a sales quote:
1. Calculate `totalListPrice` (base + freight + selected options)
2. Apply discount to get `sellingAmount`
3. Apply tax rate to `taxableBase` (which may differ from `sellingAmount`)

Each step uses `applyRate()` or integer arithmetic — never accumulate intermediate floats.

### 5. No third-party library in the shared data models

The `@dms/data-models` library is dependency-free. All arithmetic utilities use plain integer math. If complex rounding scenarios arise in future modules (payroll, forex), `dinero.js` can be added to the consuming apps (`sonix-apis`, `client-web`) at that point without touching the shared contract.

---

## Files to Create

### `libs/shared/data-models/src/lib/money/money.ts`

Defines the `Money` interface, a curated `CurrencyCode` union of supported ISO 4217 codes, and pure utility functions.

```typescript
export type CurrencyCode = 'CAD' | 'USD' | 'EUR' | 'GBP' | 'AUD' | 'MXN';

export const SUPPORTED_CURRENCIES: readonly CurrencyCode[] = ['CAD', 'USD', 'EUR', 'GBP', 'AUD', 'MXN'];

export interface Money {
  amount: number;   // integer minor units
  currency: CurrencyCode;
}

/** Parse a user-entered decimal string or number to a Money value. */
export function toMoney(value: number | string, currency: CurrencyCode): Money {
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
  return { amount: Math.round((isNaN(num) ? 0 : num) * 100), currency };
}

/** Add two Money values. Throws if currencies differ. */
export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) throw new Error(`Currency mismatch: ${a.currency} + ${b.currency}`);
  return { amount: a.amount + b.amount, currency: a.currency };
}

/** Subtract b from a. Throws if currencies differ. */
export function subtractMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) throw new Error(`Currency mismatch: ${a.currency} - ${b.currency}`);
  return { amount: a.amount - b.amount, currency: a.currency };
}

/** Multiply a Money value by a scalar (e.g. quantity). Rounds to nearest minor unit. */
export function multiplyMoney(money: Money, scalar: number): Money {
  return { amount: Math.round(money.amount * scalar), currency: money.currency };
}

/** Sum an array of Money values. All must share the same currency. */
export function sumMoney(values: Money[], currency: CurrencyCode): Money {
  return values.reduce((acc, v) => addMoney(acc, v), { amount: 0, currency });
}

/** Format a Money value for display using the browser/Node Intl API. */
export function formatMoney(money: Money, locale = 'en-CA'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: money.currency,
  }).format(money.amount / 100);
}

/** Zero value for a given currency. */
export function zeroMoney(currency: CurrencyCode): Money {
  return { amount: 0, currency };
}

/**
 * Apply a rate expressed in basis points to a Money value and return the resulting amount.
 *
 * WHY BASIS POINTS: Rates are stored as integers (basis points) rather than decimals to avoid
 * floating-point representation errors. 6.25% stored as 0.0625 cannot be represented exactly
 * in IEEE 754 binary floating point; stored as 625 basis points it is an exact integer.
 * The formula `amount * basisPoints / 10000` keeps all intermediate values as integers
 * until the final division, minimising accumulated error.
 *
 * WHY Math.round(): The division always produces a non-integer result (e.g. 771.5625 cents).
 * Math.round() is the standard accounting convention — it rounds halves away from zero,
 * which is symmetric and ensures neither party (buyer nor seller) is systematically
 * advantaged by rounding. Math.floor() would always favour the payer; Math.ceil() would
 * always favour the payee. Never substitute either of those here.
 *
 * USE FOR: tax amounts, discounts, dealer fees, insurance premiums, interest calculations.
 * Do NOT use for splitting a total across multiple items — use allocateMoney() instead.
 *
 * Examples:
 *   applyRate({ amount: 12345, currency: 'USD' }, 625)   // 6.25% tax → { amount: 772, currency: 'USD' } ($7.72)
 *   applyRate({ amount: 50000, currency: 'CAD' }, 1000)  // 10% discount → { amount: 5000, currency: 'CAD' } ($50.00)
 */
export function applyRate(money: Money, basisPoints: number): Money {
  return { amount: Math.round(money.amount * basisPoints / 10000), currency: money.currency };
}

/**
 * Split a Money value across multiple shares using the largest remainder method,
 * guaranteeing the pieces always sum exactly to the original amount.
 *
 * WHY THIS EXISTS: Naïvely rounding each share independently almost always produces a
 * total that is off by one or more cents. For example, splitting 1000 cents three ways:
 *   Math.round(1000/3) × 3  →  333 + 333 + 333 = 999  ← 1 cent lost
 * In financial systems this is unacceptable — cents must be fully accounted for.
 *
 * HOW THE LARGEST REMAINDER METHOD WORKS:
 *   1. Give every share its floor (round-down) value. This guarantees we never overshoot.
 *   2. Count how many cents are left over (original − sum of floors).
 *   3. Distribute one extra cent each to the shares whose fractional remainder was
 *      largest (i.e. they were closest to deserving the next whole cent).
 * The result: pieces always sum exactly to the original, and the allocation is as fair
 * as possible — no share receives more than one extra cent beyond its floor.
 *
 * WHY NOT applyRate() INSTEAD: applyRate() computes a derived amount (e.g. a tax on a
 * base). allocateMoney() distributes an existing total — the semantics are different.
 * Use applyRate() when calculating what a rate produces; use allocateMoney() when
 * dividing a known total so that every cent lands somewhere.
 *
 * Pass ratios as plain numbers in any unit — they do not need to sum to any particular
 * value. The function normalises them internally.
 *
 * USE FOR: prorating freight across units, splitting a shared fee across line items,
 * distributing a rebate proportionally, dividing a down payment across periods.
 *
 * Example — split $10.00 three ways:
 *   allocateMoney({ amount: 1000, currency: 'USD' }, [1, 1, 1])
 *   → [{ amount: 334 }, { amount: 333 }, { amount: 333 }]  // 334 + 333 + 333 = 1000 ✓
 *
 * Example — prorate a $50 freight charge across units worth $200 and $300:
 *   allocateMoney({ amount: 5000, currency: 'USD' }, [200, 300])
 *   → [{ amount: 2000 }, { amount: 3000 }]  // $20.00 + $30.00 = $50.00 ✓
 */
export function allocateMoney(money: Money, ratios: number[]): Money[] {
  if (ratios.length === 0) return [];
  const total = ratios.reduce((sum, r) => sum + r, 0);
  if (total === 0) throw new Error('allocateMoney: ratios must not all be zero');

  const shares = ratios.map((r) => Math.floor((money.amount * r) / total));
  const remainders = ratios.map((r, i) => (money.amount * r) / total - shares[i]);
  let leftover = money.amount - shares.reduce((sum, s) => sum + s, 0);

  // Distribute leftover cents to the indices with the largest fractional remainders
  const order = remainders
    .map((r, i) => ({ r, i }))
    .sort((a, b) => b.r - a.r)
    .map((x) => x.i);

  for (let k = 0; k < leftover; k++) {
    shares[order[k]]++;
  }

  return shares.map((amount) => ({ amount, currency: money.currency }));
}
```

**Note on minor units:** This plan targets currencies with 2 decimal places (USD, CAD, EUR, GBP, AUD, MXN). If zero-decimal (JPY) or 3-decimal (KWD) currencies are needed in future, the divisor in `toMoney` and `formatMoney` must be parameterised via an ISO 4217 minor-unit lookup table. This is not required now.

---

### `apps/sonix-apis/src/common/dto/money.dto.ts`

NestJS DTO for validating `Money` objects in request bodies.

```typescript
import { IsIn, IsInt, Min } from 'class-validator';
import { SUPPORTED_CURRENCIES } from '@dms/data-models';

export class MoneyDto {
  @IsInt()
  @Min(0)
  amount!: number;

  @IsIn(SUPPORTED_CURRENCIES)
  currency!: string;
}
```

For fields that can be negative (e.g. `netTradeAmount`, rebates, add-ons): use a separate `SignedMoneyDto` that omits `@Min(0)`.

---

## Files to Modify

### `libs/shared/data-models/src/lib/money/index.ts`

Add export:
```typescript
export * from './money.js';
```

---

### `libs/shared/data-models/src/lib/location/location.interface.ts`

Add to `DbLocation`:
```typescript
defaultCurrency: CurrencyCode;
```

---

### `apps/sonix-apis/src/location/entities/location.entity.ts`

Add field:
```typescript
public defaultCurrency!: CurrencyCode;
```

The Location DTO and seed data must also supply a `defaultCurrency`.

---

### `apps/sonix-apis/src/part/entities/part.entity.ts`

Change monetary fields from `number` to `Money`:

| Field | Class | Old type | New type |
|---|---|---|---|
| `avgCost` | `Part` | `number \| undefined` | `Money \| undefined` |
| `listPrice` | `Part` | `number \| undefined` | `Money \| undefined` |
| `cost` | `PartVendor` | `number \| undefined` | `Money \| undefined` |
| `listPrice` | `PartLocation` | `number \| undefined` | `Money \| undefined` |

---

---

### `apps/sonix-apis/src/part/dto/create-part.dto.ts`

Replace `@IsNumber() @IsOptional() fieldName?: number` with:

```typescript
@IsOptional()
@ValidateNested()
@Type(() => MoneyDto)
fieldName?: MoneyDto;
```

Affected fields: `avgCost`, `listPrice` (Part), `cost` (PartVendor), `listPrice` (PartLocation).


---

### `apps/client-web/app/services/partApi.ts`

Change the `Money`-typed fields in `Part`, `PartVendor`, `PartLocation`, `PartListItem`, `CreatePartInput`, and `UpdatePartInput` from `number` to `Money` (imported from `@dms/data-models`).

---

### `apps/client-web/app/routes/parts/index.tsx`

Remove the local `formatCurrency(value)` helper. Replace all call sites with `formatMoney(money)` from `@dms/data-models`.

---

### `database/seed-runner.ts`

Update all monetary seed values to the `Money` structure. The location seed data gains `defaultCurrency`.

**Locations** — add `defaultCurrency`:
- Acme RV (US locations): `'USD'`
- Add Canadian/other locations if present: `'CAD'`

**Inventory** — convert from bare cents integers:
```
// Before:  baseList: 3899900
// After:   baseList: { amount: 3899900, currency: 'USD' }
```

**Parts** — convert from bare dollar floats to Money (multiply × 100):
```
// Before:  listPrice: 12.99
// After:   listPrice: { amount: 1299, currency: 'USD' }

// Before:  cost: 6.45
// After:   cost: { amount: 645, currency: 'USD' }
```

Apply to: `Part.listPrice`, `Part.avgCost`, `PartVendor.cost`, `PartLocation.listPrice`.

---

## Coding Standards (to add to `docs/standards/coding-standards-core.md`)

1. **Never use `number` for a monetary value.** All monetary fields must be typed as `Money`.
2. **Never do arithmetic directly on `money.amount`.** Use the utilities in `@dms/data-models`: `addMoney`, `subtractMoney`, `multiplyMoney`, `sumMoney`.
3. **Round with `Math.round()` only.** Never `floor` or `ceil` for currency arithmetic.
4. **Parse at the boundary.** Convert user input to `Money` immediately on form submit using `toMoney()`. Never pass raw decimal strings or floats as monetary values across component or API boundaries.
5. **Format at the boundary.** Convert `Money` to a display string only at the final render layer using `formatMoney()`. Never store or pass formatted strings as monetary values.
6. **Currency is always explicit.** Never default silently. Every `Money` value carries its own `currency`. Inherit from `Location.defaultCurrency` when creating new records.
7. **Never mix currencies in arithmetic.** `addMoney` and `subtractMoney` throw if currencies differ. Cross-currency transactions must record an explicit `exchangeRate` snapshot (future AR/AP work).
8. **Rates are not Money.** Interest rates, tax rates, and margins remain `number` in basis points or decimal ratios as documented per entity.
9. **Use `applyRate()` for all percentage-based calculations.** Never multiply `money.amount` by a rate inline — always go through `applyRate(money, basisPoints)` so rounding is consistent and auditable. Tax amounts, discounts, and dealer fees all use this.
10. **Use `allocateMoney()` whenever splitting a total across items.** Never divide `money.amount` and round each piece independently — this produces off-by-one errors. Use `allocateMoney(total, ratios)` which guarantees the pieces sum exactly to the original. Examples: prorating freight, splitting a shared fee across line items, dividing a rebate.
11. **Document calculation order.** Wherever a sequence of operations is applied (e.g. discount then tax), add a comment stating the order explicitly. Changing the order changes the result.

---

## Summary of New / Changed Files

| File | Action |
|---|---|
| `libs/shared/data-models/src/lib/money/money.ts` | **Create** |
| `apps/sonix-apis/src/common/dto/money.dto.ts` | **Create** |
| `libs/shared/data-models/src/lib/money/index.ts` | Add export |
| `libs/shared/data-models/src/lib/location/location.interface.ts` | Add `defaultCurrency` |
| `apps/sonix-apis/src/location/entities/location.entity.ts` | Add `defaultCurrency` |
| `apps/sonix-apis/src/part/entities/part.entity.ts` | 4 fields → `Money` |
| `apps/sonix-apis/src/inventory/entities/inventory.entity.ts` | 7 fields → `Money` |
| `apps/sonix-apis/src/part/dto/create-part.dto.ts` | 4 fields → `MoneyDto` |
| `apps/sonix-apis/src/inventory/dto/inventory.dto.ts` | 5 fields → `MoneyDto` |
| `apps/client-web/app/services/partApi.ts` | 4 fields → `Money` |
| `apps/client-web/app/routes/parts/index.tsx` | Remove `formatCurrency`, use `formatMoney` |
| `database/seed-runner.ts` | Wrap all monetary values in `{ amount, currency }` |
