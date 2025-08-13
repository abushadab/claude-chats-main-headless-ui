"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useProjects } from "@/hooks/useProjects"
import { useAuth } from "@/contexts/AuthContext"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { AuthLoadingSkeleton } from "@/components/ui/skeleton-components"

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()

  // Simple redirect without using projects hook to avoid cache conflicts
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      // Just redirect to default workspace, let workspace API handle the rest
      router.replace('/project/default/channel/general');
    }
  }, [isAuthenticated, isAuthLoading, router]);

  return (
    <ProtectedRoute>
      <AuthLoadingSkeleton />
    </ProtectedRoute>
  )
}