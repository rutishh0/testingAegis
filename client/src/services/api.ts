import type { ApiUser, AuthPayload, MessageRecord, SendMessageRequest } from '../types';

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

export async function registerUser(payload: {
  username: string;
  password: string;
  publicKey: string;
  encryptedPrivateKey: string;
}): Promise<void> {
  const response = await fetch(`${API_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response
      .json()
      .then((data) => data?.message ?? response.statusText)
      .catch(() => response.statusText);
    throw new Error(message || 'Failed to register.');
  }
}

export async function loginUser(payload: { username: string; password: string }): Promise<AuthPayload> {
  const response = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return handleResponse<AuthPayload>(response);
}

export async function fetchAdminConfig(): Promise<{ adminPublicKey: string }> {
  const response = await fetch(`${API_URL}/api/v1/config`);
  return handleResponse<{ adminPublicKey: string }>(response);
}

export async function fetchUsers(token: string): Promise<{ users: ApiUser[] }> {
  const response = await fetch(`${API_URL}/api/v1/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return handleResponse<{ users: ApiUser[] }>(response);
}

export async function fetchMessages(token: string, userId: string): Promise<{ messages: MessageRecord[] }> {
  const response = await fetch(`${API_URL}/api/v1/messages/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return handleResponse<{ messages: MessageRecord[] }>(response);
}

export async function sendMessage(token: string, payload: SendMessageRequest): Promise<MessageRecord> {
  const response = await fetch(`${API_URL}/api/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<MessageRecord>(response);
}

export function getApiUrl() {
  return API_URL;
}

export function getSocketUrl(): string {
  return import.meta.env.VITE_SOCKET_URL ?? API_URL;
}

