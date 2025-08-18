import { useEffect, useCallback, useRef, useState } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { Message } from '@/types/chat.types';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

interface UseWebSocketMessagesOptions {
  channelId: string;
  onNewMessage?: (message: Message) => void;
  onMessageUpdated?: (message: Message) => void;
  onMessageDeleted?: (messageId: string) => void;
  onTypingUpdate?: (userId: string, isTyping: boolean, username?: string) => void;
}

interface TypingUser {
  userId: string;
  username: string;
  isTyping: boolean;
}

export function useWebSocketMessages({
  channelId,
  onNewMessage,
  onMessageUpdated,
  onMessageDeleted,
  onTypingUpdate,
}: UseWebSocketMessagesOptions) {
  const { socket, isConnected } = useWebSocket();
  const { user } = useAuth();
  const processedMessageIds = useRef<Set<string>>(new Set());
  const typingTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Join channel when connected
  useEffect(() => {
    if (!socket || !isConnected || !channelId) return;

    // Join the channel
    socket.emit('join-channels', [channelId]);

    // Listen for join confirmation
    socket.on('channel-joined', (data: any) => {
      logger.info('websocket', '✅ Joined channel:', data);
    });

    return () => {
      socket.off('channel-joined');
    };
  }, [socket, isConnected, channelId]);

  // Handle new messages from WebSocket
  useEffect(() => {
    if (!socket || !isConnected || !channelId) return;

    const handleNewMessage = (data: any) => {
      // Check if message is for our channel
      if (data.channelId !== channelId) {
        return;
      }

      // Prevent duplicate processing
      const messageId = data.messageId;
      if (messageId && processedMessageIds.current.has(messageId)) {
        return;
      }

      if (messageId) {
        processedMessageIds.current.add(messageId);
        // Clean up old IDs to prevent memory leak
        if (processedMessageIds.current.size > 100) {
          const ids = Array.from(processedMessageIds.current);
          ids.slice(0, 50).forEach(id => processedMessageIds.current.delete(id));
        }
      }

      // Convert to our Message type with snake_case fields
      const message: Message = {
        message_id: data.messageId,
        channel_id: data.channelId,
        user_id: data.userId,
        username: data.username,
        content: data.content,
        type: data.type || 'text',
        created_at: data.createdAt,
        updated_at: data.createdAt,
        is_edited: false,
        reactions: data.reactions || [],
        thread_count: 0,
        last_thread_reply: null,
        files: [],
        attachments: [],
        // Legacy camelCase fields for compatibility
        id: data.messageId,
        userId: data.userId,
        channelId: data.channelId,
        createdAt: data.createdAt,
        updatedAt: data.createdAt,
        isEdited: false,
        threadCount: 0,
        lastThreadReply: null,
      } as any;

      if (onNewMessage) {
        onNewMessage(message);
      }

      // Show notification for messages from others
      if (data.userId !== user?.id) {
        toast.info(`${data.username}: ${data.content.substring(0, 50)}${data.content.length > 50 ? '...' : ''}`);
      }
    };

    socket.on('new-message', handleNewMessage);

    return () => {
      socket.off('new-message', handleNewMessage);
    };
  }, [socket, isConnected, channelId, onNewMessage, user]);

  // Handle typing indicators
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleUserTyping = (data: any) => {
      if (data.channelId !== channelId) return;
      
      // Don't show our own typing indicator
      if (data.userId === user?.id) return;

      const typingUser: TypingUser = {
        userId: data.userId,
        username: data.username,
        isTyping: data.isTyping
      };

      if (data.isTyping) {
        setTypingUsers(prev => {
          const filtered = prev.filter(u => u.userId !== data.userId);
          return [...filtered, typingUser];
        });

        // Clear existing timer
        const existingTimer = typingTimers.current.get(data.userId);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }

        // Auto-clear after 3 seconds
        const timer = setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
          typingTimers.current.delete(data.userId);
        }, 3000);

        typingTimers.current.set(data.userId, timer);
      } else {
        setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
        
        const existingTimer = typingTimers.current.get(data.userId);
        if (existingTimer) {
          clearTimeout(existingTimer);
          typingTimers.current.delete(data.userId);
        }
      }

      if (onTypingUpdate) {
        onTypingUpdate(data.userId, data.isTyping, data.username);
      }
    };

    socket.on('user-typing', handleUserTyping);

    return () => {
      socket.off('user-typing', handleUserTyping);
    };
  }, [socket, isConnected, channelId, onTypingUpdate, user]);

  // Handle message updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleMessageUpdated = (data: any) => {
      if (data.channelId !== channelId) return;

      if (onMessageUpdated) {
        const message: Message = {
          message_id: data.messageId,
          channel_id: data.channelId,
          user_id: data.userId,
          username: data.username,
          content: data.content,
          type: data.type || 'text',
          created_at: data.createdAt,
          updated_at: data.updatedAt || data.createdAt,
          is_edited: true,
          reactions: data.reactions || [],
          thread_count: data.threadCount || 0,
          last_thread_reply: data.lastThreadReply || null,
          files: data.files || [],
          attachments: data.attachments || [],
          // Legacy fields
          id: data.messageId,
          userId: data.userId,
          channelId: data.channelId,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt || data.createdAt,
          isEdited: true,
          threadCount: data.threadCount || 0,
          lastThreadReply: data.lastThreadReply || null,
        } as any;
        
        onMessageUpdated(message);
      }
    };

    const handleMessageDeleted = (data: any) => {
      if (data.channelId !== channelId) return;
      
      if (onMessageDeleted && data.messageId) {
        onMessageDeleted(data.messageId);
      }
    };

    socket.on('message-updated', handleMessageUpdated);
    socket.on('message-deleted', handleMessageDeleted);

    return () => {
      socket.off('message-updated', handleMessageUpdated);
      socket.off('message-deleted', handleMessageDeleted);
    };
  }, [socket, isConnected, channelId, onMessageUpdated, onMessageDeleted]);

  // Handle reactions
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleReactionAdded = () => {
      // Reactions will trigger a message update from backend
      // So we don't need to handle them separately
    };

    const handleReactionRemoved = () => {
      // Reactions will trigger a message update from backend
      // So we don't need to handle them separately
    };

    socket.on('reaction-added', handleReactionAdded);
    socket.on('reaction-removed', handleReactionRemoved);

    return () => {
      socket.off('reaction-added', handleReactionAdded);
      socket.off('reaction-removed', handleReactionRemoved);
    };
  }, [socket, isConnected]);

  // Typing indicator functions
  const sendTypingStart = useCallback(() => {
    if (!socket || !isConnected || !channelId) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing-start', { channelId });

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Auto-stop after 5 seconds
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStop();
      }, 5000);
    }
  }, [socket, isConnected, channelId]);

  const sendTypingStop = useCallback(() => {
    if (!socket || !isConnected || !channelId) return;

    if (isTypingRef.current) {
      isTypingRef.current = false;
      socket.emit('typing-stop', { channelId });
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  }, [socket, isConnected, channelId]);

  // Reaction functions
  const addReaction = useCallback((messageId: string, emoji: string) => {
    if (!socket || !isConnected) return false;

    socket.emit('add-reaction', { messageId, emoji });
    return true;
  }, [socket, isConnected]);

  const removeReaction = useCallback((messageId: string, emoji: string) => {
    if (!socket || !isConnected) return false;

    socket.emit('remove-reaction', { messageId, emoji });
    return true;
  }, [socket, isConnected]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Clear all typing timers
      typingTimers.current.forEach(timer => clearTimeout(timer));
      typingTimers.current.clear();
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Clear processed message IDs
      processedMessageIds.current.clear();
    };
  }, []);

  return {
    isConnected,
    typingUsers,
    sendTypingStart,
    sendTypingStop,
    addReaction,
    removeReaction,
  };
}