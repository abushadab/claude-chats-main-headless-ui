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
import { AuthLoadingSkeleton } from "@/components/ui/skeleton-components"
import { PanelLeftClose, PanelLeft } from "lucide-react"
import { useSidebar } from "@/components/ui/headless-sidebar"

interface PageProps {
  params: Promise<{
    projectSlug: string
    channelSlug: string
  }>
}

function ChannelPageContent({ projectSlug, channelSlug }: { projectSlug: string, channelSlug: string }) {
  const { projects } = useProjects() // For sidebar display
  const { state, toggleSidebar } = useSidebar()
  const collapsed = state === "collapsed"
  const router = useRouter()
  
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

  // Show loading while fetching data - but use cached data if available
  if (loading && !workspaceData) {
    return (
      <ProtectedRoute>
        <AuthLoadingSkeleton />
      </ProtectedRoute>
    )
  }
  
  // If we don't have workspace data yet, return null
  if (!workspaceData) {
    return null;
  }

  // Backend now guarantees all fields are present
  const { 
    project, 
    current_channel, 
    channels = [], 
    active_members = [], 
    stats = { members_online: 0, total_channels: 0, unread_total: 0 } 
  } = workspaceData;

  return (
    <div className="h-screen flex w-full bg-background overflow-hidden">
      {/* Main sidebar with projects */}
      <AppSidebar 
        selectedProjectId={project.project_id}
        isLoading={false}
      />
      
      {/* Main content area with calculated width based on sidebar state */}
      <div className={`flex flex-col h-full ${
        collapsed ? 'w-[calc(100vw-56px)]' : 'w-[calc(100vw-256px)]'
      }`}>
        <header className="h-14 flex items-center justify-between border-b border-border bg-background px-4 flex-shrink-0">
          <button
            onClick={() => toggleSidebar()}
            className="p-1.5 hover:bg-accent rounded-md transition-colors relative -ml-1.5"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeft className="h-5 w-5 text-muted-foreground" />
            ) : (
              <PanelLeftClose className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
          {/* Active members indicator with stats from workspace */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              {stats?.members_online || 0} online
            </span>
          </div>
        </header>
        
        <div className="flex flex-1 h-[calc(100vh-56px)] overflow-hidden">
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