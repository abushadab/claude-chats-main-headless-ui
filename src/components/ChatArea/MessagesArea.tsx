"use client"

import { useEffect, useRef } from "react";
import { Hash, Edit3, Trash2, MoreHorizontal, Pin } from "lucide-react";
import { Button } from "@/components/ui/headless-button";
import { Avatar, AvatarFallback } from "@/components/ui/headless-avatar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import type { Channel, Message } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

interface Agent {
  id: string;
  name: string;
  avatar: string;
  type: string;
  subType: string;
}

interface MessagesAreaProps {
  filteredMessages: Message[];
  channel: Channel;
  selectedChannelId: string;
  isLoadingMessages?: boolean;
  pinnedMessageIds: Set<string>;
  editedMessages: Set<string>;
  deletingMessages: Set<string>;
  showAgentPicker: string | null;
  isAdmin: boolean;
  messageRefs: React.MutableRefObject<{[key: string]: HTMLDivElement}>;
  availableAgents: Agent[];
  getRandomQuote: (channelId: string) => { quote: string; author: string };
  canEditDelete: (message: Message) => boolean;
  handlePinMessage: (messageId: string) => void;
  handleUnpinMessage: (messageId: string) => void;
  handleEditMessage: (messageId: string) => void;
  handleSwitchAgent: (messageId: string, agent: Agent) => void;
  setShowDeleteModal: (messageId: string | null) => void;
  setLightboxImage: (image: string | null) => void;
  setShowAgentPicker: (messageId: string | null) => void;
}

