'use client';

import { useEffect, useState } from 'react';
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
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  // Check for token on mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Use the correct token key from config
      setHasToken(!!localStorage.getItem('accessToken'));
    }
  }, []);

  // Handle redirect
  useEffect(() => {
    // Immediate redirect if no token
    if (hasToken === false && requireAuth) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('redirectTo', window.location.pathname);
      }
      router.push(redirectTo);
      return;
    }
    
    // Redirect after auth check completes
    if (!isLoading && requireAuth && !isAuthenticated) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('redirectTo', window.location.pathname);
      }
      router.push(redirectTo);
    }
  }, [hasToken, isAuthenticated, isLoading, requireAuth, redirectTo, router]);

  // Initial server render - show nothing
  if (hasToken === null && requireAuth) {
    return null;
  }

  // No token found - don't show skeleton, redirect will happen
  if (hasToken === false && requireAuth) {
    return null;
  }

  // Show loading only if we have a token but still checking its validity
  if (isLoading && requireAuth) {
    return <AuthLoadingSkeleton />;
  }

  // Don't render protected content if not authenticated
  if (requireAuth && !isAuthenticated) {
    return null;
  }
  
  return <>{children}</>;
}