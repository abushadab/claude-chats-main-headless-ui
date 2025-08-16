/**
 * Hook for fetching and managing project members
 * Fetches ALL members for a project (not just active/online)
 */

import { useState, useEffect, useCallback } from 'react';
import { projectsService } from '@/services/projects.service';
import { cache, CACHE_KEYS } from '@/lib/cache';
import type { ProjectMember } from '@/types/project.types';

interface UseProjectMembersReturn {
  members: ProjectMember[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useProjectMembers(projectId: string | undefined): UseProjectMembersReturn {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [previousProjectId, setPreviousProjectId] = useState<string | undefined>();

  const fetchMembers = useCallback(async () => {
    if (!projectId || projectId === '') {
      // Don't clear members immediately - keep showing previous members
      // Only clear if we really have no project
      if (!previousProjectId) {
        setMembers([]);
      }
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check cache first if members caching is enabled
      if (cache.isMembersCacheEnabled()) {
        const cacheKey = `${CACHE_KEYS.MEMBERS_PREFIX}${projectId}`;
        const cachedMembers = cache.get<ProjectMember[]>(cacheKey, 'members');
        
        if (cachedMembers) {
          console.log('💾 Using cached members for project:', projectId);
          setMembers(cachedMembers);
          setIsLoading(false);
          return;
        }
      }

      // Fetch from API
      console.log('🔄 Fetching members from API for project:', projectId);
      const fetchedMembers = await projectsService.getProjectMembers(projectId);
      
      // Cache the members if members caching is enabled
      if (cache.isMembersCacheEnabled() && fetchedMembers) {
        const cacheKey = `${CACHE_KEYS.MEMBERS_PREFIX}${projectId}`;
        cache.set(cacheKey, fetchedMembers, 10 * 60 * 1000, 'members'); // 10 min TTL
        console.log('💾 Cached members for project:', projectId);
      }

      setMembers(fetchedMembers);
      setPreviousProjectId(projectId);
    } catch (err) {
      console.error('Error fetching project members:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch members'));
      // Don't clear members on error - keep showing previous data
      // setMembers([]);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, previousProjectId]);

  // Fetch members when projectId changes
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return {
    members,
    isLoading,
    error,
    refetch: fetchMembers
  };
}