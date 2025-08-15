import { Skeleton } from "./skeleton";
import { Hash } from "lucide-react";
import Image from "next/image";

// Project list skeleton for main sidebar
export function ProjectListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {/* Main/Active Project */}
      <div className="p-2">
        <Skeleton className="h-10 w-10 rounded-lg mx-auto" />
      </div>
      
      {/* Other Projects */}
      <div className="space-y-1">
        {Array.from({ length: count - 1 }).map((_, index) => (
          <div key={index} className="p-2 flex justify-center">
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        ))}
      </div>
      
      {/* Add Project Button */}
      <div className="p-2 flex justify-center">
        <Skeleton className="h-8 w-8 rounded-md opacity-60" />
      </div>
    </div>
  );
}

// Channel list skeleton for sidebar
export function ChannelListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={`flex items-center h-8 space-x-2 px-2 rounded-md ${
          index === 0 ? 'bg-primary/20' : ''
        }`}>
          <Hash className={`h-3 w-3 flex-shrink-0 ${
            index === 0 ? 'text-foreground/70' : 'text-muted-foreground/50'
          }`} />
          <Skeleton className={`h-3 w-[70%] ${
            index === 0 ? 'bg-primary/30' : ''
          }`} />
          {index < 2 && <Skeleton className="h-4 w-4 rounded-full ml-auto" />}
        </div>
      ))}
    </div>
  );
}

// Message list skeleton for chat area
export function MessageListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={`flex ${index % 3 === 0 ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[70%] space-y-2 ${index % 3 === 0 ? 'items-end' : 'items-start'}`}>
            <div className="flex items-center space-x-2">
              {index % 3 !== 0 && <Skeleton className="h-8 w-8 rounded-full" />}
              <Skeleton className="h-3 w-16" />
              {index % 3 === 0 && <Skeleton className="h-8 w-8 rounded-full" />}
            </div>
            <Skeleton className={`h-12 ${index % 4 === 0 ? 'w-[80%]' : index % 3 === 0 ? 'w-[60%]' : 'w-[70%]'} rounded-lg`} />
          </div>
        </div>
      ))}
    </div>
  );
}

// Chat header skeleton
export function ChatHeaderSkeleton() {
  return (
    <div className="h-[60px] flex items-center justify-between px-4 border-b">
      <div className="flex items-center">
        <Hash className="h-5 w-5 text-muted-foreground/50 mr-2" />
        <div className="space-y-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    </div>
  );
}

// Project header skeleton
export function ProjectHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Skeleton className="h-9 w-24 rounded-md" />
    </div>
  );
}

