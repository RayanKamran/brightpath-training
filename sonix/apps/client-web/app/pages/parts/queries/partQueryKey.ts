export const PART_QUERY_KEYS = {
  all: (locationId: string) => ['parts', locationId] as const,
  list: (locationId: string, filters?: Record<string, unknown>) =>
    ['parts', locationId, 'list', filters ?? {}] as const,
  detail: (id: string) => ['parts', 'detail', id] as const,
  partStatusCodes: () => ['part-status-codes'] as const,
  uoms: () => ['uoms'] as const,
  glGroups: () => ['gl-groups'] as const,
  taxCodes: () => ['tax-codes'] as const,
  saleCategories: () => ['sale-categories'] as const,
  shipWeightCodes: () => ['ship-weight-codes'] as const,
  initialVendors: () => ['vendors', 'initial'] as const,
  initialBins: (locationId: string) => ['bins', locationId, 'initial'] as const,
  initialParts: (locationId: string) => ['parts', locationId, 'initial'] as const,
} as const;
