/**
 * Authentication Service
 * Handles all authentication-related API calls and token management
 */

import axios, { AxiosInstance } from 'axios';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { config } from '@/config';
import type {
  User,
  AuthTokens,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  UpdateProfileData,
  ChangePasswordData,
  TokenPayload,
  AuthError,
} from '@/types';

class AuthService {
  private api: AxiosInstance;
  private refreshPromise: Promise<boolean> | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: `${config.api.baseUrl}/auth`,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Store tokens securely
   */
  private setTokens(tokens: AuthTokens): void {
    // Store access token in localStorage for easy access
    localStorage.setItem(config.auth.tokenKey, tokens.accessToken);
    
    // Store token expiry if available
    if (tokens.expiresIn) {
      const expiryTime = Date.now() + tokens.expiresIn * 1000;
      localStorage.setItem('tokenExpiry', expiryTime.toString());
    } else {
      // Decode token to get expiry
      try {
        const decoded = jwtDecode<TokenPayload>(tokens.accessToken);
        const expiryTime = decoded.exp * 1000;
        localStorage.setItem('tokenExpiry', expiryTime.toString());
      } catch (error) {
        console.error('Failed to decode token:', error);
      }
    }
    
    // Refresh token is automatically set as HTTP-only cookie by backend
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem(config.auth.tokenKey);
  }

  /**
   * Check if token is expired or about to expire
   */
  isTokenExpired(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;

    const expiryTime = localStorage.getItem('tokenExpiry');
    if (!expiryTime) {
      try {
        const decoded = jwtDecode<TokenPayload>(token);
        const now = Date.now() / 1000;
        return decoded.exp < now + 60; // Consider expired if less than 1 minute left
      } catch {
        return true;
      }
    }

    const expiry = parseInt(expiryTime, 10);
    return Date.now() > expiry - config.auth.tokenRefreshBuffer;
  }

  /**
   * Clear all auth data
   */
  private clearAuthData(): void {
    localStorage.removeItem(config.auth.tokenKey);
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem(config.auth.userKey);
    // Cookies are cleared by the logout endpoint
  }

  /**
   * Store user data
   */
  private setUser(user: User): void {
    localStorage.setItem(config.auth.userKey, JSON.stringify(user));
  }

  /**
   * Get stored user data
   */
  getStoredUser(): User | null {
    const userStr = localStorage.getItem(config.auth.userKey);
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await this.api.post<AuthResponse>('/register', data);
      
      if (response.data.success && response.data.tokens && response.data.user) {
        this.setTokens(response.data.tokens);
        this.setUser(response.data.user);
      }
      
      return response.data;
    } catch (error: any) {
      const authError: AuthError = {
        message: error.response?.data?.error?.message || 'Registration failed',
        code: error.response?.data?.error?.code,
        statusCode: error.response?.status,
      };
      
      return {
        success: false,
        error: authError,
      };
    }
  }

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await this.api.post<AuthResponse>('/login', credentials);
      
      if (response.data.success && response.data.tokens && response.data.user) {
        this.setTokens(response.data.tokens);
        this.setUser(response.data.user);
      }
      
      return response.data;
    } catch (error: any) {
      const authError: AuthError = {
        message: error.response?.data?.error?.message || 'Login failed',
        code: error.response?.data?.error?.code,
        statusCode: error.response?.status,
      };
      
      return {
        success: false,
        error: authError,
      };
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      const token = this.getAccessToken();
      if (token) {
        await this.api.post('/logout', {}, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuthData();
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<boolean> {
    // If already refreshing, wait for that promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this._performRefresh();
    
    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async _performRefresh(): Promise<boolean> {
    try {
      const response = await this.api.post<{
        success: boolean;
        accessToken: string;
        expiresIn?: number;
      }>('/refresh');
      
      if (response.data.success && response.data.accessToken) {
        localStorage.setItem(config.auth.tokenKey, response.data.accessToken);
        
        if (response.data.expiresIn) {
          const expiryTime = Date.now() + response.data.expiresIn * 1000;
          localStorage.setItem('tokenExpiry', expiryTime.toString());
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearAuthData();
      return false;
    }
  }

  /**
   * Get current user from API
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const token = this.getAccessToken();
      if (!token) return null;

      // Check if token needs refresh
      if (this.isTokenExpired()) {
        const refreshed = await this.refreshToken();
        if (!refreshed) return null;
      }

      const response = await this.api.get<{
        success: boolean;
        user: User;
      }>('/me', {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      });
      
      if (response.data.success && response.data.user) {
        this.setUser(response.data.user);
        return response.data.user;
      }
      
      return null;
    } catch (error: any) {
      if (error.response?.status === 401) {
        // Try to refresh token
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry the request
          return this.getCurrentUser();
        }
      }
      
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileData): Promise<AuthResponse> {
    try {
      const token = this.getAccessToken();
      if (!token) {
        return {
          success: false,
          error: { message: 'Not authenticated' },
        };
      }

      const response = await this.api.put<AuthResponse>('/profile', data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.data.success && response.data.user) {
        this.setUser(response.data.user);
      }
      
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || 'Profile update failed',
          code: error.response?.data?.error?.code,
          statusCode: error.response?.status,
        },
      };
    }
  }

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordData): Promise<AuthResponse> {
    try {
      const token = this.getAccessToken();
      if (!token) {
        return {
          success: false,
          error: { message: 'Not authenticated' },
        };
      }

      const response = await this.api.post<AuthResponse>('/change-password', data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || 'Password change failed',
          code: error.response?.data?.error?.code,
          statusCode: error.response?.status,
        },
      };
    }
  }

  /**
   * Verify if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;
    
    return !this.isTokenExpired();
  }

  /**
   * Decode the current token
   */
  decodeToken(): TokenPayload | null {
    const token = this.getAccessToken();
    if (!token) return null;
    
    try {
      return jwtDecode<TokenPayload>(token);
    } catch {
      return null;
    }
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    const user = this.getStoredUser();
    return user?.role === role;
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  /**
   * Check if user is moderator or admin
   */
  isModerator(): boolean {
    const user = this.getStoredUser();
    return user?.role === 'moderator' || user?.role === 'admin';
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;