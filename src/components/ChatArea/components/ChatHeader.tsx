"use client"

import { Button } from "@/components/ui/headless-button";
import { Hash, Users, Info, Search } from "lucide-react";
import type { Channel } from "@/types/chat.types";
import type { Project } from "@/types/project.types";

interface ChatHeaderProps {
  channel: Channel;
  project: Project;
  showRightSidebar: boolean;
  onToggleSidebar: () => void;
  onShowMembers: () => void;
  onShowSearch: () => void;
}

export function ChatHeader({ channel, project, showRightSidebar, onToggleSidebar, onShowMembers, onShowSearch }: ChatHeaderProps) {
  return (
    <div className="h-[60px] border-b border-border bg-background px-4 flex items-center justify-between">
      <div className="flex items-center">
        <Hash className="h-5 w-5 text-muted-foreground mr-2" />
        <div>
          <h2 className="font-semibold text-foreground">{channel.name}</h2>
          <p className="text-sm text-muted-foreground">{project.member_count} members</p>
        </div>
        {channel.is_private && (
          <span className="ml-2 text-xs bg-muted px-2 py-1 rounded">Private</span>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onShowSearch}
          title="Search messages (Ctrl+F)"
        >
          <Search className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onShowMembers}
          title="View members"
        >
          <Users className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onToggleSidebar}
          className={showRightSidebar ? "bg-accent" : ""}
          title="Toggle sidebar"
        >
          <Info className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}