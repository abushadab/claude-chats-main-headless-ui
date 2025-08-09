/**
 * Application configuration
 * Centralizes all environment variables and provides type-safe access
 */

export const config = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8891/api',
    wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8891',
    sseUrl: process.env.NEXT_PUBLIC_SSE_URL || 'http://localhost:8891/api/realtime/stream',
  },
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'DevTeam Chat',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  },
  features: {
    enableSSE: process.env.NEXT_PUBLIC_ENABLE_SSE === 'true',
    enableWebSocket: process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET === 'true',
    enableFileUpload: process.env.NEXT_PUBLIC_ENABLE_FILE_UPLOAD === 'true',
  },
  upload: {
    maxFileSize: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '10485760', 10),
    allowedFileTypes: process.env.NEXT_PUBLIC_ALLOWED_FILE_TYPES?.split(',') || [
      'image/*',
      'application/pdf',
      'text/*',
      'video/*',
      'audio/*',
    ],
  },
  debug: {
    enabled: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
    logLevel: process.env.NEXT_PUBLIC_LOG_LEVEL || 'info',
  },
  auth: {
    tokenKey: 'accessToken',
    refreshTokenKey: 'refreshToken',
    userKey: 'currentUser',
    tokenRefreshBuffer: 60000, // Refresh token 1 minute before expiry
  },
  cache: {
    userCacheDuration: 300000, // 5 minutes
    channelCacheDuration: 600000, // 10 minutes
  },
} as const;

export type Config = typeof config;