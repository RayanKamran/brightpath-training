export const USER_QUERY_KEYS = {
  all: () => ['users'] as const,
  list: () => ['users', 'list'] as const,
  detail: (logtoUserId: string) => ['users', 'detail', logtoUserId] as const,
} as const;
