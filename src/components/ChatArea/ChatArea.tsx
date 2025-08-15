"use client"

import { useState, useEffect } from "react";
import { mockProjects } from "@/data/mockData";
import { useMessages } from "@/hooks/useMessages";
import { useChannels } from "@/hooks/useChannels";
import { useProjects } from "@/hooks/useProjects";
import { useToast } from "@/hooks/use-toast";
import { MessageType } from "@/types/chat.types";
import type { Message } from "@/types/chat.types";
import { MessagesArea } from "./MessagesArea";
import { DeleteConfirmationModal } from "./modals/DeleteConfirmationModal";
import { ImageLightbox } from "./modals/ImageLightbox";
import { PinnedMessagesModal } from "./modals/PinnedMessagesModal";
import { ChannelSettingsModal } from "./modals/ChannelSettingsModal";
import { AllImagesModal } from "./modals/AllImagesModal";
import { AllFilesModal } from "./modals/AllFilesModal";
import { MentionModal } from "./modals/MentionModal";
import { MembersModal } from "./modals/MembersModal";
import { SearchModal } from "./modals/SearchModal";
import { RightSidebar } from "./components/RightSidebar";
import { MessageInput } from "./components/MessageInput";
import { ChatHeader } from "./components/ChatHeader";
import { EmptyChannelState } from "./components/EmptyChannelState";
import { useMessageActions } from "./hooks/useMessageActions";
import { mockUsers, availableAgents, mockEmojis, motivationalQuotes, sharedImages, sharedFiles } from "./mockData";
import { Skeleton } from "@/components/ui/skeleton";
import { Hash } from "lucide-react";

interface ChatAreaProps {
  selectedProjectId: string;
  selectedChannelId: string;
  initialChannel?: Channel;
  initialProject?: Project;
}

