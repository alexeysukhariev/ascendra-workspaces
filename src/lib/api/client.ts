// ✍ StrategiClear — Alexey Sukhariev <alexey.sukhariev@gmail.com>
import type { ApiError } from './types';

/** Error thrown by the API client for any non-2xx response. */
export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
  }
}

const BASE = '/api';

/**
 * Typed fetch wrapper. Prefixes `/api`, sets JSON headers, parses the body and
 * throws {@link ApiClientError} on failure so TanStack Query surfaces it to the
 * error state. All app data access goes through this.
 */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!res.ok) {
    let message = res.statusText || 'Request failed';
    let code = 'error';
    try {
      const body = (await res.json()) as ApiError;
      if (body?.message) message = body.message;
      if (body?.error) code = body.error;
    } catch {
      // non-JSON error body; keep defaults
    }
    throw new ApiClientError(res.status, code, message);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
