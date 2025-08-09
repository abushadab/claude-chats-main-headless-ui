/**
 * useMessagesOptimized Hook
 * Uses the new optimized messages API with slug-based endpoints
 */

import { useState, useEffect, useCallback } from 'react';
import { chatService } from '@/services/chat.service';
import type { Message, SendMessageData } from '@/types';

interface UseMessagesOptimizedProps {
  channelId?: string;
  channelSlug?: string;
  projectSlug?: string;
}

interface UseMessagesOptimizedReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  oldestMessageId?: string;
  loadMessages: () => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  sendMessage: (data: SendMessageData) => Promise<Message>;
  editMessage: (messageId: string, content: string) => Promise<Message>;
  deleteMessage: (messageId: string) => Promise<void>;
  refreshMessages: () => Promise<void>;
}

export function useMessagesOptimized({ 
  channelId, 
  channelSlug, 
  projectSlug 
}: UseMessagesOptimizedProps): UseMessagesOptimizedReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [oldestMessageId, setOldestMessageId] = useState<string | undefined>();

  // Load messages using optimized API
  const loadMessages = useCallback(async () => {
    if (!channelSlug && !channelId) return;

    try {
      setIsLoading(true);
      setError(null);
      
      let response;
      if (channelSlug) {
        // Use optimized slug-based endpoint
        response = await chatService.getMessagesBySlug(channelSlug, {
          limit: 50,
          projectSlug
        });
      } else if (channelId) {
        // Fallback to ID-based endpoint
        response = await chatService.getMessages({
          channelId,
          limit: 50,
        });
      } else {
        return;
      }
      
      setMessages(response.messages);
      setHasMore(response.hasMore || false);
      setOldestMessageId(response.oldestMessageId);
    } catch (err: any) {
      setError(err.message || 'Failed to load messages');
      console.error('Error loading messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, [channelId, channelSlug, projectSlug]);

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if ((!channelSlug && !channelId) || isLoading || !hasMore || !oldestMessageId) return;

    try {
      setIsLoading(true);
      setError(null);
      
      let response;
      if (channelSlug) {
        // Use optimized slug-based endpoint
        response = await chatService.getMessagesBySlug(channelSlug, {
          limit: 50,
          before: oldestMessageId,
          projectSlug
        });
      } else if (channelId) {
        // Fallback to ID-based endpoint
        response = await chatService.getMessages({
          channelId,
          limit: 50,
          before: oldestMessageId,
        });
      } else {
        return;
      }
      
      // Prepend older messages
      setMessages(prev => [...response.messages, ...prev]);
      setHasMore(response.hasMore || false);
      setOldestMessageId(response.oldestMessageId);
    } catch (err: any) {
      setError(err.message || 'Failed to load more messages');
      console.error('Error loading more messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, [channelId, channelSlug, projectSlug, isLoading, hasMore, oldestMessageId]);

  // Send new message
  const sendMessage = useCallback(async (data: SendMessageData) => {
    try {
      const newMessage = await chatService.sendMessage(data);
      
      // Add to local state
      setMessages(prev => [...prev, newMessage]);
      
      return newMessage;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to send message';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  // Edit message
  const editMessage = useCallback(async (messageId: string, content: string) => {
    try {
      const updatedMessage = await chatService.editMessage(messageId, content);
      
      // Update in local state
      setMessages(prev => 
        prev.map(message => 
          message.message_id === messageId ? updatedMessage : message
        )
      );
      
      return updatedMessage;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to edit message';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      await chatService.deleteMessage(messageId);
      
      // Remove from local state
      setMessages(prev => 
        prev.filter(message => message.message_id !== messageId)
      );
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to delete message';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  // Refresh messages
  const refreshMessages = useCallback(async () => {
    await loadMessages();
  }, [loadMessages]);

  // Load messages when channel changes
  useEffect(() => {
    setMessages([]); // Clear messages when switching channels
    setError(null);
    setHasMore(true);
    setOldestMessageId(undefined);
    loadMessages();
  }, [channelId, channelSlug]); // Don't include loadMessages to avoid infinite loop

  return {
    messages,
    isLoading,
    error,
    hasMore,
    oldestMessageId,
    loadMessages,
    loadMoreMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    refreshMessages,
  };
}