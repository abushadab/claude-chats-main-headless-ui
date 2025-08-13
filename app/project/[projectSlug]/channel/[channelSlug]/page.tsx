"use client"

import { use, useEffect, useState } from "react"
import { SidebarProvider } from "@/components/ui/headless-sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { ChannelsSidebar } from "@/components/ChannelsSidebar"
import { ChatArea } from "@/components/ChatArea"
import { UserProfile } from "@/components/UserProfile"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { useProjects } from "@/hooks/useProjects"
import { projectService } from "@/services/project.service"
import { notFound } from "next/navigation"
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
  const [project, setProject] = useState<Project | null>(null)
  const [channels, setChannels] = useState<Channel[]>([])
  const [activeMembers, setActiveMembers] = useState<ActiveMember[]>([])
  const [channelId, setChannelId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch project with channels and active members in one call
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true)
        console.log('Fetching project data for:', projectSlug, channelSlug);
        
        // Single API call to get project + channels + active members
        const data = await projectService.getProjectBySlug(projectSlug, ['channels', 'active_members'])
        console.log('Project data received:', data);
        
        setProject(data.project)
        setChannels(data.channels || [])
        setActiveMembers(data.active_members || [])
        
        // Find the channel by slug
        const channel = data.channels?.find(c => 
          c.slug === channelSlug || 
          c.name.toLowerCase() === channelSlug.toLowerCase()
        )
        
        if (channel) {
          console.log('Channel found:', channel.channel_id);
          setChannelId(channel.channel_id)
        } else {
          console.error('Channel not found:', channelSlug, 'Available channels:', data.channels?.map(c => c.slug));
          notFound()
        }
      } catch (error) {
        console.error('Error fetching project data:', error)
        notFound()
      } finally {
        setLoading(false)
      }
    }

    fetchProjectData()
  }, [projectSlug, channelSlug])

  // Show loading while fetching data
  if (loading || !project || !channelId) {
    return (
      <ProtectedRoute>
        <AuthLoadingSkeleton />
      </ProtectedRoute>
    )
  }

  return (
    <div className="h-screen flex w-full bg-background overflow-hidden">
      {/* Main sidebar with projects */}
      <AppSidebar 
        selectedProjectId={project.project_id}
      />
      
      {/* Global sidebar trigger */}
      <div className="flex flex-col flex-1 h-full">
        <header className="h-14 flex items-center justify-between border-b border-border bg-background px-4 flex-shrink-0">
          <button
            onClick={() => toggleSidebar()}
            className="p-1.5 hover:bg-accent rounded-md transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeft className="h-5 w-5 text-muted-foreground" />
            ) : (
              <PanelLeftClose className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
          <div className="flex items-center gap-4">
            {/* Active members indicator */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                {activeMembers.filter(m => m.status === 'online').length} online
              </span>
            </div>
            <UserProfile />
          </div>
        </header>
        
        <div className="flex flex-1 h-[calc(100vh-56px)] overflow-hidden">
          {/* Channels sidebar with pre-fetched channels */}
          <ChannelsSidebar
            selectedProjectId={project.project_id}
            selectedChannelId={channelId}
            channels={channels}
          />
          
          {/* Chat area */}
          <ChatArea
            selectedProjectId={project.project_id}
            selectedChannelId={channelId}
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