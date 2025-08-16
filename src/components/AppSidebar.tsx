"use client"

import { useState, useEffect } from "react";
import { Settings, Plus, CheckCircle, Sparkles, User, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/headless-avatar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { DiscordTooltip } from "@/components/ui/discord-tooltip";
import { cache, CACHE_KEYS, CACHE_TTL } from "@/lib/cache";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/headless-sidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/headless-button";
import { Input } from "@/components/ui/headless-input";
import { Textarea } from "@/components/ui/textarea";
import { useProjects } from "@/hooks/useProjects";
import { useToast } from "@/hooks/use-toast";
import type { Project } from "@/types/project.types";
import type { Channel } from "@/types/chat.types";

interface AppSidebarProps {
  selectedProjectId: string;
  isLoading?: boolean;
}

export function AppSidebar({ selectedProjectId, isLoading = false }: AppSidebarProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  // Use real projects API
  const { projects, createProject } = useProjects();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState("bg-blue-500");
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleProjectSelect = async (projectId: string) => {
    // Prevent double navigation and clicking on already selected project
    if (selectedProjectId === projectId) return;
    
    // Find the project to get its slug
    const project = projects.find(p => p.project_id === projectId);
    if (!project) return;
    
    // Check if we have a last visited channel for this project (only if projects caching is enabled)
    const lastChannelKey = `last_channel_${projectId}`;
    const lastChannel = cache.isProjectsCacheEnabled() ? localStorage.getItem(lastChannelKey) : null;
    
    let targetUrl = `/project/${project.slug}/channel/general`; // default fallback
    
    if (lastChannel) {
      // Use the last visited channel
      targetUrl = `/project/${project.slug}/channel/${lastChannel}`;
    } else {
      // No last channel saved, try to get the first channel for this project
      try {
        // Check if we have cached channels for this project
        const channelsCacheKey = `${CACHE_KEYS.CHANNELS_PREFIX}${projectId}`;
        const cachedChannels = cache.get<Channel[]>(channelsCacheKey, 'channels');
        
        if (cachedChannels && cachedChannels.length > 0) {
          // Smart channel selection:
          // 1. Try to find a channel with messages (non-empty)
          // 2. Otherwise use "general" if it exists
          // 3. Otherwise use the first channel
          let selectedChannel = cachedChannels.find(c => c.last_message_at) ||
                               cachedChannels.find(c => c.slug === 'general' || c.name.toLowerCase() === 'general') ||
                               cachedChannels[0];
          
          // console.log('Using channel from cache:', selectedChannel.slug || selectedChannel.name);
          targetUrl = `/project/${project.slug}/channel/${selectedChannel.slug || selectedChannel.name.toLowerCase().replace(/\s+/g, '-')}`;
        } else {
          // No cache found, fetch channels to determine the first channel
          // console.log('No cached channels, fetching for project:', projectId);
          const { chatService } = await import('@/services/chat.service');
          const channels = await chatService.getChannels(projectId);
          
          if (channels && channels.length > 0) {
            // console.log('Fetched channels:', channels.map(c => c.slug || c.name));
            // Cache the channels for future use if caching is enabled
            if (cache.isChannelsCacheEnabled()) {
              cache.set(channelsCacheKey, channels, CACHE_TTL.CHANNELS, 'channels');
            }
            
            // Smart channel selection (same logic as cached):
            // 1. Try to find a channel with messages (non-empty)
            // 2. Otherwise use "general" if it exists
            // 3. Otherwise use the first channel
            let selectedChannel = channels.find(c => c.last_message_at) ||
                                 channels.find(c => c.slug === 'general' || c.name.toLowerCase() === 'general') ||
                                 channels[0];
            
            // console.log('Using channel:', selectedChannel.slug || selectedChannel.name);
            targetUrl = `/project/${project.slug}/channel/${selectedChannel.slug || selectedChannel.name.toLowerCase().replace(/\s+/g, '-')}`;
          } else {
            // console.log('No channels found for project:', projectId);
          }
        }
      } catch (error) {
        // console.warn('Failed to fetch channels for project navigation:', error);
        // Fall back to general channel
      }
    }
    
    // Navigate immediately
    router.push(targetUrl);
  };

  const availableColors = [
    { name: 'Blue', value: 'bg-blue-500', color: '#3b82f6' },
    { name: 'Purple', value: 'bg-purple-500', color: '#8b5cf6' },
    { name: 'Green', value: 'bg-green-500', color: '#10b981' },
    { name: 'Orange', value: 'bg-orange-500', color: '#f97316' },
    { name: 'Pink', value: 'bg-pink-500', color: '#ec4899' },
    { name: 'Red', value: 'bg-red-500', color: '#ef4444' },
    { name: 'Yellow', value: 'bg-yellow-500', color: '#eab308' },
    { name: 'Indigo', value: 'bg-indigo-500', color: '#6366f1' },
  ];

  const handleCreateProject = async () => {
    if (newProjectName.trim()) {
      setIsCreating(true);
      
      try {
        const projectData = {
          name: newProjectName,
          description: newProjectDescription || undefined,
        };
        
        const newProject = await createProject(projectData);
        // console.log('Project created:', newProject);
        
        // Show success animation in modal
        setIsCreating(false);
        setShowSuccess(true);
        
        // Show success toast
        toast({
          title: "Project created successfully",
          description: (
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span>{newProjectName} has been created</span>
            </div>
          ),
        });

        // Navigate to the new project after a short delay
        setTimeout(() => {
          // New projects typically start with a general channel
          router.push(`/project/${newProject.slug}/channel/general`);
        }, 1500);
        
        // Reset and close after animation
        setTimeout(() => {
          setNewProjectName('');
          setNewProjectDescription('');
          setSelectedColor('bg-blue-500');
          setShowSuccess(false);
          setShowCreateModal(false);
        }, 1500);
      } catch (error) {
        setIsCreating(false);
        toast({
          title: "Error",
          description: "Failed to create project. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const getProjectInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase();
  };

  // Convert color hex to Tailwind class
  const getProjectColorClass = (color?: string) => {
    if (!color) return 'bg-gray-500';
    
    // Map common colors to Tailwind classes
    const colorMap: Record<string, string> = {
      '#3b82f6': 'bg-blue-500',
      '#8b5cf6': 'bg-purple-500',
      '#10b981': 'bg-green-500',
      '#f97316': 'bg-orange-500',
      '#ec4899': 'bg-pink-500',
      '#ef4444': 'bg-red-500',
      '#eab308': 'bg-yellow-500',
      '#6366f1': 'bg-indigo-500',
    };
    
    return colorMap[color] || 'bg-gray-500';
  };

  const getProjectColors = (project: Project) => {
    const bgClass = getProjectColorClass(project.color);
    return {
      bg: bgClass,
      hover: bgClass.replace('500', '600'),
      text: 'text-white',
      hex: project.color || '#6b7280'
    };
  };

  // User Profile Section Component
  const UserProfileSection = () => {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    
    if (!user) {
      return (
        <div className="h-12 bg-sidebar flex items-center justify-center flex-shrink-0 px-2">
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      );
    }
    
    const getInitials = (name: string) => {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    };
    
    const handleLogout = async () => {
      setIsLoggingOut(true);
      try {
        await logout();
        router.push('/login');
      } catch (error) {
        // console.error('Logout failed:', error);
      } finally {
        setIsLoggingOut(false);
      }
    };
    
    const userInitials = getInitials(user.fullName || user.username);
    const userName = user.fullName || user.username;
    
    return (
      <div className="h-12 bg-sidebar flex items-center justify-center flex-shrink-0 border-t border-border px-2">
        <DiscordTooltip content={userName}>
          <Popover>
            <PopoverTrigger asChild>
              <button className="h-10 w-10 p-0 flex items-center justify-center hover:bg-accent rounded-lg transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-64 p-0" 
              align="start"
              side="top"
            >
            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium">{user.fullName || user.username}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </div>
              </div>
            </div>
            <div className="p-1">
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors"
                onClick={() => router.push('/profile')}
              >
                <User className="h-4 w-4" />
                Profile Settings
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors text-red-600"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut className="h-4 w-4" />
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
            </PopoverContent>
          </Popover>
        </DiscordTooltip>
      </div>
    );
  };

  return (
    <Sidebar className="w-14">
      <SidebarContent className="bg-sidebar flex flex-col">
        {/* Scrollable Content - No logo header */}
        <SidebarGroup className="flex-1 overflow-y-auto py-2 pt-3">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-3">
              {isLoading && projects.length === 0 ? (
                // Loading skeleton - only show if no cached data
                Array.from({ length: 5 }).map((_, index) => {
                  const isFirst = index === 0;
                  return (
                    <SidebarMenuItem key={`skeleton-${index}`} className="flex items-center justify-center">
                      <SidebarMenuButton 
                        className="w-10 h-10 p-0 flex items-center justify-center rounded-lg transition-colors hover:bg-transparent relative"
                        disabled
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isFirst ? 'ring-2 ring-offset-2 ring-offset-background ring-primary' : ''
                        }`}>
                          <Skeleton className="w-full h-full rounded-lg" />
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })
              ) : (
                projects.map((project) => {
                const isSelected = selectedProjectId === project.project_id;
                const initials = getProjectInitials(project.name);
                const colors = getProjectColors(project);
                const hasUnread = project.unread_count && project.unread_count > 0;
                
                return (
                  <SidebarMenuItem key={project.project_id} className="flex items-center justify-center">
                    <DiscordTooltip content={project.name}>
                      <SidebarMenuButton 
                        className="collapsed-button w-10 h-10 p-0 flex items-center justify-center rounded-lg transition-colors hover:bg-transparent relative"
                        onClick={() => handleProjectSelect(project.project_id)}
                        disabled={selectedProjectId === project.project_id}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${colors.bg} ${
                          isSelected 
                            ? `ring-2 ring-offset-2 ring-offset-background` 
                            : `opacity-60`
                        }`} style={isSelected ? {
                          '--tw-ring-color': colors.hex
                        } as React.CSSProperties : {}}>
                          <span className={`text-sm font-bold ${colors.text}`}>
                            {initials}
                          </span>
                        </div>
                        {hasUnread && (
                          <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-background" />
                        )}
                      </SidebarMenuButton>
                    </DiscordTooltip>
                  </SidebarMenuItem>
                );
                })
              )}
              
              {/* Create Project Button - Inside SidebarMenu for consistent spacing */}
              <SidebarMenuItem className="flex items-center justify-center">
                <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                  <DialogTrigger asChild>
                    <DiscordTooltip content="Create Project">
                      <Button
                        variant="ghost"
                        className="w-10 h-10 p-0 flex items-center justify-center rounded-lg transition-colors border border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 hover:bg-accent"
                      >
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DiscordTooltip>
                  </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>
                      {showSuccess ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          Project Created!
                        </div>
                      ) : (
                        'Create New Project'
                      )}
                    </DialogTitle>
                  </DialogHeader>
                  {showSuccess ? (
                    // Success Animation
                    <div className="py-8 text-center">
                      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">Project Created Successfully!</h3>
                      <p className="text-sm text-muted-foreground">
                        {newProjectName} is ready to use
                      </p>
                    </div>
                  ) : (
                  <div className="space-y-4 py-4">
                    {/* Project Name */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Project Name</label>
                      <Input
                        placeholder="Enter project name..."
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleCreateProject();
                          }
                        }}
                        disabled={isCreating}
                        autoFocus
                      />
                    </div>

                    {/* Project Description */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        placeholder="Enter project description..."
                        value={newProjectDescription}
                        onChange={(e) => setNewProjectDescription(e.target.value)}
                        className="min-h-[80px] resize-none"
                        disabled={isCreating}
                      />
                    </div>

                    {/* Color Selection */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Project Color</label>
                      <div className="flex flex-wrap gap-2">
                        {availableColors.map((colorOption) => (
                          <button
                            key={colorOption.value}
                            type="button"
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                              selectedColor === colorOption.value
                                ? 'ring-2 ring-offset-2 ring-offset-background'
                                : 'hover:scale-110'
                            }`}
                            style={{
                              backgroundColor: colorOption.color,
                              '--tw-ring-color': colorOption.color
                            } as React.CSSProperties}
                            onClick={() => !isCreating && setSelectedColor(colorOption.value)}
                            disabled={isCreating}
                            title={colorOption.name}
                          >
                            {selectedColor === colorOption.value && (
                              <span className="text-white text-xs font-bold">
                                {getProjectInitials(newProjectName || 'New')}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {!showSuccess && (
                      <div className="flex justify-end space-x-2 pt-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowCreateModal(false)}
                          disabled={isCreating}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleCreateProject}
                          disabled={!newProjectName.trim() || isCreating}
                        >
                          {isCreating ? (
                            <>
                              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Create Project
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                  )}
                </DialogContent>
                </Dialog>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* User Profile */}
        <UserProfileSection />
        
        {/* Bottom Bar with Settings */}
        <div className="h-12 bg-sidebar flex items-center flex-shrink-0 px-2 justify-center gap-1">
          {isLoading && projects.length === 0 ? (
            <Skeleton className="h-9 w-9 rounded-lg" />
          ) : (
            <>
              <DiscordTooltip content="Test Loading Screen">
                <button
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                  onClick={() => router.push('/test-loading')}
                >
                  <div className="h-5 w-5 text-muted-foreground flex items-center justify-center text-xs font-bold">
                    L
                  </div>
                </button>
              </DiscordTooltip>
              <DiscordTooltip content="Settings">
                <button
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                  onClick={() => router.push('/settings')}
                >
                  <Settings className="h-5 w-5 text-muted-foreground" />
                </button>
              </DiscordTooltip>
            </>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}