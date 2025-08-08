"use client"

import { useState, useEffect } from "react";
import { mockMessages, mockProjects } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { MessagesArea } from "./MessagesArea";
import { DeleteConfirmationModal } from "./modals/DeleteConfirmationModal";
import { ImageLightbox } from "./modals/ImageLightbox";
import { PinnedMessagesModal } from "./modals/PinnedMessagesModal";
import { ChannelSettingsModal } from "./modals/ChannelSettingsModal";
import { AllImagesModal } from "./modals/AllImagesModal";
import { AllFilesModal } from "./modals/AllFilesModal";
import { MentionModal } from "./modals/MentionModal";
import { RightSidebar } from "./components/RightSidebar";
import { MessageInput } from "./components/MessageInput";
import { ChatHeader } from "./components/ChatHeader";
import { EmptyChannelState } from "./components/EmptyChannelState";
import { useMessageActions } from "./hooks/useMessageActions";
import { mockUsers, availableAgents, mockEmojis, motivationalQuotes, sharedImages, sharedFiles } from "./mockData";

interface ChatAreaProps {
  selectedProjectId: string;
  selectedChannelId: string;
}

export function ChatArea({ selectedProjectId, selectedChannelId }: ChatAreaProps) {
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState(mockMessages);
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
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    muteNotifications: false,
    desktopNotifications: true
  });
  const { toast } = useToast();

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
  } = useMessageActions(messages, setMessages);

  
  const filteredUsers = mockUsers.filter(user => 
    user.name.toLowerCase().includes(mentionSearch.toLowerCase())
  );
  
  const project = mockProjects.find(p => p.id === selectedProjectId);
  const channel = project?.channels.find(c => c.id === selectedChannelId);
  const filteredMessages = messages.filter(m => m.channelId === selectedChannelId);


  // Get a consistent random quote for this channel
  const getRandomQuote = (channelId: string) => {
    const seed = channelId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = seed % motivationalQuotes.length;
    return motivationalQuotes[index];
  };


  // Get pinned messages from current chat
  const getPinnedMessages = () => {
    return filteredMessages
      .filter(msg => pinnedMessageIds.has(msg.id))
      .map(msg => ({
        id: msg.id,
        content: msg.content,
        author: msg.author,
        timestamp: msg.timestamp,
        pinnedBy: 'Abu Shadab', // In real app, track who pinned it
        channelId: msg.channelId
      }));
  };

  // File download handler
  const handleFileDownload = (file: { name: string; type: string; size?: string }) => {
    // In a real app, this would download the actual file from a server
    // For demo purposes, we'll create a simulated file blob and download it
    try {
      // Create a simple text content based on file type
      let content = '';
      switch (file.type) {
        case 'pdf':
          content = `%PDF-1.4\nSimulated PDF file: ${file.name}`;
          break;
        case 'doc':
          content = `Simulated Word document: ${file.name}\n\nThis is a demo file.`;
          break;
        case 'excel':
          content = `Simulated Excel file: ${file.name}\nColumn1,Column2\nValue1,Value2`;
          break;
        case 'ppt':
          content = `Simulated PowerPoint file: ${file.name}`;
          break;
        case 'code':
          content = `-- Simulated SQL file: ${file.name}\nSELECT * FROM demo_table;`;
          break;
        default:
          content = `Simulated file: ${file.name}`;
      }

      // Create blob and download link
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: `Downloading ${file.name}${file.size ? ` (${file.size})` : ''}...`,
      });
    } catch {
      toast({
        title: "Download failed",
        description: "There was an error downloading the file.",
      });
    }
  };


  // Keyboard shortcuts for message actions
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Find the most recent current user message for shortcuts
      const currentUserMessages = filteredMessages.filter(m => m.author.type === 'current_user');
      const lastMessage = currentUserMessages[currentUserMessages.length - 1];

      if (!lastMessage) return;

      if (event.key === 'e' || event.key === 'E') {
        event.preventDefault();
        if (canEditDelete(lastMessage)) {
          handleEditMessage(lastMessage.id);
        }
      } else if (event.key === 'Delete') {
        event.preventDefault();
        if (canEditDelete(lastMessage)) {
          handleSoftDeleteMessage(lastMessage.id);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [filteredMessages, canEditDelete, handleEditMessage, handleSoftDeleteMessage]);

  if (!project || !channel) {
    return <EmptyChannelState />;
  }

  const handleSendMessage = () => {
    if (newMessage.trim() || selectedImage) {
      const newMsg = {
        id: Date.now().toString(),
        content: newMessage.trim(),
        author: { 
          id: 'current', 
          name: 'Abu Shadab', 
          avatar: 'AS', 
          type: 'current_user' as const 
        },
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        channelId: selectedChannelId,
        image: imagePreview // Add image URL if present
      };
      
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
      setSelectedImage(null);
      setImagePreview(null);
    }
  };



  const handleSwitchAgent = (messageId: string, newAgent: typeof availableAgents[0]) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { 
            ...msg, 
            author: {
              name: newAgent.name,
              avatar: newAgent.avatar,
              type: 'ai-agent',
              subType: 'claude'
            }
          }
        : msg
    ));
    setShowAgentPicker(null);
  };

  const canEditDelete = (message: { author: { type: string } }) => {
    return message.author.type === 'current_user' || message.author.type === 'human' || 
           (isAdmin && message.author.type === 'ai-agent');
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
        />

      {/* Messages Area */}
      <MessagesArea
        filteredMessages={filteredMessages}
        channel={channel}
        selectedChannelId={selectedChannelId}
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

      {/* View All Images Modal */}
      <AllImagesModal 
        showAllImagesModal={showAllImagesModal}
        onClose={() => setShowAllImagesModal(false)}
        sharedImages={sharedImages}
        onImageClick={setLightboxImage}
      />

      {/* View All Files Modal */}
      <AllFilesModal 
        showAllFilesModal={showAllFilesModal}
        onClose={() => setShowAllFilesModal(false)}
        sharedFiles={sharedFiles}
        onFileDownload={handleFileDownload}
      />

      {/* Pinned Messages Modal */}
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

      {/* Channel Settings Modal */}
      <ChannelSettingsModal 
        showChannelSettingsModal={showChannelSettingsModal}
        onClose={() => setShowChannelSettingsModal(false)}
        channel={channel}
        notificationSettings={notificationSettings}
        onNotificationSettingsChange={setNotificationSettings}
        onSave={() => {
          console.log("Saving settings - toast should appear");
          toast({
            title: "Settings saved",
            description: "Channel settings have been updated successfully.",
          });
        }}
      />

      {/* Mention Modal */}
      <MentionModal 
        showMentionModal={showMentionModal}
        onClose={() => {
          setShowMentionModal(false);
          setMentionSearch('');
        }}
        mentionSearch={mentionSearch}
        onMentionSearchChange={setMentionSearch}
        filteredUsers={filteredUsers}
        onUserSelect={(user) => {
          // If message ends with @, just add the username
          // Otherwise add @username
          setNewMessage(prev => {
            if (prev.endsWith('@')) {
              return prev + `${user.name} `;
            }
            return prev + `@${user.name} `;
          });
          setMentionSearch('');
        }}
      />
    </div>
  );
}