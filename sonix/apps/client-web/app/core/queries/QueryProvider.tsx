import {onlineManager, QueryClientProvider} from '@tanstack/react-query';
import {ReactQueryDevtools} from '@tanstack/react-query-devtools';
import {type ReactNode, useEffect} from 'react';
import {networkMonitor} from '../services/networkMonitor';
import {queryClient} from './queryClient';

const showDevtools =
  import.meta.env.DEV &&
  typeof window !== 'undefined' &&
  localStorage.getItem('show-query-devtools') === 'true';

export function QueryProvider({children}: {children: ReactNode}) {
  useEffect(() => {
    const unsubscribe = networkMonitor.subscribe(() => {
      const {status} = networkMonitor.getSnapshot();
      onlineManager.setOnline(status === 'connected');
    });

    // Set initial state
    const {status} = networkMonitor.getSnapshot();
    onlineManager.setOnline(status === 'connected');

    return unsubscribe;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {showDevtools && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
