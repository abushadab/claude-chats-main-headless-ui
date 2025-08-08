"use client"

import { use } from "react"
import { SidebarProvider } from "@/components/ui/headless-sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { ChannelsSidebar } from "@/components/ChannelsSidebar"
import { ChatArea } from "@/components/ChatArea"
import { UserProfile } from "@/components/UserProfile"

interface PageProps {
  params: Promise<{
    projectId: string
    channelId: string
  }>
}

export default function ChannelPage({ params }: PageProps) {
  const { projectId, channelId } = use(params)

  return (
    <SidebarProvider>
      <div className="h-screen flex w-full bg-background overflow-hidden">
        {/* Main sidebar with projects */}
        <AppSidebar 
          selectedProjectId={projectId}
        />
        
        {/* Global sidebar trigger */}
        <div className="flex flex-col flex-1 h-full">
          <header className="h-14 flex items-center justify-between border-b border-border bg-background px-4 flex-shrink-0">
            <h1 className="font-semibold text-foreground">DevTeam Chat</h1>
            <UserProfile />
          </header>
          
          <div className="flex flex-1 h-[calc(100vh-56px)] overflow-hidden">
            {/* Channels sidebar */}
            <ChannelsSidebar
              selectedProjectId={projectId}
              selectedChannelId={channelId}
            />
            
            {/* Chat area */}
            <ChatArea
              selectedProjectId={projectId}
              selectedChannelId={channelId}
            />
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
}