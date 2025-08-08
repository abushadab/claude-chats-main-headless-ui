"use client"

import { Hash, Edit3, Trash2, MoreHorizontal, Pin } from "lucide-react";
import { Button } from "@/components/ui/headless-button";
import { Avatar, AvatarFallback } from "@/components/ui/headless-avatar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import type { Channel, Message } from "@/data/mockData";

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
  return (
    <div className="flex-1 overflow-y-auto px-2 py-4">
      <div className="space-y-1">
        {filteredMessages.length === 0 ? (
          // Empty State with Motivational Quote
          <div className="flex-1 flex items-center justify-center h-full min-h-[400px]">
            <div className="text-center max-w-2xl mx-auto px-6">
              <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Hash className="h-8 w-8 text-primary/60" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Welcome to #{channel.name}
              </h3>
              <div className="bg-muted/30 rounded-lg p-6 border border-border/50">
                <blockquote className="text-lg italic text-muted-foreground leading-relaxed mb-4">
                  &ldquo;{getRandomQuote(selectedChannelId).quote}&rdquo;
                </blockquote>
                <cite className="text-sm font-medium text-primary">
                  — {getRandomQuote(selectedChannelId).author}
                </cite>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Start the conversation by sending your first message below.
              </p>
            </div>
          </div>
        ) : (
          // Messages List
          filteredMessages.map((message, index) => {
            const isConsecutive = 
              index > 0 && 
              filteredMessages[index - 1].author.name === message.author.name &&
              filteredMessages[index - 1].timestamp === message.timestamp &&
              filteredMessages[index - 1].author.type !== 'system';
            
            const isCurrentUser = message.author.type === 'current_user';
            const isSystemMessage = message.author.type === 'system';
            const isPinned = pinnedMessageIds.has(message.id);
            
            // System messages have different layout
            if (isSystemMessage) {
              return (
                <div key={message.id} className="flex items-center justify-center my-4 px-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="h-px bg-border flex-1 max-w-[100px]" />
                    <span className="font-medium">{message.author.name}</span>
                    <span>{message.content}</span>
                    <span className="text-muted-foreground/70">• {message.timestamp}</span>
                    <div className="h-px bg-border flex-1 max-w-[100px]" />
                  </div>
                </div>
              );
            }
            
            return (
              <div 
                key={message.id} 
                ref={(el) => {
                  if (el) {
                    messageRefs.current[message.id] = el;
                  }
                }}
                className={`group relative ${isConsecutive ? 'mt-2' : 'mt-6'} px-2 py-2 transition-all duration-300 ${deletingMessages.has(message.id) ? 'opacity-0 scale-95 -translate-x-4' : ''}`}
              >
                {/* Message Content */}
                <div className={`relative w-[70%] ${isCurrentUser ? 'ml-auto' : 'mr-auto'} ${isPinned ? 'bg-primary/20 hover:bg-primary/25' : 'bg-muted/50 hover:bg-muted/70'} rounded-lg px-4 py-3 transition-colors flex ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} group`}>
                  {!isConsecutive && (
                    <Avatar className={`h-8 w-8 flex-shrink-0 ${isCurrentUser ? 'ml-3' : 'mr-3'}`}>
                      <AvatarFallback className={`text-xs font-semibold ${
                        message.author.type === 'ai-agent' 
                          ? 'bg-orange-500 text-white' 
                          : message.author.type === 'current_user' || message.author.type === 'human'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-primary text-primary-foreground'
                      }`}>
                        {message.author.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`flex-1 ${isConsecutive ? (isCurrentUser ? 'mr-11' : 'ml-11') : ''}`}>
                    {!isConsecutive && (
                      <div className={`flex items-center space-x-2 mb-1 ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <span className={`font-semibold text-sm ${
                          message.author.type === 'ai-agent' 
                            ? 'text-orange-600' 
                            : 'text-foreground'
                        }`}>
                          {message.author.name}
                        </span>
                        {message.author.type === 'ai-agent' && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                            Agent
                          </span>
                        )}
                        {message.author.type === 'current_user' && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                            You
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {message.timestamp}
                          {editedMessages.has(message.id) && (
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
                      {message.image && (
                        <div className={`mt-2 ${isCurrentUser ? 'flex justify-end' : 'flex justify-start'}`}>
                          <img 
                            src={message.image} 
                            alt="Uploaded image" 
                            className="max-w-40 max-h-28 rounded-lg border border-border object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setLightboxImage(message.image || null)}
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
                          {message.author.type === 'ai-agent' && isAdmin && (
                            <>
                              <Popover open={showAgentPicker === message.id} onOpenChange={(open) => setShowAgentPicker(open ? message.id : null)}>
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
                                        onClick={() => handleSwitchAgent(message.id, agent)}
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
                            onClick={() => isPinned ? handleUnpinMessage(message.id) : handlePinMessage(message.id)}
                          >
                            <Pin className={`h-4 w-4 mr-2 ${isPinned ? 'fill-current text-primary' : ''}`} />
                            {isPinned ? 'Unpin' : 'Pin'} Message
                          </Button>
                          
                          {/* Edit option */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start h-9 px-3 text-sm font-normal"
                            onClick={() => handleEditMessage(message.id)}
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
                            onClick={() => setShowDeleteModal(message.id)}
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
      </div>
    </div>
  );
}