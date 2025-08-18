/**
 * Axios configuration with interceptors
 * Handles automatic token attachment and refresh
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { config } from '@/config';
import authService from '@/services/auth.service';
import { logger } from '@/lib/logger';

// Create axios instance with default config
const axiosInstance: AxiosInstance = axios.create({
  baseURL: config.api.baseUrl,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track ongoing requests to prevent duplicate refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (error: any) => void;
}> = [];

// Process queued requests after token refresh
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token if available
    const token = authService.getAccessToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request ID for tracking (commented out due to CORS)
    // config.headers['X-Request-ID'] = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Log request in debug mode
    logger.debug('api', '[API Request]', {
      method: config.method?.toUpperCase(),
      url: config.url,
      data: config.data,
      params: config.params,
    });
    
    return config;
  },
  (error: AxiosError) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
  (response) => {
    // Log response in debug mode
    logger.debug('api', '[API Response]', {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });
    
    // Extract rate limit info if available
    const rateLimitHeaders = {
      limit: response.headers['x-ratelimit-limit'],
      remaining: response.headers['x-ratelimit-remaining'],
      reset: response.headers['x-ratelimit-reset'],
    };
    
    if (rateLimitHeaders.limit) {
      (response as any).rateLimit = rateLimitHeaders;
    }
    
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _queued?: boolean;
    };
    
    // Log error in debug mode
    if (config.debug.enabled) {
      console.error('[API Response Error]', {
        url: originalRequest?.url,
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Skip refresh for auth endpoints
      if (originalRequest.url?.includes('/auth/')) {
        return Promise.reject(error);
      }
      
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const refreshed = await authService.refreshToken();
        
        if (refreshed) {
          const newToken = authService.getAccessToken();
          
          if (newToken) {
            // Update the authorization header
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            
            // Process queued requests
            processQueue(null, newToken);
            
            // Retry the original request
            return axiosInstance(originalRequest);
          }
        }
        
        // Refresh failed - clear auth data but don't logout immediately
        // Let the AuthContext handle the redirect to avoid loops
        processQueue(error, null);
        authService.clearAuthData();
        
        // Redirect to login only if not already on login page
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        
        return Promise.reject(error);
      } catch (refreshError) {
        processQueue(refreshError, null);
        authService.clearAuthData();
        
        // Redirect to login only if not already on login page
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response.data);
    }
    
    // Handle 429 Too Many Requests
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      logger.warn('api', `Rate limited. Retry after: ${retryAfter}s`);
      
      // Optionally implement automatic retry with exponential backoff
      if (originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
        
        await new Promise((resolve) => setTimeout(resolve, delay));
        return axiosInstance(originalRequest);
      }
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
      
      // You could implement retry logic here for network errors
      if (originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;
        
        // Wait and retry once
        await new Promise((resolve) => setTimeout(resolve, 2000));
        
        try {
          return await axiosInstance(originalRequest);
        } catch (retryError) {
          return Promise.reject(error);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper function to extract error message
export const extractErrorMessage = (error: any): string => {
  if (error.response?.data?.error?.message) {
    return error.response.data.error.message;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// Export configured axios instance
export default axiosInstance;

// Export additional utilities
export const setAuthToken = (token: string) => {
  axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export const removeAuthToken = () => {
  delete axiosInstance.defaults.headers.common['Authorization'];
};

export const isNetworkError = (error: any): boolean => {
  return !error.response && error.code !== 'ECONNABORTED';
};

export const isTimeoutError = (error: any): boolean => {
  return error.code === 'ECONNABORTED';
};

export const isAuthError = (error: any): boolean => {
  return error.response?.status === 401 || error.response?.status === 403;
};