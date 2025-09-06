import { useState, useCallback, useEffect } from 'react';
import { Message } from '../components/ChatMessage';
import { ChatService } from '../services/ChatService';

interface UseMessagesProps {
  conversationId: string | null;
  onConversationChange?: (conversationId: string | null) => void;
}

interface UseMessagesReturn {
  messages: Message[];
  isLoading: boolean;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  sendMessage: (content: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  resendMessage: (messageId: string, content: string) => Promise<void>;
  loadConversationMessages: (conversationId: string) => Promise<void>;
  clearMessages: () => void;
}

export const useMessages = ({ 
  conversationId, 
  onConversationChange 
}: UseMessagesProps): UseMessagesReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatService = new ChatService();

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const loadConversationMessages = useCallback(async (conversationId: string) => {
    try {
      setIsLoading(true);
      const loadedMessages = await chatService.loadConversationMessages(conversationId);
      setMessages(loadedMessages);
    } catch (error) {
      console.error('Failed to load conversation messages:', error);
      
      const errorMessage = chatService.createErrorMessage(
        "Failed to load conversation history. Please try again."
      );
      setMessages([errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [chatService]);

  const sendMessage = useCallback(async (content: string) => {
    // Add user message immediately
    const userMessage = chatService.createUserMessage(content);
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const { content: aiResponse, conversationId: newConversationId } = 
        await chatService.sendMessage(content, conversationId);
      
      // Update conversation ID if this is the first message
      if (!conversationId && newConversationId) {
        onConversationChange?.(newConversationId);
      }
      
      const assistantMessage = chatService.createAssistantMessage(aiResponse);
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage = chatService.createErrorMessage();
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, onConversationChange, chatService]);

  const editMessage = useCallback(async (messageId: string, content: string) => {
    if (!conversationId) return;
    
    try {
      setIsLoading(true);
      
      // Optimistically update the message content
      setMessages(prev => 
        prev.map(m => m.id === messageId ? { ...m, content } : m)
      );
      
      const { content: aiResponse } = await chatService.editMessage(
        messageId, 
        content, 
        conversationId
      );
      
      const assistantMessage = chatService.createAssistantMessage(aiResponse);
      
      // Remove any messages after the edited message, then add assistant response
      setMessages(prev => {
        const editedIndex = prev.findIndex(m => m.id === messageId);
        const truncated = editedIndex >= 0 ? prev.slice(0, editedIndex + 1) : prev;
        return [...truncated, assistantMessage];
      });
    } catch (error) {
      console.error('Error editing message:', error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, chatService]);

  const resendMessage = useCallback(async (messageId: string, content: string) => {
    if (!conversationId) return;
    
    try {
      setIsLoading(true);
      const { content: aiResponse } = await chatService.resendMessage(
        messageId, 
        content, 
        conversationId
      );
      
      const assistantMessage = chatService.createAssistantMessage(aiResponse);
      
      setMessages(prev => {
        const editedIndex = prev.findIndex(m => m.id === messageId);
        const truncated = editedIndex >= 0 ? prev.slice(0, editedIndex + 1) : prev;
        return [...truncated, assistantMessage];
      });
    } catch (error) {
      console.error('Error resending message:', error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, chatService]);

  return {
    messages,
    isLoading,
    setMessages,
    sendMessage,
    editMessage,
    resendMessage,
    loadConversationMessages,
    clearMessages,
  };
};
