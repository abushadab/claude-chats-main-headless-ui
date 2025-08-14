"use client"

import { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/headless-sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ChannelsSidebar } from "@/components/ChannelsSidebar";
import { Skeleton } from "./skeleton";
import { Hash } from "lucide-react";
import type { Channel } from "@/types/chat.types";

// Inner component that can use useSidebar hook
function SkeletonContent() {
  const [firstProjectId, setFirstProjectId] = useState("");
  const [channels, setChannels] = useState<Channel[]>([]);
  
  useEffect(() => {
    // Get first project from localStorage to set as selected
    const cached = localStorage.getItem('claude_chat_projects_light');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.data && parsed.data.length > 0) {
          setFirstProjectId(parsed.data[0].project_id);
          
          // Also get channels from localStorage for this project
          const channelsCached = localStorage.getItem(`claude_chat_channels_${parsed.data[0].project_id}`);
          if (channelsCached) {
            try {
              const channelsParsed = JSON.parse(channelsCached);
              if (channelsParsed.data) {
                setChannels(channelsParsed.data);
              }
            } catch (e) {}
          }
        }
      } catch (e) {}
    }
  }, []);
  
  return (
    <div className="h-screen flex w-full bg-background overflow-hidden">
      {/* Use actual AppSidebar with natural state (not forcing isLoading) */}
      <AppSidebar 
        selectedProjectId={firstProjectId}
      />
      
      {/* Rest of the layout with skeletons - fixed width */}
      <div className="flex flex-col h-full w-[calc(100vw-56px)]">
          {/* Main Top Bar */}
          <header className="h-14 flex items-center justify-between border-b border-border bg-background px-4 flex-shrink-0">
            <button className="p-1.5 rounded-md relative -ml-1.5">
              <Skeleton className="h-5 w-5 rounded-md" />
            </button>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <Skeleton className="h-4 w-14" />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Skeleton className="h-9 w-9 rounded-md" />
                <Skeleton className="h-9 w-[140px] rounded-lg" />
              </div>
            </div>
          </header>
          
          {/* Content Area */}
          <div className="flex flex-1 h-[calc(100vh-56px)] overflow-hidden">
            {/* Use actual ChannelsSidebar which will show cached data if available */}
            <ChannelsSidebar 
              selectedProjectId={firstProjectId}
              selectedChannelId={channels.length > 0 ? channels[0].channel_id : ""}
              channels={channels}
            />
            
            {/* Main Chat Area skeleton */}
            <div className="flex-1 flex flex-col">
              <div className="h-[60px] px-4 flex items-center justify-between border-b border-border">
                <div className="flex items-center">
                  <Hash className="h-5 w-5 text-muted-foreground/50 mr-2" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </div>
              
              <div className="flex-1 overflow-hidden p-4">
                <div className="space-y-4">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className={`flex ${index % 3 === 0 ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[70%] space-y-2">
                        <div className="flex items-center space-x-2">
                          {index % 3 !== 0 && <Skeleton className="h-8 w-8 rounded-full" />}
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className={`h-12 ${index % 4 === 0 ? 'w-[80%]' : 'w-[70%]'} rounded-lg`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t border-border bg-background" style={{ height: '151px' }}>
                <div className="flex flex-col justify-end h-full p-4">
                  <div className="bg-white border border-border rounded-xl" style={{ height: '118px' }}>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}

// Wrapper component that provides SidebarProvider
export function AuthLoadingSkeletonV2() {
  return (
    <SidebarProvider>
      <SkeletonContent />
    </SidebarProvider>
  );
}