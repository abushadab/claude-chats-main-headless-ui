"use client"

import { use, useEffect, useState, useRef, useCallback, useMemo } from "react"
import { SidebarProvider } from "@/components/ui/headless-sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { ChannelsSidebar } from "@/components/ChannelsSidebar"
import { ChatArea } from "@/components/ChatArea"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { useProjects } from "@/hooks/useProjects"
import { useProjectMembers } from "@/hooks/useProjectMembers"
import { useWebSocket } from "@/contexts/WebSocketContext"
import { workspaceService, type WorkspaceResponse } from "@/services/workspace.service"
import { logger } from "@/lib/logger"
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
  // Debug: Track renders
  const renderCount = useRef(0);
  renderCount.current += 1;
  
  const { projects } = useProjects() // For sidebar display and default redirect
  const router = useRouter()
  const [showNotifications, setShowNotifications] = useState(false)
  const { onlineCount, isConnected, connectionStatus } = useWebSocket()
  
  const [workspaceData, setWorkspaceData] = useState<WorkspaceResponse | null>(null)
  const workspaceDataRef = useRef<WorkspaceResponse | null>(null)
  workspaceDataRef.current = workspaceData // Keep ref in sync
  const [, setLoading] = useState(true) // Used for loading state management

  // Track if this is the initial page load
  const [isInitialLoad, setIsInitialLoad] = useState(() => {
    if (typeof window !== 'undefined') {
      // Check if we've already loaded during this session
      const hasLoadedBefore = sessionStorage.getItem('claude_chat_initial_load_complete');
      return !hasLoadedBefore;
    }
    return true;
  });

  // Mark initial load as complete once we have data
  useEffect(() => {
    if (workspaceData && isInitialLoad) {
      sessionStorage.setItem('claude_chat_initial_load_complete', 'true');
      setIsInitialLoad(false);
    }
  }, [workspaceData, isInitialLoad]);

  // Save last visited project/channel to localStorage (only if projects caching is enabled)
  useEffect(() => {
    if (projectSlug && channelSlug) {
      // Import cache here to avoid SSR issues
      import('@/lib/cache').then(({ cache }) => {
        // Save all navigation state when projects cache is enabled
        // (channel navigation is part of project navigation state)
        if (cache.isProjectsCacheEnabled()) {
          localStorage.setItem('last_visited_project', projectSlug);
          localStorage.setItem('last_visited_channel', channelSlug);
          localStorage.setItem('last_visited_url', `/project/${projectSlug}/channel/${channelSlug}`);
        }
      });
    }
  }, [projectSlug, channelSlug]);
  
  // Save last visited channel for specific project when we have the project ID
  useEffect(() => {
    if (workspaceData?.project?.project_id && channelSlug) {
      import('@/lib/cache').then(({ cache }) => {
        if (cache.isProjectsCacheEnabled()) {
          localStorage.setItem(`last_channel_${workspaceData.project.project_id}`, channelSlug);
        }
      });
    }
  }, [workspaceData?.project?.project_id, channelSlug]);

  // Handle "default" project redirect - TEMPORARILY DISABLED TO DEBUG
  // useEffect(() => {
  //   // Only run this effect once when projectSlug changes to 'default'
  //   if (projectSlug !== 'default') return;
  //   
  //   // Use a small delay to ensure projects are loaded
  //   const timer = setTimeout(() => {
  //     if (projects && projects.length > 0) {
  //       // Check if this is an intentional navigation to default project
  //       const referrer = typeof window !== 'undefined' ? document.referrer : '';
  //       const isDirectNavigation = referrer.includes('/project/'); // User clicked from another project
  //       
  //       if (!isDirectNavigation) {
  //         // Only redirect if not coming from another project page (e.g., coming from home or login)
  //         const defaultProject = projects.find(p => p.slug === 'default');
  //         
  //         // Only redirect if there's no actual "default" project
  //         if (!defaultProject) {
  //           const nonDefaultProject = projects.find(p => p.slug !== 'default');
  //           if (nonDefaultProject) {
  //             const redirectUrl = `/project/${nonDefaultProject.slug}/channel/general`;
  //             router.replace(redirectUrl);
  //           }
  //         }
  //       }
  //     }
  //   }, 100);
  //   
  //   return () => clearTimeout(timer);
  // }, [projectSlug]); // Only depend on projectSlug changing
  
  // Fetch complete workspace data in one API call
  useEffect(() => {
    let isCancelled = false; // Prevent race conditions
    
    // First check if caching is enabled and for cached data
    const checkCacheAndFetch = async () => {
      if (isCancelled) return;
      const { cache, CACHE_KEYS } = await import('@/lib/cache');
      
      if (cache.isWorkspaceCacheEnabled()) {
        const cacheKey = `${CACHE_KEYS.WORKSPACE_PREFIX}${projectSlug}_${channelSlug}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            // Check if cache is less than 5 minutes old
            if (parsed.timestamp && Date.now() - parsed.timestamp < 5 * 60 * 1000) {
              // Using cached workspace data
              if (!isCancelled) {
                setWorkspaceData(parsed.data);
                setLoading(false);
                
                // Also ensure channels are cached separately for useChannels hook
                if (cache.isChannelsCacheEnabled() && parsed.data.channels && parsed.data.project?.project_id) {
                  const channelsCacheKey = `${CACHE_KEYS.CHANNELS_PREFIX}${parsed.data.project.project_id}`;
                  // Check if channels cache already exists
                  if (!cache.has(channelsCacheKey, 'channels')) {
                    cache.set(channelsCacheKey, parsed.data.channels, 5 * 60 * 1000, 'channels');
                    logger.info('cache', '💾 Cached channels from workspace cache for project:', parsed.data.project.project_id);
                  }
                }
              }
              return; // Don't fetch from API
            }
          } catch {
            // Error parsing cached workspace data
          }
        }
      }
      
      // If caching is disabled or no cache found, proceed with API call
      // Define fetchWorkspaceData inline to avoid stale closure
      try {
        if (isCancelled) return;
        
        if (!isCancelled) {
          setLoading(true);
        }
        
        // Single API call gets everything: project, channels, messages, members, etc.
        // Request with messages included for optimal performance
        const data = await workspaceService.getWorkspace(projectSlug, channelSlug, {
          include_messages: true,
          limit: 50
        });
        
        // Cache the workspace data if caching is enabled
        if (cache.isWorkspaceCacheEnabled()) {
          const cacheKey = `${CACHE_KEYS.WORKSPACE_PREFIX}${projectSlug}_${channelSlug}`;
          localStorage.setItem(cacheKey, JSON.stringify({
            data,
            timestamp: Date.now()
          }));
        }
        
        // ALSO cache channels separately if channels caching is enabled
        // This allows useChannels hook to use the cached data without calling channels API
        if (cache.isChannelsCacheEnabled() && data.channels && data.project?.project_id) {
          const channelsCacheKey = `${CACHE_KEYS.CHANNELS_PREFIX}${data.project.project_id}`;
          cache.set(channelsCacheKey, data.channels, 5 * 60 * 1000, 'channels'); // 5 min TTL
          logger.info('cache', '💾 Cached channels from workspace API for project:', data.project.project_id);
        }
        
        // Handle smart fallback from backend
        if (data.fallback_used) {
          // Channel fallback used
          // Update URL to reflect the actual channel being shown
          router.replace(`/project/${projectSlug}/channel/${data.current_channel.slug}`, { scroll: false });
        }
        
        if (!isCancelled) {
          setWorkspaceData(data);
        }
      } catch {
        if (!isCancelled) {
          notFound();
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };
    
    checkCacheAndFetch();
    
    return () => {
      isCancelled = true; // Cancel any pending operations on cleanup
    };
  }, [projectSlug, channelSlug]); // Removed router from dependencies to prevent loops
  

  // Use current workspace data
  // Use useMemo to prevent recalculation on every render
  const displayData = useMemo(() => {
    return workspaceData;
  }, [workspaceData]);
  
  // Create default data structure when no displayData but we want to show UI
  // Use empty string for IDs to prevent API calls with invalid UUIDs
  const defaultData = {
    project: { 
      project_id: '', // Empty string prevents API calls
      name: 'Loading...', 
      slug: projectSlug,
      color: '#6b7280'
    },
    channels: [],
    messages: [],
    current_channel: {
      channel_id: '',  // Empty string prevents API calls
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
  // Memoize the cache building to prevent rebuilding on every render
  // MUST be called before any conditional returns to follow React hooks rules
  const dataToUse = useMemo(() => {
    if (displayData) {
      return displayData;
    }
    
    logger.debug('component', `[Render ${renderCount.current}] Building UI from cache for:`, projectSlug, channelSlug);
    // Always try to build workspace data from cached projects and channels
    
    let fallbackData = null;
    
    if (typeof window !== 'undefined') {
      try {
        // Use localStorage directly on client side (avoid require)
        const projectsCacheKey = `claude_chat_projects_light`;
        const cachedProjectsStr = localStorage.getItem(projectsCacheKey);
        const cachedProjects = cachedProjectsStr ? JSON.parse(cachedProjectsStr).data : null;
        
        logger.debug('cache', 'Cached projects found:', cachedProjects?.length || 0);
        
        // Handle "default" project slug - but check if it's a real project first
        const project = cachedProjects?.find(p => p.slug === projectSlug);
        
        if (projectSlug === 'default' && !project) {
          // Only use defaultData if there's NO actual project with slug "default"
          // This is a placeholder that will redirect in useEffect
          // console.log('Using default data for placeholder redirect');
          fallbackData = defaultData;
        } else if (project) {
          logger.debug('cache', 'Found project:', project.name, 'with ID:', project.project_id);
          
          // Get channels for this specific project
          const channelsCacheKey = `claude_chat_channels_${project.project_id}`;
          const cachedChannelsStr = localStorage.getItem(channelsCacheKey);
          const cachedChannels = cachedChannelsStr ? JSON.parse(cachedChannelsStr).data || [] : [];
          
          // console.log('Cached channels found:', cachedChannels.length);
          
          // Build workspace data from cached components
          fallbackData = {
            project,
            channels: cachedChannels,
            messages: [], // No cached messages yet
            current_channel: cachedChannels.find(c => c.slug === channelSlug) || null,
            active_members: [],
            stats: { members_online: 0, total_channels: cachedChannels.length, unread_total: 0 }
          };
        }
      } catch {
        // console.warn('Failed to load cached data');
      }
    }
    
    // Always fall back to default data if we don't have any data yet
    // This ensures we never show blank screen
    return fallbackData || defaultData;
  }, [displayData, projectSlug, channelSlug, defaultData]); // Include dependencies for cache rebuilding

  // Backend now guarantees all fields are present (or we provide defaults)
  const { 
    project, 
    channels = [], 
    messages = [],
    active_members = [], // eslint-disable-line @typescript-eslint/no-unused-vars 
    stats = { members_online: 0, total_channels: 0, unread_total: 0 } 
  } = dataToUse;

  // Fetch project members using the dedicated API
  // This fetches ALL members, not just active/online ones
  const { 
    members: projectMembers, 
    isLoading: isLoadingMembers 
  } = useProjectMembers(project?.project_id);

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
      channel_id: '', // Empty string prevents API calls with invalid UUID
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

  const markAsRead = () => {
    // Mark notification as read - implementation pending
  };

  const markAllAsRead = () => {
    // Mark all notifications as read - implementation pending
  };

  // Check if we should show loading screen - AFTER all hooks are called
  const hasCachedData = useMemo(() => {
    if (typeof window === 'undefined') return false;
    
    // We need BOTH projects and channels to show a meaningful UI
    // OR we need workspace cache which has everything
    
    // Check for workspace cache first (has everything we need)
    const workspaceCacheKey = `workspace_${projectSlug}_${channelSlug}`;
    const hasWorkspaceCache = localStorage.getItem(workspaceCacheKey);
    if (hasWorkspaceCache) return true;
    
    // Check for projects cache
    const hasCachedProjects = localStorage.getItem('claude_chat_projects_light');
    
    // Without projects, we can't show the UI properly
    // The dataToUse logic needs projects to build the display
    return !!hasCachedProjects;
  }, [projectSlug, channelSlug]);
  
  // Only show LoadingScreen on initial page load (not on navigation)
  // Navigation between projects/channels should use skeletons, not LoadingScreen
  if (!displayData && !hasCachedData && shouldShowLoadingScreen() && isInitialLoad) {
    return <LoadingScreen />;
  }

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
                <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                {isConnected ? (onlineCount || stats?.members_online || 0) : (stats?.members_online || 0)} online
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
                          onClick={markAsRead}
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
              selectedChannelSlug={channelSlug}
              channels={channels}
              projectMembers={projectMembers}
              isLoadingMembers={isLoadingMembers}
            />
            
            {/* Chat area with workspace data */}
            <ChatArea
              selectedProjectId={project.project_id}
              selectedChannelId={current_channel.channel_id}
              initialChannel={current_channel}
              initialProject={project}
              initialMessages={workspaceData?.messages_included && workspaceData?.current_channel?.slug === channelSlug ? messages : undefined}
            />
          </div>
        </div>
      </div>
  )
}

export default function ChannelPage({ params }: PageProps) {
  const { projectSlug, channelSlug } = use(params)

  return (
    <SidebarProvider>
      <ProtectedRoute>
        <ChannelPageContent projectSlug={projectSlug} channelSlug={channelSlug} />
      </ProtectedRoute>
    </SidebarProvider>
  )
}