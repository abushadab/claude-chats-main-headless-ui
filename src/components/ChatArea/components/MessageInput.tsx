"use client"

import { Button } from "@/components/ui/headless-button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { AtSign, Smile, Image, X } from "lucide-react";
import type { Message } from "@/types/chat.types";

interface MessageInputProps {
  // Message state
  newMessage: string;
  setNewMessage: (value: string | ((prev: string) => string)) => void;
  
  // Edit mode
  editingMessage: string | null;
  editContent: string;
  setEditContent: (value: string | ((prev: string) => string)) => void;
  handleSaveEdit: () => void;
  handleCancelEdit: () => void;
  
  // Image handling
  selectedImage: File | null;
  imagePreview: string | null;
  setSelectedImage: (file: File | null) => void;
  setImagePreview: (preview: string | null) => void;
  
  // Send message
  handleSendMessage: () => void;
  
  // Mention modal
  setShowMentionModal: (show: boolean) => void;
  
  // Message being edited info
  filteredMessages: Message[];
  
  // Emojis
  mockEmojis: string[];
}

export function MessageInput({
  newMessage,
  setNewMessage,
  editingMessage,
  editContent,
  setEditContent,
  handleSaveEdit,
  handleCancelEdit,
  selectedImage,
  imagePreview,
  setSelectedImage,
  setImagePreview,
  handleSendMessage,
  setShowMentionModal,
  filteredMessages,
  mockEmojis
}: MessageInputProps) {
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    // Handle Enter to send (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    // Handle double Escape to clear message
    if (e.key === 'Escape') {
      const now = Date.now();
      const lastEscape = (e.target as HTMLElement & { lastEscape?: number }).lastEscape || 0;
      if (now - lastEscape < 300) { // Double escape within 300ms
        setNewMessage('');
      }
      (e.target as HTMLElement & { lastEscape?: number }).lastEscape = now;
    }
  };

  const handleEditKeyPress = (e: React.KeyboardEvent) => {
    // Handle Enter to save edit (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  const handleImageUpload = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
        setSelectedImage(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const messageBeingEdited = editingMessage 
    ? filteredMessages.find(m => m.message_id === editingMessage)
    : null;
  
  const truncatedContent = messageBeingEdited?.content.slice(0, 50) + 
    (messageBeingEdited?.content.length > 50 ? '...' : '');

  return (
    <div className="border-t border-border bg-background p-4">
      {/* Editing Banner */}
      {editingMessage && messageBeingEdited && (
        <div className="mb-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Editing message from {messageBeingEdited.username || messageBeingEdited.user?.username || 'Unknown User'}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCancelEdit}
              className="h-6 px-2 text-xs"
            >
              Cancel
            </Button>
          </div>
          <div className="text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1 mb-2">
            Original: &ldquo;{truncatedContent}&rdquo;
          </div>
          <div className="text-xs text-muted-foreground">
            Press Enter to save, Escape to cancel
          </div>
        </div>
      )}
      
      <div className="relative w-full">
        <div className="flex flex-col bg-background rounded-2xl border border-border hover:border-border/80 focus-within:border-primary/50 transition-colors shadow-sm">
          {/* Image Preview */}
          {imagePreview && (
            <div className="px-4 pt-3">
              <div className="relative inline-block bg-muted/50 rounded-lg p-2">
                <img 
                  src={imagePreview} 
                  alt="Selected image" 
                  className="max-w-32 max-h-32 rounded border object-contain"
                />
                <button
                  onClick={removeSelectedImage}
                  className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                >
                  <X className="h-3 w-3" />
                </button>
                <p className="text-xs text-muted-foreground mt-1 truncate max-w-32">
                  {selectedImage?.name}
                </p>
              </div>
            </div>
          )}
          
          {/* Input Field */}
          <div className="flex items-start px-4 py-3">
            <textarea
              placeholder={editingMessage ? "Edit your message..." : "Message"}
              value={editingMessage ? editContent : newMessage}
              onChange={(e) => {
                if (editingMessage) {
                  setEditContent(e.target.value);
                } else {
                  const value = e.target.value;
                  setNewMessage(value);
                  
                  // Auto-open mention modal when @ is typed
                  if (value.endsWith('@')) {
                    setShowMentionModal(true);
                  }
                }
              }}
              onKeyDown={editingMessage ? handleEditKeyPress : handleKeyPress}
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 outline-none px-0 py-2 resize-none min-h-[3rem] max-h-32 text-sm placeholder:text-muted-foreground scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
              rows={1}
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#d1d5db transparent'
              }}
            />
          </div>
          
          {/* Bottom Actions */}
          <div className="flex items-center justify-between px-4 pb-3">
            {/* Bottom Left - Mention, Emoji and Image Icons */}
            <div className="flex items-center space-x-1">
              {/* Mention Button */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-8 h-8 p-0 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg"
                onClick={() => setShowMentionModal(true)}
              >
                <AtSign className="h-4 w-4" />
              </Button>
              
              {/* Emoji Picker Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-8 h-8 p-0 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-4" align="start">
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold">Choose an emoji</h4>
                    <div className="grid grid-cols-8 gap-1 max-h-60 overflow-y-auto overflow-x-hidden">
                      {mockEmojis.map((emoji, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          className="w-8 h-8 p-0 text-lg hover:bg-accent rounded"
                          onClick={() => {
                            if (editingMessage) {
                              setEditContent(prev => prev + emoji + ' ');
                            } else {
                              setNewMessage(prev => prev + emoji + ' ');
                            }
                          }}
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
              {/* Image Upload - Direct File Input */}
              <label className="w-8 h-8 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg cursor-pointer flex items-center justify-center transition-colors">
                <Image className="h-4 w-4" />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </label>
            </div>
            
            {/* Bottom Right - Send Button */}
            <Button 
              onClick={editingMessage ? handleSaveEdit : handleSendMessage}
              disabled={editingMessage ? !editContent.trim() : (!newMessage.trim() && !selectedImage)}
              size="sm"
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg disabled:opacity-50 font-medium text-sm"
            >
              {editingMessage ? 'Save' : 'Send'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}