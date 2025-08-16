/**
 * Projects Service
 * Handles all project-related API calls
 */

import axiosInstance from '@/lib/axios';
import { config } from '@/config';
import type {
  Project,
  ProjectMember,
  CreateProjectData,
  UpdateProjectData,
  ApiResponse,
} from '@/types';

class ProjectsService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${config.api.baseUrl}/projects`;
  }

  // =================== PROJECTS ===================

  /**
   * Get all projects for current user
   */
  async getProjects(): Promise<Project[]> {
    try {
      const response = await axiosInstance.get<{ 
        success: boolean; 
        projects: Project[]; 
        count: number;
        error?: { message: string; code: string; };
      }>(this.baseUrl);
      
      if (response.data.success) {
        return response.data.projects || [];
      }
      
      throw new Error(response.data.error?.message || 'Failed to fetch projects');
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      throw new Error(error.message || 'Failed to fetch projects');
    }
  }

  /**
   * Get project by ID
   */
  async getProject(projectId: string): Promise<Project> {
    try {
      const response = await axiosInstance.get<ApiResponse<{ project: Project }>>(
        `${this.baseUrl}/${projectId}`
      );
      
      if (response.data.success && response.data.data?.project) {
        return response.data.data.project;
      }
      
      throw new Error(response.data.error?.message || 'Project not found');
    } catch (error: any) {
      console.error('Error fetching project:', error);
      throw new Error(error.message || 'Failed to fetch project');
    }
  }

  /**
   * Create new project
   */
  async createProject(data: CreateProjectData): Promise<Project> {
    try {
      const response = await axiosInstance.post<any>(
        this.baseUrl,
        data
      );
      
      // Handle multiple possible response formats
      if (response.data) {
        // Direct project object
        if (response.data.project_id) {
          return response.data as Project;
        }
        
        // Backend returns { success: true, project: {...} }
        if (response.data.success && response.data.project) {
          return response.data.project as Project;
        }
        
        // Wrapped in success/data structure
        if (response.data.success && response.data.data) {
          const project = response.data.data.project || response.data.data;
          if (project && project.project_id) {
            return project as Project;
          }
        }
        
        // Just wrapped in data
        if (response.data.data && response.data.data.project_id) {
          return response.data.data as Project;
        }
      }
      
      throw new Error(response.data?.error?.message || 'Failed to create project');
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to create project');
    }
  }

  /**
   * Update project
   */
  async updateProject(projectId: string, data: UpdateProjectData): Promise<Project> {
    try {
      const response = await axiosInstance.put<ApiResponse<{ project: Project }>>(
        `${this.baseUrl}/${projectId}`,
        data
      );
      
      if (response.data.success && response.data.data?.project) {
        return response.data.data.project;
      }
      
      throw new Error(response.data.error?.message || 'Failed to update project');
    } catch (error: any) {
      console.error('Error updating project:', error);
      throw new Error(error.message || 'Failed to update project');
    }
  }

  /**
   * Delete project
   */
  async deleteProject(projectId: string): Promise<void> {
    try {
      const response = await axiosInstance.delete<ApiResponse>(
        `${this.baseUrl}/${projectId}`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to delete project');
      }
    } catch (error: any) {
      console.error('Error deleting project:', error);
      throw new Error(error.message || 'Failed to delete project');
    }
  }

  // =================== PROJECT MEMBERS ===================

  /**
   * Get project members
   */
  async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<{ members: ProjectMember[] }>>(
        `${this.baseUrl}/${projectId}/members`
      );
      
      if (response.data.success) {
        return response.data.data?.members || [];
      }
      
      throw new Error(response.data.error?.message || 'Failed to fetch project members');
    } catch (error: any) {
      console.error('Error fetching project members:', error);
      throw new Error(error.message || 'Failed to fetch project members');
    }
  }

  /**
   * Add member to project
   */
  async addProjectMember(projectId: string, userId: string, role: 'member' | 'moderator' | 'admin' = 'member'): Promise<void> {
    try {
      const response = await axiosInstance.post<ApiResponse>(
        `${this.baseUrl}/${projectId}/members`,
        { userId, role }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to add project member');
      }
    } catch (error: any) {
      console.error('Error adding project member:', error);
      throw new Error(error.message || 'Failed to add project member');
    }
  }

  /**
   * Remove member from project
   */
  async removeProjectMember(projectId: string, userId: string): Promise<void> {
    try {
      const response = await axiosInstance.delete<ApiResponse>(
        `${this.baseUrl}/${projectId}/members/${userId}`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to remove project member');
      }
    } catch (error: any) {
      console.error('Error removing project member:', error);
      throw new Error(error.message || 'Failed to remove project member');
    }
  }

  /**
   * Update member role
   */
  async updateMemberRole(projectId: string, userId: string, role: 'member' | 'moderator' | 'admin'): Promise<void> {
    try {
      const response = await axiosInstance.put<ApiResponse>(
        `${this.baseUrl}/${projectId}/members/${userId}/role`,
        { role }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to update member role');
      }
    } catch (error: any) {
      console.error('Error updating member role:', error);
      throw new Error(error.message || 'Failed to update member role');
    }
  }

  // =================== PROJECT CHANNELS ===================

  /**
   * Get channels for a specific project
   */
  async getProjectChannels(projectId: string): Promise<any[]> { // Using any[] for now, will be Channel[] after chat service update
    try {
      const response = await axiosInstance.get<ApiResponse<{ channels: any[] }>>(
        `${this.baseUrl}/${projectId}/channels`
      );
      
      if (response.data.success) {
        return response.data.data?.channels || [];
      }
      
      throw new Error(response.data.error?.message || 'Failed to fetch project channels');
    } catch (error: any) {
      console.error('Error fetching project channels:', error);
      throw new Error(error.message || 'Failed to fetch project channels');
    }
  }

  /**
   * Create channel in project
   */
  async createProjectChannel(projectId: string, data: { name: string; description?: string; isPrivate?: boolean }): Promise<any> {
    try {
      const response = await axiosInstance.post<ApiResponse<{ channel: any }>>(
        `${this.baseUrl}/${projectId}/channels`,
        {
          name: data.name,
          description: data.description,
          isPrivate: data.isPrivate || false,
        }
      );
      
      // Handle multiple possible response formats from the backend
      if (response.data) {
        // Direct channel object
        if (response.data.channel_id) {
          return response.data;
        }
        
        // Backend returns { success: true, channel: {...} }
        if (response.data.success && response.data.channel) {
          return response.data.channel;
        }
        
        // Wrapped in data structure
        if (response.data.success && response.data.data?.channel) {
          return response.data.data.channel;
        }
        
        // Just wrapped in data
        if (response.data.data && response.data.data.channel_id) {
          return response.data.data;
        }
      }
      
      throw new Error(response.data?.error?.message || 'Failed to create channel');
    } catch (error: any) {
      // Don't log expected errors (409 Conflict for duplicate names)
      // Only log unexpected errors for debugging
      if (error.response?.status !== 409) {
        console.error('Error creating project channel:', error);
      }
      
      // Pass through the actual API error message
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to create channel');
    }
  }
}

// Export singleton instance
export const projectsService = new ProjectsService();
export default projectsService;