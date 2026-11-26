import {API_CONFIG} from 'core/config/api';
import {apiClient} from 'core/services/apiClient';
import type {UpdateUserInput, UserProfile} from '../types/user';

export const userQueries = {
  fetchAll: async ({
    signal,
    token,
  }: {
    signal?: AbortSignal;
    token: string;
  }): Promise<UserProfile[]> => {
    return apiClient.get<UserProfile[]>(`${API_CONFIG.baseUrl}/user`, {signal, token});
  },

  fetchById: async ({
    logtoUserId,
    signal,
    token,
  }: {
    logtoUserId: string;
    signal?: AbortSignal;
    token: string;
  }): Promise<UserProfile> => {
    return apiClient.get<UserProfile>(`${API_CONFIG.baseUrl}/user/${logtoUserId}`, {
      signal,
      token,
    });
  },

  update: async (
    logtoUserId: string,
    input: UpdateUserInput,
    token: string,
  ): Promise<UserProfile> => {
    return apiClient.patch<UserProfile>(`${API_CONFIG.baseUrl}/user/${logtoUserId}`, input, {
      token,
    });
  },

  getProfile: async (token: string): Promise<UserProfile> => {
    return apiClient.get<UserProfile>(`${API_CONFIG.baseUrl}/user/profile`, {token});
  },

  updateProfile: async (input: UpdateUserInput, token: string): Promise<UserProfile> => {
    return apiClient.patch<UserProfile>(`${API_CONFIG.baseUrl}/user/profile`, input, {token});
  },

  uploadPhoto: async (logtoUserId: string, file: File, token: string): Promise<UserProfile> => {
    const form = new FormData();
    form.append('photo', file);

    return apiClient.postForm<UserProfile>(
      `${API_CONFIG.baseUrl}/user/${logtoUserId}/photo`,
      form,
      {token},
    );
  },

  deletePhoto: async (logtoUserId: string, token: string): Promise<UserProfile> => {
    return apiClient.delete<UserProfile>(`${API_CONFIG.baseUrl}/user/${logtoUserId}/photo`, {
      token,
    });
  },
};
