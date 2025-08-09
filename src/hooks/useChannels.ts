/**
 * useChannels Hook
 * Manages channels state and API calls
 */

import { useState, useEffect, useCallback } from 'react';
import { chatService } from '@/services/chat.service';
import type { Channel } from '@/types';

interface UseChannelsReturn {
  channels: Channel[];
  isLoading: boolean;
  error: string | null;
  refreshChannels: () => Promise<void>;
  createChannel: (data: { name: string; description?: string; isPrivate?: boolean }) => Promise<Channel>;
  updateChannel: (channelId: string, data: { name?: string; description?: string }) => Promise<Channel>;
  deleteChannel: (channelId: string) => Promise<void>;
  joinChannel: (channelId: string) => Promise<void>;
  leaveChannel: (channelId: string) => Promise<void>;
}

export function useChannels(projectId?: string): UseChannelsReturn {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load channels from API
  const loadChannels = useCallback(async () => {
    console.log('🔄 Loading channels...', projectId ? `for project: ${projectId}` : '(all)');
    try {
      setIsLoading(true);
      setError(null);
      
      const fetchedChannels = await chatService.getChannels(projectId);
      console.log('✅ Channels loaded:', fetchedChannels);
      setChannels(fetchedChannels);
    } catch (err: any) {
      console.error('❌ Error loading channels:', err);
      setError(err.message || 'Failed to load channels');
    } finally {
      setIsLoading(false);
      console.log('🏁 Loading channels complete');
    }
  }, [projectId]);

  // Initial load
  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  // Refresh channels (public method)
  const refreshChannels = useCallback(async () => {
    await loadChannels();
  }, [loadChannels]);

  // Create new channel
  const createChannel = useCallback(async (data: { 
    name: string; 
    description?: string; 
    isPrivate?: boolean;
  }) => {
    try {
      const newChannel = await chatService.createChannel(data);
      
      // Add to local state
      setChannels(prev => [...prev, newChannel]);
      
      return newChannel;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to create channel';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  // Update channel
  const updateChannel = useCallback(async (
    channelId: string, 
    data: { name?: string; description?: string }
  ) => {
    try {
      const updatedChannel = await chatService.updateChannel(channelId, data);
      
      // Update in local state
      setChannels(prev => 
        prev.map(channel => 
          channel.channel_id === channelId ? updatedChannel : channel
        )
      );
      
      return updatedChannel;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to update channel';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  // Delete channel
  const deleteChannel = useCallback(async (channelId: string) => {
    try {
      await chatService.deleteChannel(channelId);
      
      // Remove from local state
      setChannels(prev => 
        prev.filter(channel => channel.channel_id !== channelId)
      );
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to delete channel';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  // Join channel
  const joinChannel = useCallback(async (channelId: string) => {
    try {
      await chatService.joinChannel(channelId);
      
      // Update channel membership in local state
      setChannels(prev => 
        prev.map(channel => 
          channel.channel_id === channelId 
            ? { ...channel, is_member: true }
            : channel
        )
      );
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to join channel';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  // Leave channel
  const leaveChannel = useCallback(async (channelId: string) => {
    try {
      await chatService.leaveChannel(channelId);
      
      // Update channel membership in local state
      setChannels(prev => 
        prev.map(channel => 
          channel.channel_id === channelId 
            ? { ...channel, is_member: false }
            : channel
        )
      );
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to leave channel';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  return {
    channels,
    isLoading,
    error,
    refreshChannels,
    createChannel,
    updateChannel,
    deleteChannel,
    joinChannel,
    leaveChannel,
  };
}