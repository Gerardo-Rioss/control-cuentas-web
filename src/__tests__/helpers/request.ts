/**
 * Request construction helpers for integration tests.
 *
 * Constructs `NextRequest` objects that route handlers expect,
 * with support for query parameters, JSON bodies, and dynamic route params.
 */
import { NextRequest } from "next/server";

export interface RequestOptions {
  method?: string;
  path?: string;
  query?: Record<string, string>;
  body?: unknown;
}

const BASE_URL = "http://localhost";

/**
 * Create a NextRequest with optional query params and JSON body.
 */
export function createRequest(options: RequestOptions = {}): NextRequest {
  const { method = "GET", path = "/api/test", query, body } = options;

  const url = new URL(path, BASE_URL);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }
  }

  const init: RequestInit = {
    method,
    headers: {} as Record<string, string>,
  };

  if (body !== undefined) {
    (init.headers as Record<string, string>)["Content-Type"] =
      "application/json";
    init.body = JSON.stringify(body);
  }

  return new NextRequest(url.toString(), init);
}

// ── Convenience wrappers ────────────────────────────────────────────

export function createGetRequest(query?: Record<string, string>): NextRequest {
  return createRequest({ method: "GET", path: "/api/test", query });
}

export function createPostRequest(
  body: unknown,
  query?: Record<string, string>,
): NextRequest {
  return createRequest({ method: "POST", path: "/api/test", query, body });
}

export function createPatchRequest(
  body: unknown,
  query?: Record<string, string>,
): NextRequest {
  return createRequest({ method: "PATCH", path: "/api/test", query, body });
}

export function createDeleteRequest(
  query?: Record<string, string>,
): NextRequest {
  return createRequest({ method: "DELETE", path: "/api/test", query });
}

/**
 * Build the dynamic route params argument that Next.js App Router handlers expect.
 *
 * Usage:
 * ```ts
 * const res = await GET(req, { params: createParams({ id: "mov-1" }) });
 * ```
 */
export function createParams(
  params: Record<string, string>,
): { params: Promise<Record<string, string>> } {
  return { params: Promise.resolve(params) };
}
