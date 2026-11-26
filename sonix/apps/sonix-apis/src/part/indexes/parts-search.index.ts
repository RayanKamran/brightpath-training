import {AbstractJavaScriptIndexCreationTask} from 'ravendb';
import {type Part, PartStatus} from '../entities/part.entity';

type PartsSearchEntry = {
  /** Top-level part number — required for .orderBy('partNumber') on this index. */
  partNumber: string;
  /** All searchable text tokens — full-text indexed. */
  query: string[];
  /** Flat array of location document IDs for the location filter. */
  locationIds: string[];
  isDeleted: boolean;
  status: PartStatus;
};

/**
 * Parts/Search — static JavaScript index for server-side full-text search and filtering.
 *
 * Index name derived from class name: Parts_Search → "Parts/Search"
 *
 * The `query` field uses RavenDB's Lucene StandardAnalyzer (`this.index('query', 'Search')`)
 * which handles tokenization, lowercasing, and stop-word removal natively.
 * The service passes the raw search term to `.search()` — no manual tokenization needed.
 *
 * Indexed fields (all contribute to `query`):
 *   - partNumber, description, vendorPartNumber (top-level)
 *   - vendors[].vendor.name, vendors[].vendor.vendorNumber, vendors[].vendorPartNumber
 *   - locations[].location.name, locations[].location.displayName
 *   - locations[].bins[].bin.binNumber, locations[].bins[].bin.description
 *
 * Additional filterable fields:
 *   - locationIds  — flat array of location IDs for equality filtering
 *   - isDeleted    — soft-delete flag
 *   - status       — PartStatus (active / retired)
 */
export function buildPartsSearchEntry(part: Part): PartsSearchEntry {
  const vendorNames = part.vendors.map((v) => v.vendor.name || '');
  const vendorNumbers = part.vendors.map((v) => v.vendor.vendorNumber || '');
  const vendorPartNumbers = part.vendors.map((v) => v.vendorPartNumber || '');
  const locationNames = part.locations.map((l) => l.location.name || '');
  const locationDisplayNames = part.locations.map((l) => l.location.displayName || '');
  const binNumbers = part.locations.reduce(
    (acc: string[], l) => acc.concat(l.bins.map((b) => b.bin.binNumber || '')),
    [],
  );
  const binDescriptions = part.locations.reduce(
    (acc: string[], l) => acc.concat(l.bins.map((b) => b.bin.description || '')),
    [],
  );

  return {
    partNumber: part.partNumber,
    query: (
      [part.partNumber || '', part.description || '', part.vendorPartNumber || ''] as string[]
    )
      .concat(vendorNames)
      .concat(vendorNumbers)
      .concat(vendorPartNumbers)
      .concat(locationNames)
      .concat(locationDisplayNames)
      .concat(binNumbers)
      .concat(binDescriptions),
    locationIds: part.locations.map((l) => l.location.id),
    isDeleted: part.isDeleted,
    status: part.status,
  };
}

export class Parts_Search extends AbstractJavaScriptIndexCreationTask<Part, PartsSearchEntry> {
  public constructor() {
    super();

    this.map('parts', buildPartsSearchEntry);

    // Enable full-text search (Lucene StandardAnalyzer) on the query field.
    this.index('query', 'Search');
    // Don't store — we only need it for search, not retrieval.
    this.store('query', 'No');
  }
}
