export const LOCATION_QUERY_KEYS = {
  all: () => ['locations'] as const,
  list: (filters?: Record<string, unknown>) => ['locations', 'list', filters ?? {}] as const,
  detail: (id: string) => ['locations', 'detail', id] as const,
} as const;
