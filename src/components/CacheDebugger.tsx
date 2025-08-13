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
        if (key.startsWith('claude_chat_')) {
          const data = localStorage.getItem(key);
          const age = cache.getAge(key.replace('claude_chat_', '')) || 0;
          const isStale = cache.isStale(key.replace('claude_chat_', ''), 60000); // 1 minute threshold
          
          entries.push({
            key: key.replace('claude_chat_', ''),
            size: data?.length || 0,
            age,
            isStale,
            hasData: !!data,
          });
        }
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
    cache.remove(key);
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
            <Badge variant="secondary">
              {cacheEntries.length} cached
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium mb-2">localStorage Cache</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {cacheEntries.map((entry) => {
                const isChannelCache = entry.key.startsWith('channels_');
                const isProjectCache = entry.key.startsWith('projects');
                
                return (
                  <div
                    key={entry.key}
                    className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <div className="font-mono truncate">{entry.key}</div>
                        {isChannelCache && (
                          <Badge variant="secondary" className="text-xs py-0">CH</Badge>
                        )}
                        {isProjectCache && (
                          <Badge variant="secondary" className="text-xs py-0">PR</Badge>
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

          <div>
            <h4 className="text-sm font-medium mb-2">React Query Cache</h4>
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