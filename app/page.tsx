"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useProjects } from "@/hooks/useProjects"
import { useChannels } from "@/hooks/useChannels"
import ProtectedRoute from "@/components/auth/ProtectedRoute"

export default function HomePage() {
  const router = useRouter()
  const { projects, isLoading: isLoadingProjects, error: projectsError } = useProjects()
  const { channels, isLoading: isLoadingChannels, error: channelsError } = useChannels()

  useEffect(() => {
    if (!isLoadingProjects && !isLoadingChannels) {
      if (projects.length > 0 && channels.length > 0) {
        // Redirect to the first project's first channel
        const defaultProject = projects[0]
        const defaultChannel = channels.find(c => c.project_id === defaultProject.project_id) || channels[0]
        router.replace(`/project/${defaultProject.project_id}/channel/${defaultChannel.channel_id}`)
      } else if (!projectsError && !channelsError) {
        // No projects or channels available - stay on this page to show empty state
        console.log('No projects or channels available, staying on home page');
      }
    }
  }, [router, projects, channels, isLoadingProjects, isLoadingChannels, projectsError, channelsError])

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