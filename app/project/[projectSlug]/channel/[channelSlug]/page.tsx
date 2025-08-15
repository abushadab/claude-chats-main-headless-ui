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
import type { Project, ActiveMember } from "@/types/project.types"
import type { Channel } from "@/types/chat.types"
import { LoadingScreen } from "@/components/LoadingScreen"
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
  const { projects } = useProjects() // For sidebar display
  const router = useRouter()
  const [showNotifications, setShowNotifications] = useState(false)
  
  // Check localStorage for cached workspace data
  const getCachedWorkspace = () => {
    const cacheKey = `workspace_${projectSlug}_${channelSlug}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // Check if cache is less than 5 minutes old
        if (parsed.timestamp && Date.now() - parsed.timestamp < 5 * 60 * 1000) {
          console.log('📦 Using cached workspace data');
          return parsed.data;
        }
      } catch (e) {
        console.error('Error parsing cached workspace data:', e);
      }
    }
    return null;
  };
  
  const [workspaceData, setWorkspaceData] = useState<WorkspaceResponse | null>(getCachedWorkspace())
  const [loading, setLoading] = useState(!getCachedWorkspace())

  // Save last visited project/channel to localStorage
  useEffect(() => {
    if (projectSlug && channelSlug) {
      localStorage.setItem('last_visited_project', projectSlug);
      localStorage.setItem('last_visited_channel', channelSlug);
      localStorage.setItem('last_visited_url', `/project/${projectSlug}/channel/${channelSlug}`);
    }
  }, [projectSlug, channelSlug]);

  // Fetch complete workspace data in one API call
  useEffect(() => {
    const fetchWorkspaceData = async () => {
      try {
        setLoading(true)
        console.log('Fetching workspace data for:', projectSlug, channelSlug);
        
        // Wait a bit to ensure auth is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Single API call gets everything: project, channels, messages, members, etc.
        const data = await workspaceService.getWorkspace(projectSlug, channelSlug);
        console.log('Workspace data received:', data);
        
        // Cache the workspace data
        const cacheKey = `workspace_${projectSlug}_${channelSlug}`;
        localStorage.setItem(cacheKey, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
        console.log('💾 Workspace data cached');
        
        // Handle smart fallback from backend
        if (data.fallback_used) {
          console.log('Channel fallback used:', data.fallback_reason);
          // Update URL to reflect the actual channel being shown
          router.replace(`/project/${projectSlug}/channel/${data.current_channel.slug}`, { scroll: false });
        }
        
        setWorkspaceData(data);
      } catch (error) {
        console.error('Error fetching workspace data:', error)
        notFound()
      } finally {
        setLoading(false)
      }
    }

    fetchWorkspaceData()
  }, [projectSlug, channelSlug, router])

  // Show loading screen only on initial app load (when we don't have any cached data)
  if (loading && !workspaceData) {
    // Check if we have cached projects - if yes, we shouldn't show loading
    const hasCachedProjects = localStorage.getItem('claude_chat_projects_light');
    if (!hasCachedProjects) {
      // First time load - show loading screen with quotes
      return (
        <ProtectedRoute>
          <LoadingScreen />
        </ProtectedRoute>
      )
    }
    // We have cached data but workspace is still loading - just wait without showing skeleton
    // The UI will update when data arrives
  }
  
  // If we don't have workspace data yet, return null
  if (!workspaceData) {
    return null;
  }

  // Backend now guarantees all fields are present
  const { 
    project, 
    channels = [], 
    active_members = [], 
    stats = { members_online: 0, total_channels: 0, unread_total: 0 } 
  } = workspaceData;

  // Find the current channel from channels array
  let current_channel = workspaceData.current_channel;
  
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
      console.warn(`Channel ${channelSlug} not found, using first available channel`);
    }
  }

  // Safety check for current_channel
  if (!current_channel) {
    console.error('No channels available in workspace data');
    return null;
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
    console.log('Mark notification as read:', notificationId);
  };

  const markAllAsRead = () => {
    console.log('Mark all notifications as read');
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
              channels={channels}
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