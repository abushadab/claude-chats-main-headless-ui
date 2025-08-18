'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useSocket, ConnectionStatus } from '@/hooks/useSocket';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Socket } from 'socket.io-client';

interface UserPresence {
  userId: string;
  username: string;
  status: 'online' | 'away' | 'offline' | 'busy';
  lastSeen: Date;
  currentChannel?: string;
}

interface WebSocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  onlineUsers: Map<string, UserPresence>;
  onlineCount: number;
  sendTypingIndicator: (channelId: string, isTyping: boolean) => void;
  joinChannels: (channelIds: string[]) => void;
  updatePresence: (status: 'online' | 'away' | 'busy' | 'offline') => void;
}

const WebSocketContext = createContext<WebSocketContextValue | undefined>(undefined);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Map<string, UserPresence>>(new Map());
  const [onlineCount, setOnlineCount] = useState(0);
  const reconnectToastId = useRef<string | number | undefined>();

  // Get token from localStorage when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const accessToken = localStorage.getItem('accessToken');
      setToken(accessToken);
    } else {
      setToken(null);
    }
  }, [isAuthenticated]);

  // Use the WebSocket hook
  const { socket, connected, connectionStatus } = useSocket(token);

  // Handle connection status changes with toast notifications
  useEffect(() => {
    if (connectionStatus === 'connected') {
      if (reconnectToastId.current) {
        toast.dismiss(reconnectToastId.current);
        toast.success('Real-time connection established');
        reconnectToastId.current = undefined;
      }
    } else if (connectionStatus === 'reconnecting') {
      if (!reconnectToastId.current) {
        reconnectToastId.current = toast.loading('Reconnecting to real-time updates...');
      }
    } else if (connectionStatus === 'error') {
      if (reconnectToastId.current) {
        toast.dismiss(reconnectToastId.current);
        reconnectToastId.current = undefined;
      }
      toast.error('Real-time connection lost. Messages will sync when connection is restored.');
    }
  }, [connectionStatus]);

  // Set up presence event handlers
  useEffect(() => {
    if (!socket) return;

    const handlePresenceChanged = (data: any) => {
      console.log('[WebSocketContext] Presence update:', data);
      
      if (data.status === 'online' || data.status === 'away' || data.status === 'busy') {
        setOnlineUsers(prev => {
          const newMap = new Map(prev);
          newMap.set(data.userId, {
            userId: data.userId,
            username: data.username || 'Unknown',
            status: data.status,
            lastSeen: new Date(),
            currentChannel: data.channelId,
          });
          return newMap;
        });
      } else if (data.status === 'offline') {
        setOnlineUsers(prev => {
          const newMap = new Map(prev);
          newMap.delete(data.userId);
          return newMap;
        });
      }
    };

    socket.on('presence-changed', handlePresenceChanged);

    return () => {
      socket.off('presence-changed', handlePresenceChanged);
    };
  }, [socket]);

  // Update online count
  useEffect(() => {
    const count = Array.from(onlineUsers.values()).filter(u => u.status === 'online').length;
    setOnlineCount(count);
  }, [onlineUsers]);

  // Send typing indicator
  const sendTypingIndicator = useCallback((channelId: string, isTyping: boolean) => {
    if (!socket || !connected) return;

    if (isTyping) {
      socket.emit('typing-start', { channelId });
    } else {
      socket.emit('typing-stop', { channelId });
    }
  }, [socket, connected]);

  // Join channels
  const joinChannels = useCallback((channelIds: string[]) => {
    if (!socket || !connected) return;

    console.log('[WebSocketContext] Joining channels:', channelIds);
    // Backend expects the array directly
    socket.emit('join-channels', channelIds);
  }, [socket, connected]);

  // Update presence
  const updatePresence = useCallback((status: 'online' | 'away' | 'busy' | 'offline') => {
    if (!socket || !connected) return;

    console.log('[WebSocketContext] Updating presence:', status);
    socket.emit('presence-update', { status });
  }, [socket, connected]);

  const value: WebSocketContextValue = {
    socket,
    isConnected: connected,
    connectionStatus,
    onlineUsers,
    onlineCount,
    sendTypingIndicator,
    joinChannels,
    updatePresence,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}