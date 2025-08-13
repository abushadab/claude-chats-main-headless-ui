/**
 * useProjects Hook
 * Manages projects state and API calls
 */

import { useState, useEffect, useCallback } from 'react';
import { projectsService } from '@/services/projects.service';
import { projectService } from '@/services/project.service';
import { useAuth } from '@/contexts/AuthContext';
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
  const loadProjects = useCallback(async () => {
    // Double-check authentication before making API call
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Use the new lightweight API endpoint
      const fetchedProjects = await projectService.getProjects(true);
      setProjects(fetchedProjects);
    } catch (err: any) {
      // Fallback to old API if new one fails
      try {
        const fetchedProjects = await projectsService.getProjects();
        setProjects(fetchedProjects);
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
    await loadProjects();
  }, [loadProjects]);

  // Create new project
  const createProject = useCallback(async (data: CreateProjectData) => {
    try {
      const newProject = await projectsService.createProject(data);
      
      // Add to local state
      setProjects(prev => [...prev, newProject]);
      
      return newProject;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to create project';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  // Update project
  const updateProject = useCallback(async (
    projectId: string, 
    data: { name?: string; description?: string }
  ) => {
    try {
      const updatedProject = await projectsService.updateProject(projectId, data);
      
      // Update in local state
      setProjects(prev => 
        prev.map(project => 
          project.project_id === projectId ? updatedProject : project
        )
      );
      
      return updatedProject;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to update project';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  // Delete project
  const deleteProject = useCallback(async (projectId: string) => {
    try {
      await projectsService.deleteProject(projectId);
      
      // Remove from local state
      setProjects(prev => 
        prev.filter(project => project.project_id !== projectId)
      );
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to delete project';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

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