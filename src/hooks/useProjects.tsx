import { useState, useEffect } from 'react';
import { projectService } from '@/services/project.service';
import type { Project, ActiveMember } from '@/types/project.types';
import type { Channel } from '@/types/chat.types';

export function useProjects(lightweight = true) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await projectService.getProjects(lightweight);
        setProjects(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch projects');
        console.error('Error fetching projects:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [lightweight]);

  return { projects, loading, error };
}

export function useProject(projectSlug: string, includes?: string[]) {
  const [project, setProject] = useState<Project | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeMembers, setActiveMembers] = useState<ActiveMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectSlug) {
      setLoading(false);
      return;
    }

    const fetchProject = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await projectService.getProjectBySlug(projectSlug, includes);
        setProject(data.project);
        if (data.channels) setChannels(data.channels);
        if (data.active_members) setActiveMembers(data.active_members);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch project');
        console.error('Error fetching project:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectSlug, includes?.join(',')]);

  return { project, channels, activeMembers, loading, error };
}