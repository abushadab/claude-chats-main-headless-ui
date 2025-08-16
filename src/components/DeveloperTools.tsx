"use client"

import { useState, useEffect } from "react";
import { Database, RefreshCw, Trash2, Eye, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { EnhancedCacheDebugger } from "@/components/EnhancedCacheDebugger";
import { cache } from "@/lib/cache";
import { useToast } from "@/hooks/use-toast";

export function DeveloperTools() {
  const { toast } = useToast();
  const [showCacheDebugger, setShowCacheDebugger] = useState(true);
  const [settings, setSettings] = useState({
    cacheEnabled: false,
    projectsCacheEnabled: false,
    channelsCacheEnabled: false,
    membersCacheEnabled: false,
    workspaceCacheEnabled: false,
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        setSettings({
          cacheEnabled: cache.isEnabled(),
          projectsCacheEnabled: cache.isProjectsCacheEnabled(),
          channelsCacheEnabled: cache.isChannelsCacheEnabled(),
          membersCacheEnabled: cache.isMembersCacheEnabled(),
          workspaceCacheEnabled: cache.isWorkspaceCacheEnabled(),
        });
      } catch (error) {
        console.warn('Failed to load cache settings:', error);
      }
    };
    
    loadSettings();
  }, []);

  const handleSettingChange = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // Handle cache settings
    if (key === 'cacheEnabled') {
      cache.setEnabled(value);
      if (!value) {
        // Clear all cache when disabling
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } else if (key === 'projectsCacheEnabled') {
      cache.setProjectsCacheEnabled(value);
    } else if (key === 'channelsCacheEnabled') {
      cache.setChannelsCacheEnabled(value);
    } else if (key === 'membersCacheEnabled') {
      cache.setMembersCacheEnabled(value);
    } else if (key === 'workspaceCacheEnabled') {
      cache.setWorkspaceCacheEnabled(value);
    }
  };

  const handleClearCache = (cacheType: 'all' | 'projects' | 'channels' | 'members' | 'workspace') => {
    switch (cacheType) {
      case 'all':
        cache.clear();
        toast({
          title: "Cache Cleared",
          description: "All cached data has been removed",
        });
        break;
      case 'projects':
        cache.clearProjectsCache();
        toast({
          title: "Projects Cache Cleared",
          description: "Projects cache has been removed",
        });
        break;
      case 'channels':
        cache.clearChannelsCache();
        toast({
          title: "Channels Cache Cleared",
          description: "Channels cache has been removed",
        });
        break;
      case 'members':
        cache.clearMembersCache();
        toast({
          title: "Members Cache Cleared",
          description: "Members cache has been removed",
        });
        break;
      case 'workspace':
        cache.clearWorkspaceCache();
        toast({
          title: "Workspace Cache Cleared",
          description: "Workspace cache has been removed",
        });
        break;
    }
  };

  const SettingItem = ({ 
    label, 
    description, 
    checked, 
    onChange,
    onClear
  }: { 
    label: string;
    description?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    onClear?: () => void;
  }) => (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex-1">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {description && (
          <div className="text-xs text-muted-foreground mt-1">{description}</div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {onClear && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-8 px-2"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        <Switch
          checked={checked}
          onCheckedChange={onChange}
          className="data-[state=checked]:bg-primary"
        />
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground flex items-center">
              <Database className="h-6 w-6 text-primary mr-2" />
              Developer Tools
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Cache management and debugging tools
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reload Page
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Cache Settings */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-medium text-foreground mb-4 flex items-center">
              <Database className="h-5 w-5 text-primary mr-2" />
              Cache Settings
            </h2>
            
            <div className="space-y-1">
              <SettingItem
                label="Enable Caching"
                description="Master switch for all cache functionality"
                checked={settings.cacheEnabled}
                onChange={(checked) => handleSettingChange('cacheEnabled', checked)}
                onClear={() => handleClearCache('all')}
              />
              
              <div className="pl-8 space-y-1 opacity-90">
                <SettingItem
                  label="Projects Caching"
                  description="Cache projects list and metadata"
                  checked={settings.projectsCacheEnabled}
                  onChange={(checked) => handleSettingChange('projectsCacheEnabled', checked)}
                  onClear={() => handleClearCache('projects')}
                />
                
                <SettingItem
                  label="Channels Caching"
                  description="Cache channel lists for each project"
                  checked={settings.channelsCacheEnabled}
                  onChange={(checked) => handleSettingChange('channelsCacheEnabled', checked)}
                  onClear={() => handleClearCache('channels')}
                />
                
                <SettingItem
                  label="Members Caching"
                  description="Cache project members for each project"
                  checked={settings.membersCacheEnabled}
                  onChange={(checked) => handleSettingChange('membersCacheEnabled', checked)}
                  onClear={() => handleClearCache('members')}
                />
                
                <SettingItem
                  label="Workspace Caching"
                  description="Cache complete workspace data (projects + channels + messages)"
                  checked={settings.workspaceCacheEnabled}
                  onChange={(checked) => handleSettingChange('workspaceCacheEnabled', checked)}
                  onClear={() => handleClearCache('workspace')}
                />
              </div>
            </div>
          </div>

          {/* Cache Monitor Toggle */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-foreground flex items-center">
                  <Eye className="h-5 w-5 text-primary mr-2" />
                  Cache Monitor
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Real-time view of cached data
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCacheDebugger(!showCacheDebugger)}
                className="gap-2"
              >
                {showCacheDebugger ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    Hide
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    Show
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Enhanced Cache Debugger */}
          {showCacheDebugger && (
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="h-[600px]">
                <EnhancedCacheDebugger />
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-medium text-foreground mb-4">
              Quick Actions
            </h2>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  localStorage.setItem('show_cache_settings', 'true');
                  toast({
                    title: "Cache Settings Enabled",
                    description: "Cache settings will now appear in Settings page",
                  });
                }}
              >
                Enable Cache Settings in Production
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  localStorage.removeItem('show_cache_settings');
                  toast({
                    title: "Cache Settings Hidden",
                    description: "Cache settings hidden from Settings page",
                  });
                }}
              >
                Hide Cache Settings in Production
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  sessionStorage.removeItem('claude_chat_initial_load_complete');
                  toast({
                    title: "Session Reset",
                    description: "Next navigation will show loading screen",
                  });
                }}
              >
                Reset Session State
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}