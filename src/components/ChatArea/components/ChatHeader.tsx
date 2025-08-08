"use client"

import { Button } from "@/components/ui/headless-button";
import { Hash, Users, Info } from "lucide-react";
import type { Channel, Project } from "@/data/mockData";

interface ChatHeaderProps {
  channel: Channel;
  project: Project;
  showRightSidebar: boolean;
  onToggleSidebar: () => void;
}

export function ChatHeader({ channel, project, showRightSidebar, onToggleSidebar }: ChatHeaderProps) {
  return (
    <div className="h-[60px] border-b border-border bg-background px-4 flex items-center justify-between">
      <div className="flex items-center">
        <Hash className="h-5 w-5 text-muted-foreground mr-2" />
        <div>
          <h2 className="font-semibold text-foreground">{channel.name}</h2>
          <p className="text-sm text-muted-foreground">{project.members} members</p>
        </div>
        {channel.isPrivate && (
          <span className="ml-2 text-xs bg-muted px-2 py-1 rounded">Private</span>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm">
          <Users className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onToggleSidebar}
          className={showRightSidebar ? "bg-accent" : ""}
        >
          <Info className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}