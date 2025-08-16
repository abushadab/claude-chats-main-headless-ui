/**
 * Project related types
 */

export interface Project {
  project_id: string;        // UUID
  name: string;              // "LaunchDB"
  description?: string;      // Project description
  slug: string;              // "launchdb" (URL-friendly)
  owner_id: string;          // Project owner UUID
  avatar_url?: string;       // Project avatar
  is_active: boolean;        // Soft delete support
  settings: object;          // Project settings (JSON)
  created_at: string;        // ISO timestamp
  updated_at: string;        // ISO timestamp
  created_by?: string;       // Who created the project
  metadata: object;          // Additional metadata

  // Computed fields from API response
  member_count: number;      // Number of members
  channel_count: number;     // Number of channels
  is_member: boolean;        // Current user's membership
  user_role: string;         // Current user's role (member/moderator/admin)
  joined_at: string;         // When current user joined
  
  // Owner information
  owner_username: string;    // Owner's username
  owner_name: string;        // Owner's full name
  owner_avatar?: string;     // Owner's avatar
  
  // New fields from optimized API
  color?: string;            // UI theme color for project (hex format)
  unread_count?: number;     // Total unread messages in project (now a number, not string)
  last_activity?: string;    // Last activity timestamp for sorting
}

export interface ActiveMember {
  user_id: string;
  username: string;
  full_name: string;
  email?: string;
  avatar_url?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  last_seen?: string;
}

export interface ProjectMember {
  user_id: string;
  project_id: string;
  role: 'member' | 'moderator' | 'admin';
  joined_at: string;
  invited_by?: string;         // UUID of user who invited this member
  invited_by_username?: string; // Username of inviter
  status?: 'online' | 'offline' | 'away' | 'busy';
  last_seen?: string;
  user?: {
    user_id: string;
    username: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface CreateProjectData {
  name: string;
  description?: string;
  slug?: string; // Optional, auto-generated if not provided
  color?: string; // Optional hex color, random color assigned if not provided
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  slug?: string;
  settings?: object;
}

export interface ProjectSettings {
  [key: string]: any; // Flexible settings object
}