import { NextResponse } from "next/server";

type ApiResponse<T = unknown> = {
  data?: T;
  error?: string;
  details?: unknown;
};

export function success<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function error(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export function unauthorized() {
  return error("Authentication required", 401);
}

export function notFound(resource = "Resource") {
  return error(`${resource} not found`, 404);
}
