import { useQuery, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/services/project.service';
import { cache, CACHE_KEYS, CACHE_TTL, STALE_THRESHOLD } from '@/lib/cache';
import type { Project, ActiveMember } from '@/types/project.types';
import type { Channel } from '@/types/chat.types';

export function useProjects(lightweight = true) {
  const queryClient = useQueryClient();
  const cacheKey = `${CACHE_KEYS.PROJECTS}_${lightweight ? 'light' : 'full'}`;

  const {
    data: projects = [],
    isLoading: loading,
    error,
    isStale,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['projects', lightweight],
    queryFn: async (): Promise<Project[]> => {
      console.log('🔄 Fetching projects from API...');
      const data = await projectService.getProjects(lightweight);
      
      // Cache in localStorage with TTL
      cache.set(cacheKey, data, CACHE_TTL.PROJECTS);
      console.log('💾 Projects cached in localStorage');
      
      return data;
    },
    // Enhanced caching strategy
    staleTime: STALE_THRESHOLD.PROJECTS,
    gcTime: CACHE_TTL.PROJECTS,
    // Initialize with cached data if available
    initialData: () => {
      const cachedData = cache.get<Project[]>(cacheKey);
      if (cachedData) {
        console.log('🗂️ Loading projects from localStorage cache');
        // Trigger background refetch if cache is stale
        const isStale = cache.isStale(cacheKey, STALE_THRESHOLD.PROJECTS);
        if (isStale) {
          console.log('📡 Cache is stale, will refetch in background');
          // Use setTimeout to avoid blocking initial render
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['projects', lightweight] });
          }, 100);
        }
        return cachedData;
      }
      return undefined;
    },
    // Prevent refetch on mount if we have cached data
    refetchOnMount: (query) => {
      const hasCache = cache.has(cacheKey);
      const isStale = cache.isStale(cacheKey, STALE_THRESHOLD.PROJECTS);
      return !hasCache || isStale;
    },
    // Enable background refetching
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    // Retry with exponential backoff
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors (except 429 rate limiting)
      if (error?.response?.status >= 400 && error?.response?.status < 500 && error?.response?.status !== 429) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Enhanced error handling with cache fallback
  const errorMessage = error ? 
    (error as any)?.message || 'Failed to fetch projects' : 
    null;

  // Provide cache refresh method
  const refreshProjects = async () => {
    console.log('🔄 Force refreshing projects...');
    cache.remove(cacheKey);
    await refetch();
  };

  // Cache statistics for debugging
  const getCacheStats = () => {
    const hasCache = cache.has(cacheKey);
    const age = cache.getAge(cacheKey);
    const isStaleCache = cache.isStale(cacheKey, STALE_THRESHOLD.PROJECTS);
    
    return {
      hasCache,
      age,
      isStale: isStaleCache,
      isFetching,
      isQueryStale: isStale,
    };
  };

  return { 
    projects, 
    isLoading: loading, 
    loading, // Keep backward compatibility
    error: errorMessage,
    refreshProjects,
    getCacheStats,
    // Additional React Query state
    isFetching,
    isStale,
  };
}

export function useProject(projectSlug: string, includes?: string[]) {
  const queryClient = useQueryClient();
  const includesKey = includes?.join(',') || '';
  const cacheKey = `${CACHE_KEYS.PROJECT_PREFIX}${projectSlug}_${includesKey}`;

  const {
    data,
    isLoading: loading,
    error,
    isStale,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['project', projectSlug, includesKey],
    queryFn: async () => {
      if (!projectSlug) {
        throw new Error('Project slug is required');
      }
      
      console.log('🔄 Fetching project from API...', projectSlug);
      const data = await projectService.getProjectBySlug(projectSlug, includes);
      
      // Cache in localStorage with TTL
      cache.set(cacheKey, data, CACHE_TTL.PROJECT);
      console.log('💾 Project cached in localStorage');
      
      return data;
    },
    enabled: !!projectSlug, // Only run query if projectSlug exists
    // Enhanced caching strategy
    staleTime: STALE_THRESHOLD.PROJECT,
    gcTime: CACHE_TTL.PROJECT,
    // Initialize with cached data if available
    initialData: () => {
      if (!projectSlug) return undefined;
      
      const cachedData = cache.get<any>(cacheKey);
      if (cachedData) {
        console.log('🗂️ Loading project from localStorage cache');
        // Trigger background refetch if cache is stale
        const isStale = cache.isStale(cacheKey, STALE_THRESHOLD.PROJECT);
        if (isStale) {
          console.log('📡 Project cache is stale, will refetch in background');
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['project', projectSlug, includesKey] });
          }, 100);
        }
        return cachedData;
      }
      return undefined;
    },
    // Prevent refetch on mount if we have fresh cached data
    refetchOnMount: (query) => {
      if (!projectSlug) return false;
      const hasCache = cache.has(cacheKey);
      const isStale = cache.isStale(cacheKey, STALE_THRESHOLD.PROJECT);
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

  // Extract data with fallbacks
  const project = data?.project || null;
  const channels = data?.channels || [];
  const activeMembers = data?.active_members || [];

  // Enhanced error handling
  const errorMessage = error ? 
    (error as any)?.message || 'Failed to fetch project' : 
    null;

  // Provide cache refresh method
  const refreshProject = async () => {
    console.log('🔄 Force refreshing project...');
    cache.remove(cacheKey);
    await refetch();
  };

  // Cache statistics for debugging
  const getCacheStats = () => {
    const hasCache = cache.has(cacheKey);
    const age = cache.getAge(cacheKey);
    const isStaleCache = cache.isStale(cacheKey, STALE_THRESHOLD.PROJECT);
    
    return {
      hasCache,
      age,
      isStale: isStaleCache,
      isFetching,
      isQueryStale: isStale,
    };
  };

  return { 
    project, 
    channels, 
    activeMembers, 
    isLoading: loading,
    loading, // Keep backward compatibility
    error: errorMessage,
    refreshProject,
    getCacheStats,
    // Additional React Query state
    isFetching,
    isStale,
  };
}