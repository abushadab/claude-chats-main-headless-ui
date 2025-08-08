"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/headless-scroll-area";
import { Input } from "@/components/ui/headless-input";
import { Button } from "@/components/ui/headless-button";
import { Search } from "lucide-react";

interface User {
  id: string;
  name: string;
  avatar: string;
  type: 'current_user' | 'ai-agent' | 'human';
  subType?: string;
}

interface MentionModalProps {
  showMentionModal: boolean;
  onClose: () => void;
  mentionSearch: string;
  onMentionSearchChange: (search: string) => void;
  filteredUsers: User[];
  onUserSelect: (user: User) => void;
}

export function MentionModal({ 
  showMentionModal,
  onClose,
  mentionSearch,
  onMentionSearchChange,
  filteredUsers,
  onUserSelect
}: MentionModalProps) {
  
  const handleUserSelect = (user: User) => {
    onUserSelect(user);
    onClose();
  };

  const getUserTypeStyle = (type: string) => {
    if (type === 'ai-agent') {
      return 'bg-orange-100 text-orange-700';
    } else if (type === 'current_user' || type === 'human') {
      return 'bg-primary text-primary-foreground';
    }
    return 'bg-blue-100 text-blue-700';
  };

  return (
    <Dialog open={showMentionModal} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mention Someone</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={mentionSearch}
              onChange={(e) => onMentionSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <ScrollArea className="h-64">
            <div className="space-y-1">
              {filteredUsers.map((user) => (
                <Button
                  key={user.id}
                  variant="ghost"
                  className="w-full justify-start h-12 px-3"
                  onClick={() => handleUserSelect(user)}
                >
                  <div className={`w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center mr-3 ${getUserTypeStyle(user.type)}`}>
                    {user.avatar}
                  </div>
                  <span className="text-sm">{user.name}</span>
                  {user.type === 'ai-agent' && (
                    <span className="ml-auto text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                      Agent
                    </span>
                  )}
                  {user.type === 'current_user' && (
                    <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                      You
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}