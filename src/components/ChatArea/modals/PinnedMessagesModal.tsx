"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/headless-scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/headless-avatar";
import { Pin, Search } from "lucide-react";

interface PinnedMessage {
  id: string;
  content: string;
  author: {
    name: string;
    avatar: string;
    type: 'current_user' | 'ai-agent' | 'human';
  };
  timestamp: string;
  pinnedBy: string;
  channelId: string;
}

interface PinnedMessagesModalProps {
  showPinnedMessagesModal: boolean;
  onClose: () => void;
  pinnedMessages: PinnedMessage[];
  onScrollToMessage: (messageId: string) => void;
  onCloseRightSidebar?: () => void;
}

export function PinnedMessagesModal({ 
  showPinnedMessagesModal, 
  onClose,
  pinnedMessages,
  onScrollToMessage,
  onCloseRightSidebar
}: PinnedMessagesModalProps) {
  
  const handleMessageClick = (messageId: string) => {
    onScrollToMessage(messageId);
    onClose();
    // Also close the right sidebar if it's open
    if (onCloseRightSidebar) {
      onCloseRightSidebar();
    }
  };

  return (
    <Dialog open={showPinnedMessagesModal} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Pin className="h-5 w-5 mr-2" />
            Pinned Messages ({pinnedMessages.length})
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 p-2">
            {pinnedMessages.map((message) => (
              <div 
                key={message.id} 
                className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer group"
                onClick={() => handleMessageClick(message.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {message.author.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">{message.author.name}</div>
                      <div className="text-xs text-muted-foreground">{message.timestamp}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Pin className="h-4 w-4 text-primary fill-current" />
                    <span className="text-xs text-muted-foreground">Pinned by {message.pinnedBy}</span>
                  </div>
                </div>
                <div className="text-sm leading-relaxed mb-2">
                  {message.content}
                </div>
                <div className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                  <Search className="h-3 w-3 mr-1" />
                  Click to jump to message
                </div>
              </div>
            ))}
            {pinnedMessages.length === 0 && (
              <div className="text-center py-8">
                <Pin className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No pinned messages yet</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Hover over a message and click the pin icon to pin it
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}