/**
 * Enhanced Cache Debugger Component
 * Detailed cache monitoring with better organization
 */

"use client"

import { useState, useEffect } from 'react';
import { cache, CACHE_KEYS } from '@/lib/cache';
import { Button } from '@/components/ui/headless-button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/headless-scroll-area';
import { 
  Trash2, 
  RefreshCw, 
  Database, 
  Clock, 
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Copy,
  Check,
  FileJson,
  Activity,
  HardDrive,
  Zap
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CacheEntry {
  key: string;
  fullKey: string;
  size: number;
  sizeFormatted: string;
  age: number;
  ageFormatted: string;
  expiresAt?: number;
  expiresIn?: string;
  category: 'projects' | 'channels' | 'members' | 'workspace' | 'navigation' | 'settings' | 'other';
  value: any;
  rawValue: string;
}

interface CacheStats {
  totalSize: number;
  totalEntries: number;
  categoryCounts: Record<string, number>;
  oldestEntry?: CacheEntry;
  newestEntry?: CacheEntry;
  largestEntry?: CacheEntry;
}

export function EnhancedCacheDebugger() {
  const [cacheEntries, setCacheEntries] = useState<CacheEntry[]>([]);
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<CacheEntry | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['projects', 'channels', 'members', 'workspace']));
  const [showRawData, setShowRawData] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const categorizeKey = (key: string): CacheEntry['category'] => {
    if (key.includes('claude_chat_projects')) return 'projects';
    if (key.includes('claude_chat_channels')) return 'channels';
    if (key.includes('claude_chat_members')) return 'members';
    if (key.includes('workspace_')) return 'workspace';
    if (key.includes('last_visited') || key.includes('last_channel')) return 'navigation';
    if (key.includes('cache_enabled') || key.includes('show_')) return 'settings';
    return 'other';
  };

  const refreshCache = () => {
    const entries: CacheEntry[] = [];
    const now = Date.now();
    
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        try {
          const rawValue = localStorage.getItem(key) || '';
          const size = new Blob([rawValue]).size;
          
          let value: any = rawValue;
          let age = 0;
          let expiresAt: number | undefined;
          
          // Try to parse as JSON to get cache metadata
          try {
            const parsed = JSON.parse(rawValue);
            if (parsed.timestamp) {
              age = now - parsed.timestamp;
            }
            if (parsed.expires) {
              expiresAt = parsed.expires;
            }
            if (parsed.data) {
              value = parsed.data;
            }
          } catch {
            // Not JSON or not cache format
          }
          
          entries.push({
            key: key.replace('claude_chat_', '').replace('workspace_', 'ws_'),
            fullKey: key,
            size,
            sizeFormatted: formatBytes(size),
            age,
            ageFormatted: age > 0 ? formatDistanceToNow(now - age, { addSuffix: true }) : 'Unknown',
            expiresAt,
            expiresIn: expiresAt && expiresAt > now ? formatDistanceToNow(expiresAt) : undefined,
            category: categorizeKey(key),
            value,
            rawValue
          });
        } catch (err) {
          console.warn(`Failed to process cache key ${key}:`, err);
        }
      });
      
      // Sort by category, then by key
      entries.sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return a.key.localeCompare(b.key);
      });
      
      // Calculate stats
      const totalSize = entries.reduce((sum, e) => sum + e.size, 0);
      const categoryCounts: Record<string, number> = {};
      entries.forEach(e => {
        categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
      });
      
      const oldestEntry = entries.reduce((oldest, e) => 
        e.age > (oldest?.age || 0) ? e : oldest, entries[0]);
      const newestEntry = entries.reduce((newest, e) => 
        e.age > 0 && e.age < (newest?.age || Infinity) ? e : newest, entries[0]);
      const largestEntry = entries.reduce((largest, e) => 
        e.size > (largest?.size || 0) ? e : largest, entries[0]);
      
      setStats({
        totalSize,
        totalEntries: entries.length,
        categoryCounts,
        oldestEntry,
        newestEntry,
        largestEntry
      });
      
      setCacheEntries(entries);
    } catch (error) {
      console.error('Failed to refresh cache:', error);
    }
  };

  useEffect(() => {
    refreshCache();
    
    if (autoRefresh) {
      const interval = setInterval(refreshCache, 2000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const deleteEntry = (key: string) => {
    try {
      localStorage.removeItem(key);
      refreshCache();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const clearCategory = (category: string) => {
    const entriesToDelete = cacheEntries.filter(e => e.category === category);
    entriesToDelete.forEach(e => {
      try {
        localStorage.removeItem(e.fullKey);
      } catch (err) {
        console.error('Failed to delete:', err);
      }
    });
    refreshCache();
  };

  const filteredEntries = searchTerm 
    ? cacheEntries.filter(e => 
        e.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.category.includes(searchTerm.toLowerCase())
      )
    : cacheEntries;

  const groupedEntries = filteredEntries.reduce((groups, entry) => {
    if (!groups[entry.category]) {
      groups[entry.category] = [];
    }
    groups[entry.category].push(entry);
    return groups;
  }, {} as Record<string, CacheEntry[]>);

  const categoryIcons: Record<string, any> = {
    projects: Database,
    channels: Database,
    members: Database,
    workspace: Database,
    navigation: Activity,
    settings: Settings,
    other: FileJson
  };

  const categoryColors: Record<string, string> = {
    projects: 'text-blue-500',
    channels: 'text-green-500',
    members: 'text-purple-500',
    workspace: 'text-orange-500',
    navigation: 'text-gray-500',
    settings: 'text-gray-500',
    other: 'text-gray-400'
  };

  return (
    <div className="w-full h-full flex flex-col">
      <Tabs defaultValue="overview" className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid grid-cols-3 w-fit">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="entries">Cache Entries</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? 'bg-primary/10' : ''}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Auto' : 'Manual'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshCache}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                cache.clear();
                refreshCache();
              }}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          </div>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="flex-1 space-y-4">
          {stats && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-card border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <HardDrive className="h-5 w-5 text-muted-foreground" />
                    <span className="text-2xl font-bold">{formatBytes(stats.totalSize)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Total Cache Size</p>
                </div>
                
                <div className="bg-card border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <Database className="h-5 w-5 text-muted-foreground" />
                    <span className="text-2xl font-bold">{stats.totalEntries}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Total Entries</p>
                </div>
                
                <div className="bg-card border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">{stats.oldestEntry?.ageFormatted || 'N/A'}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Oldest Entry</p>
                </div>
                
                <div className="bg-card border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <Zap className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">{stats.largestEntry?.sizeFormatted || 'N/A'}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Largest Entry</p>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-card border rounded-lg p-4">
                <h3 className="text-sm font-medium mb-4">Cache by Category</h3>
                <div className="space-y-2">
                  {Object.entries(stats.categoryCounts).map(([category, count]) => {
                    const percentage = (count / stats.totalEntries) * 100;
                    const categorySize = cacheEntries
                      .filter(e => e.category === category)
                      .reduce((sum, e) => sum + e.size, 0);
                    
                    return (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`capitalize ${categoryColors[category]}`}>{category}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">{formatBytes(categorySize)}</span>
                          <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-12 text-right">
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cache Settings Status */}
              <div className="bg-card border rounded-lg p-4">
                <h3 className="text-sm font-medium mb-4">Cache Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  {['Global', 'Projects', 'Channels', 'Members', 'Workspace'].map(type => {
                    const isEnabled = type === 'Global' ? cache.isEnabled() :
                      type === 'Projects' ? cache.isProjectsCacheEnabled() :
                      type === 'Channels' ? cache.isChannelsCacheEnabled() :
                      type === 'Members' ? cache.isMembersCacheEnabled() :
                      cache.isWorkspaceCacheEnabled();
                    
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm">{type} Caching</span>
                        <Badge variant={isEnabled ? 'default' : 'secondary'}>
                          {isEnabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </TabsContent>

        {/* Cache Entries Tab */}
        <TabsContent value="entries" className="flex-1">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search cache entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            />
          </div>
          
          <ScrollArea className="h-[500px] border rounded-lg">
            <div className="p-4 space-y-2">
              {Object.entries(groupedEntries).map(([category, entries]) => (
                <div key={category} className="border rounded-lg">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between p-3 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {expandedCategories.has(category) ? 
                        <ChevronDown className="h-4 w-4" /> : 
                        <ChevronRight className="h-4 w-4" />
                      }
                      <span className={`font-medium capitalize ${categoryColors[category]}`}>
                        {category}
                      </span>
                      <Badge variant="secondary">{entries.length}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatBytes(entries.reduce((sum, e) => sum + e.size, 0))}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearCategory(category);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </button>
                  
                  {expandedCategories.has(category) && (
                    <div className="border-t">
                      {entries.map(entry => (
                        <div
                          key={entry.fullKey}
                          className="flex items-center justify-between p-2 px-4 hover:bg-accent/30 cursor-pointer border-b last:border-0"
                          onClick={() => setSelectedEntry(entry)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono truncate">{entry.key}</span>
                              {entry.expiresIn && (
                                <Badge variant="outline" className="text-xs">
                                  Expires {entry.expiresIn}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-muted-foreground">{entry.sizeFormatted}</span>
                              <span className="text-xs text-muted-foreground">{entry.ageFormatted}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(entry.rawValue, entry.fullKey);
                              }}
                            >
                              {copiedKey === entry.fullKey ? 
                                <Check className="h-3 w-3 text-green-500" /> : 
                                <Copy className="h-3 w-3" />
                              }
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteEntry(entry.fullKey);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="flex-1">
          {selectedEntry ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{selectedEntry.key}</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRawData(!showRawData)}
                  >
                    {showRawData ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                    {showRawData ? 'Parsed' : 'Raw'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(selectedEntry.rawValue, selectedEntry.fullKey)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      deleteEntry(selectedEntry.fullKey);
                      setSelectedEntry(null);
                    }}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Full Key</span>
                    <p className="font-mono text-sm">{selectedEntry.fullKey}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Category</span>
                    <p className="capitalize">{selectedEntry.category}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Size</span>
                    <p>{selectedEntry.sizeFormatted}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Age</span>
                    <p>{selectedEntry.ageFormatted}</p>
                  </div>
                  {selectedEntry.expiresIn && (
                    <div>
                      <span className="text-sm text-muted-foreground">Expires In</span>
                      <p>{selectedEntry.expiresIn}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <span className="text-sm text-muted-foreground">Data</span>
                <ScrollArea className="h-[300px] mt-2 border rounded-lg">
                  <pre className="p-4 text-xs">
                    {showRawData ? 
                      selectedEntry.rawValue : 
                      JSON.stringify(selectedEntry.value, null, 2)
                    }
                  </pre>
                </ScrollArea>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              <div className="text-center">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a cache entry to view details</p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Add Settings import that was missing
import { Settings } from 'lucide-react';