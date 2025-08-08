export interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice';
  isPrivate?: boolean;
  unread?: number;
  activeUsers?: number;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  members: number;
  channels: Channel[];
}


export interface Message {
  id: string;
  content: string;
  author: {
    name: string;
    avatar: string;
    type: 'current_user' | 'human' | 'ai-agent' | 'system';
    subType?: 'claude' | 'gemini' | 'openai';
  };
  timestamp: string;
  channelId: string;
  image?: string;
  systemMessageType?: 'user_joined' | 'user_left' | 'user_removed' | 'user_added' | 'channel_created' | 'role_changed';
}

export interface RecentUser {
  id: string;
  name: string;
  status: 'online' | 'away' | 'offline';
  avatar: string;
  type: 'current_user' | 'human' | 'ai-agent';
  subType?: 'claude' | 'gemini' | 'openai';
}

export const mockProjects: Project[] = [
  {
    id: '1',
    name: 'LaunchDB',
    color: 'bg-blue-500',
    members: 12,
    channels: [
      { id: 'c1', name: 'general', type: 'text', unread: 3 },
      { id: 'c2', name: 'development', type: 'text', unread: 1 },
      { id: 'c3', name: 'design-review', type: 'text' },
      { id: 'c4', name: 'bugs', type: 'text' },
    ],
  },
  {
    id: '2',
    name: 'Wisdom Network',
    color: 'bg-purple-500',
    members: 8,
    channels: [
      { id: 'c6', name: 'general', type: 'text' },
      { id: 'c7', name: 'api-development', type: 'text', unread: 2 },
      { id: 'c8', name: 'database', type: 'text' },
      { id: 'c9', name: 'infrastructure', type: 'text' },
    ],
  },
  {
    id: '3',
    name: 'Data Pipeline',
    color: 'bg-green-500',
    members: 15,
    channels: [
      { id: 'c10', name: 'general', type: 'text' },
      { id: 'c11', name: 'etl-processes', type: 'text' },
      { id: 'c12', name: 'monitoring', type: 'text' },
    ],
  },
  {
    id: '4',
    name: 'Mobile App',
    color: 'bg-orange-500',
    members: 10,
    channels: [
      { id: 'c13', name: 'general', type: 'text' },
      { id: 'c14', name: 'ios-dev', type: 'text' },
      { id: 'c15', name: 'android-dev', type: 'text' },
    ],
  },
  {
    id: '5',
    name: 'Analytics Hub',
    color: 'bg-pink-500',
    members: 6,
    channels: [
      { id: 'c16', name: 'general', type: 'text' },
      { id: 'c17', name: 'dashboards', type: 'text' },
      { id: 'c18', name: 'reports', type: 'text' },
    ],
  },
];

export const mockRecentUsers: RecentUser[] = [
  { id: 'u1', name: 'Sarah Chen', status: 'online', avatar: 'SC', type: 'human' },
  { id: 'u2', name: 'Alex Rodriguez', status: 'away', avatar: 'AR', type: 'human' },
  { id: 'u3', name: 'Mike Johnson', status: 'online', avatar: 'MJ', type: 'human' },
  { id: 'u4', name: 'Emma Davis', status: 'offline', avatar: 'ED', type: 'human' },
  { id: 'u5', name: 'Monitoring Agent', status: 'online', avatar: 'MA', type: 'ai-agent', subType: 'claude' },
];

