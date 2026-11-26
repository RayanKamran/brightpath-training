import {useQuery} from '@tanstack/react-query';
import {useAuth} from 'core/contexts/auth/useAuth';
import {locationQueries} from '../queries/locationQueries';
import {LOCATION_QUERY_KEYS} from '../queries/locationQueryKey';

type UseLocationsOptions = {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  active?: boolean;
};

export function useLocations(options: UseLocationsOptions = {}) {
  const {accessToken} = useAuth();
  const {page = 1, pageSize = 10, searchTerm = '', active} = options;

  return useQuery({
    queryKey: LOCATION_QUERY_KEYS.list({page, pageSize, searchTerm, active}),
    queryFn: ({signal}) => {
      if (!accessToken) {
        throw new Error('No access token available');
      }
      return locationQueries.fetchAll({
        page,
        pageSize,
        searchTerm: searchTerm || undefined,
        active,
        signal,
        token: accessToken,
      });
    },
    enabled: !!accessToken,
  });
}
