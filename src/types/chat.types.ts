/**
 * Chat related types
 */

import { User } from './auth.types';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  SYSTEM = 'system',
  AGENT = 'agent',
}

export enum ChannelType {
  PUBLIC = 'public',
  PRIVATE = 'private',
  DIRECT = 'direct',
}

export interface Channel {
  channel_id: string;
  name: string;
  slug: string;              // URL-friendly slug for routing
  description?: string;
  project_id: string;        // UUID linking to project
  project_name: string;      // "Wisdom Network" (joined from projects table)
  project_slug: string;      // "wisdom-network" (for URLs)
  is_private: boolean;
  owner_id?: string;         // Can be null
  created_at: string;
  created_by?: string;       // Who created the channel
  user_role?: string;        // User's role in this channel (can be null)
  joined_at?: string;        // When user joined (can be null)
  member_count: string;      // Note: API returns this as string, not number
  unread_count?: number;
  last_message?: {           // Preview of last message
    message_id: string;
    content: string;
    from_agent?: string;
    user_id?: string;
    username?: string;
    created_at: string;
  };
  is_member?: boolean;
  last_message_at?: string;  // Last activity timestamp
  
  // Derived field for compatibility
  type?: ChannelType;        // We'll derive this from is_private
}

export interface Message {
  message_id: string;
  content: string;
  user_id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  user?: User;
  channel_id: string;
  parent_message_id?: string;
  type: MessageType;
  metadata?: Record<string, any>;
  created_at: string;
  edited_at?: string;
  deleted_at?: string;
  thread_count?: number;
  reactions?: MessageReaction[];
  files?: FileAttachment[];
  is_read?: boolean;
  from_agent?: string;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: ReactionUser[];
  has_reacted?: boolean;
}

export interface ReactionUser {
  userId: string;
  username: string;
  createdAt: string;
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  mimetype: string;
  thumbnail_url?: string;
}

export interface ChannelMember {
  user_id: string;
  channel_id: string;
  role: 'member' | 'moderator' | 'admin';
  joined_at: string;
  user?: User;
}

export interface TypingIndicator {
  userId: string;
  username: string;
  channelId: string;
  isTyping: boolean;
}

export interface SendMessageData {
  content: string;
  channelId: string;
  type?: MessageType;
  metadata?: Record<string, any>;
  parentMessageId?: string;
  files?: string[];
}

export interface SearchMessagesParams {
  q: string;
  channelId?: string;
  limit?: number;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export interface GetMessagesParams {
  channelId?: string;
  limit?: number;
  before?: string;
  after?: string;
}

export interface CreateChannelData {
  name: string;
  description?: string;
  isPrivate?: boolean;
  memberIds?: string[];
}

export interface UpdateChannelData {
  name?: string;
  description?: string;
  isPrivate?: boolean;
}

export interface UnreadCount {
  total: number;
  channels: {
    [channelId: string]: number;
  };
}

export interface PresenceUpdate {
  userId: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen?: string;
}