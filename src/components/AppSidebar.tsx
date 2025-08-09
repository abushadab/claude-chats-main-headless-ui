"use client"

import { useState } from "react";
import { Settings, PanelLeftClose, PanelLeft, Plus, CheckCircle, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/headless-sidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/headless-button";
import { Input } from "@/components/ui/headless-input";
import { Textarea } from "@/components/ui/textarea";
import { useProjects } from "@/hooks/useProjects";
import { useToast } from "@/hooks/use-toast";
import type { Project } from "@/types/project.types";

interface AppSidebarProps {
  selectedProjectId: string;
}

export function AppSidebar({ selectedProjectId }: AppSidebarProps) {
  const router = useRouter();
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
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
    // Find the project to get its slug
    const project = projects.find(p => p.project_id === projectId);
    if (!project) return;
    
    // Fetch channels for this specific project only
    try {
      const { chatService } = await import('@/services/chat.service');
      const projectChannels = await chatService.getChannels(projectId);
      
      if (projectChannels.length > 0) {
        const firstChannel = projectChannels[0];
        const channelSlug = firstChannel.slug || firstChannel.name.toLowerCase().replace(/\s+/g, '-');
        router.push(`/project/${project.slug}/channel/${channelSlug}`);
      } else {
        // No channels in project, just navigate to default channel
        router.push(`/project/${project.slug}/channel/general`);
      }
    } catch (error) {
      console.error('Error fetching project channels:', error);
      // Fallback to general channel
      router.push(`/project/${project.slug}/channel/general`);
    }
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
        console.log('Project created:', newProject);
        
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

  return (
    <Sidebar className={collapsed ? "w-16 collapsed-sidebar transition-all duration-300" : "w-64 transition-all duration-300"} collapsible="icon">
      <SidebarContent className={`bg-sidebar flex flex-col ${collapsed ? 'collapsed-content' : ''}`}>
        {/* Fixed Header Section */}
        <div className={`h-14 flex items-center bg-sidebar flex-shrink-0 overflow-hidden ${collapsed ? 'px-2 justify-center collapsed-header' : 'px-3 justify-between'}`}>
          {!collapsed ? (
            <>
              <h1 className="font-semibold text-sidebar-foreground whitespace-nowrap">
                Wisdom Network
              </h1>
              <button
                onClick={() => toggleSidebar()}
                className="p-1.5 hover:bg-accent rounded-md transition-colors"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="h-5 w-5 text-muted-foreground" />
              </button>
            </>
          ) : (
            <button
              onClick={() => toggleSidebar()}
              className="p-1.5 hover:bg-accent rounded-md transition-colors"
              aria-label="Expand sidebar"
            >
              <PanelLeft className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
        </div>
        
        {/* Scrollable Content */}
        <SidebarGroup className="flex-1 overflow-y-auto">
          <SidebarGroupContent className={collapsed ? "!space-y-3" : ""}>
            <SidebarMenu className={collapsed ? "!space-y-3" : ""}>
              {projects.map((project) => {
                const isSelected = selectedProjectId === project.project_id;
                const initials = getProjectInitials(project.name);
                const colors = getProjectColors(project);
                const hasUnread = project.unread_count && project.unread_count > 0;
                
                return (
                  <SidebarMenuItem key={project.project_id}>
                    <SidebarMenuButton 
                      className={collapsed 
                        ? `collapsed-button w-10 h-10 p-0 flex items-center justify-center mx-auto rounded-lg transition-colors hover:bg-transparent relative`
                        : `w-full h-10 justify-start px-3 hover:bg-transparent relative ${
                            isSelected ? 'bg-primary/20' : ''
                          }`
                      }
                      onClick={() => handleProjectSelect(project.project_id)}
                    >
                      {collapsed ? (
                        <>
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
                        </>
                      ) : (
                        <div className="flex items-center w-full">
                          <div className={`w-7 h-7 ${colors.bg} ${colors.text} rounded-md text-xs font-semibold flex items-center justify-center flex-shrink-0`}>
                            {initials}
                          </div>
                          <span className="ml-3 truncate flex-1">{project.name}</span>
                          {hasUnread && (
                            <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                              {project.unread_count}
                            </span>
                          )}
                        </div>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
            
            {/* Create Project Button */}
            <div className={`mt-2 ${collapsed ? 'px-0' : 'px-2'}`}>
              <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className={collapsed 
                      ? `w-10 h-10 p-0 flex items-center justify-center mx-auto rounded-lg transition-colors border border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 hover:bg-accent`
                      : `w-full h-10 justify-start px-3 border border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 hover:bg-accent rounded-lg transition-colors`
                    }
                  >
                    {collapsed ? (
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Create Project</span>
                      </>
                    )}
                  </Button>
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
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* Bottom Bar with Settings */}
        <div className={`h-14 bg-sidebar flex items-center flex-shrink-0 ${
          collapsed ? 'px-2 justify-center' : 'px-3'
        }`}>
          <button
            className={collapsed
              ? 'p-2 hover:bg-accent rounded-lg transition-colors'
              : 'w-full flex items-center gap-3 px-3 py-2 hover:bg-primary/10 rounded-lg transition-colors'
            }
            title={collapsed ? 'Settings' : undefined}
            onClick={() => router.push('/settings')}
          >
            <Settings className={collapsed ? 'h-5 w-5 text-muted-foreground' : 'h-4 w-4 text-muted-foreground'} />
            {!collapsed && <span className="text-sm">Settings</span>}
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}