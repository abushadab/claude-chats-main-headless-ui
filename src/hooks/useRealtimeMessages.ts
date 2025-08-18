import { useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { Message } from '@/types';
import { toast } from 'sonner';

interface UseRealtimeMessagesOptions {
  channelId: string;
  onNewMessage?: (message: Message) => void;
  onMessageUpdated?: (message: Message) => void;
  onMessageDeleted?: (messageId: string) => void;
  onTypingUpdate?: (userId: string, isTyping: boolean) => void;
}

export function useRealtimeMessages({
  channelId,
  onNewMessage,
  onMessageUpdated,
  onMessageDeleted,
  onTypingUpdate,
}: UseRealtimeMessagesOptions) {
  const { socket, isConnected } = useWebSocket();
  const processedMessageIds = useRef<Set<string>>(new Set());
  const typingTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Handle new messages
  const handleChannelMessage = useCallback((data: any) => {
    console.log('[useRealtimeMessages] Received message event:', {
      data,
      currentChannelId: channelId,
      messageChannelId: data.channelId || data.channel_id,
      userId: data.user_id,
    });
    
    // Check if this message is for our channel
    const messageChannelId = data.channelId || data.channel_id;
    if (messageChannelId && messageChannelId !== channelId) {
      console.log('[useRealtimeMessages] Message for different channel:', messageChannelId, '!==', channelId);
      return;
    }

    // Prevent duplicate processing
    const messageId = data.message_id || data.id;
    if (messageId && processedMessageIds.current.has(messageId)) {
      console.log('[useRealtimeMessages] Skipping duplicate message:', messageId);
      return;
    }

    console.log('[useRealtimeMessages] Processing message:', data);

    // Handle different message actions
    switch (data.action) {
      case 'created':
      case 'new':
      case 'new_message': // Backend sends this action type
      case undefined: // Default to new message if no action specified
        if (messageId) {
          processedMessageIds.current.add(messageId);
          // Clean up old IDs to prevent memory leak
          if (processedMessageIds.current.size > 100) {
            const ids = Array.from(processedMessageIds.current);
            ids.slice(0, 50).forEach(id => processedMessageIds.current.delete(id));
          }
        }
        
        const newMessage: Message = {
          message_id: data.message_id || data.id,
          content: data.content || data.message,
          channel_id: data.channelId || data.channel_id,
          user_id: data.user_id || data.sender_id || data.senderId,
          username: data.username || data.sender_name || data.senderName,
          avatar_url: data.avatar_url || data.avatar || data.sender_avatar || data.senderAvatar,
          created_at: data.created_at || data.timestamp || new Date().toISOString(),
          edited_at: data.is_edited ? (data.updated_at || data.edited_at) : undefined,
          type: data.type || 'text',
          metadata: data.metadata || {},
          thread_count: data.thread_count || 0,
          reactions: data.reactions || [],
          files: data.files || data.attachments || [],
          from_agent: data.from_agent || data.agent,
        };
        
        if (onNewMessage) {
          onNewMessage(newMessage);
        }
        break;

      case 'updated':
      case 'edited':
        if (onMessageUpdated) {
          const updatedMessage: Message = {
            message_id: data.message_id || data.id,
            content: data.content || data.message,
            channel_id: data.channelId || data.channel_id,
            user_id: data.user_id || data.sender_id || data.senderId,
            username: data.username || data.sender_name || data.senderName,
            avatar_url: data.avatar_url || data.avatar || data.sender_avatar || data.senderAvatar,
            created_at: data.created_at || data.timestamp,
            edited_at: data.updated_at || data.edited_at || new Date().toISOString(),
            type: data.type || 'text',
            metadata: data.metadata || {},
            thread_count: data.thread_count || 0,
            reactions: data.reactions || [],
            files: data.files || data.attachments || [],
            from_agent: data.from_agent || data.agent,
          };
          onMessageUpdated(updatedMessage);
        }
        break;

      case 'deleted':
        if (onMessageDeleted) {
          onMessageDeleted(data.message_id || data.id);
        }
        break;

      default:
        console.warn('[useRealtimeMessages] Unknown message action:', data.action);
    }
  }, [channelId, onNewMessage, onMessageUpdated, onMessageDeleted]);

  // Handle typing indicators
  const handleTypingIndicator = useCallback((data: any) => {
    if (data.channelId !== channelId) {
      return;
    }

    const userId = data.userId || data.user_id;
    const isTyping = data.isTyping ?? true;

    if (onTypingUpdate) {
      onTypingUpdate(userId, isTyping);
    }

    // Auto-clear typing indicator after 3 seconds
    if (isTyping) {
      // Clear existing timer if any
      const existingTimer = typingTimers.current.get(userId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new timer
      const timer = setTimeout(() => {
        if (onTypingUpdate) {
          onTypingUpdate(userId, false);
        }
        typingTimers.current.delete(userId);
      }, 3000);

      typingTimers.current.set(userId, timer);
    } else {
      // Clear timer if typing stopped
      const existingTimer = typingTimers.current.get(userId);
      if (existingTimer) {
        clearTimeout(existingTimer);
        typingTimers.current.delete(userId);
      }
    }
  }, [channelId, onTypingUpdate]);

  // Handle channel events (member join/leave, etc.)
  const handleChannelEvent = useCallback((data: any) => {
    if (data.channelId !== channelId) {
      return;
    }

    console.log('[useRealtimeMessages] Channel event:', data);

    switch (data.action) {
      case 'member_joined':
        toast.info(`${data.username || 'Someone'} joined the channel`);
        break;
      case 'member_left':
        toast.info(`${data.username || 'Someone'} left the channel`);
        break;
      case 'channel_updated':
        // Handle channel updates if needed
        break;
    }
  }, [channelId]);

  // Set up subscriptions
  useEffect(() => {
    if (!socket || !isConnected || !channelId) {
      return;
    }

    console.log('[useRealtimeMessages] Setting up real-time subscriptions for channel:', channelId);

    // Join the channel - backend expects array directly
    socket.emit('join-channels', [channelId]);

    // Set up event listeners
    socket.on('new-message', handleChannelMessage);
    socket.on('message-updated', handleChannelMessage);
    socket.on('message-deleted', (data: any) => {
      if (onMessageDeleted && data.messageId) {
        onMessageDeleted(data.messageId);
      }
    });
    socket.on('user-typing', handleTypingIndicator);
    socket.on('channel-event', handleChannelEvent);

    // Clear processed IDs when channel changes
    processedMessageIds.current.clear();

    return () => {
      console.log('[useRealtimeMessages] Cleaning up subscriptions for channel:', channelId);
      socket.off('new-message', handleChannelMessage);
      socket.off('message-updated', handleChannelMessage);
      socket.off('message-deleted');
      socket.off('user-typing', handleTypingIndicator);
      socket.off('channel-event', handleChannelEvent);
      
      // Clear all typing timers
      typingTimers.current.forEach(timer => clearTimeout(timer));
      typingTimers.current.clear();
    };
  }, [
    channelId,
    isConnected,
    socket,
    handleChannelMessage,
    handleTypingIndicator,
    handleChannelEvent,
    onMessageDeleted,
  ]);

  return {
    isConnected,
  };
}