export function ChatArea({ selectedProjectId, selectedChannelId, initialChannel, initialProject }: ChatAreaProps) {
  // ALL HOOKS MUST BE CALLED AT THE TOP - NO CONDITIONAL RETURNS BEFORE THIS POINT
  const [newMessage, setNewMessage] = useState('');
  const [showMentionModal, setShowMentionModal] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [showAgentPicker, setShowAgentPicker] = useState<string | null>(null);
  const [isAdmin] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [showAllImagesModal, setShowAllImagesModal] = useState(false);
  const [showAllFilesModal, setShowAllFilesModal] = useState(false);
  const [showPinnedMessagesModal, setShowPinnedMessagesModal] = useState(false);
  const [showChannelSettingsModal, setShowChannelSettingsModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    muteNotifications: false,
    desktopNotifications: true
  });
  
  const { toast } = useToast();
  
  // Use real messages API
  const { 
    messages, 
    isLoading: isLoadingMessages, 
    error: messagesError, 
    sendMessage: sendMessageAPI, 
    editMessage: editMessageAPI, 
    deleteMessage: deleteMessageAPI 
  } = useMessages(selectedChannelId);
  
  // Fetch channels only for the current project (more efficient)
  const { channels } = useChannels(selectedProjectId);

  // Use the message actions hook
  const {
    editingMessage,
    editContent,
    setEditContent,
    showDeleteModal,
    setShowDeleteModal,
    editedMessages,
    deletingMessages,
    pinnedMessageIds,
    messageRefs,
    handlePinMessage,
    handleUnpinMessage,
    handleEditMessage,
    handleSaveEdit,
    handleCancelEdit,
    handleSoftDeleteMessage,
    handleDeleteMessage,
    scrollToMessage,
  } = useMessageActions(messages, () => {}); // Empty setter since messages are managed by hook

  // DERIVED STATE AND FUNCTIONS - AFTER ALL HOOKS
  const filteredUsers = mockUsers.filter(user => 
    user.name.toLowerCase().includes(mentionSearch.toLowerCase())
  );
  
  // Find the current channel from initial data or real channels data
  const channel = initialChannel || channels.find(c => c.channel_id === selectedChannelId);
  
  // Get project info from initial data or real projects data
  const { projects } = useProjects();
  const project = initialProject || projects.find(p => p.project_id === selectedProjectId) || {
    project_id: selectedProjectId,
    name: 'Unknown Project',
    slug: 'unknown',
    member_count: 0,
    channel_count: 0,
    user_role: 'member',
    is_member: true,
    // Add missing required fields for compatibility
    owner_id: '',
    is_active: true,
    settings: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: '',
    description: null,
    project_type: 'standard',
    visibility: 'private',
    metadata: {},
    joined_at: new Date().toISOString(),
    owner_username: '',
    owner_name: ''
  };
  
  // Messages are already filtered by channel in the useMessages hook
  const filteredMessages = messages;

  // Get a consistent random quote for this channel
  const getRandomQuote = (channelId: string) => {
    const seed = channelId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = seed % motivationalQuotes.length;
    return motivationalQuotes[index];
  };

  // CONDITIONAL RETURNS - ONLY AFTER ALL HOOKS ARE CALLED
  // Only show skeleton if we're loading and don't have initial data
  if (isLoadingMessages && !initialChannel) {
    return (
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="h-[60px] flex items-center justify-between px-4 border-b">
          <div className="flex items-center">
            <Hash className="h-5 w-5 text-muted-foreground/50 mr-2" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
        
        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          <div className="space-y-4 p-4 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div className={`${i % 2 === 0 ? 'w-[60%]' : 'w-[50%]'} h-20 bg-muted rounded-lg`} />
              </div>
            ))}
          </div>
        </div>
        
        {/* Message Input */}
        <div className="border-t border-border bg-background" style={{ height: '151px' }}>
          <div className="flex flex-col justify-end h-full p-4">
            <div className="bg-white border border-border rounded-xl" style={{ height: '118px' }}>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (messagesError) {
    // Check if it's a UUID error (invalid channel ID)
    const isUuidError = messagesError.includes('invalid input syntax for type uuid');
    
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">
            {isUuidError 
              ? 'Invalid channel ID. Please select a valid channel from the sidebar.' 
              : `Error loading messages: ${messagesError}`
            }
          </p>
          <button 
            onClick={() => isUuidError ? window.location.href = '/' : window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            {isUuidError ? 'Go Home' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Channel not found</p>
        </div>
      </div>
    );
  }

  // Additional functions and handlers
  const handleSendMessage = async () => {
    if (newMessage.trim() || selectedImage) {
      try {
        // Send message via API
        await sendMessageAPI({
          content: newMessage.trim(),
          channelId: selectedChannelId,
          type: MessageType.TEXT,
          metadata: selectedImage ? { hasImage: true } : {},
        });
        
        // Clear input after successful send
        setNewMessage('');
        setSelectedImage(null);
        setImagePreview(null);
        
        // TODO: Handle image upload when file upload is implemented
        
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive",
        });
        console.error('Failed to send message:', error);
      }
    }
  };

  const handleSwitchAgent = (messageId: string, newAgent: typeof availableAgents[0]) => {
    // This would need to be implemented with real API calls
    setShowAgentPicker(null);
  };

  // File download handler
  const handleFileDownload = (file: { name: string; type: string; size?: string }) => {
    console.log('Downloading file:', file.name);
  };

  // Check if user can edit/delete message
  const canEditDelete = (message: Message) => {
    // For real API messages, check if user owns the message or is admin
    return isAdmin || message.user_id === 'current'; // TODO: Replace with actual current user ID
  };

  // Get pinned messages from current chat
  const getPinnedMessages = () => {
    return filteredMessages
      .filter(msg => pinnedMessageIds.has(msg.message_id))
      .map(msg => {
        const authorName = msg.username || msg.user?.username || msg.full_name || (msg.from_agent ? msg.from_agent.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown User');
        const authorAvatar = authorName.split(' ').map(n => n[0]).join('').toUpperCase();
        
        return {
          id: msg.message_id,
          content: msg.content,
          author: {
            name: authorName,
            avatar: authorAvatar,
            type: msg.from_agent ? 'ai-agent' as const : 'current_user' as const,
            subType: msg.from_agent ? 'claude' as const : undefined
          },
          timestamp: new Date(msg.created_at).toLocaleTimeString(),
          pinnedBy: 'User', // In real app, track who pinned it
          channelId: msg.channel_id
        };
      });
  };

  // Get current pinned messages for modal
  const currentPinnedMessages = getPinnedMessages();

  return (
    <div className="flex-1 flex bg-background overflow-hidden">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <ChatHeader 
          channel={channel}
          project={project}
          showRightSidebar={showRightSidebar}
          onToggleSidebar={() => {
            if (showRightSidebar) {
              setSidebarVisible(false);
              setTimeout(() => {
                setShowRightSidebar(false);
              }, 300);
            } else {
              setShowRightSidebar(true);
              setTimeout(() => {
                setSidebarVisible(true);
              }, 10);
            }
          }}
          onShowMembers={() => setShowMembersModal(true)}
          onShowSearch={() => setShowSearchModal(true)}
        />

        {/* Messages Area */}
        <MessagesArea
          filteredMessages={filteredMessages}
          channel={channel}
          selectedChannelId={selectedChannelId}
          isLoadingMessages={isLoadingMessages}
          pinnedMessageIds={pinnedMessageIds}
          editedMessages={editedMessages}
          deletingMessages={deletingMessages}
          showAgentPicker={showAgentPicker}
          isAdmin={isAdmin}
          messageRefs={messageRefs}
          availableAgents={availableAgents}
          getRandomQuote={getRandomQuote}
          canEditDelete={canEditDelete}
          handlePinMessage={handlePinMessage}
          handleUnpinMessage={handleUnpinMessage}
          handleEditMessage={handleEditMessage}
          handleSwitchAgent={handleSwitchAgent}
          setShowDeleteModal={setShowDeleteModal}
          setLightboxImage={setLightboxImage}
          setShowAgentPicker={setShowAgentPicker}
        />

        {/* Message Input */}
        <MessageInput 
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          editingMessage={editingMessage}
          editContent={editContent}
          setEditContent={setEditContent}
          handleSaveEdit={handleSaveEdit}
          handleCancelEdit={handleCancelEdit}
          selectedImage={selectedImage}
          imagePreview={imagePreview}
          setSelectedImage={setSelectedImage}
          setImagePreview={setImagePreview}
          handleSendMessage={handleSendMessage}
          setShowMentionModal={setShowMentionModal}
          filteredMessages={filteredMessages}
          mockEmojis={mockEmojis}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal 
          showDeleteModal={showDeleteModal}
          onClose={() => setShowDeleteModal(null)}
          onConfirmDelete={handleDeleteMessage}
        />

        {/* Lightbox for Image View */}
        <ImageLightbox 
          lightboxImage={lightboxImage}
          onClose={() => setLightboxImage(null)}
        />
      </div>

      {/* Right Sidebar */}
      <RightSidebar 
        showRightSidebar={showRightSidebar}
        sidebarVisible={sidebarVisible}
        onClose={() => {
          setSidebarVisible(false);
          setTimeout(() => {
            setShowRightSidebar(false);
          }, 300);
        }}
        sharedImages={sharedImages}
        sharedFiles={sharedFiles}
        onImageClick={setLightboxImage}
        onFileDownload={handleFileDownload}
        onShowAllImagesClick={() => setShowAllImagesModal(true)}
        onShowAllFilesClick={() => setShowAllFilesModal(true)}
        onShowPinnedMessagesClick={() => setShowPinnedMessagesModal(true)}
        onShowChannelSettingsClick={() => setShowChannelSettingsModal(true)}
      />

      {/* Modals */}
      <AllImagesModal 
        showAllImagesModal={showAllImagesModal}
        onClose={() => setShowAllImagesModal(false)}
        sharedImages={sharedImages}
        onImageClick={setLightboxImage}
      />

      <AllFilesModal 
        showAllFilesModal={showAllFilesModal}
        onClose={() => setShowAllFilesModal(false)}
        sharedFiles={sharedFiles}
        onFileDownload={handleFileDownload}
      />

      <PinnedMessagesModal 
        showPinnedMessagesModal={showPinnedMessagesModal}
        onClose={() => setShowPinnedMessagesModal(false)}
        pinnedMessages={currentPinnedMessages}
        onScrollToMessage={scrollToMessage}
        onCloseRightSidebar={() => {
          setSidebarVisible(false);
          setTimeout(() => {
            setShowRightSidebar(false);
          }, 300);
        }}
      />

      <ChannelSettingsModal 
        showChannelSettingsModal={showChannelSettingsModal}
        onClose={() => setShowChannelSettingsModal(false)}
        channel={channel}
        notificationSettings={notificationSettings}
        onNotificationSettingsChange={setNotificationSettings}
        onSave={() => {
          // TODO: Save settings to API
        }}
      />

      <MembersModal 
        showMembersModal={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        channelName={channel?.name || 'Unknown Channel'}
        currentUserId="current"
        isAdmin={isAdmin}
      />

      <SearchModal 
        showSearchModal={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        messages={filteredMessages}
        onMessageSelect={scrollToMessage}
      />

      <MentionModal 
        showMentionModal={showMentionModal}
        onClose={() => setShowMentionModal(false)}
        filteredUsers={filteredUsers}
        mentionSearch={mentionSearch}
        onUserSelect={(user) => {
          const mentionText = `@${user.name} `;
          const newText = newMessage.replace(/@\w*$/, mentionText);
          setNewMessage(newText);
          setShowMentionModal(false);
        }}
        onMentionSearchChange={setMentionSearch}
      />
    </div>
  );
}