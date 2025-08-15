"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { LoadingScreen } from "@/components/LoadingScreen"

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()

  // Simple redirect without using projects hook to avoid cache conflicts
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      // Check for last visited URL in localStorage
      const lastVisitedUrl = localStorage.getItem('last_visited_url');
      if (lastVisitedUrl) {
        router.replace(lastVisitedUrl);
      } else {
        // Just redirect to default workspace, let workspace API handle the rest
        router.replace('/project/default/channel/general');
      }
    }
  }, [isAuthenticated, isAuthLoading, router]);

  return (
    <ProtectedRoute>
      <LoadingScreen />
    </ProtectedRoute>
  )
}