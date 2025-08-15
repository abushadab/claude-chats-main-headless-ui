/**
 * Workspace Service
 * Handles the new composite workspace API that gets everything in one call
 */

import axios from '@/lib/axios';
import { config } from '@/config';
import type { Project, Channel, Message, ActiveMember, User } from '@/types';

export interface WorkspaceResponse {
  success: boolean;
  project: Project;
  current_channel: Channel;
  channels: Channel[];
  messages: Message[];
  messages_included?: boolean;
  active_members: ActiveMember[];
  typing_users: Array<{
    user_id: string;
    user: User;
    is_typing: boolean;
  }>;
  stats: {
    total_channels: number;
    unread_total: number;
    members_online: number;
  };
  pagination?: {
    has_more: boolean;
    oldest_message_id: string;
    newest_message_id: string;
  };
  fallback_used?: boolean;
  requested_channel?: string;
  fallback_reason?: string;
}

export interface WorkspaceOptions {
  limit?: number;
  before?: string;
  after?: string;
  include_messages?: boolean;
}

class WorkspaceService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${config.api.baseUrl}/workspace`;
  }

  /**
   * Get complete workspace data in one API call
   */
  async getWorkspace(
    projectSlug: string, 
    channelSlug: string, 
    options?: WorkspaceOptions
  ): Promise<WorkspaceResponse> {
    try {
      const params = new URLSearchParams();
      if (options?.include_messages) params.set('include_messages', 'true');
      if (options?.limit) params.set('limit', options.limit.toString());
      if (options?.before) params.set('before', options.before);
      if (options?.after) params.set('after', options.after);

      const url = `${this.baseUrl}/${projectSlug}/${channelSlug}${params.toString() ? '?' + params.toString() : ''}`;
      
      const response = await axios.get<WorkspaceResponse>(url);
      
      if (response.data.success) {
        return response.data;
      }
      
      throw new Error('Failed to fetch workspace data');
    } catch (error: any) {
      console.error('Error fetching workspace:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch workspace');
    }
  }

  /**
   * Get older messages for pagination
   */
  async getOlderMessages(
    projectSlug: string,
    channelSlug: string,
    beforeMessageId: string,
    limit: number = 50
  ): Promise<WorkspaceResponse> {
    return this.getWorkspace(projectSlug, channelSlug, {
      before: beforeMessageId,
      limit
    });
  }

  /**
   * Get newer messages for pagination
   */
  async getNewerMessages(
    projectSlug: string,
    channelSlug: string,
    afterMessageId: string,
    limit: number = 50
  ): Promise<WorkspaceResponse> {
    return this.getWorkspace(projectSlug, channelSlug, {
      after: afterMessageId,
      limit
    });
  }
}

// Export singleton instance
export const workspaceService = new WorkspaceService();
export default workspaceService;