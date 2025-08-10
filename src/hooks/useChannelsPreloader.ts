/**
 * Channels Preloader Hook
 * Preloads channels for all projects to improve navigation performance
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useProjects } from './useProjects';
import { chatService } from '@/services/chat.service';
import { cache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';
import type { Channel } from '@/types';

interface UseChannelsPreloaderOptions {
  enabled?: boolean;
  preloadDelay?: number; // Delay before starting preload (ms)
  maxConcurrent?: number; // Max concurrent requests
}

export function useChannelsPreloader(options: UseChannelsPreloaderOptions = {}) {
  const {
    enabled = true,
    preloadDelay = 2000, // Wait 2 seconds after projects load
    maxConcurrent = 2, // Limit concurrent requests
  } = options;

  const { projects, isLoading: projectsLoading } = useProjects();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || projectsLoading || projects.length === 0) {
      return;
    }

    const preloadChannels = async () => {
      console.log('🔄 Starting channels preload for', projects.length, 'projects');

      // Process projects in batches to avoid overwhelming the API
      for (let i = 0; i < projects.length; i += maxConcurrent) {
        const batch = projects.slice(i, i + maxConcurrent);
        
        await Promise.allSettled(
          batch.map(async (project) => {
            const cacheKey = `${CACHE_KEYS.CHANNELS_PREFIX}${project.project_id}`;
            
            // Skip if we already have fresh cached data
            if (cache.has(cacheKey) && !cache.isStale(cacheKey, 2 * 60 * 1000)) { // 2 min threshold
              console.log('⚡ Skipping preload for', project.name, '- cache is fresh');
              return;
            }

            // Check if React Query already has this data
            const existingQuery = queryClient.getQueryState(['channels', project.project_id]);
            if (existingQuery?.data && existingQuery.dataUpdatedAt > Date.now() - 2 * 60 * 1000) {
              console.log('⚡ Skipping preload for', project.name, '- React Query has fresh data');
              return;
            }

            try {
              console.log('📡 Preloading channels for', project.name);
              
              // Prefetch with React Query (won't trigger if already cached)
              await queryClient.prefetchQuery({
                queryKey: ['channels', project.project_id],
                queryFn: async () => {
                  const data = await chatService.getChannels(project.project_id);
                  
                  // Cache in localStorage
                  cache.set(cacheKey, data, CACHE_TTL.CHANNELS);
                  console.log('💾 Preloaded channels cached for', project.name);
                  
                  return data;
                },
                staleTime: 5 * 60 * 1000, // 5 minutes
                gcTime: CACHE_TTL.CHANNELS,
              });

              console.log('✅ Preloaded channels for', project.name);
            } catch (error) {
              console.warn('❌ Failed to preload channels for', project.name, error);
            }
          })
        );

        // Small delay between batches to be API-friendly
        if (i + maxConcurrent < projects.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      console.log('🏁 Channels preload complete');
    };

    // Delay preload to not interfere with initial page load
    const timer = setTimeout(preloadChannels, preloadDelay);
    
    return () => clearTimeout(timer);
  }, [projects, projectsLoading, enabled, preloadDelay, maxConcurrent, queryClient]);

  // Utility method to manually trigger preload
  const triggerPreload = async (projectIds?: string[]) => {
    const targetProjects = projectIds 
      ? projects.filter(p => projectIds.includes(p.project_id))
      : projects;

    console.log('🔄 Manual channels preload triggered for', targetProjects.length, 'projects');

    await Promise.allSettled(
      targetProjects.map(async (project) => {
        try {
          await queryClient.prefetchQuery({
            queryKey: ['channels', project.project_id],
            queryFn: async () => {
              const data = await chatService.getChannels(project.project_id);
              const cacheKey = `${CACHE_KEYS.CHANNELS_PREFIX}${project.project_id}`;
              cache.set(cacheKey, data, CACHE_TTL.CHANNELS);
              return data;
            },
            staleTime: 5 * 60 * 1000,
            gcTime: CACHE_TTL.CHANNELS,
          });
          console.log('✅ Manually preloaded channels for', project.name);
        } catch (error) {
          console.warn('❌ Manual preload failed for', project.name, error);
        }
      })
    );
  };

  // Get preload statistics
  const getPreloadStats = () => {
    const stats = {
      totalProjects: projects.length,
      cachedProjects: 0,
      freshCached: 0,
      staleCached: 0,
    };

    projects.forEach(project => {
      const cacheKey = `${CACHE_KEYS.CHANNELS_PREFIX}${project.project_id}`;
      if (cache.has(cacheKey)) {
        stats.cachedProjects++;
        if (cache.isStale(cacheKey, 2 * 60 * 1000)) {
          stats.staleCached++;
        } else {
          stats.freshCached++;
        }
      }
    });

    return stats;
  };

  return {
    triggerPreload,
    getPreloadStats,
    isEnabled: enabled && !projectsLoading,
    projectsCount: projects.length,
  };
}