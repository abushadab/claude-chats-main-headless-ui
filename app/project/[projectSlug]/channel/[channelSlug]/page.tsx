"use client"

import { use, useEffect, useState } from "react"
import { SidebarProvider } from "@/components/ui/headless-sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { ChannelsSidebar } from "@/components/ChannelsSidebar"
import { ChatArea } from "@/components/ChatArea"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { useProjects } from "@/hooks/useProjects"
import { workspaceService, type WorkspaceResponse } from "@/services/workspace.service"
import { notFound, useRouter } from "next/navigation"
import type { Project } from "@/types/project.types"
import type { Channel } from "@/types/chat.types"
import { LoadingScreen } from "@/components/LoadingScreen"
import { shouldShowLoadingScreen } from "@/lib/settings"
import { Bell } from "lucide-react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Button } from "@/components/ui/headless-button"
import { ScrollArea } from "@/components/ui/headless-scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/headless-avatar"
import Image from "next/image"

interface PageProps {
  params: Promise<{
    projectSlug: string
    channelSlug: string
  }>
}

function ChannelPageContent({ projectSlug, channelSlug }: { projectSlug: string, channelSlug: string }) {
  const { projects } = useProjects() // For sidebar display and default redirect
  const router = useRouter()
  const [showNotifications, setShowNotifications] = useState(false)
  
  const [workspaceData, setWorkspaceData] = useState<WorkspaceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [previousWorkspaceData, setPreviousWorkspaceData] = useState<WorkspaceResponse | null>(() => {
    // Only use cached workspace data that matches the current project/channel
    const cacheKey = `workspace_${projectSlug}_${channelSlug}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.data) {
          return parsed.data;
        }
      }
    } catch (e) {
      // Error parsing cached data for this specific project/channel
    }
    return null;
  })

  // Save last visited project/channel to localStorage (only if respective caching is enabled)
  useEffect(() => {
    if (projectSlug && channelSlug) {
      // Import cache here to avoid SSR issues
      import('@/lib/cache').then(({ cache }) => {
        // Save project-related last visited info if projects cache is enabled
        if (cache.isProjectsCacheEnabled()) {
          localStorage.setItem('last_visited_project', projectSlug);
          localStorage.setItem('last_visited_url', `/project/${projectSlug}/channel/${channelSlug}`);
        }
        
        // Save channel-related last visited info if channels cache is enabled
        if (cache.isChannelsCacheEnabled()) {
          localStorage.setItem('last_visited_channel', channelSlug);
          
          // Save last visited channel for this specific project
          if (workspaceData?.project?.project_id) {
            localStorage.setItem(`last_channel_${workspaceData.project.project_id}`, channelSlug);
          } else if (projects) {
            // Try to find project from projects list
            const currentProject = projects.find(p => p.slug === projectSlug);
            if (currentProject?.project_id) {
              localStorage.setItem(`last_channel_${currentProject.project_id}`, channelSlug);
            }
          }
        }
      });
    }
  }, [projectSlug, channelSlug, workspaceData, projects]);

  // Handle "default" project redirect - only redirect if coming from home/root
  useEffect(() => {
    // Check if this is an intentional navigation to default project
    const referrer = typeof window !== 'undefined' ? document.referrer : '';
    const isDirectNavigation = referrer.includes('/project/'); // User clicked from another project
    
    if (projectSlug === 'default' && projects && projects.length > 0 && !isDirectNavigation) {
      // Only redirect if not coming from another project page (e.g., coming from home or login)
      const defaultProject = projects.find(p => p.slug === 'default');
      
      // Only redirect if there's no actual "default" project, or if coming from non-project page
      if (!defaultProject) {
        const nonDefaultProject = projects.find(p => p.slug !== 'default');
        if (nonDefaultProject) {
          const redirectUrl = `/project/${nonDefaultProject.slug}/channel/general`;
          router.replace(redirectUrl);
        }
      }
    }
  }, [projectSlug, projects, router]);
  
  // Fetch complete workspace data in one API call
  useEffect(() => {
    // First check if caching is enabled and for cached data
    const checkCacheAndFetch = async () => {
      const { cache } = await import('@/lib/cache');
      
      if (cache.isWorkspaceCacheEnabled()) {
        const cacheKey = `workspace_${projectSlug}_${channelSlug}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            // Check if cache is less than 5 minutes old
            if (parsed.timestamp && Date.now() - parsed.timestamp < 5 * 60 * 1000) {
              // Using cached workspace data
              setWorkspaceData(parsed.data);
              setLoading(false);
              // Don't clear previous data - keep it for smooth transitions
              return; // Don't fetch from API
            }
          } catch (e) {
            // Error parsing cached workspace data
          }
        }
      }
      
      // If caching is disabled or no cache found, proceed with API call
      fetchWorkspaceData();
    };
    
    checkCacheAndFetch();
  }, [projectSlug, channelSlug]);
  
  const fetchWorkspaceData = async () => {
    try {
      // Check if workspace caching is enabled BEFORE making the API call
      const { cache } = await import('@/lib/cache');
      
      if (!cache.isWorkspaceCacheEnabled()) {
        // Workspace caching is disabled - don't call workspace API
        // Let individual components fetch their own data (projects, channels, messages)
        setLoading(false);
        return;
      }
      
      // Save current data before loading new data
      if (workspaceData) {
        setPreviousWorkspaceData(workspaceData);
      }
      
      setLoading(true)
      
      // Wait a bit to ensure auth is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Single API call gets everything: project, channels, messages, members, etc.
      const data = await workspaceService.getWorkspace(projectSlug, channelSlug);
      
      // Cache the workspace data since caching is enabled
      const cacheKey = `workspace_${projectSlug}_${channelSlug}`;
      localStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      
      // Handle smart fallback from backend
      if (data.fallback_used) {
        // Channel fallback used
        // Update URL to reflect the actual channel being shown
        router.replace(`/project/${projectSlug}/channel/${data.current_channel.slug}`, { scroll: false });
      }
      
      setWorkspaceData(data);
      // Keep previous data for next transition
      setPreviousWorkspaceData(data);
    } catch (error) {
      notFound()
    } finally {
      setLoading(false)
    }
  };

  // Use either current workspace data or previous data while loading
  const displayData = workspaceData || previousWorkspaceData;
  
  // Only show loading screen on very first app load (no cached data anywhere)
  if (!displayData && shouldShowLoadingScreen()) {
    // Check if this is truly the first load (no cached projects at all)
    const hasCachedProjects = typeof window !== 'undefined' ? localStorage.getItem('claude_chat_cache_projects_light') : null;
    if (!hasCachedProjects) {
      return (
        <ProtectedRoute>
          <LoadingScreen />
        </ProtectedRoute>
      );
    }
  }

  // Create default data structure when no displayData but we want to show UI
  const defaultData = {
    project: { 
      project_id: 'loading', 
      name: 'Loading...', 
      slug: projectSlug,
      color: '#6b7280'
    },
    channels: [],
    current_channel: {
      channel_id: 'loading',
      name: channelSlug,
      slug: channelSlug,
      description: 'Loading...',
      type: 'text' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    active_members: [],
    stats: { members_online: 0, total_channels: 0, unread_total: 0 }
  };

  // Use displayData if available, otherwise try to build from cached data
  let dataToUse = displayData;
  
  if (!dataToUse && !shouldShowLoadingScreen()) {
    // Try to build workspace data from cached projects and channels
    try {
      if (typeof window !== 'undefined') {
        // Import cache synchronously on client side
        const { cache, CACHE_KEYS } = require('@/lib/cache');
        const projectsCacheKey = `${CACHE_KEYS.PROJECTS}_light`;
        const cachedProjects = cache.get<Project[]>(projectsCacheKey, 'projects');
        
        // Handle "default" project slug
        if (projectSlug === 'default') {
          // Don't try to load data for "default" project - will redirect in useEffect
          // Show loading state while redirect happens
          dataToUse = defaultData;
        }
        
        const project = cachedProjects?.find(p => p.slug === projectSlug);
        
        if (project) {
          // Get channels for this specific project
          const channelsCacheKey = `${CACHE_KEYS.CHANNELS_PREFIX}${project.project_id}`;
          const cachedChannels = cache.get<Channel[]>(channelsCacheKey, 'channels') || [];
          
          // Build workspace data from cached components
          dataToUse = {
            project,
            channels: cachedChannels,
            current_channel: cachedChannels.find(c => c.slug === channelSlug) || null,
            active_members: [],
            stats: { members_online: 0, total_channels: cachedChannels.length, unread_total: 0 }
          };
        }
      }
    } catch (error) {
      console.warn('Failed to load cached data:', error);
    }
    
    // Fall back to default data if cache loading failed
    if (!dataToUse) {
      dataToUse = defaultData;
    }
  }
  
  // If we have no data and loading screen is enabled, show loading screen
  if (!dataToUse) {
    return (
      <ProtectedRoute>
        <LoadingScreen />
      </ProtectedRoute>
    );
  }

  // Backend now guarantees all fields are present (or we provide defaults)
  const { 
    project, 
    channels = [], 
    active_members = [], // eslint-disable-line @typescript-eslint/no-unused-vars 
    stats = { members_online: 0, total_channels: 0, unread_total: 0 } 
  } = dataToUse;

  // Find the current channel from channels array
  let current_channel = dataToUse.current_channel;
  
  // If current_channel is null, try to find it from channels array
  if (!current_channel && channels.length > 0) {
    // Try to find by slug
    current_channel = channels.find(ch => ch.slug === channelSlug);
    
    // If not found by slug, try by name
    if (!current_channel) {
      current_channel = channels.find(ch => ch.name.toLowerCase().replace(/\s+/g, '-') === channelSlug);
    }
    
    // If still not found, use first channel
    if (!current_channel) {
      current_channel = channels[0];
      // Channel not found, using first available channel
    }
  }

  // Safety check for current_channel - create a placeholder if missing
  if (!current_channel) {
    // Create a placeholder channel while data loads
    current_channel = {
      channel_id: 'loading',
      name: channelSlug.replace(/-/g, ' '),
      slug: channelSlug,
      description: '',
      type: 'text' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  // Mock notifications (in a real app, these would come from the API)
  const notifications = [
    {
      id: '1',
      type: 'mention',
      title: 'Sarah Chen mentioned you',
      message: 'in #development channel',
      time: '2 minutes ago',
      read: false,
      avatar: 'SC'
    },
    {
      id: '2',
      type: 'project',
      title: 'New project created',
      message: 'LaunchDB project was created by Alex Rodriguez',
      time: '1 hour ago',
      read: false,
      avatar: 'AR'
    },
    {
      id: '3',
      type: 'message',
      title: 'New message',
      message: 'You have 3 unread messages in #general',
      time: '2 hours ago',
      read: true,
      avatar: null
    },
    {
      id: '4',
      type: 'system',
      title: 'System update',
      message: 'DevTeam Chat has been updated to version 2.1.0',
      time: '1 day ago',
      read: true,
      avatar: null
    }
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (notificationId: string) => {
    // Mark notification as read
  };

  const markAllAsRead = () => {
    // Mark all notifications as read
  };

  return (
    <div className="h-screen flex flex-col w-full bg-background overflow-hidden">
      {/* Full-width topbar */}
      <header className="h-14 flex items-center justify-between border-b border-border bg-background px-3 flex-shrink-0">
        {/* Left side - Logo */}
        <div className="flex items-center gap-3">
          <Image 
            src="/hudhud-logo.svg" 
            alt="Hudhud" 
            width={32}
            height={32}
            className="rounded-[6px] flex-shrink-0"
          />
          <span className="font-semibold text-lg">Hudhud</span>
        </div>
        
        {/* Right side - Online indicator and Notification bell */}
        <div className="flex items-center gap-4">
            {/* Active members indicator */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                {stats?.members_online || 0} online
              </span>
            </div>
            
            {/* Notification bell with popover */}
            <Popover open={showNotifications} onOpenChange={setShowNotifications}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 relative"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                  )}
                </Button>
              </PopoverTrigger>
              
              <PopoverContent className="w-80 p-0" align="end">
                <div className="space-y-1">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="font-medium text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="text-xs h-auto p-1 text-muted-foreground hover:text-foreground"
                      >
                        Mark all as read
                      </Button>
                    )}
                  </div>

                  {/* Notifications List */}
                  <ScrollArea className="max-h-96">
                    <div className="space-y-1 p-2">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 rounded-lg transition-colors cursor-pointer group ${
                            !notification.read 
                              ? 'bg-primary/5 hover:bg-primary/10' 
                              : 'hover:bg-accent'
                          }`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start space-x-3">
                            {notification.avatar ? (
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                  {notification.avatar}
                                </AvatarFallback>
                              </Avatar>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                <Bell className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-foreground">
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {notification.time}
                                  </p>
                                </div>
                                
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2"></div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {notifications.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No notifications</p>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>
        
        {/* Main content area below topbar */}
        <div className="flex flex-1 h-[calc(100vh-56px)] overflow-hidden">
          {/* Main sidebar with projects */}
          <AppSidebar 
            selectedProjectId={project.project_id}
            isLoading={false}
          />
          
          {/* Right side content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Channels sidebar with workspace data */}
            <ChannelsSidebar
              selectedProjectId={project.project_id}
              selectedChannelId={current_channel.channel_id}
              channels={workspaceData ? channels : undefined}
            />
            
            {/* Chat area with workspace data */}
            <ChatArea
              selectedProjectId={project.project_id}
              selectedChannelId={current_channel.channel_id}
              initialChannel={current_channel}
              initialProject={project}
            />
          </div>
        </div>
      </div>
  )
}

export default function ChannelPage({ params }: PageProps) {
  const { projectSlug, channelSlug } = use(params)

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <ChannelPageContent projectSlug={projectSlug} channelSlug={channelSlug} />
      </SidebarProvider>
    </ProtectedRoute>
  )
}