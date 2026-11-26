# Properties: Add a new part (DMSMOD-15 / DMSMOD-59)

Source: `sonix/docs/features/parts/part-create.md` (v2.0). Line numbers below are lines of that file.
Written from the spec **before any create code existed**, approved by the repo owner, then locked
(see `docs/property-testing.md`). Library: [fast-check](https://fast-check.dev) under vitest,
1000 generated cases per property.

Tests: `sonix/apps/sonix-apis/src/part/__properties__/part-create.properties.test.ts` (locked).

## The contract the tests call

The spec names these; the tests fix where they live so the implementation has a target.

- `sonix/apps/sonix-apis/src/part/dto/part-create.dto.ts` exports `PartCreateDto`,
  `PartVendorCreateDto` (`vendorNumber`, `vendorPartNumber?`, `isPrimary`, `cost?` in cents) and
  `PartBinCreateDto` (`binCode`, `isMain`) with class-validator decorators (spec 897-1021).
- `PartService.create(dto: PartCreateDto, userId: string)` returns `PartCreateResponseDto`
  (`partNumber`, `description`, `locationId | null`) and throws Nest's `BadRequestException`,
  `NotFoundException` or `ConflictException` (spec 870-879).
- It reads with `session.load(id)` / `session.load(ids[])` and writes once with
  `session.store(part, 'parts/{partNumber}')` + `session.saveChanges()` (spec 1152-1162). The tests
  give it an in-memory fake session holding vendors `vendors/{n}`, locations `locations/{id}` and
  bins `bins/{locationId}/{binCode}` (spec 201-211, 788-823). `locationId` is sent bare (`LOC_A`).
- `PartService.findOne(partNumber)` (already exists) reads it back.

## The properties

| # | Kind | Property | Spec lines |
|---|---|---|---|
| P1 | Round-trip | For any valid create payload, `create` then `findOne` gives back the same partNumber, description, status (`active` when omitted), list price, UOMs, restocking fields, and the same vendors (number, primary flag, cost in cents, vendorPartNumber defaulting to the part number). | 64, 70, 517, 641, 1084-1086 |
| P2 | Invariant | Every part `create` accepts has exactly one primary vendor, no repeated vendor number, at most one main bin, and `avgCost` equal to the primary vendor's cost (`0 USD` if it has none). | 41-43, 547, 553, 575, 1164-1166 |
| P3 | Invariant | On any accepted create, the rollups hold: `numOnHand = onHandQty ?? 0`, committed / on-order / special / backordered start at 0, `numAvailable = numOnHand + numOnOrder - numCommitted`, `totalOnHand = sum(locations.numOnHand)`, `totalAvailable = (totalOnHand + totalOnOrder) - totalCommitted`, `totalNetAvailable = totalAvailable - totalSpecialOrderCommitted`. | 425-464, 673-703, 748 |
| P4 | Equivalence | `create` rejects with 400 **if and only if** a plain reference model of the business rules says so: not exactly one primary vendor, a repeated vendor number, a vendor that doesn't exist, `maxQty < minQty`, `shippingWeight > 0` with no `shippingUnit`, bins without exactly one main, repeated bin codes, or a bin that doesn't exist. A missing location is 404. A rejected create writes nothing. | 523-566, 629-643, 733-743, 870-879 |
| P5 | Equivalence | DTO validation accepts a part number **if and only if** it is 1-50 characters of letters, digits, `-`, `.`, `_`. Same for description (non-empty string) and every numeric field (`>= 0`). | 50, 245, 499, 874, 914-1003 |
| P6 | Idempotency | Creating the same payload twice: the first succeeds, every later attempt is 409 and leaves the stored part exactly as the first create wrote it. | 45, 51, 135-150, 505, 879, 1152-1154 |
| P7 | Idempotency | `pogNumber` is stored uppercase, and normalising an already-stored value again changes nothing (`up(up(x)) = up(x)`, and what `findOne` returns equals what was sent, uppercased). | 323, 535 |

## Spec conflict I found while writing these (decide before build)

Line 535 says `pogNumber` is "stored uppercase (auto-converted)"; line 875 lists "`pogNumber` not
uppercase" as a **400**. Both can't be true. P7 follows 535 + 1003 (auto-convert), since that is the
business rule table and the error table is the summary.

## Not covered by properties (unit tests or manual instead)

The frontend form and its Valibot schema (36-40, 1102-1132), PATCH / edit (1023-1025, 1168-1179),
the `Location` header (1056), auth/audit fields (1090-1096). Edit is a separate story in the same
doc, out of this ticket's two stories.
