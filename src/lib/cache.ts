/**
 * Cache utilities for localStorage persistence
 * Handles serialization, expiration, and error handling
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expires?: number; // TTL in milliseconds
}

class CacheManager {
  private prefix = 'claude_chat_';
  private enabledKey = 'cache_enabled';
  private projectsCacheKey = 'projects_cache_enabled';
  private channelsCacheKey = 'channels_cache_enabled';
  private workspaceCacheKey = 'workspace_cache_enabled';

  /**
   * Check if caching is globally enabled (backwards compatibility)
   */
  isEnabled(): boolean {
    if (!this.isLocalStorageAvailable()) return false;
    
    try {
      const enabled = localStorage.getItem(this.enabledKey);
      // Default to DISABLED for testing
      return enabled === 'true';
    } catch {
      return false; // Default to disabled
    }
  }

  /**
   * Check if projects caching is enabled
   */
  isProjectsCacheEnabled(): boolean {
    if (!this.isLocalStorageAvailable()) return false;
    
    try {
      const enabled = localStorage.getItem(this.projectsCacheKey);
      // Default to following global cache setting
      return enabled !== null ? enabled === 'true' : this.isEnabled();
    } catch {
      return false;
    }
  }

  /**
   * Check if channels caching is enabled
   */
  isChannelsCacheEnabled(): boolean {
    if (!this.isLocalStorageAvailable()) return false;
    
    try {
      const enabled = localStorage.getItem(this.channelsCacheKey);
      // Default to following global cache setting
      return enabled !== null ? enabled === 'true' : this.isEnabled();
    } catch {
      return false;
    }
  }

  /**
   * Check if workspace caching is enabled
   */
  isWorkspaceCacheEnabled(): boolean {
    if (!this.isLocalStorageAvailable()) return false;
    
    try {
      const enabled = localStorage.getItem(this.workspaceCacheKey);
      // Default to following global cache setting
      return enabled !== null ? enabled === 'true' : this.isEnabled();
    } catch {
      return false;
    }
  }

  /**
   * Enable or disable caching globally
   */
  setEnabled(enabled: boolean): void {
    if (!this.isLocalStorageAvailable()) return;
    
    try {
      localStorage.setItem(this.enabledKey, enabled.toString());
      
      // If disabling cache, clear all cached data
      if (!enabled) {
        this.clear();
      }
    } catch (error) {
      console.warn('Failed to set cache enabled state:', error);
    }
  }

  /**
   * Enable or disable projects caching
   */
  setProjectsCacheEnabled(enabled: boolean): void {
    if (!this.isLocalStorageAvailable()) return;
    
    try {
      localStorage.setItem(this.projectsCacheKey, enabled.toString());
      
      // If disabling, clear projects cache
      if (!enabled) {
        this.clearProjectsCache();
      }
    } catch (error) {
      console.warn('Failed to set projects cache enabled state:', error);
    }
  }

  /**
   * Enable or disable channels caching
   */
  setChannelsCacheEnabled(enabled: boolean): void {
    if (!this.isLocalStorageAvailable()) return;
    
    try {
      localStorage.setItem(this.channelsCacheKey, enabled.toString());
      
      // If disabling, clear channels cache
      if (!enabled) {
        this.clearChannelsCache();
      }
    } catch (error) {
      console.warn('Failed to set channels cache enabled state:', error);
    }
  }

  /**
   * Enable or disable workspace caching
   */
  setWorkspaceCacheEnabled(enabled: boolean): void {
    if (!this.isLocalStorageAvailable()) return;
    
    try {
      localStorage.setItem(this.workspaceCacheKey, enabled.toString());
      
      // If disabling, clear workspace cache
      if (!enabled) {
        this.clearWorkspaceCache();
      }
    } catch (error) {
      console.warn('Failed to set workspace cache enabled state:', error);
    }
  }

  /**
   * Check if localStorage is available
   */
  private isLocalStorageAvailable(): boolean {
    try {
      return typeof window !== 'undefined' && window.localStorage !== undefined;
    } catch {
      return false;
    }
  }

  /**
   * Set item in cache with optional TTL
   */
  set<T>(key: string, data: T, ttlMs?: number, cacheType?: 'projects' | 'channels' | 'workspace'): boolean {
    // Check specific cache type or fall back to global cache setting
    let cacheEnabled = this.isEnabled();
    if (cacheType === 'projects') cacheEnabled = this.isProjectsCacheEnabled();
    else if (cacheType === 'channels') cacheEnabled = this.isChannelsCacheEnabled();
    else if (cacheType === 'workspace') cacheEnabled = this.isWorkspaceCacheEnabled();
    
    if (!this.isLocalStorageAvailable() || !cacheEnabled) return false;
    
    try {
      const cacheKey = `${this.prefix}${key}`;
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expires: ttlMs ? Date.now() + ttlMs : undefined,
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(cacheItem));
      return true;
    } catch (error) {
      console.warn('Failed to cache data:', error);
      return false;
    }
  }

  /**
   * Get item from cache, returns null if expired or not found
   */
  get<T>(key: string, cacheType?: 'projects' | 'channels' | 'workspace'): T | null {
    // Check specific cache type or fall back to global cache setting
    let cacheEnabled = this.isEnabled();
    if (cacheType === 'projects') cacheEnabled = this.isProjectsCacheEnabled();
    else if (cacheType === 'channels') cacheEnabled = this.isChannelsCacheEnabled();
    else if (cacheType === 'workspace') cacheEnabled = this.isWorkspaceCacheEnabled();
    
    if (!this.isLocalStorageAvailable() || !cacheEnabled) return null;
    
    try {
      const cacheKey = `${this.prefix}${key}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return null;

      const cacheItem: CacheItem<T> = JSON.parse(cached);
      
      // Check if expired
      if (cacheItem.expires && Date.now() > cacheItem.expires) {
        this.remove(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.warn('Failed to read cache:', error);
      this.remove(key); // Remove corrupted cache
      return null;
    }
  }

  /**
   * Check if cache item exists and is not expired
   */
  has(key: string, cacheType?: 'projects' | 'channels' | 'workspace'): boolean {
    return this.get(key, cacheType) !== null;
  }

  /**
   * Get cache age in milliseconds
   */
  getAge(key: string): number | null {
    if (!this.isLocalStorageAvailable()) return null;
    
    try {
      const cacheKey = `${this.prefix}${key}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return null;

      const cacheItem: CacheItem<any> = JSON.parse(cached);
      return Date.now() - cacheItem.timestamp;
    } catch {
      return null;
    }
  }

  /**
   * Check if cache is stale (older than threshold)
   */
  isStale(key: string, staleThresholdMs: number): boolean {
    const age = this.getAge(key);
    return age === null || age > staleThresholdMs;
  }

  /**
   * Remove item from cache
   */
  remove(key: string): void {
    if (!this.isLocalStorageAvailable()) return;
    
    try {
      const cacheKey = `${this.prefix}${key}`;
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.warn('Failed to remove cache:', error);
    }
  }

  /**
   * Clear projects cache specifically
   */
  clearProjectsCache(): void {
    if (!this.isLocalStorageAvailable()) return;
    
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix + 'projects') || key.includes('projects')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear projects cache:', error);
    }
  }

  /**
   * Clear channels cache specifically
   */
  clearChannelsCache(): void {
    if (!this.isLocalStorageAvailable()) return;
    
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix + 'channels') || key.includes('channels')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear channels cache:', error);
    }
  }

  /**
   * Clear workspace cache specifically
   */
  clearWorkspaceCache(): void {
    if (!this.isLocalStorageAvailable()) return;
    
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('workspace_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear workspace cache:', error);
    }
  }

  /**
   * Clear all cache items with our prefix
   */
  clear(): void {
    if (!this.isLocalStorageAvailable()) return;
    
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  /**
   * Clear ALL cache data including workspace, navigation, and other data
   */
  clearAll(): void {
    if (!this.isLocalStorageAvailable()) return;
    
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        // Clear all cache-related data
        if (key.startsWith(this.prefix) || 
            key.startsWith('workspace_') ||
            key.startsWith('last_') ||
            key.includes('last_channel_') ||
            key === 'cache_enabled') {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear all cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { count: number; totalSize: number } {
    if (!this.isLocalStorageAvailable()) return { count: 0, totalSize: 0 };
    
    let count = 0;
    let totalSize = 0;

    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          count++;
          totalSize += localStorage.getItem(key)?.length || 0;
        }
      });
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
    }

    return { count, totalSize };
  }
}

