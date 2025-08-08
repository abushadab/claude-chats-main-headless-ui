"use client"

import { useState } from "react";
import { Settings, PanelLeftClose, PanelLeft, Plus } from "lucide-react";
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
import { mockProjects } from "@/data/mockData";

interface AppSidebarProps {
  selectedProjectId: string;
}

export function AppSidebar({ selectedProjectId }: AppSidebarProps) {
  const router = useRouter();
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState("bg-blue-500");

  const handleProjectSelect = (projectId: string) => {
    // Get the first channel of the selected project
    const project = mockProjects.find(p => p.id === projectId);
    if (project && project.channels.length > 0) {
      const firstChannelId = project.channels[0].id;
      router.push(`/project/${projectId}/channel/${firstChannelId}`);
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

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      // This would normally be an API call
      console.log('Creating project:', {
        name: newProjectName,
        description: newProjectDescription,
        color: selectedColor
      });
      setNewProjectName('');
      setNewProjectDescription('');
      setSelectedColor('bg-blue-500');
      setShowCreateModal(false);
      // For now, just close the modal - in real app you'd create the project and redirect
    }
  };

  const getProjectInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase();
  };

  // Define color schemes for different projects
  const projectColors: Record<string, { bg: string; hover: string; text: string }> = {
    '1': { // LaunchDB
      bg: 'bg-blue-500',
      hover: 'hover:bg-blue-600',
      text: 'text-white'
    },
    '2': { // Wisdom Network  
      bg: 'bg-purple-500',
      hover: 'hover:bg-purple-600',
      text: 'text-white'
    },
    '3': { // Data Pipeline
      bg: 'bg-green-500',
      hover: 'hover:bg-green-600',
      text: 'text-white'
    },
    '4': { // Mobile App
      bg: 'bg-orange-500',
      hover: 'hover:bg-orange-600',
      text: 'text-white'
    },
    '5': { // Analytics Hub
      bg: 'bg-pink-500',
      hover: 'hover:bg-pink-600',
      text: 'text-white'
    },
    'default': {
      bg: 'bg-gray-500',
      hover: 'hover:bg-gray-600',
      text: 'text-white'
    }
  };

  const getProjectColors = (projectId: string) => {
    return projectColors[projectId] || projectColors.default;
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
              {mockProjects.map((project) => {
                const isSelected = selectedProjectId === project.id;
                const initials = getProjectInitials(project.name);
                
                return (
                  <SidebarMenuItem key={project.id}>
                    <SidebarMenuButton 
                      className={collapsed 
                        ? `collapsed-button w-10 h-10 p-0 flex items-center justify-center mx-auto rounded-lg transition-colors hover:bg-transparent`
                        : `w-full h-10 justify-start px-3 hover:bg-transparent ${
                            isSelected ? 'bg-primary/20' : ''
                          }`
                      }
                      onClick={() => handleProjectSelect(project.id)}
                    >
                      {collapsed ? (
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${getProjectColors(project.id).bg} ${
                          isSelected 
                            ? `ring-2 ring-offset-2 ring-offset-background` 
                            : `opacity-60`
                        }`} style={isSelected ? {
                          '--tw-ring-color': getProjectColors(project.id).bg === 'bg-blue-500' ? '#3b82f6' :
                                             getProjectColors(project.id).bg === 'bg-purple-500' ? '#8b5cf6' :
                                             getProjectColors(project.id).bg === 'bg-green-500' ? '#10b981' :
                                             getProjectColors(project.id).bg === 'bg-orange-500' ? '#f97316' :
                                             getProjectColors(project.id).bg === 'bg-pink-500' ? '#ec4899' : '#6b7280'
                        } as React.CSSProperties : {}}>
                          <span className={`text-sm font-bold ${getProjectColors(project.id).text}`}>
                            {initials}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <div className={`w-7 h-7 ${getProjectColors(project.id).bg} ${getProjectColors(project.id).text} rounded-md text-xs font-semibold flex items-center justify-center flex-shrink-0`}>
                            {initials}
                          </div>
                          <span className="ml-3 truncate">{project.name}</span>
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
                    <DialogTitle>Create New Project</DialogTitle>
                  </DialogHeader>
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
                            onClick={() => setSelectedColor(colorOption.value)}
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

                    <div className="flex justify-end space-x-2 pt-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowCreateModal(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleCreateProject}
                        disabled={!newProjectName.trim()}
                      >
                        Create Project
                      </Button>
                    </div>
                  </div>
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