import { useState, useCallback } from 'react';
import { ChatService } from '../services/ChatService';

interface UseMessageEditProps {
  messageId: string;
  initialContent: string;
  conversationId: string | null;
  onMessagesReload: (conversationId: string) => Promise<void>;
  onError?: (errorMessage: string) => void;
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
  onError
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
    console.log('submitEdit called', { conversationId, isEditing, messageId, editingValue });
    
    if (!isEditing) {
      console.log('Not in editing mode, skipping');
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('Calling editMessage API...');
      
      // Call the edit message API
      const { content: aiResponse } = await chatService.editMessage(
        messageId, 
        editingValue, 
        conversationId
      );
      
      console.log('Edit message API response:', aiResponse);
      
      // Reload the conversation to get updated messages
      if (conversationId) {
        console.log('Reloading conversation messages...');
        await onMessagesReload(conversationId);
        console.log('Messages reloaded successfully');
      } else {
        console.log('No conversationId, skipping message reload');
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
  }, [conversationId, messageId, editingValue, isEditing, chatService, onMessagesReload, onError]);

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
