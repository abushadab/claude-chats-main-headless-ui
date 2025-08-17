"use client"

import { SidebarProvider } from "@/components/ui/headless-sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { SettingsPage } from "@/components/SettingsPage"
import Image from "next/image"
import { Bell } from "lucide-react"
import { useState } from "react"
import { useRealtime } from "@/contexts/RealtimeContext"

export default function SettingsRoute() {
  const [unreadCount, setUnreadCount] = useState(2)
  const { onlineCount, isConnected } = useRealtime()

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
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span>{onlineCount || 0} online</span>
          </div>
          
          {/* Notification bell */}
          <button className="relative p-2 hover:bg-accent rounded-lg transition-colors">
            <Bell className="h-5 w-5 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main content area with sidebar */}
      <SidebarProvider>
        <div className="flex flex-1 overflow-hidden">
          {/* Main sidebar with projects */}
          <AppSidebar 
            selectedProjectId=""
          />
          
          {/* Settings content */}
          <div className="flex-1 overflow-y-auto">
            <SettingsPage />
          </div>
        </div>
      </SidebarProvider>
    </div>
  )
}