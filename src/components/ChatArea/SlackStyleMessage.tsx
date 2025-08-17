"use client"

import { useState } from "react";
import { 
  MoreHorizontal, 
  Smile, 
  Reply, 
  Share2, 
  Bookmark,
  Edit3,
  Trash2,
  Pin,
  Check,
  X
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/headless-avatar";
import { Button } from "@/components/ui/headless-button";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import type { Message } from "@/types";
import { formatMessageTime } from "@/lib/utils";

interface SlackStyleMessageProps {
  message: Message;
  isConsecutive: boolean;
  isCurrentUser: boolean;
  isPinned: boolean;
  isEditing: boolean;
  editContent: string;
  onEditStart: () => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onEditContentChange: (content: string) => void;
  onDelete: () => void;
  onPin: () => void;
  onUnpin: () => void;
  onReply?: () => void;
  messageRef?: (el: HTMLDivElement | null) => void;
}

export function SlackStyleMessage({
  message,
  isConsecutive,
  isCurrentUser,
  isPinned,
  isEditing,
  editContent,
  onEditStart,
  onEditSave,
  onEditCancel,
  onEditContentChange,
  onDelete,
  onPin,
  onUnpin,
  onReply,
  messageRef
}: SlackStyleMessageProps) {
  const [showActions, setShowActions] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const username = message.username || message.user?.username || message.full_name || 'Unknown User';
  const avatarInitials = username
    .replace(/-/g, ' ')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Format time - only show on hover or first message
  const messageTime = new Date(message.created_at).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  // Compact time for hover display (no AM/PM)
  const hoverTime = new Date(message.created_at).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).replace(/ [AP]M/i, '');

  return (
    <div 
      ref={messageRef}
      className={`group relative flex items-start px-5 py-1 hover:bg-accent/50 transition-colors ${
        isConsecutive ? '' : 'mt-4'
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        if (!showMoreMenu) setShowMoreMenu(false);
      }}
    >
      {/* Avatar - Only show for first message in group */}
      <div className="w-9 mr-2 flex-shrink-0">
        {!isConsecutive ? (
          <Avatar className="h-9 w-9">
            <AvatarFallback className={`text-xs font-semibold ${
              message.from_agent 
                ? 'bg-orange-500 text-white' 
                : 'bg-primary text-primary-foreground'
            }`}>
              {avatarInitials}
            </AvatarFallback>
          </Avatar>
        ) : (
          // Show time on hover for consecutive messages
          <span className="text-[11px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity block text-right relative top-[2px]">
            {hoverTime}
          </span>
        )}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        {/* Header - Only show for first message in group */}
        {!isConsecutive && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="font-semibold text-sm">
              {username}
            </span>
            <span className="text-xs text-muted-foreground">
              {messageTime}
            </span>
            {isPinned && (
              <span className="text-xs text-amber-600 flex items-center gap-1">
                <Pin className="h-3 w-3" />
                Pinned
              </span>
            )}
          </div>
        )}

        {/* Message Text */}
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editContent}
              onChange={(e) => onEditContentChange(e.target.value)}
              className="flex-1 bg-background border border-border rounded px-2 py-1 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') onEditSave();
                if (e.key === 'Escape') onEditCancel();
              }}
            />
            <Button size="sm" variant="ghost" onClick={onEditSave}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={onEditCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="text-sm text-foreground break-words">
            {message.content}
            {message.edited_at && (
              <span className="text-xs text-muted-foreground ml-1">(edited)</span>
            )}
          </div>
        )}

        {/* Thread preview if exists */}
        {message.thread_count && message.thread_count > 0 && (
          <button className="mt-1 text-xs text-primary hover:underline flex items-center gap-1">
            <Reply className="h-3 w-3" />
            {message.thread_count} {message.thread_count === 1 ? 'reply' : 'replies'}
          </button>
        )}
      </div>

      {/* Hover Actions Toolbar */}
      {showActions && !isEditing && (
        <div className="absolute right-5 top-0 bg-background border border-border rounded-md shadow-sm flex items-center z-10">
          {/* Quick Reactions */}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            title="Add reaction"
          >
            <Smile className="h-4 w-4" />
          </Button>

          {/* Reply in Thread */}
          {onReply && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={onReply}
              title="Reply in thread"
            >
              <Reply className="h-4 w-4" />
            </Button>
          )}

          {/* Share */}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            title="Share message"
          >
            <Share2 className="h-4 w-4" />
          </Button>

          {/* Bookmark */}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            title="Save for later"
          >
            <Bookmark className="h-4 w-4" />
          </Button>

          {/* More Actions */}
          <Popover open={showMoreMenu} onOpenChange={setShowMoreMenu}>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                title="More actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1" align="end">
              {/* Pin/Unpin */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-8 px-2 text-sm"
                onClick={isPinned ? onUnpin : onPin}
              >
                <Pin className="h-4 w-4 mr-2" />
                {isPinned ? 'Unpin' : 'Pin'} message
              </Button>

              {/* Edit - only for current user */}
              {isCurrentUser && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8 px-2 text-sm"
                  onClick={() => {
                    setShowMoreMenu(false);
                    onEditStart();
                  }}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit message
                </Button>
              )}

              {/* Delete - only for current user */}
              {isCurrentUser && (
                <>
                  <div className="h-px bg-border my-1" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-8 px-2 text-sm text-destructive hover:text-destructive"
                    onClick={onDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete message
                  </Button>
                </>
              )}
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}