import {API_CONFIG} from '../config/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface SalespersonListItem {
  id: string;
  displayName: string;
  email: string;
}

export type UserProfile = {
  id: string;
  logtoUserId: string;
  email: string;
  username: string | null;
  nickname: string | null;
  displayName: string | null;
  bio: string | null;
  preferredLanguage: string | null;
  timezone: string | null;
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  profileCompleteness: number;
  lastLoginAt: string | null;
  hasProfilePhoto: boolean;
};

export type UpdateUserInput = {
  displayName?: string | null;
  bio?: string | null;
  timezone?: string | null;
  preferredLanguage?: string | null;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  marketingEmails?: boolean;
};

class UserApiService {
  private readonly _baseUrl: string;

  constructor() {
    this._baseUrl = `${API_CONFIG.baseUrl}/user`;
  }

  private _headers(accessToken: string): HeadersInit {
    return {Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json'};
  }

  async searchSalespeople(accessToken: string, q?: string): Promise<SalespersonListItem[]> {
    const params = new URLSearchParams();
    if (q) {
      params.append('q', q);
    }
    const response = await fetch(`${this._baseUrl}/search?${params}`, {
      headers: this._headers(accessToken),
    });
    if (!response.ok) {
      throw new Error(`Failed to search users: ${response.statusText}`);
    }
    return response.json();
  }

  async getUsers(accessToken: string): Promise<UserProfile[]> {
    const response = await fetch(this._baseUrl, {headers: this._headers(accessToken)});
    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(`Failed to fetch users: ${errorText}`, response.status);
    }
    return response.json();
  }

  async getUser(accessToken: string, logtoUserId: string): Promise<UserProfile> {
    const response = await fetch(`${this._baseUrl}/${logtoUserId}`, {
      headers: this._headers(accessToken),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(`Failed to fetch user: ${errorText}`, response.status);
    }
    return response.json();
  }

  async updateUser(
    accessToken: string,
    logtoUserId: string,
    input: UpdateUserInput,
  ): Promise<UserProfile> {
    const response = await fetch(`${this._baseUrl}/${logtoUserId}`, {
      method: 'PATCH',
      headers: this._headers(accessToken),
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(`Failed to update user: ${errorText}`, response.status);
    }
    return response.json();
  }

  getPhotoUrl(logtoUserId: string): string {
    return `${this._baseUrl}/${logtoUserId}/photo`;
  }

  async uploadPhoto(accessToken: string, logtoUserId: string, file: File): Promise<UserProfile> {
    const form = new FormData();
    form.append('photo', file);
    const response = await fetch(`${this._baseUrl}/${logtoUserId}/photo`, {
      method: 'POST',
      headers: {Authorization: `Bearer ${accessToken}`},
      body: form,
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(`Failed to upload photo: ${errorText}`, response.status);
    }
    return response.json();
  }

  async deletePhoto(accessToken: string, logtoUserId: string): Promise<UserProfile> {
    const response = await fetch(`${this._baseUrl}/${logtoUserId}/photo`, {
      method: 'DELETE',
      headers: this._headers(accessToken),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(`Failed to delete photo: ${errorText}`, response.status);
    }
    return response.json();
  }
}

export const userApi = new UserApiService();
