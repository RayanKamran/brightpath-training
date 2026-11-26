import {useQuery} from '@tanstack/react-query';
import {useAuth} from 'core/contexts/auth/useAuth';
import {locationQueries} from '../queries/locationQueries';
import {LOCATION_QUERY_KEYS} from '../queries/locationQueryKey';

export function useLocation(id: string) {
  const {accessToken} = useAuth();

  return useQuery({
    queryKey: LOCATION_QUERY_KEYS.detail(id),
    queryFn: ({signal}) => locationQueries.fetchById({id, signal, token: accessToken ?? ''}),
    enabled: !!accessToken && !!id,
  });
}
