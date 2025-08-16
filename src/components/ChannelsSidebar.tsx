"use client"

import React, { useState } from "react";
import { Hash, Lock, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { mockRecentUsers } from "@/data/mockData";
import { useChannels } from "@/hooks/useChannels";
import { useProjects } from "@/hooks/useProjects";
import type { Channel } from "@/types/chat.types";
import { Button } from "@/components/ui/headless-button";
import { ScrollArea } from "@/components/ui/headless-scroll-area";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CreateChannelModal } from "@/components/ChatArea/modals/CreateChannelModal";
import { useToast } from "@/hooks/use-toast";

interface ChannelsSidebarProps {
  selectedProjectId: string;
  selectedChannelId: string;
  selectedChannelSlug?: string; // Channel slug from URL for matching
  channels?: Channel[]; // Pre-fetched channels from parent
}

export function ChannelsSidebar({ selectedProjectId, selectedChannelId, selectedChannelSlug, channels: preFetchedChannels }: ChannelsSidebarProps) {
  const router = useRouter();
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const { toast } = useToast();
  const [previousChannels, setPreviousChannels] = useState<Channel[]>([]);
  
  // Always call the hook (React rules), but skip fetching if we have pre-fetched channels
  // Pass the actual project ID always - useChannels will handle skipping fetch internally
  const { 
    channels: fetchedChannels, 
    isLoading, 
    error, 
    createChannel, 
    refreshChannels 
  } = useChannels(selectedProjectId, !!preFetchedChannels);
  
  // Use pre-fetched channels if available
  const projectChannels = preFetchedChannels || fetchedChannels;
  
  // Update previous channels when we get new data (even if empty)
  React.useEffect(() => {
    if (!isLoading) {
      // Always update previous channels, even if empty
      // This prevents showing wrong project's channels during transitions
      setPreviousChannels(projectChannels);
    }
  }, [projectChannels, isLoading]);

  // Get real projects data
  const { projects } = useProjects();
  
  // Use previous channels while loading new ones to prevent flash
  const displayChannels = isLoading && projectChannels.length === 0 ? previousChannels : projectChannels;
  
  // All channels are text channels (no voice channels in current API)
  const textChannels = displayChannels;

  // Find current project from real data
  const project = projects.find(p => p.project_id === selectedProjectId);
  
  // Create a display-only fallback if project not found
  const displayProject = project || {
    project_id: selectedProjectId,
    name: 'Loading...',
    member_count: 0,
    slug: '' // Empty slug prevents navigation
  };

  const handleChannelSelect = (channel: Channel) => {
    // Only navigate if we have a real project with a valid slug
    if (!project || !project.slug) {
      // console.warn('Cannot navigate: Project not found or has no slug');
      return;
    }
    
    const channelSlug = channel.slug || channel.name.toLowerCase().replace(/\s+/g, '-');
    router.push(`/project/${project.slug}/channel/${channelSlug}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  // Handle channel creation - returns true on success, false on failure
  const handleChannelCreated = async (channelData: { 
    name: string; 
    description?: string; 
    isPrivate?: boolean; 
  }): Promise<boolean> => {
    try {
      const newChannel = await createChannel(channelData);
      
      // Navigate to the new channel (only if we have a real project)
      if (project && project.slug) {
        const channelSlug = newChannel.slug || newChannel.name.toLowerCase().replace(/\s+/g, '-');
        router.push(`/project/${project.slug}/channel/${channelSlug}`);
      }
      
      // Show success message
      toast({
        title: "Channel created",
        description: `#${newChannel.name} has been created successfully`,
      });
      
      return true; // Success
    } catch (error: any) {
      // Show error in toast (no console.error needed for expected errors)
      toast({
        title: "Error",
        description: error.message || "Failed to create channel. Please try again.",
        variant: "destructive",
      });
      
      return false; // Failure
    }
  };

  // Show error state
  if (error) {
    return (
      <div className="w-72 flex-shrink-0 bg-muted border-r border-border flex flex-col">
        <div className="h-[60px] px-4 flex items-center border-b border-border">
          <div className="text-red-500 text-sm">
            Error loading channels: {error}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Button onClick={refreshChannels} variant="outline" size="sm">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 flex-shrink-0 bg-muted border-r border-border flex flex-col">
      {/* Project Header */}
      <div className="h-[60px] px-4 flex items-center border-b border-border">
        <div className="w-4 h-4 rounded mr-3 flex-shrink-0 bg-primary" />
        <div>
          <h2 className="font-bold text-foreground">{displayProject.name}</h2>
          <p className="text-sm text-muted-foreground">{displayProject.member_count} members</p>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Channels */}
          <div>
            <div className="flex items-center justify-between mb-2 px-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Channels
              </h3>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-4 w-4 p-0 hover:bg-accent">
                    <Plus className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-2" align="end">
                  <div className="space-y-1">
                    <Button
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start h-8 px-2 text-sm"
                      onClick={() => {
                        setShowCreateChannelModal(true);
                      }}
                    >
                      <Hash className="h-4 w-4 mr-2" />
                      Create Channel
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-1 px-2">
              {isLoading && textChannels.length === 0 ? (
                // Skeleton loading state
                <>
                  <div className="w-full h-8 px-2 flex items-center space-x-2">
                    <Hash className="h-3 w-3 text-muted-foreground/30 animate-pulse" />
                    <div className="h-4 w-20 bg-muted-foreground/20 rounded animate-pulse" />
                  </div>
                  <div className="w-full h-8 px-2 flex items-center space-x-2">
                    <Lock className="h-3 w-3 text-muted-foreground/30 animate-pulse" />
                    <div className="h-4 w-24 bg-muted-foreground/20 rounded animate-pulse" />
                  </div>
                  <div className="w-full h-8 px-2 flex items-center space-x-2">
                    <Hash className="h-3 w-3 text-muted-foreground/30 animate-pulse" />
                    <div className="h-4 w-28 bg-muted-foreground/20 rounded animate-pulse" />
                  </div>
                  <div className="w-full h-8 px-2 flex items-center space-x-2">
                    <Hash className="h-3 w-3 text-muted-foreground/30 animate-pulse" />
                    <div className="h-4 w-20 bg-muted-foreground/20 rounded animate-pulse" />
                  </div>
                </>
              ) : textChannels.length === 0 ? (
                <div className="py-4 text-sm text-muted-foreground text-center">
                  No channels found
                </div>
              ) : (
                textChannels.map((channel) => {
                  // Check if this channel is selected by ID or slug
                  const isSelected = selectedChannelId === channel.channel_id || 
                    (selectedChannelSlug && (channel.slug === selectedChannelSlug || 
                    channel.name.toLowerCase().replace(/\s+/g, '-') === selectedChannelSlug));
                  
                  return (
                    <Button
                      key={channel.channel_id}
                      variant="ghost"
                      className={`w-full justify-start h-8 px-2 ${
                        isSelected
                          ? 'bg-primary/20 hover:bg-primary/25 text-foreground' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-primary/10'
                      }`}
                      onClick={() => handleChannelSelect(channel)}
                    >
                    {channel.is_private ? (
                      <Lock className="h-3 w-3 mr-2" />
                    ) : (
                      <Hash className="h-3 w-3 mr-2" />
                    )}
                    <span className="text-sm">{channel.name}</span>
                    {channel.unread_count > 0 && (
                      <span className="ml-auto bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center font-medium">
                        {channel.unread_count > 9 ? '9+' : channel.unread_count}
                      </span>
                    )}
                  </Button>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Users */}
          <div>
            <div className="flex items-center justify-between mb-2 px-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Recent Active Users
              </h3>
            </div>
            
            <div className="space-y-1">
              {mockRecentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center px-2 py-1.5 rounded"
                >
                  <div className="relative mr-2">
                    <div className={`w-6 h-6 rounded text-xs font-semibold flex items-center justify-center ${
                      user.type === 'ai-agent' && user.subType === 'claude' 
                        ? 'bg-orange-100 text-orange-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.avatar}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(user.status)}`} />
                  </div>
                  <span className="text-sm text-muted-foreground">{user.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Create Channel Modal */}
      <CreateChannelModal 
        showCreateChannelModal={showCreateChannelModal}
        onClose={() => setShowCreateChannelModal(false)}
        projectId={selectedProjectId}
        projectName={displayProject.name}
        onChannelCreated={handleChannelCreated}
      />
    </div>
  );
}