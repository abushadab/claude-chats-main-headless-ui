"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useProjects } from "@/hooks/useProjects"
import { useChannels } from "@/hooks/useChannels"
import { useChannelsPreloader } from "@/hooks/useChannelsPreloader"
import ProtectedRoute from "@/components/auth/ProtectedRoute"

export default function HomePage() {
  const router = useRouter()
  const { projects, isLoading: isLoadingProjects, error: projectsError } = useProjects()
  
  // Only fetch channels for the first project to improve performance
  // Use 'skip' when we don't have a project yet to avoid fetching ALL channels
  const firstProjectId = projects.length > 0 ? projects[0].project_id : 'skip'
  const { channels, isLoading: isLoadingChannels, error: channelsError } = useChannels(firstProjectId as any)
  
  // Preload channels for all projects in the background
  useChannelsPreloader({
    enabled: true,
    preloadDelay: 1000, // Start preloading 1 second after projects load
    maxConcurrent: 2, // Limit concurrent requests
  })

  useEffect(() => {
    // Only redirect once when data is ready
    if (!isLoadingProjects && !isLoadingChannels) {
      console.log('HomePage - Projects:', projects.length, 'Channels:', channels.length);
      
      if (projects.length > 0 && channels.length > 0) {
        const defaultProject = projects[0]
        const defaultChannel = channels[0]
        
        // Make sure we have valid slugs
        if (!defaultProject.slug) {
          console.error('Project missing slug:', defaultProject);
          return;
        }
        
        const channelSlug = defaultChannel.slug || 
                           defaultChannel.name?.toLowerCase().replace(/\s+/g, '-') || 
                           'general';
        
        const redirectUrl = `/project/${defaultProject.slug}/channel/${channelSlug}`;
        
        // Check if we're already on this URL to prevent loops
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/project/')) {
          console.log('Redirecting from homepage to:', redirectUrl);
          router.push(redirectUrl);
        }
      } else {
        console.log('No projects or channels to redirect to');
      }
    }
  }, [projects, channels, isLoadingProjects, isLoadingChannels, router])

  // Show loading while redirecting
  if (isLoadingProjects || isLoadingChannels) {
    return (
      <ProtectedRoute>
        <div className="h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading chat...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  // Show error state
  if (projectsError || channelsError) {
    return (
      <ProtectedRoute>
        <div className="h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <p className="text-red-500 mb-4">
              Error loading {projectsError ? 'projects' : 'channels'}: {projectsError || channelsError}
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
            >
              Retry
            </button>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  // Show empty state if no projects or channels
  if (projects.length === 0 || channels.length === 0) {
    return (
      <ProtectedRoute>
        <div className="h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              {projects.length === 0 ? 'No projects available' : 'No channels available'}
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
            >
              Retry
            </button>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  // This should not be reached, but show loading as fallback
  return (
    <ProtectedRoute>
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    </ProtectedRoute>
  )
}