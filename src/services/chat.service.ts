/**
 * Chat Service
 * Handles all chat-related API calls for channels and messages
 */

import axiosInstance from '@/lib/axios';
import { config } from '@/config';
import type {
  Channel,
  Message,
  SendMessageData,
  GetMessagesParams,
  SearchMessagesParams,
  CreateChannelData,
  UpdateChannelData,
  ChannelMember,
  UnreadCount,
  ApiResponse,
} from '@/types';

class ChatService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${config.api.baseUrl}/chat`;
  }

  // =================== CHANNELS ===================

  /**
   * Get all channels for current user (optionally filtered by project)
   */
  async getChannels(projectId?: string): Promise<Channel[]> {
    try {
      const url = projectId 
        ? `${this.baseUrl}/channels?projectId=${projectId}`
        : `${this.baseUrl}/channels`;
        
      const response = await axiosInstance.get<{
        success: boolean;
        channels: Channel[];
        count: number;
        error?: { message: string; code: string; };
      }>(url);
      
      if (response.data.success) {
        return response.data.channels || [];
      }
      
      throw new Error(response.data.error?.message || 'Failed to fetch channels');
    } catch (error: any) {
      console.error('Error fetching channels:', error);
      throw new Error(error.message || 'Failed to fetch channels');
    }
  }

  /**
   * Get channel by ID
   */
  async getChannel(channelId: string): Promise<Channel> {
    try {
      const response = await axiosInstance.get<ApiResponse<{ channel: Channel }>>(
        `${this.baseUrl}/channels/${channelId}`
      );
      
      if (response.data.success && response.data.data?.channel) {
        return response.data.data.channel;
      }
      
      throw new Error(response.data.error?.message || 'Channel not found');
    } catch (error: any) {
      console.error('Error fetching channel:', error);
      throw new Error(error.message || 'Failed to fetch channel');
    }
  }

  /**
   * Create new channel
   */
  async createChannel(data: CreateChannelData): Promise<Channel> {
    try {
      const response = await axiosInstance.post<ApiResponse<{ channel: Channel }>>(
        `${this.baseUrl}/channels`,
        {
          name: data.name,
          description: data.description,
          isPrivate: data.isPrivate || false,
        }
      );
      
      if (response.data.success && response.data.data?.channel) {
        return response.data.data.channel;
      }
      
      throw new Error(response.data.error?.message || 'Failed to create channel');
    } catch (error: any) {
      console.error('Error creating channel:', error);
      throw new Error(error.message || 'Failed to create channel');
    }
  }

  /**
   * Update channel
   */
  async updateChannel(channelId: string, data: UpdateChannelData): Promise<Channel> {
    try {
      const response = await axiosInstance.put<ApiResponse<{ channel: Channel }>>(
        `${this.baseUrl}/channels/${channelId}`,
        data
      );
      
      if (response.data.success && response.data.data?.channel) {
        return response.data.data.channel;
      }
      
      throw new Error(response.data.error?.message || 'Failed to update channel');
    } catch (error: any) {
      console.error('Error updating channel:', error);
      throw new Error(error.message || 'Failed to update channel');
    }
  }

  /**
   * Delete channel
   */
  async deleteChannel(channelId: string): Promise<void> {
    try {
      const response = await axiosInstance.delete<ApiResponse>(
        `${this.baseUrl}/channels/${channelId}`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to delete channel');
      }
    } catch (error: any) {
      console.error('Error deleting channel:', error);
      throw new Error(error.message || 'Failed to delete channel');
    }
  }

  /**
   * Join channel
   */
  async joinChannel(channelId: string): Promise<void> {
    try {
      const response = await axiosInstance.post<ApiResponse>(
        `${this.baseUrl}/channels/${channelId}/join`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to join channel');
      }
    } catch (error: any) {
      console.error('Error joining channel:', error);
      throw new Error(error.message || 'Failed to join channel');
    }
  }

  /**
   * Leave channel
   */
  async leaveChannel(channelId: string): Promise<void> {
    try {
      const response = await axiosInstance.post<ApiResponse>(
        `${this.baseUrl}/channels/${channelId}/leave`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to leave channel');
      }
    } catch (error: any) {
      console.error('Error leaving channel:', error);
      throw new Error(error.message || 'Failed to leave channel');
    }
  }

  /**
   * Get channel members
   */
  async getChannelMembers(channelId: string): Promise<ChannelMember[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<{ members: ChannelMember[] }>>(
        `${this.baseUrl}/channels/${channelId}/members`
      );
      
      if (response.data.success) {
        return response.data.data?.members || [];
      }
      
      throw new Error(response.data.error?.message || 'Failed to fetch members');
    } catch (error: any) {
      console.error('Error fetching channel members:', error);
      throw new Error(error.message || 'Failed to fetch channel members');
    }
  }

  // =================== MESSAGES ===================

  /**
   * Get messages with pagination (optimized API)
   */
  async getMessages(params: GetMessagesParams = {}): Promise<{
    messages: Message[];
    count: number;
    hasMore?: boolean;
    oldestMessageId?: string;
  }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.channelId) queryParams.append('channelId', params.channelId);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.before) queryParams.append('before', params.before);
      if (params.after) queryParams.append('after', params.after);

      const url = `${this.baseUrl}/messages?${queryParams.toString()}`;
      console.log('🔄 Fetching messages from:', url);
      
      const response = await axiosInstance.get<{
        success: boolean;
        messages: Message[];
        count: number;
        hasMore?: boolean;
        has_more?: boolean;
        oldestMessageId?: string;
        oldest_message_id?: string;
        error?: { message: string; code: string; };
      }>(url);
      
      console.log('📥 Messages API response:', response.data);
      
      if (response.data.success) {
        return {
          messages: response.data.messages || [],
          count: response.data.count || 0,
          hasMore: response.data.hasMore || response.data.has_more,
          oldestMessageId: response.data.oldestMessageId || response.data.oldest_message_id,
        };
      }
      
      throw new Error(response.data.error?.message || 'Failed to fetch messages');
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      throw new Error(error.message || 'Failed to fetch messages');
    }
  }

  /**
   * Get messages by channel slug (new optimized endpoint)
   */
  async getMessagesBySlug(channelSlug: string, params: {
    limit?: number;
    before?: string;
    projectSlug?: string;
  } = {}): Promise<{
    messages: Message[];
    hasMore: boolean;
    oldestMessageId?: string;
  }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.before) queryParams.append('before', params.before);
      if (params.projectSlug) queryParams.append('projectSlug', params.projectSlug);

      const url = `${this.baseUrl}/channels/${channelSlug}/messages?${queryParams.toString()}`;
      console.log('🔄 Fetching messages from optimized endpoint:', url);
      
      const response = await axiosInstance.get<{
        messages: Message[];
        has_more: boolean;
        oldest_message_id?: string;
      }>(url);
      
      console.log('📥 Optimized messages API response:', response.data);
      
      return {
        messages: response.data.messages || [],
        hasMore: response.data.has_more || false,
        oldestMessageId: response.data.oldest_message_id,
      };
    } catch (error: any) {
      console.error('Error fetching messages by slug:', error);
      throw new Error(error.message || 'Failed to fetch messages');
    }
  }

  /**
   * Send message
   */
  async sendMessage(data: SendMessageData): Promise<Message> {
    try {
      const response = await axiosInstance.post<ApiResponse<{ message: Message }>>(
        `${this.baseUrl}/messages`,
        {
          content: data.content,
          channelId: data.channelId,
          type: data.type || 'text',
          metadata: data.metadata || {},
          parentMessageId: data.parentMessageId,
        }
      );
      
      if (response.data.success && response.data.data?.message) {
        return response.data.data.message;
      }
      
      throw new Error(response.data.error?.message || 'Failed to send message');
    } catch (error: any) {
      console.error('Error sending message:', error);
      throw new Error(error.message || 'Failed to send message');
    }
  }

  /**
   * Edit message
   */
  async editMessage(messageId: string, content: string): Promise<Message> {
    try {
      const response = await axiosInstance.put<ApiResponse<{ message: Message }>>(
        `${this.baseUrl}/messages/${messageId}`,
        { content }
      );
      
      if (response.data.success && response.data.data?.message) {
        return response.data.data.message;
      }
      
      throw new Error(response.data.error?.message || 'Failed to edit message');
    } catch (error: any) {
      console.error('Error editing message:', error);
      throw new Error(error.message || 'Failed to edit message');
    }
  }

  /**
   * Delete message
   */
  async deleteMessage(messageId: string): Promise<void> {
    try {
      const response = await axiosInstance.delete<ApiResponse>(
        `${this.baseUrl}/messages/${messageId}`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to delete message');
      }
    } catch (error: any) {
      console.error('Error deleting message:', error);
      throw new Error(error.message || 'Failed to delete message');
    }
  }

  /**
   * Search messages
   */
  async searchMessages(params: SearchMessagesParams): Promise<{
    messages: Message[];
    count: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      
      queryParams.append('q', params.q);
      if (params.channelId) queryParams.append('channelId', params.channelId);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.userId) queryParams.append('userId', params.userId);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);

      const response = await axiosInstance.get<ApiResponse<{
        messages: Message[];
        count: number;
      }>>(`${this.baseUrl}/messages/search?${queryParams.toString()}`);
      
      if (response.data.success && response.data.data) {
        return {
          messages: response.data.data.messages || [],
          count: response.data.data.count || 0,
        };
      }
      
      throw new Error(response.data.error?.message || 'Failed to search messages');
    } catch (error: any) {
      console.error('Error searching messages:', error);
      throw new Error(error.message || 'Failed to search messages');
    }
  }

  /**
   * Mark messages as read
   */
  async markAsRead(messageIds: string[]): Promise<void> {
    try {
      const response = await axiosInstance.post<ApiResponse>(
        `${this.baseUrl}/messages/read`,
        { messageIds }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to mark as read');
      }
    } catch (error: any) {
      console.error('Error marking messages as read:', error);
      throw new Error(error.message || 'Failed to mark messages as read');
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<UnreadCount> {
    try {
      const response = await axiosInstance.get<ApiResponse<UnreadCount>>(
        `${this.baseUrl}/messages/unread/count`
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.error?.message || 'Failed to fetch unread count');
    } catch (error: any) {
      console.error('Error fetching unread count:', error);
      throw new Error(error.message || 'Failed to fetch unread count');
    }
  }

  /**
   * Send typing indicator
   */
  async sendTyping(channelId: string): Promise<void> {
    try {
      const response = await axiosInstance.post<ApiResponse>(
        `${this.baseUrl}/typing`,
        { channelId }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to send typing indicator');
      }
    } catch (error: any) {
      console.error('Error sending typing indicator:', error);
      // Don't throw for typing indicators - they're not critical
    }
  }

  // =================== REACTIONS ===================

  /**
   * Add reaction to message
   */
  async addReaction(messageId: string, emoji: string): Promise<void> {
    try {
      const response = await axiosInstance.post<ApiResponse>(
        `${this.baseUrl}/messages/${messageId}/reactions`,
        { emoji }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to add reaction');
      }
    } catch (error: any) {
      console.error('Error adding reaction:', error);
      throw new Error(error.message || 'Failed to add reaction');
    }
  }

  /**
   * Remove reaction from message
   */
  async removeReaction(messageId: string, emoji: string): Promise<void> {
    try {
      const response = await axiosInstance.delete<ApiResponse>(
        `${this.baseUrl}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to remove reaction');
      }
    } catch (error: any) {
      console.error('Error removing reaction:', error);
      throw new Error(error.message || 'Failed to remove reaction');
    }
  }

  /**
   * Get message reactions
   */
  async getReactions(messageId: string) {
    try {
      const response = await axiosInstance.get<ApiResponse<{
        reactions: Array<{
          emoji: string;
          count: number;
          users: Array<{
            userId: string;
            username: string;
            createdAt: string;
          }>;
        }>;
      }>>(`${this.baseUrl}/messages/${messageId}/reactions`);
      
      if (response.data.success && response.data.data) {
        return response.data.data.reactions || [];
      }
      
      throw new Error(response.data.error?.message || 'Failed to fetch reactions');
    } catch (error: any) {
      console.error('Error fetching reactions:', error);
      throw new Error(error.message || 'Failed to fetch reactions');
    }
  }

  // =================== THREADS ===================

  /**
   * Get thread replies
   */
  async getThreadReplies(messageId: string, limit = 50): Promise<Message[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<{
        messages: Message[];
      }>>(`${this.baseUrl}/messages/${messageId}/replies?limit=${limit}`);
      
      if (response.data.success && response.data.data) {
        return response.data.data.messages || [];
      }
      
      throw new Error(response.data.error?.message || 'Failed to fetch thread replies');
    } catch (error: any) {
      console.error('Error fetching thread replies:', error);
      throw new Error(error.message || 'Failed to fetch thread replies');
    }
  }

  /**
   * Send thread reply
   */
  async sendThreadReply(messageId: string, content: string): Promise<Message> {
    try {
      const response = await axiosInstance.post<ApiResponse<{ message: Message }>>(
        `${this.baseUrl}/messages/${messageId}/replies`,
        {
          content,
          type: 'text',
        }
      );
      
      if (response.data.success && response.data.data?.message) {
        return response.data.data.message;
      }
      
      throw new Error(response.data.error?.message || 'Failed to send thread reply');
    } catch (error: any) {
      console.error('Error sending thread reply:', error);
      throw new Error(error.message || 'Failed to send thread reply');
    }
  }
}

// Export singleton instance
export const chatService = new ChatService();
export default chatService;