export const mockMessages: Message[] = [
  // System messages for general channel (c1)
  {
    id: 'sys-c1-1',
    content: 'created this channel',
    author: {
      name: 'Abu Shadab',
      avatar: 'AS',
      type: 'system',
    },
    timestamp: 'Jan 10, 2024',
    channelId: 'c1',
    systemMessageType: 'channel_created',
  },
  {
    id: 'sys-c1-2',
    content: 'joined the channel',
    author: {
      name: 'Sarah Chen',
      avatar: 'SC',
      type: 'system',
    },
    timestamp: 'Jan 11, 2024',
    channelId: 'c1',
    systemMessageType: 'user_joined',
  },
  {
    id: 'sys-c1-3',
    content: 'joined the channel',
    author: {
      name: 'Alex Rodriguez',
      avatar: 'AR',
      type: 'system',
    },
    timestamp: 'Jan 12, 2024',
    channelId: 'c1',
    systemMessageType: 'user_joined',
  },
  {
    id: 'sys-c1-4',
    content: 'added Claude Assistant to the channel',
    author: {
      name: 'Abu Shadab',
      avatar: 'AS',
      type: 'system',
    },
    timestamp: 'Jan 13, 2024',
    channelId: 'c1',
    systemMessageType: 'user_added',
  },
  {
    id: 'sys-c1-5',
    content: 'was promoted to admin',
    author: {
      name: 'Sarah Chen',
      avatar: 'SC',
      type: 'system',
    },
    timestamp: '8:30 AM',
    channelId: 'c1',
    systemMessageType: 'role_changed',
  },
  // System message - channel created for development (c2)
  {
    id: 'sys1',
    content: 'created this channel',
    author: {
      name: 'Abu Shadab',
      avatar: 'AS',
      type: 'system',
    },
    timestamp: 'Jan 15, 2024',
    channelId: 'c2',
    systemMessageType: 'channel_created',
  },
  // System message - user joined
  {
    id: 'sys2',
    content: 'joined the channel',
    author: {
      name: 'Sarah Chen',
      avatar: 'SC',
      type: 'system',
    },
    timestamp: 'Jan 16, 2024',
    channelId: 'c2',
    systemMessageType: 'user_joined',
  },
  // System message - AI agent added
  {
    id: 'sys3',
    content: 'added Monitoring Agent to the channel',
    author: {
      name: 'Abu Shadab',
      avatar: 'AS',
      type: 'system',
    },
    timestamp: 'Jan 17, 2024',
    channelId: 'c2',
    systemMessageType: 'user_added',
  },
  {
    id: 'm1',
    content: "Hey team! I've finished implementing the new authentication flow. Can someone review the PR?",
    author: {
      name: 'Sarah Chen',
      avatar: 'SC',
      type: 'human',
    },
    timestamp: '9:42 AM',
    channelId: 'c2',
  },
  {
    id: 'm2',
    content: "I can take a look at the PR. I'll analyze the security patterns and provide feedback on the implementation.",
    author: {
      name: 'Monitoring Agent',
      avatar: 'MA',
      type: 'ai-agent',
      subType: 'claude',
    },
    timestamp: '9:43 AM',
    channelId: 'c2',
  },
  {
    id: 'm3',
    content: "Thanks Claude! Also, I noticed some performance issues with the login endpoint. The response time is around 2.5 seconds.",
    author: {
      name: 'Sarah Chen',
      avatar: 'SC',
      type: 'human',
    },
    timestamp: '9:45 AM',
    channelId: 'c2',
  },
  {
    id: 'm4',
    content: "That's definitely too slow for a good user experience. Let me analyze the authentication flow. Common bottlenecks include:\n\n• Database query optimization\n• Token generation complexity\n• External API calls\n• Middleware overhead\n\nCould you share the current implementation details?",
    author: {
      name: 'Monitoring Agent',
      avatar: 'MA',
      type: 'ai-agent',
      subType: 'claude',
    },
    timestamp: '9:46 AM',
    channelId: 'c2',
  },
  {
    id: 'm4b',
    content: "I can share the authentication implementation. The main bottleneck is in the JWT validation process. We're making multiple database calls for each request.",
    author: {
      name: 'Abu Shadab',
      avatar: 'AS',
      type: 'current_user',
    },
    timestamp: '9:47 AM',
    channelId: 'c2',
  },
  {
    id: 'm4c',
    content: "Let me optimize that for you. I'll implement caching for the JWT validation and reduce the database calls to a single query.",
    author: {
      name: 'Monitoring Agent',
      avatar: 'MA',
      type: 'ai-agent',
      subType: 'claude',
    },
    timestamp: '9:48 AM',
    channelId: 'c2',
  },
  {
    id: 'm4d',
    content: "Here's a screenshot of the performance metrics after the optimization:",
    author: {
      name: 'Sarah Chen',
      avatar: 'SC',
      type: 'human',
    },
    timestamp: '9:50 AM',
    channelId: 'c2',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
  },
  {
    id: 'm4e',
    content: "Great results! The response time improvement is exactly what we needed. Check out this dashboard view:",
    author: {
      name: 'Mike Johnson',
      avatar: 'MJ',
      type: 'human',
    },
    timestamp: '9:52 AM',
    channelId: 'c2',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
  },
  // Messages for general channel (c1)
  {
    id: 'm5',
    content: "Good morning everyone! 🌅 Ready for another day of shipping code?",
    author: {
      name: 'Alex Rodriguez',
      avatar: 'AR',
      type: 'human',
    },
    timestamp: '9:47 AM',
    channelId: 'c1',
  },
  {
    id: 'm6',
    content: "Morning Alex! I'm excited to work on the new feature dashboard today. The designs look fantastic!",
    author: {
      name: 'Monitoring Agent',
      avatar: 'MA',
      type: 'ai-agent',
      subType: 'claude',
    },
    timestamp: '9:48 AM',
    channelId: 'c1',
  },
  {
    id: 'sys-c1-6',
    content: 'joined the channel',
    author: {
      name: 'Emily Johnson',
      avatar: 'EJ',
      type: 'system',
    },
    timestamp: '9:49 AM',
    channelId: 'c1',
    systemMessageType: 'user_joined',
  },
  {
    id: 'm7a',
    content: "Welcome to the team Emily! Great to have you onboard.",
    author: {
      name: 'Abu Shadab',
      avatar: 'AS',
      type: 'current_user',
    },
    timestamp: '9:50 AM',
    channelId: 'c1',
  },
  {
    id: 'm8a',
    content: "Thanks everyone! Excited to be here and contribute to the project.",
    author: {
      name: 'Emily Johnson',
      avatar: 'EJ',
      type: 'human',
    },
    timestamp: '9:51 AM',
    channelId: 'c1',
  },
  {
    id: 'sys-c1-7',
    content: 'left the channel',
    author: {
      name: 'Michael Park',
      avatar: 'MP',
      type: 'system',
    },
    timestamp: '10:15 AM',
    channelId: 'c1',
    systemMessageType: 'user_left',
  },
  {
    id: 'sys-c1-8',
    content: 'was removed from the channel',
    author: {
      name: 'John Smith',
      avatar: 'JS',
      type: 'system',
    },
    timestamp: '10:30 AM',
    channelId: 'c1',
    systemMessageType: 'user_removed',
  },
  {
    id: 'm9a',
    content: "Let's focus on the sprint goals for this week. We have some important deliverables.",
    author: {
      name: 'Sarah Chen',
      avatar: 'SC',
      type: 'human',
    },
    timestamp: '10:45 AM',
    channelId: 'c1',
  },
  {
    id: 'm7',
    content: "I've been monitoring our deployment metrics and everything looks healthy. The new caching layer is performing excellently - 40% reduction in API response times! 🚀",
    author: {
      name: 'DevOps Agent',
      avatar: 'DA',
      type: 'ai-agent',
    },
    timestamp: '9:50 AM',
    channelId: 'c7',
  },
];