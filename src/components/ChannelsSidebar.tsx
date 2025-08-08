"use client"

import { useState } from "react";
import { Hash, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { mockProjects, mockRecentUsers } from "@/data/mockData";
import { Button } from "@/components/ui/headless-button";
import { ScrollArea } from "@/components/ui/headless-scroll-area";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CreateChannelModal } from "@/components/ChatArea/modals/CreateChannelModal";
import { useToast } from "@/hooks/use-toast";

interface ChannelsSidebarProps {
  selectedProjectId: string;
  selectedChannelId: string;
}

export function ChannelsSidebar({ selectedProjectId, selectedChannelId }: ChannelsSidebarProps) {
  const router = useRouter();
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const { toast } = useToast();
  const project = mockProjects.find(p => p.id === selectedProjectId);
  
  if (!project) return null;

  const textChannels = project.channels.filter(c => c.type === 'text');

  const handleChannelSelect = (channelId: string) => {
    router.push(`/project/${selectedProjectId}/channel/${channelId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="w-72 flex-shrink-0 bg-muted border-r border-border flex flex-col">
      {/* Project Header */}
      <div className="h-[60px] px-4 flex items-center border-b border-border">
        <div className={`w-4 h-4 rounded mr-3 flex-shrink-0 ${project.color}`} />
        <div>
          <h2 className="font-bold text-foreground">{project.name}</h2>
          <p className="text-sm text-muted-foreground">{project.members} members</p>
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
            
            <div className="space-y-1">
              {textChannels.map((channel) => (
                <Button
                  key={channel.id}
                  variant="ghost"
                  className={`w-full justify-start h-8 px-2 ${
                    selectedChannelId === channel.id 
                      ? 'bg-primary/20 hover:bg-primary/25 text-foreground' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-primary/10'
                  }`}
                  onClick={() => handleChannelSelect(channel.id)}
                >
                  <Hash className="h-3 w-3 mr-2" />
                  <span className="text-sm">{channel.name}</span>
                  {channel.unread > 0 && (
                    <span className="ml-auto bg-blue-900 text-white text-xs rounded-sm px-1.5 py-0.5 min-w-[16px] h-4 flex items-center justify-center">
                      {channel.unread}
                    </span>
                  )}
                </Button>
              ))}
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
                  className="flex items-center px-2 py-1.5 hover:bg-primary/10 rounded cursor-pointer"
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
        projectName={project.name}
        onChannelCreated={(channel) => {
          // Add the new channel to the project (in a real app, this would be an API call)
          console.log('Channel created:', channel);
          
          // Navigate to the new channel
          router.push(`/project/${selectedProjectId}/channel/${channel.id}`);
          
          // Show system message in the new channel
          toast({
            title: "Channel created",
            description: `#${channel.name} has been created successfully`,
          });
        }}
      />
    </div>
  );
}