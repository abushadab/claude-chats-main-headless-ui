import { Skeleton } from "./skeleton";

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
        <div key={index} className="flex items-center space-x-2 px-2 py-1.5 rounded">
          <Skeleton className="h-3 w-3 rounded-sm flex-shrink-0" />
          <Skeleton className="h-3 w-[70%]" />
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
    <div className="flex items-center justify-between px-6 py-3 border-b">
      <div className="flex items-center space-x-3">
        <Skeleton className="h-8 w-8 rounded-full" />
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
export function AuthLoadingSkeleton() {
  return (
    <div className="h-screen flex w-full bg-background overflow-hidden">
      {/* Main Layout */}
      <div className="flex flex-1 h-full">
        {/* Left Sidebar - Projects */}
        <div className="w-16 bg-muted border-r border-border flex-shrink-0">
          <div className="py-3">
            <ProjectListSkeleton count={5} />
          </div>
        </div>
        
        {/* Right Side - Channels + Chat */}
        <div className="flex flex-col flex-1 h-full">
          {/* 1. Main Top Bar */}
          <header className="h-14 flex items-center justify-between border-b border-border bg-background px-4 flex-shrink-0">
            <Skeleton className="h-6 w-40" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </header>
          
          {/* Content Area */}
          <div className="flex flex-1 h-[calc(100vh-56px)] overflow-hidden">
            {/* Channels Sidebar */}
            <div className="w-72 bg-muted border-r border-border flex-shrink-0">
              {/* 2. Channel Sidebar Header - PROJECT INFO */}
              <div className="h-14 px-4 flex items-center border-b border-border bg-background">
                <Skeleton className="h-8 w-8 rounded mr-3" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
        
        {/* Channels List */}
        <div className="p-3">
          <div className="mb-4">
            <Skeleton className="h-3 w-16 mb-2" />
            <ChannelListSkeleton count={6} />
          </div>
          
          {/* Recent Users */}
          <div>
            <Skeleton className="h-3 w-24 mb-2" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <Skeleton className="h-6 w-6 rounded-full" />
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
              <div className="h-14 px-6 flex items-center justify-between border-b border-border">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-5 w-5 rounded" />
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
              
              {/* Messages Area */}
              <div className="flex-1 overflow-hidden">
                <MessageListSkeleton count={6} />
              </div>
              
              {/* Message Input */}
              <div className="p-4 border-t border-border">
                <Skeleton className="h-12 w-full rounded-lg" />
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