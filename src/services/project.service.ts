import axios from '@/lib/axios';
import type { Project, ActiveMember, CreateProjectData, UpdateProjectData } from '@/types/project.types';
import type { Channel } from '@/types/chat.types';

class ProjectService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hudhud.baytlabs.com/api';

  /**
   * Get all projects (lightweight version for initial load)
   */
  async getProjects(lightweight = true): Promise<Project[]> {
    const params = lightweight ? { lightweight: 'true' } : {};
    const response = await axios.get<{
      success: boolean;
      projects: Project[];
      count: number;
    }>(`${this.baseUrl}/projects`, { params });
    
    // Handle the response structure { success: true, projects: [...] }
    if (response.data.success && response.data.projects) {
      return response.data.projects;
    }
    
    // Fallback if response is already an array (old API)
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    throw new Error('Invalid response structure from projects API');
  }

  /**
   * Get a single project by ID with optional includes
   */
  async getProject(projectId: string, includes?: string[]): Promise<{
    project: Project;
    channels?: Channel[];
    active_members?: ActiveMember[];
  }> {
    const params = includes?.length ? { include: includes.join(',') } : {};
    const response = await axios.get(`${this.baseUrl}/projects/${projectId}`, { params });
    return response.data;
  }

  /**
   * Get a single project by slug with optional includes
   */
  async getProjectBySlug(slug: string, includes?: string[]): Promise<{
    project: Project;
    channels?: Channel[];
    active_members?: ActiveMember[];
  }> {
    const params = includes?.length ? { include: includes.join(',') } : {};
    const response = await axios.get(`${this.baseUrl}/projects/slug/${slug}`, { params });
    return response.data;
  }

  /**
   * Create a new project
   */
  async createProject(data: CreateProjectData): Promise<Project> {
    const response = await axios.post(`${this.baseUrl}/projects`, data);
    return response.data;
  }

  /**
   * Update a project
   */
  async updateProject(projectId: string, data: UpdateProjectData): Promise<Project> {
    const response = await axios.patch(`${this.baseUrl}/projects/${projectId}`, data);
    return response.data;
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId: string): Promise<void> {
    await axios.delete(`${this.baseUrl}/projects/${projectId}`);
  }

  /**
   * Get project members
   */
  async getProjectMembers(projectId: string): Promise<ActiveMember[]> {
    const response = await axios.get(`${this.baseUrl}/projects/${projectId}/members`);
    return response.data;
  }

  /**
   * Add member to project
   */
  async addProjectMember(projectId: string, userId: string, role: string = 'member'): Promise<void> {
    await axios.post(`${this.baseUrl}/projects/${projectId}/members`, { userId, role });
  }

  /**
   * Remove member from project
   */
  async removeProjectMember(projectId: string, userId: string): Promise<void> {
    await axios.delete(`${this.baseUrl}/projects/${projectId}/members/${userId}`);
  }

  /**
   * Update member role
   */
  async updateProjectMemberRole(projectId: string, userId: string, role: string): Promise<void> {
    await axios.patch(`${this.baseUrl}/projects/${projectId}/members/${userId}`, { role });
  }
}

export const projectService = new ProjectService();