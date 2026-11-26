import {useQuery} from '@tanstack/react-query';
import {useLocation} from 'core/contexts/location/useLocation';
import {partQueries} from '../queries/partQueries';
import {PART_QUERY_KEYS} from '../queries/partQueryKey';

type UsePartsOptions = {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
};

export function useParts(options: UsePartsOptions = {}) {
  const {currentLocation, locationToken, refreshLocationToken} = useLocation();
  const locationId = currentLocation?.id ?? '';
  const {page = 1, pageSize = 25, searchTerm = ''} = options;

  return useQuery({
    queryKey: PART_QUERY_KEYS.list(locationId, {page, pageSize, searchTerm}),
    queryFn: ({signal}) =>
      partQueries.fetchAll({
        locationId,
        searchTerm,
        page,
        pageSize,
        signal,
        token: locationToken ?? undefined,
        refreshToken: refreshLocationToken,
      }),
    enabled: !!locationId && !!locationToken,
  });
}
