"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { mockProjects } from "@/data/mockData"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the first project's first channel
    const defaultProject = mockProjects[0]
    if (defaultProject && defaultProject.channels.length > 0) {
      const defaultChannel = defaultProject.channels[0]
      router.replace(`/project/${defaultProject.id}/channel/${defaultChannel.id}`)
    }
  }, [router])

  // Show loading while redirecting
  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading chat...</p>
      </div>
    </div>
  )
}