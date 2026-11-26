import type {UpdateUserDto, User} from '@dms/data-models';
import {API_CONFIG} from '../config/api';

/**
 * Get the authenticated user's profile from RavenDB
 */
export async function getUserProfile(accessToken: string): Promise<User> {
  const response = await fetch(`${API_CONFIG.baseUrl}/user/profile`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('User profile not found. Please contact support.');
    }
    throw new Error(`Failed to fetch user profile: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Update the authenticated user's profile
 */
export async function updateUserProfile(
  accessToken: string,
  updates: UpdateUserDto,
): Promise<User> {
  const response = await fetch(`${API_CONFIG.baseUrl}/user/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error(`Failed to update user profile: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Delete the authenticated user's profile
 */
export async function deleteUserProfile(accessToken: string): Promise<void> {
  const response = await fetch(`${API_CONFIG.baseUrl}/user/profile`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete user profile: ${response.statusText}`);
  }
}

/**
 * Get a user profile by ID
 */
export async function getUserById(accessToken: string, id: string): Promise<User> {
  const response = await fetch(`${API_CONFIG.baseUrl}/user/${id}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('User not found');
    }
    throw new Error(`Failed to fetch user: ${response.statusText}`);
  }

  return await response.json();
}
