/**
 * useProjects Hook
 * Manages projects state and API calls
 */

import { useState, useEffect, useCallback } from 'react';
import { projectsService } from '@/services/projects.service';
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

  // Load projects from API
  const loadProjects = useCallback(async () => {
    console.log('🔄 Loading projects...');
    try {
      setIsLoading(true);
      setError(null);
      
      const fetchedProjects = await projectsService.getProjects();
      console.log('✅ Projects loaded:', fetchedProjects);
      setProjects(fetchedProjects);
    } catch (err: any) {
      console.error('❌ Error loading projects:', err);
      setError(err.message || 'Failed to load projects');
    } finally {
      setIsLoading(false);
      console.log('🏁 Loading projects complete');
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

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