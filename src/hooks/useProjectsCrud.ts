/**
 * useProjects Hook
 * Manages projects state and API calls
 */

import { useState, useEffect, useCallback } from 'react';
import { projectsService } from '@/services/projects.service';
import { projectService } from '@/services/project.service';
import { useAuth } from '@/contexts/AuthContext';
import { cache, CACHE_KEYS, CACHE_TTL, STALE_THRESHOLD } from '@/lib/cache';
import type { Project, CreateProjectData } from '@/types';

interface UseProjectsReturn {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  refreshProjects: () => Promise<void>;
  createProject: (data: CreateProjectData) => Promise<Project>;
  updateProject: (projectId: string, data: { name?: string; description?: string }) => Promise<Project>;
  deleteProject: (projectId: string) => Promise<void>;
}

export function useProjects(): UseProjectsReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // Load projects from API (using lightweight version for performance)
  const loadProjects = useCallback(async (forceRefresh = false) => {
    // Double-check authentication before making API call
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const cacheKey = CACHE_KEYS.PROJECTS;
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedProjects = cache.get<Project[]>(cacheKey, 'projects');
      if (cachedProjects) {
        console.log('🗂️ Loading projects from cache');
        setProjects(cachedProjects);
        setIsLoading(false);
        
        // Check if cache is stale and trigger background refresh
        const isStale = cache.isStale(cacheKey, STALE_THRESHOLD.PROJECTS);
        if (isStale) {
          console.log('📡 Projects cache is stale, refreshing in background');
          // Don't await this - let it run in background
          loadProjects(true);
        }
        return;
      }
    }
    
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔄 Fetching projects from API...');
      
      // Use the new lightweight API endpoint
      const fetchedProjects = await projectService.getProjects(true);
      setProjects(fetchedProjects);
      
      // Only cache if projects caching is enabled
      if (cache.isProjectsCacheEnabled()) {
        cache.set(cacheKey, fetchedProjects, CACHE_TTL.PROJECTS, 'projects');
        console.log('💾 Projects cached in localStorage');
      }
    } catch (err: any) {
      // Fallback to old API if new one fails
      try {
        const fetchedProjects = await projectsService.getProjects();
        setProjects(fetchedProjects);
        
        // Only cache if projects caching is enabled
        if (cache.isProjectsCacheEnabled()) {
          cache.set(cacheKey, fetchedProjects, CACHE_TTL.PROJECTS, 'projects');
          console.log('💾 Projects (fallback) cached in localStorage');
        }
      } catch (fallbackErr: any) {
        setError(fallbackErr.message || 'Failed to load projects');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Initial load - only if authenticated
  useEffect(() => {
    // Skip if auth is still loading
    if (isAuthLoading) {
      setIsLoading(true);
      return;
    }
    
    // If not authenticated, don't fetch
    if (!isAuthenticated) {
      setIsLoading(false);
      setProjects([]);
      setError(null);
      return;
    }
    
    loadProjects();
  }, [isAuthenticated, isAuthLoading, loadProjects]);

  // Refresh projects (public method)
  const refreshProjects = useCallback(async () => {
    console.log('🔄 Force refreshing projects...');
    cache.remove(CACHE_KEYS.PROJECTS);
    await loadProjects(true);
  }, [loadProjects]);

  // Create new project
  const createProject = useCallback(async (data: CreateProjectData) => {
    try {
      const newProject = await projectsService.createProject(data);
      
      // Update local state
      const updatedProjects = [...projects, newProject];
      setProjects(updatedProjects);
      
      // Update cache if enabled
      if (cache.isProjectsCacheEnabled()) {
        cache.set(CACHE_KEYS.PROJECTS, updatedProjects, CACHE_TTL.PROJECTS, 'projects');
      }
      
      return newProject;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to create project';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [projects]);

  // Update project
  const updateProject = useCallback(async (
    projectId: string, 
    data: { name?: string; description?: string }
  ) => {
    try {
      const updatedProject = await projectsService.updateProject(projectId, data);
      
      // Update in local state
      const updatedProjects = projects.map(project => 
        project.project_id === projectId ? updatedProject : project
      );
      setProjects(updatedProjects);
      
      // Update cache if enabled
      if (cache.isProjectsCacheEnabled()) {
        cache.set(CACHE_KEYS.PROJECTS, updatedProjects, CACHE_TTL.PROJECTS, 'projects');
      }
      console.log('✅ Project updated and cache updated:', updatedProject.name);
      
      return updatedProject;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to update project';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [projects]);

  // Delete project
  const deleteProject = useCallback(async (projectId: string) => {
    try {
      await projectsService.deleteProject(projectId);
      
      // Remove from local state
      const updatedProjects = projects.filter(project => project.project_id !== projectId);
      setProjects(updatedProjects);
      
      // Update cache if enabled
      if (cache.isProjectsCacheEnabled()) {
        cache.set(CACHE_KEYS.PROJECTS, updatedProjects, CACHE_TTL.PROJECTS, 'projects');
      }
      console.log('✅ Project deleted and cache updated');
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to delete project';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [projects]);

  return {
    projects,
    isLoading,
    error,
    refreshProjects,
    createProject,
    updateProject,
    deleteProject,
  };
}