/**
 * useChannels Hook
 * Manages channels state and API calls
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatService } from '@/services/chat.service';
import { cache, CACHE_KEYS, CACHE_TTL, STALE_THRESHOLD } from '@/lib/cache';
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
  const queryClient = useQueryClient();
  const cacheKey = `${CACHE_KEYS.CHANNELS_PREFIX}${projectId || 'all'}`;

  // Handle the 'skip' case for backward compatibility
  const shouldFetch = projectId !== 'skip';

  const {
    data: channels = [],
    isLoading,
    error,
    isStale,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['channels', projectId],
    queryFn: async (): Promise<Channel[]> => {
      console.log('🔄 Fetching channels from API...', projectId ? `for project: ${projectId}` : '(all)');
      const data = await chatService.getChannels(projectId);
      
      // Cache in localStorage with TTL
      cache.set(cacheKey, data, CACHE_TTL.CHANNELS);
      console.log('💾 Channels cached in localStorage');
      
      return data;
    },
    enabled: shouldFetch, // Skip if projectId is 'skip'
    // Enhanced caching strategy
    staleTime: STALE_THRESHOLD.CHANNELS,
    gcTime: CACHE_TTL.CHANNELS,
    // Initialize with cached data if available
    initialData: () => {
      if (!shouldFetch) return [];
      
      const cachedData = cache.get<Channel[]>(cacheKey);
      if (cachedData) {
        console.log('🗂️ Loading channels from localStorage cache');
        // Trigger background refetch if cache is stale
        const isStale = cache.isStale(cacheKey, STALE_THRESHOLD.CHANNELS);
        if (isStale) {
          console.log('📡 Channels cache is stale, will refetch in background');
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['channels', projectId] });
          }, 100);
        }
        return cachedData;
      }
      return undefined;
    },
    // Prevent refetch on mount if we have fresh cached data
    refetchOnMount: (query) => {
      if (!shouldFetch) return false;
      const hasCache = cache.has(cacheKey);
      const isStale = cache.isStale(cacheKey, STALE_THRESHOLD.CHANNELS);
      return !hasCache || isStale;
    },
    // Enable background refetching
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    // Retry strategy
    retry: (failureCount, error: any) => {
      if (error?.response?.status >= 400 && error?.response?.status < 500 && error?.response?.status !== 429) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // If skip mode, return empty state
  if (!shouldFetch) {
    return {
      channels: [],
      isLoading: false,
      error: null,
      refreshChannels: async () => {},
      createChannel: async () => { throw new Error('Cannot create channel in skip mode'); },
      updateChannel: async () => { throw new Error('Cannot update channel in skip mode'); },
      deleteChannel: async () => {},
      joinChannel: async () => {},
      leaveChannel: async () => {},
    };
  }

  // Enhanced error handling
  const errorMessage = error ? 
    (error as any)?.message || 'Failed to load channels' : 
    null;

  // Refresh channels (public method)
  const refreshChannels = useCallback(async () => {
    console.log('🔄 Force refreshing channels...');
    cache.remove(cacheKey);
    await refetch();
  }, [cacheKey, refetch]);

  // Create new channel with optimistic updates and cross-cache invalidation
  const createChannel = useCallback(async (data: { 
    name: string; 
    description?: string; 
    isPrivate?: boolean;
  }) => {
    try {
      const newChannel = await chatService.createChannel(data);
      
      // 1. Update current project's channels cache optimistically
      queryClient.setQueryData(['channels', projectId], (oldData: Channel[] | undefined) => {
        return oldData ? [...oldData, newChannel] : [newChannel];
      });
      
      // 2. Update localStorage cache
      const cachedData = cache.get<Channel[]>(cacheKey) || [];
      cache.set(cacheKey, [...cachedData, newChannel], CACHE_TTL.CHANNELS);
      
      // 3. Invalidate "all channels" cache if it exists
      queryClient.invalidateQueries({ queryKey: ['channels', undefined] });
      cache.remove(`${CACHE_KEYS.CHANNELS_PREFIX}all`);
      
      // 4. Update project data that includes channel count
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      console.log('✅ Channel created and caches updated:', newChannel.name);
      return newChannel;
    } catch (err: any) {
      // On error, invalidate caches to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['channels', projectId] });
      cache.remove(cacheKey);
      
      const errorMsg = err.message || 'Failed to create channel';
      throw new Error(errorMsg);
    }
  }, [queryClient, projectId, cacheKey]);

  // Update channel with optimistic updates
  const updateChannel = useCallback(async (
    channelId: string, 
    data: { name?: string; description?: string }
  ) => {
    try {
      const updatedChannel = await chatService.updateChannel(channelId, data);
      
      // Update cache optimistically
      queryClient.setQueryData(['channels', projectId], (oldData: Channel[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(channel => 
          channel.channel_id === channelId ? updatedChannel : channel
        );
      });
      
      // Update localStorage cache
      const cachedData = cache.get<Channel[]>(cacheKey);
      if (cachedData) {
        const updatedData = cachedData.map(channel => 
          channel.channel_id === channelId ? updatedChannel : channel
        );
        cache.set(cacheKey, updatedData, CACHE_TTL.CHANNELS);
      }
      
      return updatedChannel;
    } catch (err: any) {
      // Invalidate cache on error to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['channels', projectId] });
      const errorMsg = err.message || 'Failed to update channel';
      throw new Error(errorMsg);
    }
  }, [queryClient, projectId, cacheKey]);

  // Delete channel with comprehensive cache cleanup
  const deleteChannel = useCallback(async (channelId: string) => {
    try {
      await chatService.deleteChannel(channelId);
      
      // 1. Remove from current project's channels cache
      queryClient.setQueryData(['channels', projectId], (oldData: Channel[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.filter(channel => channel.channel_id !== channelId);
      });
      
      // 2. Update localStorage cache
      const cachedData = cache.get<Channel[]>(cacheKey);
      if (cachedData) {
        const updatedData = cachedData.filter(channel => channel.channel_id !== channelId);
        cache.set(cacheKey, updatedData, CACHE_TTL.CHANNELS);
      }
      
      // 3. Invalidate "all channels" cache
      queryClient.invalidateQueries({ queryKey: ['channels', undefined] });
      cache.remove(`${CACHE_KEYS.CHANNELS_PREFIX}all`);
      
      // 4. Remove any messages cache for this channel
      queryClient.removeQueries({ queryKey: ['messages', channelId] });
      
      // 5. Update project data (channel count changed)
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      // 6. Remove from any project-specific caches that include this channel
      const projects = queryClient.getQueryData(['projects']) as any[];
      if (projects) {
        projects.forEach(project => {
          if (project.project_id !== projectId) {
            const otherCacheKey = `${CACHE_KEYS.CHANNELS_PREFIX}${project.project_id}`;
            const otherCached = cache.get<Channel[]>(otherCacheKey);
            if (otherCached?.some(ch => ch.channel_id === channelId)) {
              // This channel exists in another project's cache, remove it
              const filtered = otherCached.filter(ch => ch.channel_id !== channelId);
              cache.set(otherCacheKey, filtered, CACHE_TTL.CHANNELS);
              queryClient.invalidateQueries({ queryKey: ['channels', project.project_id] });
            }
          }
        });
      }
      
      console.log('✅ Channel deleted and all related caches cleaned up');
    } catch (err: any) {
      // On error, invalidate all channel-related caches for safety
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      const errorMsg = err.message || 'Failed to delete channel';
      throw new Error(errorMsg);
    }
  }, [queryClient, projectId, cacheKey]);

  // Join channel with optimistic updates
  const joinChannel = useCallback(async (channelId: string) => {
    try {
      await chatService.joinChannel(channelId);
      
      // Update membership optimistically
      queryClient.setQueryData(['channels', projectId], (oldData: Channel[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(channel => 
          channel.channel_id === channelId 
            ? { ...channel, is_member: true }
            : channel
        );
      });
      
      // Update localStorage cache
      const cachedData = cache.get<Channel[]>(cacheKey);
      if (cachedData) {
        const updatedData = cachedData.map(channel => 
          channel.channel_id === channelId 
            ? { ...channel, is_member: true }
            : channel
        );
        cache.set(cacheKey, updatedData, CACHE_TTL.CHANNELS);
      }
    } catch (err: any) {
      queryClient.invalidateQueries({ queryKey: ['channels', projectId] });
      const errorMsg = err.message || 'Failed to join channel';
      throw new Error(errorMsg);
    }
  }, [queryClient, projectId, cacheKey]);

  // Leave channel with optimistic updates
  const leaveChannel = useCallback(async (channelId: string) => {
    try {
      await chatService.leaveChannel(channelId);
      
      // Update membership optimistically
      queryClient.setQueryData(['channels', projectId], (oldData: Channel[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(channel => 
          channel.channel_id === channelId 
            ? { ...channel, is_member: false }
            : channel
        );
      });
      
      // Update localStorage cache
      const cachedData = cache.get<Channel[]>(cacheKey);
      if (cachedData) {
        const updatedData = cachedData.map(channel => 
          channel.channel_id === channelId 
            ? { ...channel, is_member: false }
            : channel
        );
        cache.set(cacheKey, updatedData, CACHE_TTL.CHANNELS);
      }
    } catch (err: any) {
      queryClient.invalidateQueries({ queryKey: ['channels', projectId] });
      const errorMsg = err.message || 'Failed to leave channel';
      throw new Error(errorMsg);
    }
  }, [queryClient, projectId, cacheKey]);

  return {
    channels,
    isLoading,
    error: errorMessage,
    refreshChannels,
    createChannel,
    updateChannel,
    deleteChannel,
    joinChannel,
    leaveChannel,
  };
}