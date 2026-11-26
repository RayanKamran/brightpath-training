import {useQuery} from '@tanstack/react-query';
import {useLocation} from 'core/contexts/location/useLocation';
import {partQueries} from '../queries/partQueries';
import {PART_QUERY_KEYS} from '../queries/partQueryKey';

export function usePart(partNumber: string) {
  const {locationToken, refreshLocationToken} = useLocation();

  return useQuery({
    queryKey: PART_QUERY_KEYS.detail(partNumber),
    queryFn: ({signal}) =>
      partQueries.fetchById({
        id: partNumber,
        signal,
        token: locationToken ?? undefined,
        refreshToken: refreshLocationToken,
      }),
    enabled: !!partNumber && !!locationToken,
  });
}
