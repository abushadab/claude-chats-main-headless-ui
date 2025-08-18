import { useEffect, useState, useRef, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting';

export interface UseSocketOptions {
  url?: string;
  transports?: string[];
  timeout?: number;
  reconnection?: boolean;
  reconnectionDelay?: number;
  reconnectionAttempts?: number;
}

export interface UseSocketReturn {
  socket: Socket | null;
  connected: boolean;
  reconnecting: boolean;
  error: { type: string; message: string } | null;
  connectionStatus: ConnectionStatus;
  reconnect: () => void;
  disconnect: () => void;
}

export const useSocket = (token: string | null, options: UseSocketOptions = {}): UseSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [error, setError] = useState<{ type: string; message: string } | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const defaultOptions = {
    url: process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '') || 'https://hudhud-api.baytlabs.com',
    transports: ['websocket', 'polling'],
    timeout: 20000,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    ...options
  };

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!token) {
      console.log('🔌 No token provided, skipping socket connection');
      return;
    }

    console.log('🔌 Initializing socket connection...');
    setConnectionStatus('connecting');

    const newSocket = io(defaultOptions.url, {
      auth: { token },
      transports: defaultOptions.transports,
      timeout: defaultOptions.timeout,
      reconnection: defaultOptions.reconnection,
      reconnectionDelay: defaultOptions.reconnectionDelay,
      reconnectionAttempts: defaultOptions.reconnectionAttempts,
      forceNew: true
    });

    // Uncomment for debugging WebSocket events
    // newSocket.onAny((eventName: string, ...args: any[]) => {
    //   console.log('🔵 WebSocket Event:', eventName, args);
    // });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      setConnected(true);
      setReconnecting(false);
      setError(null);
      setConnectionStatus('connected');

      heartbeatIntervalRef.current = setInterval(() => {
        if (newSocket.connected) {
          newSocket.emit('ping', { timestamp: Date.now() });
        }
      }, 30000);
    });

    newSocket.on('connected', (data) => {
      console.log('✅ Authentication successful:', data);
    });

    newSocket.on('connect_error', (err) => {
      console.error('❌ Socket connection failed:', err);
      setError({
        type: 'connection',
        message: err.message || 'Connection failed'
      });
      setConnected(false);
      setConnectionStatus('error');
    });

    newSocket.on('reconnect_attempt', (attempt) => {
      console.log(`🔄 Reconnection attempt ${attempt}...`);
      setReconnecting(true);
      setConnectionStatus('reconnecting');
    });

    newSocket.on('reconnect', (attempt) => {
      console.log(`✅ Reconnected after ${attempt} attempts`);
      setReconnecting(false);
      setError(null);
      setConnectionStatus('connected');
    });

    newSocket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed');
      setReconnecting(false);
      setError({
        type: 'reconnection',
        message: 'Failed to reconnect after maximum attempts'
      });
      setConnectionStatus('error');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setConnected(false);
      setConnectionStatus('disconnected');
      cleanup();

      if (reason === 'io server disconnect') {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Attempting manual reconnection...');
          newSocket.connect();
        }, 2000);
      }
    });

    newSocket.on('error', (serverError: any) => {
      console.error('🚨 Server error:', serverError);
      setError({
        type: serverError.type || 'server',
        message: serverError.message || 'Server error occurred'
      });

      if (serverError.type === 'authentication') {
        setConnected(false);
        setConnectionStatus('error');
        newSocket.disconnect();
      }
    });

    newSocket.on('pong', (data) => {
      console.log('🏓 Pong received:', data);
    });

    setSocket(newSocket);

    return () => {
      console.log('🧹 Cleaning up socket connection');
      cleanup();
      newSocket.close();
      setSocket(null);
      setConnected(false);
      setConnectionStatus('disconnected');
    };
  }, [token, defaultOptions.url]);

  const reconnect = useCallback(() => {
    if (socket && !connected) {
      console.log('🔄 Manual reconnection triggered');
      socket.connect();
    }
  }, [socket, connected]);

  const disconnect = useCallback(() => {
    if (socket) {
      console.log('👋 Manual disconnect triggered');
      socket.disconnect();
    }
  }, [socket]);

  return { 
    socket, 
    connected, 
    reconnecting,
    error,
    connectionStatus,
    reconnect,
    disconnect
  };
};