export function MessagesArea({
  filteredMessages,
  channel,
  selectedChannelId,
  isLoadingMessages = false,
  pinnedMessageIds,
  editedMessages,
  deletingMessages,
  showAgentPicker,
  isAdmin,
  messageRefs,
  availableAgents,
  getRandomQuote,
  canEditDelete,
  handlePinMessage,
  handleUnpinMessage,
  handleEditMessage,
  handleSwitchAgent,
  setShowDeleteModal,
  setLightboxImage,
  setShowAgentPicker,
}: MessagesAreaProps) {
  const { user } = useAuth();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(0);
  
  // Check if user is near bottom of scroll
  const isNearBottom = () => {
    if (!scrollContainerRef.current) return true; // Default to true if not yet mounted
    const threshold = 150; // pixels from bottom (increased for better detection)
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
    // Check if new messages were added
    if (filteredMessages.length > lastMessageCountRef.current) {
      // Only scroll if user was near bottom before the update
      if (wasAtBottomRef.current) {
        // Use requestAnimationFrame to ensure DOM has updated
        requestAnimationFrame(() => {
          scrollToBottom(true);
        });
      }
    }
    
    // Update the message count
    lastMessageCountRef.current = filteredMessages.length;
  }, [filteredMessages.length]);
  
  // Initial scroll to bottom when component mounts or channel changes
  useEffect(() => {
    // Reset message count when channel changes
    lastMessageCountRef.current = filteredMessages.length;
    // Scroll to bottom on initial load
    setTimeout(() => {
      scrollToBottom(false);
    }, 100);
  }, [channel.channel_id]);
  
  return (
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-2 py-4">
      <div className="space-y-1">
        {filteredMessages.length === 0 ? (
          isLoadingMessages ? null : (
            // Empty State with Motivational Quote - only show when we're sure channel is empty
            <div className="flex-1 flex items-center justify-center h-full min-h-[400px]">
            <div className="text-center max-w-2xl mx-auto px-6">
              <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Hash className="h-8 w-8 text-primary/60" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Welcome to #{channel.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                Start the conversation by sending your first message below.
              </p>
            </div>
          </div>
          )
        ) : (
          // Messages List
          filteredMessages.map((message, index) => {
            const isConsecutive = 
              index > 0 && 
              (filteredMessages[index - 1].username || filteredMessages[index - 1].user?.username) === (message.username || message.user?.username) &&
              filteredMessages[index - 1].created_at === message.created_at &&
              filteredMessages[index - 1].type !== 'system';
            
            // Check if message is from current user by comparing user IDs
            const isCurrentUser = user?.id === message.user_id;
            const isSystemMessage = message.type === 'system';
            const isPinned = pinnedMessageIds.has(message.message_id);
            
            // System messages have different layout
            if (isSystemMessage) {
              return (
                <div key={message.message_id} className="flex items-center justify-center my-4 px-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="h-px bg-border flex-1 max-w-[100px]" />
                    <span className="font-medium">{message.username || message.user?.username || 'System'}</span>
                    <span>{message.content}</span>
                    <span className="text-muted-foreground/70">• {new Date(message.created_at).toLocaleTimeString()}</span>
                    <div className="h-px bg-border flex-1 max-w-[100px]" />
                  </div>
                </div>
              );
            }
            
            return (
              <div 
                key={message.message_id} 
                ref={(el) => {
                  if (el) {
                    messageRefs.current[message.message_id] = el;
                  }
                }}
                className={`group relative ${isConsecutive ? 'mt-2' : 'mt-6'} px-2 py-2 transition-all duration-300 ${deletingMessages.has(message.message_id) ? 'opacity-0 scale-95 -translate-x-4' : ''}`}
              >
                {/* Message Content */}
                <div className={`relative w-[70%] ${isCurrentUser ? 'ml-auto' : 'mr-auto'} ${isPinned ? 'bg-primary/20 hover:bg-primary/25' : 'bg-muted/50 hover:bg-muted/70'} rounded-lg px-4 py-3 transition-colors flex ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} group`}>
                  {!isConsecutive && (
                    <Avatar className={`h-8 w-8 flex-shrink-0 ${isCurrentUser ? 'ml-3' : 'mr-3'}`}>
                      <AvatarFallback className={`text-xs font-semibold ${
                        message.from_agent 
                          ? 'bg-orange-500 text-white' 
                          : 'bg-primary text-primary-foreground'
                      }`}>
                        {(() => {
                          const name = message.username || message.user?.username || message.full_name || message.from_agent || 'Unknown User';
                          return name.replace(/-/g, ' ').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                        })()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`flex-1 ${isConsecutive ? (isCurrentUser ? 'mr-11' : 'ml-11') : ''}`}>
                    {!isConsecutive && (
                      <div className={`flex items-center space-x-2 mb-1 ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <span className={`font-semibold text-sm ${
                          message.from_agent 
                            ? 'text-orange-600' 
                            : 'text-foreground'
                        }`}>
                          {message.username || message.user?.username || message.full_name || (message.from_agent ? message.from_agent.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown User')}
                        </span>
                        {message.from_agent && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                            Agent
                          </span>
                        )}
                        {isCurrentUser && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                            You
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.created_at).toLocaleTimeString()}
                          {editedMessages.has(message.message_id) && (
                            <span className="ml-1 text-xs text-muted-foreground/70 italic">
                              (edited)
                            </span>
                          )}
                          {isPinned && (
                            <span className="ml-2 inline-flex items-center text-xs text-primary font-medium">
                              <Pin className="h-3 w-3 mr-1 fill-current" />
                              Pinned
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    
                    <div className={`text-sm leading-relaxed text-foreground ${isCurrentUser ? 'text-right' : ''}`}>
                      <div>
                        {message.content && message.content.split('\n').map((line, lineIndex) => (
                          <div key={lineIndex}>
                            {line}
                            {lineIndex < message.content.split('\n').length - 1 && <br />}
                          </div>
                        ))}
                      </div>
                      {message.files && message.files.length > 0 && message.files[0].mimetype?.startsWith('image/') && (
                        <div className={`mt-2 ${isCurrentUser ? 'flex justify-end' : 'flex justify-start'}`}>
                          <img 
                            src={message.files[0].url} 
                            alt="Uploaded image" 
                            className="max-w-40 max-h-28 rounded-lg border border-border object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setLightboxImage(message.files?.[0]?.url || null)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Three dots menu inside message box */}
                  {canEditDelete(message) && (
                    <div className={`absolute top-2 ${isCurrentUser ? 'left-2' : 'right-2'} opacity-0 group-hover:opacity-100 transition-opacity z-10`}>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-muted/50 rounded"
                          >
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          </Button>
                        </PopoverTrigger>
                      <PopoverContent className="w-48 p-1" align={isCurrentUser ? "start" : "end"}>
                        <div className="flex flex-col">
                          {/* Switch Agent option for AI messages */}
                          {message.from_agent && isAdmin && (
                            <>
                              <Popover open={showAgentPicker === message.message_id} onOpenChange={(open) => setShowAgentPicker(open ? message.message_id : null)}>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start h-9 px-3 text-sm font-normal"
                                  >
                                    <MoreHorizontal className="h-4 w-4 mr-2" />
                                    Switch Agent
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48 p-2" side="left" align="start">
                                  <div className="space-y-1">
                                    <div className="text-xs font-semibold text-muted-foreground px-2 py-1">Select Agent:</div>
                                    {availableAgents.map((agent) => (
                                      <Button
                                        key={agent.id}
                                        variant="ghost"
                                        size="sm"
                                        className="w-full justify-start h-8 px-2 text-sm"
                                        onClick={() => handleSwitchAgent(message.message_id, agent)}
                                      >
                                        <div className="w-6 h-6 rounded bg-orange-100 text-orange-700 text-xs font-semibold flex items-center justify-center mr-2">
                                          {agent.avatar}
                                        </div>
                                        {agent.name}
                                      </Button>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>
                              <div className="h-px bg-border my-1" />
                            </>
                          )}
                          
                          {/* Pin/Unpin option */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start h-9 px-3 text-sm font-normal"
                            onClick={() => isPinned ? handleUnpinMessage(message.message_id) : handlePinMessage(message.message_id)}
                          >
                            <Pin className={`h-4 w-4 mr-2 ${isPinned ? 'fill-current text-primary' : ''}`} />
                            {isPinned ? 'Unpin' : 'Pin'} Message
                          </Button>
                          
                          {/* Edit option */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start h-9 px-3 text-sm font-normal"
                            onClick={() => handleEditMessage(message.message_id)}
                          >
                            <Edit3 className="h-4 w-4 mr-2" />
                            Edit Message
                          </Button>
                          
                          <div className="h-px bg-border my-1" />
                          
                          {/* Delete option */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start h-9 px-3 text-sm font-normal text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setShowDeleteModal(message.message_id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Message
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  )}
                </div>
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