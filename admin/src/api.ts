import type { AdminMessage } from './types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response
      .json()
      .then((data) => data?.message ?? response.statusText)
      .catch(() => response.statusText);
    throw new Error(message || 'Request failed.');
  }

  return response.json() as Promise<T>;
}

export async function fetchAdminMessages(token: string): Promise<{ messages: AdminMessage[] }> {
  const response = await fetch(`${API_URL}/api/v1/admin/messages`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return handleResponse<{ messages: AdminMessage[] }>(response);
}

export function getAdminSocketUrl(token: string): string {
  const baseUrl = import.meta.env.VITE_SOCKET_URL ?? API_URL;
  return baseUrl;
}

