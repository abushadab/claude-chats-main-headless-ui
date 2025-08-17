"use client"

import { useEffect, useRef } from "react";
import { Hash } from "lucide-react";
import { SlackStyleMessage } from "./SlackStyleMessage";
import type { Channel, Message } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

interface MessagesAreaSlackProps {
  filteredMessages: Message[];
  channel: Channel;
  selectedChannelId: string;
  isLoadingMessages?: boolean;
  pinnedMessageIds: Set<string>;
  editedMessages: Map<string, string>;
  deletingMessages: Set<string>;
  editingMessage: string | null;
  editContent: string;
  setEditContent: (content: string) => void;
  showDeleteModal: string | null;
  messageRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
  handlePinMessage: (messageId: string) => void;
  handleUnpinMessage: (messageId: string) => void;
  handleEditMessage: (messageId: string) => void;
  handleSaveEdit: (messageId: string) => void;
  handleCancelEdit: () => void;
  setShowDeleteModal: (messageId: string | null) => void;
}

export function MessagesAreaSlack({
  filteredMessages,
  channel,
  selectedChannelId,
  isLoadingMessages = false,
  pinnedMessageIds,
  editedMessages,
  deletingMessages,
  editingMessage,
  editContent,
  setEditContent,
  showDeleteModal,
  messageRefs,
  handlePinMessage,
  handleUnpinMessage,
  handleEditMessage,
  handleSaveEdit,
  handleCancelEdit,
  setShowDeleteModal,
}: MessagesAreaSlackProps) {
  const { user } = useAuth();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(0);
  
  // Check if user is near bottom of scroll
  const isNearBottom = () => {
    if (!scrollContainerRef.current) return true;
    const threshold = 150;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    return distanceFromBottom < threshold;
  };
  
  // Scroll to bottom
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end'
      });
    }
  };
  
  // Track if user was at bottom before update
  const wasAtBottomRef = useRef(true);
  
  // Check scroll position before messages update
  useEffect(() => {
    wasAtBottomRef.current = isNearBottom();
  });
  
  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (filteredMessages.length > lastMessageCountRef.current) {
      if (wasAtBottomRef.current) {
        requestAnimationFrame(() => {
          scrollToBottom(true);
        });
      }
    }
    lastMessageCountRef.current = filteredMessages.length;
  }, [filteredMessages.length]);
  
  // Initial scroll to bottom when component mounts or channel changes
  useEffect(() => {
    lastMessageCountRef.current = filteredMessages.length;
    setTimeout(() => {
      scrollToBottom(false);
    }, 100);
  }, [channel.id]);

  // Helper to check if messages are consecutive (from same user within 5 minutes)
  const isConsecutiveMessage = (currentMsg: Message, prevMsg: Message | undefined) => {
    if (!prevMsg) return false;
    
    const isSameUser = (currentMsg.user_id === prevMsg.user_id) && 
                       (currentMsg.from_agent === prevMsg.from_agent);
    
    if (!isSameUser) return false;
    
    // Check if within 5 minutes
    const currentTime = new Date(currentMsg.created_at).getTime();
    const prevTime = new Date(prevMsg.created_at).getTime();
    const fiveMinutes = 5 * 60 * 1000;
    
    return (currentTime - prevTime) < fiveMinutes;
  };

  // Group messages by date
  const getMessageDate = (message: Message) => {
    const date = new Date(message.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  let lastDate = '';
  
  return (
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
      <div className="pb-4">
        {filteredMessages.length === 0 ? (
          isLoadingMessages ? null : (
            // Empty State
            <div className="flex-1 flex items-center justify-center h-full min-h-[400px]">
              <div className="text-center max-w-2xl mx-auto px-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Hash className="h-8 w-8 text-primary/60" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Welcome to #{channel.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  This is the beginning of #{channel.name} channel.
                </p>
              </div>
            </div>
          )
        ) : (
          filteredMessages.map((message, index) => {
            const prevMessage = index > 0 ? filteredMessages[index - 1] : undefined;
            const isConsecutive = isConsecutiveMessage(message, prevMessage);
            const isCurrentUser = user?.id === message.user_id;
            const isPinned = pinnedMessageIds.has(message.message_id);
            const isEditing = editingMessage === message.message_id;
            
            // Date separator
            const messageDate = getMessageDate(message);
            const showDateSeparator = messageDate !== lastDate;
            if (showDateSeparator) {
              lastDate = messageDate;
            }
            
            // System messages
            if (message.type === 'system') {
              return (
                <div key={message.message_id} className="flex items-center justify-center my-4 px-5">
                  <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                    {message.content}
                  </div>
                </div>
              );
            }
            
            return (
              <div key={message.message_id}>
                {/* Date Separator */}
                {showDateSeparator && (
                  <div className="flex items-center my-4 px-5">
                    <div className="h-px bg-border flex-1" />
                    <span className="px-3 text-xs font-medium text-muted-foreground">
                      {messageDate}
                    </span>
                    <div className="h-px bg-border flex-1" />
                  </div>
                )}
                
                {/* Message */}
                <SlackStyleMessage
                  message={message}
                  isConsecutive={isConsecutive}
                  isCurrentUser={isCurrentUser}
                  isPinned={isPinned}
                  isEditing={isEditing}
                  editContent={editContent}
                  onEditStart={() => handleEditMessage(message.message_id)}
                  onEditSave={() => handleSaveEdit(message.message_id)}
                  onEditCancel={handleCancelEdit}
                  onEditContentChange={setEditContent}
                  onDelete={() => setShowDeleteModal(message.message_id)}
                  onPin={() => handlePinMessage(message.message_id)}
                  onUnpin={() => handleUnpinMessage(message.message_id)}
                  messageRef={(el) => {
                    if (el) {
                      messageRefs.current[message.message_id] = el;
                    }
                  }}
                />
              </div>
            );
          })
        )}
        {/* Invisible element at the end for scroll targeting */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}