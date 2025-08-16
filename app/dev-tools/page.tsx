"use client"

import { DeveloperTools } from "@/components/DeveloperTools"
import ProtectedRoute from "@/components/auth/ProtectedRoute"

export default function DevToolsPage() {
  // Only show in development or when explicitly enabled
  const isEnabled = process.env.NODE_ENV === 'development' || 
    (typeof window !== 'undefined' && localStorage.getItem('show_dev_tools') === 'true');

  if (!isEnabled) {
    return (
      <ProtectedRoute>
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
            <p className="text-muted-foreground">Developer tools are not available in production.</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DeveloperTools />
    </ProtectedRoute>
  );
}