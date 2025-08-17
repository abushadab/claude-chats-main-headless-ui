/**
 * General API types
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string | any; // Can be a string or the actual message object from backend
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  field?: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface ApiRequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
  withCredentials?: boolean;
  signal?: AbortSignal;
}

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
}

export type RequestInterceptor = (config: any) => any | Promise<any>;
export type ResponseInterceptor = (response: any) => any | Promise<any>;
export type ErrorInterceptor = (error: any) => any | Promise<any>;