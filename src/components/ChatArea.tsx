"use client"

import { useState, useEffect, useRef } from "react";
import { Hash, Users, Send, Paperclip, Smile, Image, FileText, Video, Plus, AtSign, Search, X, Edit3, Trash2, MoreHorizontal, ChevronDown, Info, Pin, Settings, Download, ZoomIn } from "lucide-react";
import { mockMessages, mockProjects } from "@/data/mockData";
import { Button } from "@/components/ui/headless-button";
import { Input } from "@/components/ui/headless-input";
import { ScrollArea } from "@/components/ui/headless-scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/headless-avatar";
import { ClientOnly } from "@/components/ClientOnly";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

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
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [deletedMessage, setDeletedMessage] = useState<{id: string, message: any, timeout: NodeJS.Timeout} | null>(null);
  const [editedMessages, setEditedMessages] = useState<Set<string>>(new Set());
  const [deletingMessages, setDeletingMessages] = useState<Set<string>>(new Set());
  const [showAgentPicker, setShowAgentPicker] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(true); // Admin status - you can make this dynamic
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [showAllImagesModal, setShowAllImagesModal] = useState(false);
  const [showAllFilesModal, setShowAllFilesModal] = useState(false);
  const [showPinnedMessagesModal, setShowPinnedMessagesModal] = useState(false);
  const [showChannelSettingsModal, setShowChannelSettingsModal] = useState(false);
  const [sidebarAnimating, setSidebarAnimating] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    muteNotifications: false,
    desktopNotifications: true
  });
  const [pinnedMessageIds, setPinnedMessageIds] = useState<Set<string>>(new Set(['m1', 'm2', 'm5'])); // Initial pinned messages
  const messageRefs = useRef<{[key: string]: HTMLDivElement}>({});
  const { toast } = useToast();

  // Custom Toggle Switch Component
  const ToggleSwitch = ({ checked, onCheckedChange, disabled = false }: { 
    checked: boolean; 
    onCheckedChange: (checked: boolean) => void; 
    disabled?: boolean 
  }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={`
        relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
        transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 
        focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
        ${checked ? 'bg-primary' : 'bg-input'} 
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90'}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-lg ring-0 
          transition-transform duration-200 ease-in-out
          ${checked ? 'translate-x-4' : 'translate-x-0'}
        `}
      />
    </button>
  );
  
  // Mock users for mention functionality
  const mockUsers = [
    { id: '1', name: 'Abu Shadab', avatar: 'AS', type: 'current_user' },
    { id: '2', name: 'Claude Assistant', avatar: 'CA', type: 'ai-agent', subType: 'claude' },
    { id: '3', name: 'John Doe', avatar: 'JD', type: 'human' },
    { id: '4', name: 'Jane Smith', avatar: 'JS', type: 'human' },
  ];
  
  // Available agents for admin to switch between
  const availableAgents = [
    { id: 'agent1', name: 'Monitoring Agent', avatar: 'MA', type: 'ai-agent', subType: 'claude' },
    { id: 'agent2', name: 'DevOps Agent', avatar: 'DA', type: 'ai-agent', subType: 'claude' },
    { id: 'agent3', name: 'Security Agent', avatar: 'SA', type: 'ai-agent', subType: 'claude' },
    { id: 'agent4', name: 'Code Review Agent', avatar: 'CR', type: 'ai-agent', subType: 'claude' },
  ];
  
  // Mock emojis for emoji picker
  const mockEmojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥲', '😊',
    '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙',
    '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎',
    '🥸', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁',
    '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
    '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥',
    '👍', '👎', '👌', '🤝', '👏', '🙌', '👋', '🤚', '🖐️', '✋',
    '🖖', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘', '👈',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️'
  ];
  
  const filteredUsers = mockUsers.filter(user => 
    user.name.toLowerCase().includes(mentionSearch.toLowerCase())
  );
  
  const project = mockProjects.find(p => p.id === selectedProjectId);
  const channel = project?.channels.find(c => c.id === selectedChannelId);
  const filteredMessages = messages.filter(m => m.channelId === selectedChannelId);

  // Motivational quotes for empty channels
  const motivationalQuotes = [
    {
      quote: "Innovation distinguishes between a leader and a follower.",
      author: "Steve Jobs"
    },
    {
      quote: "Your most unhappy customers are your greatest source of learning.",
      author: "Bill Gates"
    },
    {
      quote: "The first step is to establish that something is possible; then probability will occur.",
      author: "Elon Musk"
    },
    {
      quote: "If you don't give up, you still have a chance.",
      author: "Jack Ma"
    },
    {
      quote: "I am not afraid of an army of lions led by a sheep; I am afraid of an army of sheep led by a lion.",
      author: "Alexander the Great"
    },
    {
      quote: "The way to get started is to quit talking and begin doing.",
      author: "Walt Disney"
    },
    {
      quote: "Don't be afraid to give up the good to go for the great.",
      author: "John D. Rockefeller"
    },
    {
      quote: "I have not failed. I've just found 10,000 ways that won't work.",
      author: "Thomas Edison"
    },
    {
      quote: "Every master was once a disaster.",
      author: "T. Harv Eker"
    },
    {
      quote: "Chess is mental torture.",
      author: "Garry Kasparov"
    },
    {
      quote: "I prefer to lose a really good game than to win a bad one.",
      author: "Magnus Carlsen"
    },
    {
      quote: "Tactics flow from a superior position.",
      author: "Bobby Fischer"
    },
    {
      quote: "The best revenge is massive success.",
      author: "Frank Sinatra"
    },
    {
      quote: "Life is what happens to you while you're busy making other plans.",
      author: "John Lennon"
    },
    {
      quote: "The future belongs to those who believe in the beauty of their dreams.",
      author: "Eleanor Roosevelt"
    },
    {
      quote: "It is during our darkest moments that we must focus to see the light.",
      author: "Aristotle"
    },
    {
      quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
      author: "Winston Churchill"
    },
    {
      quote: "The only way to do great work is to love what you do.",
      author: "Steve Jobs"
    },
    {
      quote: "In the middle of difficulty lies opportunity.",
      author: "Albert Einstein"
    },
    {
      quote: "Believe you can and you're halfway there.",
      author: "Theodore Roosevelt"
    }
  ];

  // Get a consistent random quote for this channel
  const getRandomQuote = (channelId: string) => {
    const seed = channelId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = seed % motivationalQuotes.length;
    return motivationalQuotes[index];
  };

  // Pin/Unpin message handlers
  const handlePinMessage = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    setPinnedMessageIds(prev => new Set([...prev, messageId]));
    
    // Subtle visual feedback without overflow
    const messageElement = messageRefs.current[messageId];
    if (messageElement) {
      messageElement.classList.add('brightness-110');
      setTimeout(() => {
        messageElement.classList.remove('brightness-110');
      }, 200);
    }
    
    toast({
      title: "📌 Message pinned",
      description: `Message from ${message.author.name} has been pinned to the channel.`,
      duration: 3000,
    });
  };

  const handleUnpinMessage = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    setPinnedMessageIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(messageId);
      return newSet;
    });
    
    // Subtle visual feedback for unpin
    const messageElement = messageRefs.current[messageId];
    if (messageElement) {
      messageElement.classList.add('opacity-70');
      setTimeout(() => {
        messageElement.classList.remove('opacity-70');
      }, 300);
    }
    
    toast({
      title: "📌 Message unpinned",
      description: `Message from ${message.author.name} has been unpinned.`,
      duration: 3000,
    });
  };

  // Scroll to message function
  const scrollToMessage = (messageId: string) => {
    const messageElement = messageRefs.current[messageId];
    if (messageElement) {
      messageElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Gentle highlight effect
      messageElement.classList.add('bg-primary/15');
      setTimeout(() => {
        messageElement.classList.remove('bg-primary/15');
      }, 1500);
    }
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
    } catch (error) {
      toast({
        title: "Download failed",
        description: "There was an error downloading the file.",
      });
    }
  };

  // ESC key support for lightbox
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && lightboxImage) {
        setLightboxImage(null);
      }
    };

    if (lightboxImage) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [lightboxImage]);

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
  }, [filteredMessages]);

  if (!project || !channel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-muted-foreground">
            Select a channel to start chatting
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            Choose a project and channel from the sidebar to view messages
          </p>
        </div>
      </div>
    );
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

  const handleEditMessage = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      setEditingMessage(messageId);
      setEditContent(message.content);
    }
  };

  const handleSaveEdit = () => {
    if (editingMessage) {
      setMessages(prev => prev.map(msg => 
        msg.id === editingMessage 
          ? { ...msg, content: editContent }
          : msg
      ));
      // Mark message as edited
      setEditedMessages(prev => new Set([...prev, editingMessage]));
      setEditingMessage(null);
      setEditContent('');
    }
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditContent('');
  };

  const handleSoftDeleteMessage = (messageId: string) => {
    const messageToDelete = messages.find(m => m.id === messageId);
    if (!messageToDelete) return;

    // Clear any existing deleted message timeout
    if (deletedMessage?.timeout) {
      clearTimeout(deletedMessage.timeout);
    }

    // Start deletion animation
    setDeletingMessages(prev => new Set([...prev, messageId]));

    // Remove from UI after animation
    setTimeout(() => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
      setDeletingMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
    }, 300); // Wait for animation

    // Set timeout for permanent deletion
    const timeout = setTimeout(() => {
      setDeletedMessage(null);
    }, 10000); // 10 seconds to undo

    setDeletedMessage({
      id: messageId,
      message: messageToDelete,
      timeout
    });

    // Show toast with undo option
    toast({
      title: "Message deleted",
      description: "You can undo this action within 10 seconds.",
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={handleUndoDelete}
        >
          Undo
        </Button>
      ),
    });
  };

  const handleUndoDelete = () => {
    if (deletedMessage) {
      // Clear the timeout
      clearTimeout(deletedMessage.timeout);
      
      // Restore the message
      setMessages(prev => [...prev, deletedMessage.message].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ));
      
      setDeletedMessage(null);
      
      // Show confirmation toast
      toast({
        title: "Message restored",
        description: "Your message has been restored.",
      });
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    handleSoftDeleteMessage(messageId);
    setShowDeleteModal(null);
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

  const canEditDelete = (message: any) => {
    return message.author.type === 'current_user' || message.author.type === 'human' || 
           (isAdmin && message.author.type === 'ai-agent');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    // Handle Enter to send (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    // Handle Shift+Enter for new line (default behavior)
    // Handle double Escape to clear message
    if (e.key === 'Escape') {
      const now = Date.now();
      const lastEscape = (e.target as any).lastEscape || 0;
      if (now - lastEscape < 300) { // Double escape within 300ms
        setNewMessage('');
      }
      (e.target as any).lastEscape = now;
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


  // Mock data for sidebar
  const sharedImages = [
    { id: '1', url: 'https://picsum.photos/150/100?random=1', name: 'Screenshot 2024.png', date: '2 days ago', author: 'John Doe' },
    { id: '2', url: 'https://picsum.photos/150/100?random=2', name: 'Design mockup.jpg', date: '3 days ago', author: 'Sarah Chen' },
    { id: '3', url: 'https://picsum.photos/150/100?random=3', name: 'Graph chart.png', date: '1 week ago', author: 'Mike Ross' },
    { id: '4', url: 'https://picsum.photos/150/100?random=4', name: 'Dashboard UI.png', date: '2 weeks ago', author: 'Alex Rodriguez' },
    { id: '5', url: 'https://picsum.photos/150/100?random=5', name: 'Meeting notes.jpg', date: '3 weeks ago', author: 'Emma Wilson' },
    { id: '6', url: 'https://picsum.photos/150/100?random=6', name: 'Architecture.png', date: '1 month ago', author: 'Tom Chen' }
  ];

  const sharedFiles = [
    { id: '1', name: 'Project_Brief.pdf', size: '2.3 MB', date: '1 day ago', author: 'Alex Rodriguez', type: 'pdf' },
    { id: '2', name: 'Requirements.docx', size: '1.8 MB', date: '3 days ago', author: 'Emma Wilson', type: 'doc' },
    { id: '3', name: 'Budget.xlsx', size: '956 KB', date: '1 week ago', author: 'Tom Chen', type: 'excel' },
    { id: '4', name: 'Technical_Spec.pdf', size: '3.1 MB', date: '2 weeks ago', author: 'John Doe', type: 'pdf' },
    { id: '5', name: 'Presentation.pptx', size: '4.5 MB', date: '3 weeks ago', author: 'Sarah Chen', type: 'ppt' },
    { id: '6', name: 'Database_Schema.sql', size: '125 KB', date: '1 month ago', author: 'Mike Ross', type: 'code' }
  ];

  const channelMembers = [
    { id: '1', name: 'Abu Shadab', avatar: 'AS', status: 'online', role: 'Admin' },
    { id: '2', name: 'Sarah Chen', avatar: 'SC', status: 'online', role: 'Member' },
    { id: '3', name: 'John Doe', avatar: 'JD', status: 'away', role: 'Member' },
    { id: '4', name: 'Emma Wilson', avatar: 'EW', status: 'offline', role: 'Member' }
  ];

  // Get current pinned messages for modal
  const currentPinnedMessages = getPinnedMessages();

  return (
    <div className="flex-1 flex bg-background overflow-hidden">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
      <div className="h-[60px] border-b border-border bg-background px-4 flex items-center justify-between">
        <div className="flex items-center">
          <Hash className="h-5 w-5 text-muted-foreground mr-2" />
          <div>
            <h2 className="font-semibold text-foreground">{channel.name}</h2>
            <p className="text-sm text-muted-foreground">{project.members} members</p>
          </div>
          {channel.isPrivate && (
            <span className="ml-2 text-xs bg-muted px-2 py-1 rounded">Private</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Users className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              if (showRightSidebar) {
                // Close animation
                setSidebarVisible(false);
                setTimeout(() => {
                  setShowRightSidebar(false);
                }, 300);
              } else {
                // Open animation
                setShowRightSidebar(true);
                setTimeout(() => {
                  setSidebarVisible(true);
                }, 10); // Small delay to trigger transition
              }
            }}
            className={showRightSidebar ? "bg-accent" : ""}
          >
            <Info className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-2 py-4">
        <div className="space-y-1">
          {filteredMessages.length === 0 ? (
            /* Empty State with Motivational Quote */
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
                    "{getRandomQuote(selectedChannelId).quote}"
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
            {filteredMessages.map((message, index) => {
            const isConsecutive = 
                  index > 0 && 
                  filteredMessages[index - 1].author.name === message.author.name &&
                  filteredMessages[index - 1].timestamp === message.timestamp;
                
                const isCurrentUser = message.author.type === 'current_user';

                const isPinned = pinnedMessageIds.has(message.id);
                
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
                <div className={`relative w-[70%] ${isCurrentUser ? 'ml-auto' : 'mr-auto'} ${isPinned ? 'bg-primary/20 hover:bg-primary/25' : 'bg-muted/50 hover:bg-muted/70'} rounded-lg px-4 py-3 transition-colors flex ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
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
                    {(message as any).image && (
                      <div className={`mt-2 ${isCurrentUser ? 'flex justify-end' : 'flex justify-start'}`}>
                        <img 
                          src={(message as any).image} 
                          alt="Uploaded image" 
                          className="max-w-40 max-h-28 rounded-lg border border-border object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setLightboxImage((message as any).image)}
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Vertical Edit/Delete Actions - Positioned relative to message box */}
                {canEditDelete(message) && (
                  <div className={`absolute top-2 ${isCurrentUser ? 'left-[70%] ml-2' : 'right-[70%] mr-2'} opacity-0 group-hover:opacity-100 transition-opacity z-10`}>
                      <div className="flex flex-col gap-1">
                      {/* Agent Picker - Always reserve space */}
                      {message.author.type === 'ai-agent' && isAdmin ? (
                        <Popover open={showAgentPicker === message.id} onOpenChange={(open) => setShowAgentPicker(open ? message.id : null)}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 bg-background/80 hover:bg-background border border-border/50 shadow-sm"
                            >
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2" align={isCurrentUser ? "end" : "start"}>
                            <div className="space-y-1">
                              <div className="text-xs font-semibold text-muted-foreground px-2 py-1">Switch Agent:</div>
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
                      ) : (
                        <div className="h-7 w-7"></div>
                      )}
                      
                      {/* Pin/Unpin Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-7 w-7 p-0 bg-background/80 hover:bg-background border border-border/50 shadow-sm ${isPinned ? 'text-primary' : ''}`}
                        onClick={() => isPinned ? handleUnpinMessage(message.id) : handlePinMessage(message.id)}
                        title={isPinned ? 'Unpin message' : 'Pin message'}
                      >
                        <Pin className={`h-3 w-3 ${isPinned ? 'fill-current' : ''}`} />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 bg-background/80 hover:bg-background border border-border/50 shadow-sm"
                        onClick={() => handleEditMessage(message.id)}
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 bg-background/80 hover:bg-red-50 hover:text-red-600 border border-border/50 shadow-sm"
                        onClick={() => setShowDeleteModal(message.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      </div>
                    </div>
                  )}
              </div>
            );
          })}
          )
        </div>
      </div>

      {/* Message Input */}
      <div className="border-t border-border bg-background p-4">
        {/* Editing Banner */}
        {editingMessage && (() => {
          const messageBeingEdited = filteredMessages.find(m => m.id === editingMessage);
          const truncatedContent = messageBeingEdited?.content.slice(0, 50) + (messageBeingEdited?.content.length > 50 ? '...' : '');
          
          return (
            <div className="mb-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Editing message from {messageBeingEdited?.author.name}</span>
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
                Original: "{truncatedContent}"
              </div>
              <div className="text-xs text-muted-foreground">
                Press Enter to save, Escape to cancel
              </div>
            </div>
          );
        })()}
        <div className="relative w-full">
            <div className="flex flex-col bg-background rounded-2xl border border-border hover:border-border/80 focus-within:border-primary/50 transition-colors shadow-sm" data-dashlane-rid="">
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
              <div className="flex items-start px-4 py-3">
                <textarea
                  placeholder={editingMessage ? "Edit your message..." : "Message"}
                  value={editingMessage ? editContent : newMessage}
                  onChange={(e) => editingMessage ? setEditContent(e.target.value) : setNewMessage(e.target.value)}
                  onKeyDown={editingMessage ? handleEditKeyPress : handleKeyPress}
                  className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 outline-none px-0 py-2 resize-none min-h-[3rem] max-h-32 text-sm placeholder:text-muted-foreground scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
                  data-dashlane-rid=""
                  data-form-type="message"
                  rows={1}
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#d1d5db transparent'
                  }}
                />
              </div>
              <div className="flex items-center justify-between px-4 pb-3">
                {/* Bottom Left - Mention, Emoji and Image Icons */}
                <div className="flex items-center space-x-1">
                  {/* Mention Modal */}
                  <Dialog open={showMentionModal} onOpenChange={setShowMentionModal}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-8 h-8 p-0 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg"
                      >
                        <AtSign className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
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
                            onChange={(e) => setMentionSearch(e.target.value)}
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
                                onClick={() => {
                                  setNewMessage(prev => prev + `@${user.name} `);
                                  setShowMentionModal(false);
                                  setMentionSearch('');
                                }}
                              >
                                <div className={`w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center mr-3 ${
                                  user.type === 'ai-agent' 
                                    ? 'bg-orange-100 text-orange-700' 
                                    : user.type === 'current_user' || user.type === 'human'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
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
                                setNewMessage(prev => prev + emoji + ' ');
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
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() && !selectedImage}
                  size="sm"
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg disabled:opacity-50 font-medium text-sm"
                >
                  Send
                </Button>
              </div>
            </div>
        </div>
      </div>


      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <Dialog open={!!showDeleteModal} onOpenChange={() => setShowDeleteModal(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-lg">Delete Message?</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                This message will be deleted. You can undo this action for 10 seconds.
              </p>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowDeleteModal(null)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleDeleteMessage(showDeleteModal)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Lightbox for Image View */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setLightboxImage(null)}
        >
          <div 
            className="relative max-w-4xl max-h-4xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={lightboxImage} 
              alt="Full size image" 
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
      </div>

      {/* Right Sidebar Modal */}
      {showRightSidebar && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
              sidebarVisible ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={() => {
              setSidebarVisible(false);
              setTimeout(() => {
                setShowRightSidebar(false);
              }, 300);
            }}
          />
          
          {/* Sidebar Panel */}
          <div className={`ml-auto w-96 bg-background border-l border-border flex flex-col shadow-2xl relative z-10 transform transition-all duration-300 ease-out ${
            sidebarVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
          }`}>
            {/* Sidebar Header */}
            <div className="h-[60px] border-b border-border px-4 flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Shared Content</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setSidebarVisible(false);
                  setTimeout(() => {
                    setShowRightSidebar(false);
                  }, 300);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Sidebar Content */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-6">
                {/* Shared Images */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center">
                    <Image className="h-4 w-4 mr-2" />
                    Shared Images
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {sharedImages.slice(0, 6).map((image) => (
                      <div key={image.id} className="relative group cursor-pointer" onClick={() => setLightboxImage(image.url)}>
                        <img 
                          src={image.url} 
                          alt={image.name}
                          className="w-full h-20 object-cover rounded-lg border border-border group-hover:opacity-90 transition-all duration-200"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <ZoomIn className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-2 text-xs"
                    onClick={() => setShowAllImagesModal(true)}
                  >
                    View all images
                  </Button>
                </div>

                {/* Shared Files */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Shared Files
                  </h4>
                  <div className="space-y-2">
                    {sharedFiles.slice(0, 3).map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors group">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-semibold ${
                            file.type === 'pdf' ? 'bg-red-100 text-red-700' :
                            file.type === 'doc' ? 'bg-blue-100 text-blue-700' :
                            file.type === 'excel' ? 'bg-green-100 text-green-700' :
                            file.type === 'ppt' ? 'bg-orange-100 text-orange-700' :
                            file.type === 'code' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {file.type === 'pdf' ? 'PDF' : 
                             file.type === 'doc' ? 'DOC' : 
                             file.type === 'excel' ? 'XLS' :
                             file.type === 'ppt' ? 'PPT' :
                             file.type === 'code' ? 'SQL' : 'FILE'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{file.name}</div>
                            <div className="text-xs text-muted-foreground">{file.size} • {file.date}</div>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleFileDownload(file)}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-2 text-xs"
                    onClick={() => setShowAllFilesModal(true)}
                  >
                    View all files
                  </Button>
                </div>

                {/* Channel Settings */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Channel Settings
                  </h4>
                  <div className="space-y-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start h-8 text-sm"
                      onClick={() => setShowPinnedMessagesModal(true)}
                    >
                      <Pin className="h-4 w-4 mr-2" />
                      Pinned Messages
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start h-8 text-sm"
                      onClick={() => setShowChannelSettingsModal(true)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Channel Settings
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* View All Images Modal */}
      {showAllImagesModal && (
        <Dialog open={showAllImagesModal} onOpenChange={setShowAllImagesModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Image className="h-5 w-5 mr-2" />
                Shared Images ({sharedImages.length})
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <div className="grid grid-cols-3 gap-4 p-2">
                {sharedImages.map((image) => (
                  <div key={image.id} className="relative">
                    <div className="relative group cursor-pointer" onClick={() => {
                      setLightboxImage(image.url);
                      setShowAllImagesModal(false);
                    }}>
                      <img 
                        src={image.url} 
                        alt={image.name}
                        className="w-full h-32 object-cover rounded-lg border border-border group-hover:opacity-90 transition-all duration-200"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <ZoomIn className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="text-sm font-medium truncate">{image.name}</div>
                      <div className="text-xs text-muted-foreground">{image.date} • {image.author}</div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}

      {/* View All Files Modal */}
      {showAllFilesModal && (
        <Dialog open={showAllFilesModal} onOpenChange={setShowAllFilesModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Shared Files ({sharedFiles.length})
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-2 p-2">
                {sharedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors group border border-border">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded flex items-center justify-center text-xs font-semibold ${
                        file.type === 'pdf' ? 'bg-red-100 text-red-700' :
                        file.type === 'doc' ? 'bg-blue-100 text-blue-700' :
                        file.type === 'excel' ? 'bg-green-100 text-green-700' :
                        file.type === 'ppt' ? 'bg-orange-100 text-orange-700' :
                        file.type === 'code' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {file.type === 'pdf' ? 'PDF' : 
                         file.type === 'doc' ? 'DOC' : 
                         file.type === 'excel' ? 'XLS' :
                         file.type === 'ppt' ? 'PPT' :
                         file.type === 'code' ? 'SQL' : 'FILE'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{file.name}</div>
                        <div className="text-xs text-muted-foreground">{file.size} • {file.date} • {file.author}</div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-3"
                      onClick={() => handleFileDownload(file)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}

      {/* Pinned Messages Modal */}
      {showPinnedMessagesModal && (
        <Dialog open={showPinnedMessagesModal} onOpenChange={setShowPinnedMessagesModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Pin className="h-5 w-5 mr-2" />
                Pinned Messages ({currentPinnedMessages.length})
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 p-2">
                {currentPinnedMessages.map((message) => (
                  <div 
                    key={message.id} 
                    className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer group"
                    onClick={() => {
                      scrollToMessage(message.id);
                      setShowPinnedMessagesModal(false);
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {message.author.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">{message.author.name}</div>
                          <div className="text-xs text-muted-foreground">{message.timestamp}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Pin className="h-4 w-4 text-primary fill-current" />
                        <span className="text-xs text-muted-foreground">Pinned by {message.pinnedBy}</span>
                      </div>
                    </div>
                    <div className="text-sm leading-relaxed mb-2">
                      {message.content}
                    </div>
                    <div className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                      <Search className="h-3 w-3 mr-1" />
                      Click to jump to message
                    </div>
                  </div>
                ))}
                {currentPinnedMessages.length === 0 && (
                  <div className="text-center py-8">
                    <Pin className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No pinned messages yet</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Hover over a message and click the pin icon to pin it
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}

      {/* Channel Settings Modal */}
      {showChannelSettingsModal && (
        <Dialog open={showChannelSettingsModal} onOpenChange={setShowChannelSettingsModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Channel Settings
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Channel Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Channel Information</h4>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Channel Name</label>
                    <Input value={channel.name} readOnly className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Description</label>
                    <Input placeholder="Add a description..." className="mt-1" />
                  </div>
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground">Privacy & Access</h4>
                <div className="space-y-4">
                  <div className="flex items-start justify-between py-2">
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-foreground">Private Channel</div>
                      <div className="text-xs text-muted-foreground">Only invited members can access this channel</div>
                    </div>
                    <ToggleSwitch 
                      checked={channel.isPrivate} 
                      onCheckedChange={() => {}} 
                      disabled={true}
                    />
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground">Notifications</h4>
                <div className="space-y-4">
                  <div className="flex items-start justify-between py-2">
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-foreground">Mute notifications</div>
                      <div className="text-xs text-muted-foreground">Turn off all notifications for this channel</div>
                    </div>
                    <ToggleSwitch 
                      checked={notificationSettings.muteNotifications} 
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({
                        ...prev,
                        muteNotifications: checked
                      }))}
                    />
                  </div>
                  <div className="flex items-start justify-between py-2">
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-foreground">Desktop notifications</div>
                      <div className="text-xs text-muted-foreground">Show desktop notifications for new messages</div>
                    </div>
                    <ToggleSwitch 
                      checked={notificationSettings.desktopNotifications} 
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({
                        ...prev,
                        desktopNotifications: checked
                      }))}
                      disabled={notificationSettings.muteNotifications}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowChannelSettingsModal(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  setShowChannelSettingsModal(false);
                  toast({
                    title: "Settings saved",
                    description: "Channel settings have been updated successfully.",
                  });
                }}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}