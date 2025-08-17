'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { realtimeService, ConnectionStatus } from '@/services/realtime.service';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UserPresence {
  userId: string;
  username: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: Date;
  currentChannel?: string;
}

interface RealtimeContextValue {
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  onlineUsers: Map<string, UserPresence>;
  onlineCount: number;
  subscribe: (eventType: string, handler: (data: any) => void) => () => void;
  unsubscribe: (eventType: string, handler: (data: any) => void) => void;
  sendTypingIndicator: (channelId: string, isTyping: boolean) => void;
}

const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [onlineUsers, setOnlineUsers] = useState<Map<string, UserPresence>>(new Map());
  const [onlineCount, setOnlineCount] = useState(0);
  const hasInitialized = useRef(false);
  const reconnectToastId = useRef<string | number | undefined>();

  // Handle connection status changes
  const handleConnectionChange = useCallback((status: ConnectionStatus) => {
    setConnectionStatus(status);
    
    // Show toast notifications for connection status
    if (status === 'connected') {
      if (reconnectToastId.current) {
        toast.dismiss(reconnectToastId.current);
        toast.success('Real-time connection restored');
        reconnectToastId.current = undefined;
      }
    } else if (status === 'reconnecting') {
      if (!reconnectToastId.current) {
        reconnectToastId.current = toast.loading('Reconnecting to real-time updates...');
      }
    } else if (status === 'error') {
      if (reconnectToastId.current) {
        toast.dismiss(reconnectToastId.current);
        reconnectToastId.current = undefined;
      }
      toast.error('Real-time connection lost. Messages will sync when connection is restored.');
    }
  }, []);

  // Initialize real-time connection
  useEffect(() => {
    if (!isAuthenticated || !user || hasInitialized.current) {
      return;
    }

    console.log('[RealtimeContext] Initializing real-time connection for user:', user.id);
    hasInitialized.current = true;

    // Connect to SSE
    realtimeService.connect({
      onConnectionChange: handleConnectionChange,
    });

    // Set up event handlers
    const unsubscribers: Array<() => void> = [];

    // Handle init event
    unsubscribers.push(
      realtimeService.on('init', (data) => {
        console.log('[RealtimeContext] Received init event:', data);
        // Initialize user's channels and presence
      })
    );

    // Handle presence updates
    unsubscribers.push(
      realtimeService.on('presence', (data) => {
        console.log('[RealtimeContext] Presence update:', data);
        
        if (data.action === 'join') {
          setOnlineUsers(prev => {
            const newMap = new Map(prev);
            newMap.set(data.userId, {
              userId: data.userId,
              username: data.username,
              status: 'online',
              lastSeen: new Date(),
              currentChannel: data.channelId,
            });
            return newMap;
          });
        } else if (data.action === 'leave') {
          setOnlineUsers(prev => {
            const newMap = new Map(prev);
            newMap.delete(data.userId);
            return newMap;
          });
        } else if (data.action === 'update') {
          setOnlineUsers(prev => {
            const newMap = new Map(prev);
            const existing = newMap.get(data.userId);
            if (existing) {
              newMap.set(data.userId, {
                ...existing,
                ...data.updates,
                lastSeen: new Date(),
              });
            }
            return newMap;
          });
        }
        
        // Update online count
        if (data.onlineCount !== undefined) {
          setOnlineCount(data.onlineCount);
        }
      })
    );

    // Handle channel messages
    unsubscribers.push(
      realtimeService.on('channel_message', (data) => {
        console.log('[RealtimeContext] New channel message:', data);
        
        // Show notification for messages in other channels
        if (data.senderId !== user.id && data.channelId !== getCurrentChannelId()) {
          toast.info(`New message in #${data.channelName || 'channel'}`, {
            description: `${data.senderName}: ${data.content.substring(0, 50)}...`,
          });
        }
      })
    );

    // Handle broadcast messages
    unsubscribers.push(
      realtimeService.on('broadcast', (data) => {
        console.log('[RealtimeContext] Broadcast message:', data);
        
        if (data.type === 'system') {
          toast.info(data.message);
        } else if (data.type === 'alert') {
          toast.error(data.message);
        }
      })
    );

    // Clean up on unmount
    return () => {
      console.log('[RealtimeContext] Cleaning up real-time connection');
      unsubscribers.forEach(unsub => unsub());
      realtimeService.disconnect();
      hasInitialized.current = false;
    };
  }, [isAuthenticated, user, handleConnectionChange]);

  // Update online count from map
  useEffect(() => {
    const count = Array.from(onlineUsers.values()).filter(u => u.status === 'online').length;
    setOnlineCount(count);
  }, [onlineUsers]);

  // Subscribe to events
  const subscribe = useCallback((eventType: string, handler: (data: any) => void) => {
    return realtimeService.on(eventType, handler);
  }, []);

  // Unsubscribe from events
  const unsubscribe = useCallback((eventType: string, handler: (data: any) => void) => {
    realtimeService.off(eventType, handler);
  }, []);

  // Send typing indicator
  const sendTypingIndicator = useCallback((channelId: string, isTyping: boolean) => {
    // This would normally send a request to the backend
    // For now, we'll just log it
    console.log('[RealtimeContext] Typing indicator:', { channelId, isTyping });
  }, []);

  // Helper function to get current channel ID (will be implemented later)
  function getCurrentChannelId(): string | undefined {
    // This will be replaced with actual logic to get current channel from URL
    if (typeof window !== 'undefined') {
      const pathParts = window.location.pathname.split('/');
      const channelIndex = pathParts.indexOf('channel');
      if (channelIndex !== -1 && pathParts[channelIndex + 1]) {
        return pathParts[channelIndex + 1];
      }
    }
    return undefined;
  }

  const value: RealtimeContextValue = {
    isConnected: connectionStatus === 'connected',
    connectionStatus,
    onlineUsers,
    onlineCount,
    subscribe,
    unsubscribe,
    sendTypingIndicator,
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}