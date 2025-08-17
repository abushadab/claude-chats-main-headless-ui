import React, { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Message } from "@/types/chat.types";

// Note: This hook now works with real API messages, not mock data
// The setMessages function is now a no-op since messages are managed by the useMessages hook
export function useMessageActions(messages: Message[], setMessages: (fn: (prev: Message[]) => Message[]) => void) {
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [deletedMessage, setDeletedMessage] = useState<{id: string, message: Message, timeout: NodeJS.Timeout} | null>(null);
  const [editedMessages, setEditedMessages] = useState<Map<string, string>>(new Map());
  const [deletingMessages, setDeletingMessages] = useState<Set<string>>(new Set());
  const [pinnedMessageIds, setPinnedMessageIds] = useState<Set<string>>(new Set());
  const messageRefs = useRef<{[key: string]: HTMLDivElement}>({});
  const { toast } = useToast();

  const handlePinMessage = (messageId: string) => {
    const message = messages.find(m => m.message_id === messageId);
    if (!message) return;

    setPinnedMessageIds(prev => new Set([...prev, messageId]));
    
    const messageElement = messageRefs.current[messageId];
    if (messageElement) {
      messageElement.classList.add('brightness-110');
      setTimeout(() => {
        messageElement.classList.remove('brightness-110');
      }, 200);
    }
    
    const authorName = message.username || message.user?.username || message.full_name || (message.from_agent ? message.from_agent.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown User');
    toast({
      title: "Message pinned",
      description: `Message from ${authorName} has been pinned to the channel.`,
      duration: 3000,
    });
  };

  const handleUnpinMessage = (messageId: string) => {
    const message = messages.find(m => m.message_id === messageId);
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
    
    const authorName = message.username || message.user?.username || message.full_name || (message.from_agent ? message.from_agent.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown User');
    toast({
      title: "Message unpinned",
      description: `Message from ${authorName} has been unpinned.`,
      duration: 3000,
    });
  };

  const handleEditMessage = (messageId: string) => {
    const message = messages.find(m => m.message_id === messageId);
    if (message) {
      setEditingMessage(messageId);
      setEditContent(message.content);
    }
  };

  const handleSaveEdit = () => {
    if (editingMessage) {
      // TODO: Call real API to edit message
      // For now, just mark as edited locally
      setEditedMessages(prev => {
        const newMap = new Map(prev);
        newMap.set(editingMessage, new Date().toISOString());
        return newMap;
      });
      setEditingMessage(null);
      setEditContent('');
      
      toast({
        title: "Message edited",
        description: "Your message has been updated.",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditContent('');
  };

  const handleUndoDelete = () => {
    if (deletedMessage) {
      clearTimeout(deletedMessage.timeout);
      
      // TODO: Call real API to restore message
      // For now, just clear the deleted state
      setDeletedMessage(null);
      
      toast({
        title: "Message restored",
        description: "Your message has been restored.",
      });
    }
  };

  const handleSoftDeleteMessage = (messageId: string) => {
    const messageToDelete = messages.find(m => m.message_id === messageId);
    if (!messageToDelete) return;

    if (deletedMessage?.timeout) {
      clearTimeout(deletedMessage.timeout);
    }

    setDeletingMessages(prev => new Set([...prev, messageId]));

    // TODO: Call real API to delete message
    // For now, just show the toast
    const timeout = setTimeout(() => {
      setDeletedMessage(null);
      setDeletingMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
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