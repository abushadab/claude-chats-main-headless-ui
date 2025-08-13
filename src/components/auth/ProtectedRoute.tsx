'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AuthLoadingSkeleton } from '@/components/ui/skeleton-components';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export default function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && requireAuth && !isAuthenticated) {
      // Save current path for redirect after login
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('redirectTo', window.location.pathname);
      }
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, requireAuth, redirectTo, router]);

  // Show loading while checking auth
  if (isLoading) {
    return <AuthLoadingSkeleton />;
  }

  // Don't render protected content if not authenticated
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}