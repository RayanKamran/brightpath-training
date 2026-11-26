import {API_CONFIG} from '../config/api';

export function getUserPhotoUrl(logtoUserId: string): string {
  return `${API_CONFIG.baseUrl}/user/${logtoUserId}/photo`;
}
