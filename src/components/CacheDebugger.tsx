/**
 * Cache Debugger Component
 * Development utility for monitoring and managing cache
 */

"use client"

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { cache } from '@/lib/cache';
import { Button } from '@/components/ui/headless-button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, RefreshCw, Database, Clock, AlertCircle } from 'lucide-react';

interface CacheEntry {
  key: string;
  size: number;
  age: number;
  isStale: boolean;
  hasData: boolean;
  category: 'cache' | 'navigation' | 'workspace' | 'other';
  value?: string;
}

interface CacheDebuggerProps {
  inline?: boolean; // Whether to render inline (in settings) or as floating overlay
}

export function CacheDebugger({ inline = false }: CacheDebuggerProps) {
  const [cacheEntries, setCacheEntries] = useState<CacheEntry[]>([]);
  const [queryClientState, setQueryClientState] = useState<any>({});
  const queryClient = useQueryClient();

  const refreshStats = () => {
    // Get localStorage cache entries
    const entries: CacheEntry[] = [];
    
    try {
      // Check if localStorage is available
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }
      
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        const data = localStorage.getItem(key);
        let category: CacheEntry['category'] = 'other';
        let cacheKey = key;
        let age = 0;
        let isStale = false;
        
        // Categorize the entries
        if (key.startsWith('claude_chat_')) {
          category = 'cache';
          cacheKey = key.replace('claude_chat_', '');
          age = cache.getAge(cacheKey) || 0;
          isStale = cache.isStale(cacheKey, 60000); // 1 minute threshold
        } else if (key.startsWith('last_') || key.includes('last_channel_')) {
          category = 'navigation';
          // For navigation entries, calculate age from timestamp if available
          try {
            const parsed = JSON.parse(data || '{}');
            if (parsed.timestamp) {
              age = Date.now() - parsed.timestamp;
              isStale = age > 300000; // 5 minutes for navigation data
            }
          } catch {
            // If not JSON, assume it's a simple string value
            age = 0;
          }
        } else if (key.startsWith('workspace_') || key.startsWith('channels_') || key.startsWith('projects')) {
          category = 'workspace';
          // Try to get age from cache if available
          try {
            const parsed = JSON.parse(data || '{}');
            if (parsed.timestamp) {
              age = Date.now() - parsed.timestamp;
              isStale = age > 300000; // 5 minutes for workspace data
            }
          } catch {
            age = 0;
          }
        }
        
        // Get a preview of the value
        let value = data;
        if (data && data.length > 100) {
          try {
            const parsed = JSON.parse(data);
            if (parsed && typeof parsed === 'object') {
              value = JSON.stringify(parsed, null, 2).substring(0, 100) + '...';
            } else {
              value = data.substring(0, 100) + '...';
            }
          } catch {
            value = data.substring(0, 100) + '...';
          }
        }
        
        entries.push({
          key: cacheKey,
          size: data?.length || 0,
          age,
          isStale,
          hasData: !!data,
          category,
          value
        });
      });
    } catch (error) {
      console.warn('Failed to read cache entries:', error);
    }

    setCacheEntries(entries);

    // Get React Query state
    const queryCache = queryClient.getQueryCache();
    const queries = queryCache.getAll();
    
    setQueryClientState({
      queryCount: queries.length,
      queries: queries.map(query => ({
        queryKey: query.queryKey,
        state: query.state.status,
        dataUpdatedAt: query.state.dataUpdatedAt,
        isStale: query.isStale(),
        isFetching: query.state.fetchStatus === 'fetching',
      })),
    });
  };

  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 2000);
    return () => clearInterval(interval);
  }, [queryClient]);

  const clearAllCache = () => {
    cache.clear();
    queryClient.clear();
    refreshStats();
  };

  const clearSpecificCache = (key: string) => {
    try {
      // Remove from cache if it's a cache entry
      cache.remove(key);
      // Also try to remove directly from localStorage
      localStorage.removeItem(key);
      // Try with claude_chat_ prefix if original key didn't work
      localStorage.removeItem(`claude_chat_${key}`);
    } catch (error) {
      console.warn('Failed to clear cache entry:', key, error);
    }
    refreshStats();
  };

  const formatAge = (age: number) => {
    if (age < 1000) return `${age}ms`;
    if (age < 60000) return `${Math.round(age / 1000)}s`;
    return `${Math.round(age / 60000)}min`;
  };

  const formatSize = (size: number) => {
    if (size < 1024) return `${size}B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
    return `${(size / 1024 / 1024).toFixed(1)}MB`;
  };

  // Don't render in production
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  // Render inline version for settings page
  if (inline) {
    return (
      <div className="w-full space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2 text-sm">
            <Badge variant={cache.isEnabled() ? 'default' : 'destructive'}>
              {cache.isEnabled() ? 'Global ON' : 'Global OFF'}
            </Badge>
            <Badge variant={cache.isProjectsCacheEnabled() ? 'default' : 'destructive'}>
              {cache.isProjectsCacheEnabled() ? 'Projects ON' : 'Projects OFF'}
            </Badge>
            <Badge variant={cache.isChannelsCacheEnabled() ? 'default' : 'destructive'}>
              {cache.isChannelsCacheEnabled() ? 'Channels ON' : 'Channels OFF'}
            </Badge>
            <Badge variant={cache.isWorkspaceCacheEnabled() ? 'default' : 'destructive'}>
              {cache.isWorkspaceCacheEnabled() ? 'Workspace ON' : 'Workspace OFF'}
            </Badge>
            <Badge variant="secondary">
              {cacheEntries.filter(e => e.category === 'navigation').length} nav
            </Badge>
            <Badge variant="secondary">
              {cacheEntries.filter(e => e.category === 'workspace').length} workspace
            </Badge>
            <Badge variant="secondary">
              {cacheEntries.filter(e => e.category === 'cache').length} cache
            </Badge>
            <Badge variant="secondary">
              {queryClientState.queryCount} queries
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={refreshStats}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              onClick={clearAllCache}
              variant="destructive"
              size="sm"
              className="h-8 px-3 text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          </div>
        </div>

        {/* Cache Entries */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Navigation Data */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Database className="h-4 w-4" />
              Navigation ({cacheEntries.filter(e => e.category === 'navigation').length})
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {cacheEntries.filter(e => e.category === 'navigation').map((entry) => (
                <div
                  key={entry.key}
                  className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-950/30 rounded text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <div className="font-mono truncate">{entry.key}</div>
                      <Badge variant="secondary" className="text-xs py-0 bg-blue-100 dark:bg-blue-900">NAV</Badge>
                    </div>
                    <div className="flex gap-2 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatAge(entry.age)}
                      </span>
                      <span>{formatSize(entry.size)}</span>
                      {entry.isStale && (
                        <Badge variant="outline" className="text-xs py-0">
                          <AlertCircle className="h-2 w-2 mr-1" />
                          Stale
                        </Badge>
                      )}
                    </div>
                    {entry.value && (
                      <div className="text-xs text-muted-foreground mt-1 font-mono truncate">
                        {entry.value}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => clearSpecificCache(entry.key)}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 ml-2"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          
          {/* Workspace Data */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Database className="h-4 w-4" />
              Workspace ({cacheEntries.filter(e => e.category === 'workspace').length})
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {cacheEntries.filter(e => e.category === 'workspace').map((entry) => {
                const isChannelCache = entry.key.startsWith('channels_');
                const isProjectCache = entry.key.startsWith('projects');
                
                return (
                  <div
                    key={entry.key}
                    className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/30 rounded text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <div className="font-mono truncate">{entry.key}</div>
                        {isChannelCache && (
                          <Badge variant="secondary" className="text-xs py-0 bg-green-100 dark:bg-green-900">CH</Badge>
                        )}
                        {isProjectCache && (
                          <Badge variant="secondary" className="text-xs py-0 bg-green-100 dark:bg-green-900">PR</Badge>
                        )}
                        {entry.key.startsWith('workspace_') && (
                          <Badge variant="secondary" className="text-xs py-0 bg-green-100 dark:bg-green-900">WS</Badge>
                        )}
                      </div>
                      <div className="flex gap-2 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatAge(entry.age)}
                        </span>
                        <span>{formatSize(entry.size)}</span>
                        {entry.isStale && (
                          <Badge variant="outline" className="text-xs py-0">
                            <AlertCircle className="h-2 w-2 mr-1" />
                            Stale
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => clearSpecificCache(entry.key)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 ml-2"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Cache & Other Data */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Database className="h-4 w-4" />
              Cache & Other ({cacheEntries.filter(e => e.category === 'cache' || e.category === 'other').length})
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {cacheEntries.filter(e => e.category === 'cache' || e.category === 'other').map((entry) => (
                <div
                  key={entry.key}
                  className={`flex items-center justify-between p-2 rounded text-xs ${
                    entry.category === 'cache' 
                      ? 'bg-purple-50 dark:bg-purple-950/30' 
                      : 'bg-muted/30'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <div className="font-mono truncate">{entry.key}</div>
                      <Badge variant="secondary" className={`text-xs py-0 ${
                        entry.category === 'cache' 
                          ? 'bg-purple-100 dark:bg-purple-900' 
                          : 'bg-gray-100 dark:bg-gray-800'
                      }`}>
                        {entry.category === 'cache' ? 'CACHE' : 'OTHER'}
                      </Badge>
                    </div>
                    <div className="flex gap-2 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatAge(entry.age)}
                      </span>
                      <span>{formatSize(entry.size)}</span>
                      {entry.isStale && (
                        <Badge variant="outline" className="text-xs py-0">
                          <AlertCircle className="h-2 w-2 mr-1" />
                          Stale
                        </Badge>
                      )}
                    </div>
                    {entry.value && (
                      <div className="text-xs text-muted-foreground mt-1 font-mono truncate">
                        {entry.value}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => clearSpecificCache(entry.key)}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 ml-2"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

        </div>
        
        {/* React Query Cache */}
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            React Query Cache ({queryClientState.queries?.length || 0})
          </h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            <div className="lg:col-span-2 xl:col-span-3">
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {queryClientState.queries?.map((query: any, index: number) => (
                  <div key={index} className="p-2 bg-muted/30 rounded text-xs">
                    <div className="font-mono truncate mb-1">
                      {JSON.stringify(query.queryKey)}
                    </div>
                    <div className="flex gap-2 text-muted-foreground">
                      <Badge variant={query.state === 'success' ? 'default' : 'secondary'} className="text-xs py-0">
                        {query.state}
                      </Badge>
                      {query.isStale && <span>stale</span>}
                      {query.isFetching && <span>fetching</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render floating version (legacy)
  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 overflow-hidden z-50">
      <Card className="bg-background/95 backdrop-blur-sm border shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Database className="h-4 w-4" />
            Cache Debugger
            <Button
              onClick={refreshStats}
              variant="ghost"
              size="sm"
              className="ml-auto h-6 w-6 p-0"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {/* Cache Statistics */}
          <div className="flex gap-2 text-xs">
            <Badge variant="secondary">
              {cacheEntries.length} cached
            </Badge>
            <Badge variant="secondary">
              {queryClientState.queryCount} queries
            </Badge>
            <Button
              onClick={clearAllCache}
              variant="destructive"
              size="sm"
              className="ml-auto h-6 px-2 text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          </div>

          {/* Cache Entries */}
          <div className="max-h-48 overflow-y-auto space-y-1">
            {cacheEntries.map((entry) => {
              const isChannelCache = entry.key.startsWith('channels_');
              const isProjectCache = entry.key.startsWith('projects');
              
              return (
                <div
                  key={entry.key}
                  className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <div className="font-mono truncate">{entry.key}</div>
                      {isChannelCache && (
                        <Badge variant="secondary" className="text-xs py-0">
                          CH
                        </Badge>
                      )}
                      {isProjectCache && (
                        <Badge variant="secondary" className="text-xs py-0">
                          PR
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatAge(entry.age)}
                      </span>
                      <span>{formatSize(entry.size)}</span>
                      {entry.isStale && (
                        <Badge variant="outline" className="text-xs py-0">
                          <AlertCircle className="h-2 w-2 mr-1" />
                          Stale
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => clearSpecificCache(entry.key)}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 ml-2"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
            
            {/* Summary stats for channels */}
            {cacheEntries.some(e => e.key.startsWith('channels_')) && (
              <div className="pt-2 border-t">
                <div className="text-xs font-medium text-muted-foreground">
                  Channels Cache: {cacheEntries.filter(e => e.key.startsWith('channels_')).length} projects cached
                </div>
              </div>
            )}
          </div>

          {/* React Query State */}
          <div className="border-t pt-2">
            <div className="text-xs font-medium mb-1">React Query</div>
            <div className="max-h-24 overflow-y-auto space-y-1">
              {queryClientState.queries?.slice(0, 3).map((query: any, index: number) => (
                <div key={index} className="text-xs bg-muted/30 p-1 rounded">
                  <div className="font-mono truncate">
                    {JSON.stringify(query.queryKey)}
                  </div>
                  <div className="flex gap-2 text-muted-foreground">
                    <Badge variant={query.state === 'success' ? 'default' : 'secondary'} className="text-xs py-0">
                      {query.state}
                    </Badge>
                    {query.isStale && <span>stale</span>}
                    {query.isFetching && <span>fetching</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}