// Auth loading skeleton - shows chat app layout structure
export function AuthLoadingSkeleton({ activeProjectIndex = 0, activeChannelIndex = 0 }: { activeProjectIndex?: number; activeChannelIndex?: number } = {}) {
  return (
    <div className="h-screen flex w-full bg-background overflow-hidden">
      {/* Main Layout */}
      <div className="flex w-full h-full">
        {/* Left Sidebar - Projects */}
        <div className="w-14 bg-muted border-r border-border flex-shrink-0 flex flex-col">
          {/* Logo Header - Always show actual logo, not skeleton */}
          <div className="h-14 flex items-center justify-center flex-shrink-0">
            <Image 
              src="/hudhud-logo.svg" 
              alt="Hudhud" 
              width={40}
              height={40}
              className="rounded-[8px] flex-shrink-0"
            />
          </div>
          {/* Projects List - Matches exact structure of AppSidebar */}
          <div className="flex-1 overflow-y-auto py-2">
            <div className="space-y-1 !space-y-3">
              <nav className="space-y-1 !space-y-3">
                {/* Show 5 project skeletons matching the actual sidebar */}
                {Array.from({ length: 5 }).map((_, index) => {
                  const isActive = index === activeProjectIndex;
                  return (
                    <div key={index} className="flex items-center justify-center">
                      <button className="collapsed-button w-10 h-10 p-0 flex items-center justify-center rounded-lg transition-colors hover:bg-transparent relative" disabled>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isActive ? 'ring-2 ring-offset-2 ring-offset-background ring-primary' : ''
                        }`}>
                          <Skeleton className="w-full h-full rounded-lg" />
                        </div>
                      </button>
                    </div>
                  );
                })}
              </nav>
              
              {/* Create Project Button skeleton - outside nav but inside scrollable area */}
              <div className="mt-2 flex items-center justify-center">
                <button className="w-10 h-10 p-0 flex items-center justify-center rounded-lg transition-colors border border-dashed border-muted-foreground/30" disabled>
                  <Skeleton className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          
          {/* User Profile skeleton */}
          <div className="h-12 bg-sidebar flex items-center justify-center flex-shrink-0 px-2 border-t border-border">
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          
          {/* Bottom settings skeleton */}
          <div className="h-12 bg-sidebar flex items-center justify-center flex-shrink-0 px-2">
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
        </div>
        
        {/* Right Side - Channels + Chat with fixed width */}
        <div className="flex flex-col w-[calc(100vw-56px)] h-full">
          {/* 1. Main Top Bar */}
          <header className="h-14 flex items-center justify-between border-b border-border bg-background px-4 flex-shrink-0">
            {/* Sidebar toggle button - matches actual h-5 w-5 */}
            <Skeleton className="h-5 w-5 rounded-md" />
            {/* Online members indicator only */}
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1">
                <Skeleton className="h-2 w-2 rounded-full" />
                <Skeleton className="h-4 w-14" />
              </div>
            </div>
          </header>
          
          {/* Content Area */}
          <div className="flex flex-1 h-[calc(100vh-56px)] overflow-hidden">
            {/* Channels Sidebar */}
            <div className="w-72 bg-muted border-r border-border flex-shrink-0">
              {/* 2. Channel Sidebar Header - PROJECT INFO */}
              <div className="h-[60px] px-4 flex items-center border-b border-border">
                <Skeleton className="h-4 w-4 rounded mr-3" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
        
        {/* Channels List */}
        <div className="p-3">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2 px-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Channels
              </h3>
              <Skeleton className="h-4 w-4 rounded" />
            </div>
            <div className="space-y-1 px-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className={`flex items-center h-8 space-x-2 px-2 rounded-md ${
                  index === activeChannelIndex ? 'bg-primary/20' : ''
                }`}>
                  <Hash className={`h-3 w-3 flex-shrink-0 ${
                    index === activeChannelIndex ? 'text-foreground/70' : 'text-muted-foreground/50'
                  }`} />
                  <Skeleton className={`h-3 w-[70%] ${
                    index === activeChannelIndex ? 'bg-primary/30' : ''
                  }`} />
                </div>
              ))}
            </div>
          </div>
          
          {/* Recent Users */}
          <div>
            <div className="flex items-center justify-between mb-2 px-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Recent Active Users
              </h3>
            </div>
            <div className="space-y-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-2 px-2 py-1.5 rounded">
                  <Skeleton className="h-6 w-6 rounded" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
              {/* 3. Chat Header - CHANNEL INFO */}
              <div className="h-[60px] px-4 flex items-center justify-between border-b border-border">
                <div className="flex items-center">
                  <Hash className="h-5 w-5 text-muted-foreground/50 mr-2" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-10 flex items-center justify-center">
                    <Skeleton className="h-4 w-4 rounded" />
                  </div>
                  <div className="h-8 w-10 flex items-center justify-center">
                    <Skeleton className="h-4 w-4 rounded" />
                  </div>
                  <div className="h-8 w-10 flex items-center justify-center">
                    <Skeleton className="h-4 w-4 rounded" />
                  </div>
                </div>
              </div>
              
              {/* Messages Area */}
              <div className="flex-1 overflow-hidden p-4">
                <div className="space-y-4">
                  {/* Simple alternating message skeletons without avatars/names */}
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                      <Skeleton className={`${index % 2 === 0 ? 'w-[60%]' : 'w-[50%]'} rounded-lg`} style={{ height: '90px' }} />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Message Input */}
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
    </div>
  );
}

// General content skeleton
export function ContentSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-64" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[90%]" />
        <Skeleton className="h-4 w-[85%]" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    </div>
  );
}