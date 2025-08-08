import React, { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

export function useMessageActions(messages: any[], setMessages: React.Dispatch<React.SetStateAction<any[]>>) {
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [deletedMessage, setDeletedMessage] = useState<{id: string, message: any, timeout: NodeJS.Timeout} | null>(null);
  const [editedMessages, setEditedMessages] = useState<Set<string>>(new Set());
  const [deletingMessages, setDeletingMessages] = useState<Set<string>>(new Set());
  const [pinnedMessageIds, setPinnedMessageIds] = useState<Set<string>>(new Set(['m1', 'm2', 'm5']));
  const messageRefs = useRef<{[key: string]: HTMLDivElement}>({});
  const { toast } = useToast();

  const handlePinMessage = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    setPinnedMessageIds(prev => new Set([...prev, messageId]));
    
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
      setEditedMessages(prev => new Set([...prev, editingMessage]));
      setEditingMessage(null);
      setEditContent('');
    }
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditContent('');
  };

  const handleUndoDelete = () => {
    if (deletedMessage) {
      clearTimeout(deletedMessage.timeout);
      
      setMessages(prev => [...prev, deletedMessage.message].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ));
      
      setDeletedMessage(null);
      
      toast({
        title: "Message restored",
        description: "Your message has been restored.",
      });
    }
  };

  const handleSoftDeleteMessage = (messageId: string) => {
    const messageToDelete = messages.find(m => m.id === messageId);
    if (!messageToDelete) return;

    if (deletedMessage?.timeout) {
      clearTimeout(deletedMessage.timeout);
    }

    setDeletingMessages(prev => new Set([...prev, messageId]));

    setTimeout(() => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
      setDeletingMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
    }, 300);

    const timeout = setTimeout(() => {
      setDeletedMessage(null);
    }, 10000);

    setDeletedMessage({
      id: messageId,
      message: messageToDelete,
      timeout
    });

    toast({
      title: "Message deleted",
      description: "You can undo this action within 10 seconds.",
      action: (
        <button
          className="text-sm px-2 py-1 border rounded"
          onClick={handleUndoDelete}
        >
          Undo
        </button>
      ),
    });
  };


  const handleDeleteMessage = (messageId: string) => {
    handleSoftDeleteMessage(messageId);
    setShowDeleteModal(null);
  };

  const scrollToMessage = (messageId: string) => {
    const messageElement = messageRefs.current[messageId];
    if (messageElement) {
      messageElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      messageElement.classList.add('bg-primary/15');
      setTimeout(() => {
        messageElement.classList.remove('bg-primary/15');
      }, 1500);
    }
  };

  return {
    // State
    editingMessage,
    editContent,
    setEditContent,
    showDeleteModal,
    setShowDeleteModal,
    editedMessages,
    deletingMessages,
    pinnedMessageIds,
    messageRefs,
    
    // Actions
    handlePinMessage,
    handleUnpinMessage,
    handleEditMessage,
    handleSaveEdit,
    handleCancelEdit,
    handleSoftDeleteMessage,
    handleDeleteMessage,
    scrollToMessage,
  };
}