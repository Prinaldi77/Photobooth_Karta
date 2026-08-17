import { NextResponse } from 'next/server';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

function sanitizeString(str: string): string {
  if (!str) return '';
  return str.replace(/(?:key|private_key|secret|token|password|auth|bearer)=['"]?[^'"\s]+['"]?/gi, '[REDACTED]');
}

export function successResponse<T>(data: T, message?: string, status = 200) {
  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(message ? { message: sanitizeString(message) } : {}),
  };
  return NextResponse.json(body, { status });
}

export function errorResponse(code: string, message: string, details?: unknown, status = 400) {
  const body: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message: sanitizeString(message),
      ...(details !== undefined ? { details } : {}),
    },
  };
  return NextResponse.json(body, { status });
}
