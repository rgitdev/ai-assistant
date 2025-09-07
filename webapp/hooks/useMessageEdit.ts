import { useState, useCallback } from 'react';
import { ChatService } from '../services/ChatService';

interface UseMessageEditProps {
  messageId: string;
  initialContent: string;
  conversationId: string | null;
  onMessagesReload: (conversationId: string) => Promise<void>;
  onError?: (errorMessage: string) => void;
  onNewChat?: () => void;
  onSendMessage?: (message: string) => Promise<void>;
}

interface UseMessageEditReturn {
  isEditing: boolean;
  editingValue: string;
  isLoading: boolean;
  startEdit: () => void;
  cancelEdit: () => void;
  updateValue: (value: string) => void;
  submitEdit: () => Promise<void>;
  resendMessage: () => Promise<void>;
}

export const useMessageEdit = ({ 
  messageId, 
  initialContent,
  conversationId,
  onMessagesReload,
  onError,
  onNewChat,
  onSendMessage
}: UseMessageEditProps): UseMessageEditReturn => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingValue, setEditingValue] = useState(initialContent);
  const [isLoading, setIsLoading] = useState(false);
  
  const chatService = new ChatService();

  const startEdit = useCallback(() => {
    setIsEditing(true);
    setEditingValue(initialContent);
  }, [initialContent]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditingValue(initialContent);
  }, [initialContent]);

  const updateValue = useCallback((value: string) => {
    setEditingValue(value);
  }, []);

  const submitEdit = useCallback(async () => {
    if (!isEditing) return;
    
    try {
      setIsLoading(true);
      
      if (!conversationId) {
        // New chat scenario: clear state and send new message
        onNewChat?.();
        await onSendMessage?.(editingValue);
      } else {
        // Existing conversation: use edit message API
        await chatService.editMessage(messageId, editingValue, conversationId);
        await onMessagesReload(conversationId);
      }
      
    } catch (error) {
      console.error('Error editing message:', error);
      const errorMessage = chatService.createErrorMessage(
        "I'm sorry, I encountered an error while editing your message. Please try again."
      );
      onError?.(errorMessage.content);
    } finally {
      setIsLoading(false);
      setIsEditing(false);
    }
  }, [conversationId, messageId, editingValue, isEditing, chatService, onMessagesReload, onError, onNewChat, onSendMessage]);

  const resendMessage = useCallback(async () => {
    if (!conversationId) return;
    
    try {
      setIsLoading(true);
      
      const { content: aiResponse } = await chatService.resendMessage(
        messageId, 
        editingValue, 
        conversationId
      );
      
      // Reload the conversation to get updated messages
      if (conversationId) {
        await onMessagesReload(conversationId);
      }
      
    } catch (error) {
      console.error('Error resending message:', error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, messageId, editingValue, chatService, onMessagesReload]);

  return {
    isEditing,
    editingValue,
    isLoading,
    startEdit,
    cancelEdit,
    updateValue,
    submitEdit,
    resendMessage,
  };
};