// Export singleton instance
export const cache = new CacheManager();

// Cache keys constants
export const CACHE_KEYS = {
  PROJECTS: 'projects',
  PROJECT_PREFIX: 'project_',
  CHANNELS_PREFIX: 'channels_',
  USER_PROFILE: 'user_profile',
  WORKSPACE_PREFIX: 'workspace_',
} as const;

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  PROJECTS: 15 * 60 * 1000,    // 15 minutes (very stable)
  PROJECT: 10 * 60 * 1000,     // 10 minutes (stable)
  CHANNELS: 10 * 60 * 1000,    // 10 minutes (channels rarely change)
  USER_PROFILE: 15 * 60 * 1000, // 15 minutes (very stable)
  MESSAGES: 30 * 1000,         // 30 seconds (real-time data)
} as const;

// Stale thresholds - when to trigger background refresh
export const STALE_THRESHOLD = {
  PROJECTS: 5 * 60 * 1000,     // 5 minutes (background refresh)
  PROJECT: 3 * 60 * 1000,      // 3 minutes (background refresh)
  CHANNELS: 5 * 60 * 1000,     // 5 minutes (channels are stable)
  USER_PROFILE: 5 * 60 * 1000, // 5 minutes
  MESSAGES: 5 * 1000,          // 5 seconds (keep messages fresh)
} as const;