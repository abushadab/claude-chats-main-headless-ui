/**
 * useChannels Hook
 * Manages channels state and API calls
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatService } from '@/services/chat.service';
import { projectsService } from '@/services/projects.service';
import { cache, CACHE_KEYS, CACHE_TTL, STALE_THRESHOLD } from '@/lib/cache';
import { useAuth } from '@/contexts/AuthContext';
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

// Stable empty array to prevent re-renders
const EMPTY_CHANNELS: Channel[] = [];

export function useChannels(projectId?: string | 'skip', skipFetch = false): UseChannelsReturn {
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const cacheKey = `${CACHE_KEYS.CHANNELS_PREFIX}${projectId || 'all'}`;

  // Handle the 'skip' case for backward compatibility
  // Also skip if not authenticated or if projectId is invalid (empty/loading/placeholder)
  const shouldFetch = !skipFetch && Boolean(
    projectId && 
    projectId !== 'skip' && 
    projectId !== 'loading' && 
    isAuthenticated && 
    !isAuthLoading
  );
  
  // Skip debug logging

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
      // Double-check auth before making request
      if (!isAuthenticated) {
        console.log('⏭️ Skipping channels fetch - not authenticated');
        return [];
      }
      console.log('🔄 Fetching channels from API...', projectId ? `for project: ${projectId}` : '(all)');
      const data = await chatService.getChannels(projectId);
      
      // Only cache if channels caching is enabled
      if (cache.isChannelsCacheEnabled()) {
        cache.set(cacheKey, data, CACHE_TTL.CHANNELS, 'channels');
        console.log('💾 Channels cached in localStorage');
      }
      
      return data;
    },
    enabled: shouldFetch, // Skip if projectId is 'skip' or not authenticated
    // Enhanced caching strategy
    staleTime: STALE_THRESHOLD.CHANNELS,
    gcTime: CACHE_TTL.CHANNELS,
    // Initialize with cached data if available
    initialData: () => {
      if (!shouldFetch) return [];
      
      const cachedData = cache.get<Channel[]>(cacheKey, 'channels');
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
      const hasCache = cache.has(cacheKey, 'channels');
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

  // Enhanced error handling
  const errorMessage = error ? 
    (error as any)?.message || 'Failed to load channels' : 
    null;

  // Refresh channels (public method) - Always define hooks regardless of shouldFetch
  const refreshChannels = useCallback(async () => {
    if (!shouldFetch) return;
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
    // Check if we have a valid project ID for creating channels
    if (!projectId || projectId === 'skip' || projectId === 'loading') {
      throw new Error('Cannot create channel: invalid project ID');
    }
    try {
      // Use the project-specific endpoint
      const newChannel = await projectsService.createProjectChannel(projectId, data);
      
      // 1. Update current project's channels cache optimistically
      queryClient.setQueryData(['channels', projectId], (oldData: Channel[] | undefined) => {
        return oldData ? [...oldData, newChannel] : [newChannel];
      });
      
      // 2. Update localStorage cache if enabled
      if (cache.isChannelsCacheEnabled()) {
        const cachedData = cache.get<Channel[]>(cacheKey, 'channels') || [];
        cache.set(cacheKey, [...cachedData, newChannel], CACHE_TTL.CHANNELS, 'channels');
      }
      
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
      
      // Pass the error through without wrapping it in a new Error
      // This preserves the original error and avoids console pollution
      throw err;
    }
  }, [queryClient, projectId, cacheKey]);

  // Update channel with optimistic updates
  const updateChannel = useCallback(async (
    channelId: string, 
    data: { name?: string; description?: string }
  ) => {
    if (!shouldFetch) {
      throw new Error('Cannot update channel in skip mode');
    }
    try {
      const updatedChannel = await chatService.updateChannel(channelId, data);
      
      // Update cache optimistically
      queryClient.setQueryData(['channels', projectId], (oldData: Channel[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(channel => 
          channel.channel_id === channelId ? updatedChannel : channel
        );
      });
      
      // Update localStorage cache if enabled
      if (cache.isChannelsCacheEnabled()) {
        const cachedData = cache.get<Channel[]>(cacheKey);
        if (cachedData) {
          const updatedData = cachedData.map(channel => 
            channel.channel_id === channelId ? updatedChannel : channel
          );
          cache.set(cacheKey, updatedData, CACHE_TTL.CHANNELS);
        }
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
    if (!shouldFetch) return;
    try {
      await chatService.deleteChannel(channelId);
      
      // 1. Remove from current project's channels cache
      queryClient.setQueryData(['channels', projectId], (oldData: Channel[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.filter(channel => channel.channel_id !== channelId);
      });
      
      // 2. Update localStorage cache if enabled
      if (cache.isChannelsCacheEnabled()) {
        const cachedData = cache.get<Channel[]>(cacheKey);
        if (cachedData) {
          const updatedData = cachedData.filter(channel => channel.channel_id !== channelId);
          cache.set(cacheKey, updatedData, CACHE_TTL.CHANNELS);
        }
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
              if (cache.isChannelsCacheEnabled()) {
                cache.set(otherCacheKey, filtered, CACHE_TTL.CHANNELS);
              }
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
    if (!shouldFetch) return;
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
      
      // Update localStorage cache if enabled
      if (cache.isChannelsCacheEnabled()) {
        const cachedData = cache.get<Channel[]>(cacheKey);
        if (cachedData) {
          const updatedData = cachedData.map(channel => 
            channel.channel_id === channelId 
              ? { ...channel, is_member: true }
              : channel
          );
          cache.set(cacheKey, updatedData, CACHE_TTL.CHANNELS);
        }
      }
    } catch (err: any) {
      queryClient.invalidateQueries({ queryKey: ['channels', projectId] });
      const errorMsg = err.message || 'Failed to join channel';
      throw new Error(errorMsg);
    }
  }, [queryClient, projectId, cacheKey]);

  // Leave channel with optimistic updates
  const leaveChannel = useCallback(async (channelId: string) => {
    if (!shouldFetch) return;
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
      
      // Update localStorage cache if enabled
      if (cache.isChannelsCacheEnabled()) {
        const cachedData = cache.get<Channel[]>(cacheKey);
        if (cachedData) {
          const updatedData = cachedData.map(channel => 
            channel.channel_id === channelId 
              ? { ...channel, is_member: false }
              : channel
          );
          cache.set(cacheKey, updatedData, CACHE_TTL.CHANNELS);
        }
      }
    } catch (err: any) {
      queryClient.invalidateQueries({ queryKey: ['channels', projectId] });
      const errorMsg = err.message || 'Failed to leave channel';
      throw new Error(errorMsg);
    }
  }, [queryClient, projectId, cacheKey]);

  // Return the same structure regardless of shouldFetch
  return {
    channels: shouldFetch ? channels : EMPTY_CHANNELS, // Use stable empty array
    isLoading: shouldFetch ? isLoading : false,
    error: shouldFetch ? errorMessage : null,
    refreshChannels,
    createChannel,
    updateChannel,
    deleteChannel,
    joinChannel,
    leaveChannel,
  };
}