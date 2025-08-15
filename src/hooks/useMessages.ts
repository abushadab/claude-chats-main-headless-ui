/**
 * useMessages Hook
 * Manages messages state and API calls
 */

import { useState, useEffect, useCallback } from 'react';
import { chatService } from '@/services/chat.service';
import type { Message, SendMessageData } from '@/types';

interface UseMessagesReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMessages: (channelId?: string, limit?: number) => Promise<void>;
  loadMoreMessages: (before?: string) => Promise<void>;
  sendMessage: (data: SendMessageData) => Promise<Message>;
  editMessage: (messageId: string, content: string) => Promise<Message>;
  deleteMessage: (messageId: string) => Promise<void>;
  refreshMessages: () => Promise<void>;
}

export function useMessages(channelId?: string): UseMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentChannelId, setCurrentChannelId] = useState<string | undefined>(channelId);

  // Load messages from API
  const loadMessages = useCallback(async (targetChannelId?: string, limit = 50) => {
    const channelToLoad = targetChannelId || currentChannelId;
    
    if (!channelToLoad) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await chatService.getMessages({
        channelId: channelToLoad,
        limit,
      });
      
      setMessages(response.messages);
      setHasMore(response.hasMore || false);
    } catch (err: any) {
      setError(err.message || 'Failed to load messages');
      console.error('[useMessages] Error loading messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentChannelId]);

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async (before?: string) => {
    if (!currentChannelId || isLoading) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await chatService.getMessages({
        channelId: currentChannelId,
        limit: 50,
        before,
      });
      
      // Prepend older messages
      setMessages(prev => [...response.messages, ...prev]);
      setHasMore(response.hasMore || false);
    } catch (err: any) {
      setError(err.message || 'Failed to load more messages');
      console.error('Error loading more messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentChannelId, isLoading]);

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

  // Refresh messages (public method)
  const refreshMessages = useCallback(async () => {
    await loadMessages(currentChannelId);
  }, [loadMessages, currentChannelId]);

  // Load messages when channel changes
  useEffect(() => {
    if (channelId !== currentChannelId) {
      setIsLoading(true); // Set loading BEFORE clearing to prevent quotes
      setCurrentChannelId(channelId);
      setMessages([]); // Now safe to clear since isLoading is true
      setError(null);
      setHasMore(true);
      
      // Load messages immediately for the new channel
      if (channelId) {
        loadMessages(channelId);
      }
    }
  }, [channelId, currentChannelId, loadMessages]);

  return {
    messages,
    isLoading,
    error,
    hasMore,
    loadMessages,
    loadMoreMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    refreshMessages,
  };
}