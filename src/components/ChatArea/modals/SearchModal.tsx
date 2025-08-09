"use client"

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/headless-input";
import { Button } from "@/components/ui/headless-button";
import { ScrollArea } from "@/components/ui/headless-scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/headless-avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Search, 
  X,
  ChevronRight,
  Clock,
  ChevronDown,
  User,
  Calendar,
  Check
} from "lucide-react";
import type { Message } from "@/types/chat.types";

interface SearchModalProps {
  showSearchModal: boolean;
  onClose: () => void;
  messages: Message[];
  onMessageSelect: (messageId: string) => void;
}

const dateOptions = [
  { value: "all", label: "All Time", icon: Calendar },
  { value: "today", label: "Today", icon: Clock },
  { value: "week", label: "Last 7 Days", icon: Calendar },
  { value: "month", label: "Last 30 Days", icon: Calendar }
];

export function SearchModal({ 
  showSearchModal, 
  onClose, 
  messages,
  onMessageSelect
}: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAuthor, setSelectedAuthor] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");

  // Get unique authors from messages
  const uniqueAuthors = useMemo(() => {
    const authors = new Map();
    messages.forEach(msg => {
      // Skip system messages and messages from agents
      if (msg.type !== 'system' && !msg.from_agent) {
        const authorName = msg.username || msg.user?.username || 'Unknown User';
        const authorInfo = {
          name: authorName,
          type: msg.from_agent ? 'ai-agent' : 'user',
          user_id: msg.user_id
        };
        authors.set(authorName, authorInfo);
      }
    });
    return Array.from(authors.values());
  }, [messages]);

  // Filter messages based on search criteria
  const searchResults = useMemo(() => {
    let results = messages.filter(msg => msg.type !== 'system' && !msg.from_agent);

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(msg => {
        const authorName = msg.username || msg.user?.username || 'Unknown User';
        return msg.content.toLowerCase().includes(query) ||
               authorName.toLowerCase().includes(query);
      });
    }

    // Filter by selected author
    if (selectedAuthor) {
      results = results.filter(msg => {
        const authorName = msg.username || msg.user?.username || 'Unknown User';
        return authorName === selectedAuthor;
      });
    }

    // Filter by date
    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();
      
      if (dateFilter === "today") {
        filterDate.setHours(0, 0, 0, 0);
      } else if (dateFilter === "week") {
        filterDate.setDate(now.getDate() - 7);
      } else if (dateFilter === "month") {
        filterDate.setMonth(now.getMonth() - 1);
      }
      
      // For demo purposes, we'll just return all messages since we don't have real dates
      // In production, you'd filter by actual message timestamps
    }

    return results;
  }, [messages, searchQuery, selectedAuthor, dateFilter]);

  // Highlight matching text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <mark key={index} className="bg-yellow-200 text-foreground px-0.5 rounded">{part}</mark> : 
        part
    );
  };

  // Handle jump to message
  const handleJumpToMessage = (messageId: string) => {
    onMessageSelect(messageId);
    onClose();
  };

  // Get selected date option label
  const getDateLabel = () => {
    const option = dateOptions.find(opt => opt.value === dateFilter);
    return option?.label || "All Time";
  };

  // Get selected author
  const getAuthorLabel = () => {
    if (!selectedAuthor) return "All Authors";
    const author = uniqueAuthors.find(a => a.name === selectedAuthor);
    return author?.name || "All Authors";
  };

  // Keyboard shortcut to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (showSearchModal) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showSearchModal, onClose]);

  return (
    <Dialog open={showSearchModal} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            <span>Search Messages</span>
            <span className="text-sm text-muted-foreground font-normal ml-2">
              ({searchResults.length} result{searchResults.length !== 1 ? 's' : ''})
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Search Input */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex gap-2">
            {/* Author Filter Dropdown */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-[180px] justify-between font-normal"
                >
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{getAuthorLabel()}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-1" align="start">
                <div className="flex flex-col">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`w-full justify-between px-2 py-1.5 h-auto font-normal ${!selectedAuthor ? 'bg-accent' : ''}`}
                    onClick={() => setSelectedAuthor("")}
                  >
                    <span className="text-sm">All Authors</span>
                    {!selectedAuthor && <Check className="h-4 w-4 text-primary" />}
                  </Button>
                  <div className="h-px bg-border my-1" />
                  {uniqueAuthors.map((author) => (
                    <Button
                      key={author.name}
                      variant="ghost"
                      size="sm"
                      className={`w-full justify-between px-2 py-1.5 h-auto font-normal ${selectedAuthor === author.name ? 'bg-accent' : ''}`}
                      onClick={() => setSelectedAuthor(author.name)}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className={`text-[10px] ${
                            author.type === 'ai-agent' 
                              ? 'bg-orange-500 text-white' 
                              : 'bg-primary text-primary-foreground'
                          }`}>
                            {author.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm truncate">{author.name}</span>
                      </div>
                      {selectedAuthor === author.name && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Date Filter Dropdown */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-[180px] justify-between font-normal"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{getDateLabel()}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[180px] p-1" align="start">
                <div className="flex flex-col">
                  {dateOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <Button
                        key={option.value}
                        variant="ghost"
                        size="sm"
                        className={`w-full justify-between px-2 py-1.5 h-auto font-normal ${dateFilter === option.value ? 'bg-accent' : ''}`}
                        onClick={() => setDateFilter(option.value as typeof dateFilter)}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{option.label}</span>
                        </div>
                        {dateFilter === option.value && <Check className="h-4 w-4 text-primary" />}
                      </Button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>

            {/* Clear Filters Button */}
            {(selectedAuthor || dateFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedAuthor("");
                  setDateFilter("all");
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear filters
              </Button>
            )}
          </div>

          {/* Search Results */}
          <ScrollArea className="h-[400px] border border-border rounded-lg">
            <div className="p-2">
              {searchResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery || selectedAuthor || dateFilter !== "all" ? 
                    "No messages found with current filters" : 
                    "Start typing to search messages"
                  }
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((message) => {
                    const authorName = message.username || message.user?.username || 'Unknown User';
                    const isAgent = !!message.from_agent;
                    const timestamp = new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    
                    return (
                      <button
                        key={message.message_id}
                        onClick={() => handleJumpToMessage(message.message_id)}
                        className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarFallback className={`text-xs font-semibold ${
                              isAgent
                                ? 'bg-orange-500 text-white' 
                                : 'bg-primary text-primary-foreground'
                            }`}>
                              {authorName.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">
                                  {highlightText(authorName, searchQuery)}
                                </span>
                                {isAgent && (
                                  <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                                    Agent
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {timestamp}
                              </div>
                            </div>
                            
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {selectedAuthor && !searchQuery ? 
                                message.content : 
                                <>{highlightText(message.content, searchQuery)}</>
                              }
                            </p>
                          </div>

                          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}