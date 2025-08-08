"use client"

import { SidebarProvider } from "@/components/ui/headless-sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { UserProfile } from "@/components/UserProfile"
import { SettingsPage } from "@/components/SettingsPage"

export default function SettingsRoute() {
  return (
    <SidebarProvider>
      <div className="h-screen flex w-full bg-background overflow-hidden">
        {/* Main sidebar with projects */}
        <AppSidebar 
          selectedProjectId=""
        />
        
        {/* Main content */}
        <div className="flex flex-col flex-1 h-full">
          <header className="h-14 flex items-center justify-between border-b border-border bg-background px-4 flex-shrink-0">
            <h1 className="font-semibold text-foreground">DevTeam Chat</h1>
            <UserProfile />
          </header>
          
          <div className="flex-1 overflow-y-auto">
            <SettingsPage />
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
}