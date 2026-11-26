import {MutationCache, QueryCache, QueryClient} from '@tanstack/react-query';
import {
  ApiError,
  isTransientError,
  NetworkOfflineError,
  ServerUnreachableError,
} from '../config/apiErrors';
import {networkMonitor} from '../services/networkMonitor';
import {setSignOutNotice} from '../storage/sessionStore';

function handleGlobalError(error: Error): void {
  if (error instanceof NetworkOfflineError || error instanceof ServerUnreachableError) {
    networkMonitor.reportServerUnreachable();
    return;
  }
  if (error instanceof ApiError && error.status === 401) {
    setSignOutNotice('session_expired');
    window.location.href = '/sign-in';
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({onError: handleGlobalError}),
  mutationCache: new MutationCache({onError: handleGlobalError}),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60_000, // 5 minutes
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
      retry: (failureCount, error) => {
        if (isTransientError(error)) {
          return false;
        }
        if (error instanceof ApiError) {
          if ([401, 403, 404, 422].includes(error.status)) {
            return false;
          }
        }
        return failureCount < 2;
      },
    },
  },
});
