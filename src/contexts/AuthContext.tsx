'use client';

/**
 * Authentication Context and Provider
 * Manages global authentication state and provides auth methods
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import authService from '@/services/auth.service';
import type {
  User,
  AuthState,
  AuthError,
  LoginCredentials,
  RegisterData,
  UpdateProfileData,
  ChangePasswordData,
} from '@/types';

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  changePassword: (data: ChangePasswordData) => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  // Set up automatic token refresh
  useEffect(() => {
    if (!state.isAuthenticated) return;

    // Check token expiry every minute
    const interval = setInterval(() => {
      if (authService.isTokenExpired()) {
        authService.refreshToken().catch(() => {
          // If refresh fails, logout
          logout();
        });
      }
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, [state.isAuthenticated]);

  /**
   * Initialize authentication state
   */
  const initializeAuth = async () => {
    try {
      // Don't set loading here, it's already true from initial state
      // Check if user has valid token
      const hasAuth = authService.isAuthenticated();
      
      if (hasAuth) {
        // Try to get user data
        const user = await authService.getCurrentUser();
        
        if (user) {
          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return;
        }
      }

      // No valid auth
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  };

  /**
   * Login user
   */
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await authService.login(credentials);

      if (response.success && response.user) {
        setState({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        // Redirect to workspace directly to avoid home page redirect loop
        const redirectTo = sessionStorage.getItem('redirectTo') || '/project/default/channel/general';
        sessionStorage.removeItem('redirectTo');
        
        // Small delay to ensure state is updated before redirect
        setTimeout(() => {
          router.push(redirectTo);
        }, 100);
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: response.error || { message: 'Login failed' },
        }));
        throw new Error(response.error?.message || 'Login failed');
      }
    } catch (error: any) {
      const authError: AuthError = {
        message: error.message || 'Login failed',
        code: error.code,
      };
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: authError,
      }));
      
      throw error;
    }
  }, [router]);

  /**
   * Register new user
   */
  const register = useCallback(async (data: RegisterData) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await authService.register(data);

      if (response.success && response.user) {
        setState({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        // Redirect to onboarding or dashboard
        router.push('/onboarding');
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: response.error || { message: 'Registration failed' },
        }));
        throw new Error(response.error?.message || 'Registration failed');
      }
    } catch (error: any) {
      const authError: AuthError = {
        message: error.message || 'Registration failed',
        code: error.code,
      };
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: authError,
      }));
      
      throw error;
    }
  }, [router]);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      await authService.logout();

      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });

      // Redirect handled by authService
    } catch (error: any) {
      console.error('Logout error:', error);
      
      // Even if logout fails, clear local state
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, []);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (data: UpdateProfileData) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await authService.updateProfile(data);

      if (response.success && response.user) {
        setState(prev => ({
          ...prev,
          user: response.user,
          isLoading: false,
          error: null,
        }));
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: response.error || { message: 'Profile update failed' },
        }));
        throw new Error(response.error?.message || 'Profile update failed');
      }
    } catch (error: any) {
      const authError: AuthError = {
        message: error.message || 'Profile update failed',
        code: error.code,
      };
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: authError,
      }));
      
      throw error;
    }
  }, []);

  /**
   * Change password
   */
  const changePassword = useCallback(async (data: ChangePasswordData) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await authService.changePassword(data);

      if (response.success) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: null,
        }));
        
        // Optionally show success message
        console.log('Password changed successfully');
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: response.error || { message: 'Password change failed' },
        }));
        throw new Error(response.error?.message || 'Password change failed');
      }
    } catch (error: any) {
      const authError: AuthError = {
        message: error.message || 'Password change failed',
        code: error.code,
      };
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: authError,
      }));
      
      throw error;
    }
  }, []);

  /**
   * Refresh user data
   */
  const refreshUser = useCallback(async () => {
    if (!state.isAuthenticated) return;

    try {
      const user = await authService.getCurrentUser();
      if (user) {
        setState(prev => ({
          ...prev,
          user,
        }));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, [state.isAuthenticated]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      register,
      logout,
      updateProfile,
      changePassword,
      refreshUser,
      clearError,
    }),
    [state, login, register, logout, updateProfile, changePassword, refreshUser, clearError]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

/**
 * Hook to require authentication
 */
export function useRequireAuth(redirectTo = '/login') {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Save the current path to redirect back after login
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('redirectTo', window.location.pathname);
      }
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  return { isAuthenticated, isLoading };
}

/**
 * Hook to check user permissions
 */
export function usePermission(requiredRole?: string) {
  const { user } = useAuth();

  const hasPermission = useCallback(() => {
    if (!user) return false;
    if (!requiredRole) return true;
    
    // Check if user has required role
    if (requiredRole === 'admin') {
      return user.role === 'admin';
    }
    
    if (requiredRole === 'moderator') {
      return user.role === 'moderator' || user.role === 'admin';
    }
    
    return true;
  }, [user, requiredRole]);

  return {
    hasPermission: hasPermission(),
    userRole: user?.role,
  };
}