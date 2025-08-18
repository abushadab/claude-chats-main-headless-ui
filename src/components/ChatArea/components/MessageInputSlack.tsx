"use client"

import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/headless-button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { 
  Bold, 
  Italic, 
  Link2, 
  ListOrdered, 
  Code, 
  Smile, 
  Paperclip, 
  AtSign,
  Send,
  Mic,
  Video,
  X
} from "lucide-react";
import type { Message } from "@/types/chat.types";

interface MessageInputSlackProps {
  newMessage: string;
  setNewMessage: (value: string | ((prev: string) => string)) => void;
  editingMessage: string | null;
  editContent: string;
  setEditContent: (value: string | ((prev: string) => string)) => void;
  handleSaveEdit: () => void;
  handleCancelEdit: () => void;
  selectedImage: File | null;
  imagePreview: string | null;
  setSelectedImage: (file: File | null) => void;
  setImagePreview: (preview: string | null) => void;
  handleSendMessage: () => void;
  setShowMentionModal: (show: boolean) => void;
  filteredMessages: Message[];
  mockEmojis: string[];
  channelName?: string;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
}

export function MessageInputSlack({
  newMessage,
  setNewMessage,
  editingMessage,
  editContent,
  setEditContent,
  handleSaveEdit,
  handleCancelEdit,
  // selectedImage,
  imagePreview,
  setSelectedImage,
  setImagePreview,
  handleSendMessage,
  setShowMentionModal,
  // filteredMessages,
  mockEmojis,
  channelName = "channel",
  onTypingStart,
  onTypingStop
}: MessageInputSlackProps) {
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  // Handle typing indicators
  useEffect(() => {
    return () => {
      // Cleanup: stop typing on unmount
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTypingRef.current && onTypingStop) {
        onTypingStop();
      }
    };
  }, [onTypingStop]);

  const handleTyping = () => {
    // Start typing if not already typing
    if (!isTypingRef.current && onTypingStart) {
      isTypingRef.current = true;
      onTypingStart();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current && onTypingStop) {
        isTypingRef.current = false;
        onTypingStop();
      }
    }, 2000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      
      // Stop typing indicator when sending
      if (isTypingRef.current && onTypingStop) {
        isTypingRef.current = false;
        onTypingStop();
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
      
      if (editingMessage) {
        handleSaveEdit();
      } else {
        handleSendMessage();
      }
    }
  };

  return (
    <div className="bg-background">
      {/* Image Preview */}
      {imagePreview && (
        <div className="px-4 pt-3">
          <div className="inline-block relative">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="h-20 rounded-md border border-border"
            />
            <button
              onClick={() => {
                setSelectedImage(null);
                setImagePreview(null);
              }}
              className="absolute -top-2 -right-2 bg-background border border-border rounded-full p-1 hover:bg-accent"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      <div className="px-4 py-3">
        <div className="bg-background border border-border rounded-lg focus-within:border-primary/50 transition-colors">
          {/* Formatting Toolbar */}
          <div className="flex items-center gap-1 px-3 pt-2 border-b border-border/50">
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-7 w-7 p-0 hover:bg-accent"
              title="Bold"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-7 w-7 p-0 hover:bg-accent"
              title="Italic"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <div className="w-px h-4 bg-border mx-1" />
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-7 w-7 p-0 hover:bg-accent"
              title="Link"
            >
              <Link2 className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-7 w-7 p-0 hover:bg-accent"
              title="Ordered List"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-7 w-7 p-0 hover:bg-accent"
              title="Code"
            >
              <Code className="h-4 w-4" />
            </Button>
          </div>

          {/* Message Input */}
          <div className="relative">
            <textarea
              value={editingMessage ? editContent : newMessage}
              onChange={(e) => {
                const value = e.target.value;
                if (editingMessage) {
                  setEditContent(value);
                } else {
                  setNewMessage(value);
                  // Trigger typing indicator for new messages
                  if (value.trim()) {
                    handleTyping();
                  }
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder={`Message #${channelName}`}
              className="w-full px-3 py-2 bg-transparent resize-none focus:outline-none text-sm min-h-[80px]"
              rows={3}
            />
          </div>

          {/* Bottom Toolbar */}
          <div className="flex items-center justify-between px-3 pb-2">
            <div className="flex items-center gap-1">
              {/* File Upload */}
              <label htmlFor="file-upload">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 w-7 p-0 hover:bg-accent"
                  title="Attach files"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </label>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />

              {/* Emoji Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-7 w-7 p-0 hover:bg-accent"
                    title="Emoji"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="start">
                  <div className="grid grid-cols-8 gap-1">
                    {mockEmojis.map((emoji, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          if (editingMessage) {
                            setEditContent(prev => prev + emoji);
                          } else {
                            setNewMessage(prev => prev + emoji);
                          }
                        }}
                        className="hover:bg-accent rounded p-1 text-xl"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Mention */}
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 w-7 p-0 hover:bg-accent"
                onClick={() => setShowMentionModal(true)}
                title="Mention someone"
              >
                <AtSign className="h-4 w-4" />
              </Button>

              <div className="w-px h-4 bg-border mx-1" />

              {/* Video */}
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 w-7 p-0 hover:bg-accent"
                title="Record video"
              >
                <Video className="h-4 w-4" />
              </Button>

              {/* Voice */}
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 w-7 p-0 hover:bg-accent"
                title="Record audio"
              >
                <Mic className="h-4 w-4" />
              </Button>
            </div>

            {/* Send Button */}
            <div className="flex items-center gap-2">
              {editingMessage && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  className="text-xs"
                >
                  Cancel
                </Button>
              )}
              <Button
                size="sm"
                variant={newMessage.trim() || editContent.trim() ? "default" : "ghost"}
                disabled={editingMessage ? !editContent.trim() : !newMessage.trim()}
                onClick={editingMessage ? handleSaveEdit : handleSendMessage}
                className="h-7 px-3"
              >
                <Send className="h-4 w-4 mr-1" />
                {editingMessage ? 'Save' : 'Send'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}