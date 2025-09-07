import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useConversation } from '../hooks/useConversation';
import { useMessages } from '../hooks/useMessages';
import { Message } from '../components/Messages';

interface ChatContextType {
  // Core chat state
  messages: Message[];
  isLoading: boolean;
  conversationId: string | null;
  conversationName: string | undefined;
  
  // Core chat actions
  onSendMessage: (content: string) => Promise<void>;
  onNewChat: () => void;
  onNameUpdate: (name: string) => void;
  
  // Internal methods for effects
  setConversationId: (id: string | null) => void;
  setConversationName: (name: string | undefined) => void;
  loadConversationMessages: (conversationId: string) => Promise<void>;
  clearMessages: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
  selectedConversationId?: string | null;
  selectedConversationName?: string;
  onConversationChange?: (conversationId: string | null) => void;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ 
  children, 
  selectedConversationId,
  selectedConversationName,
  onConversationChange
}) => {
  const conversation = useConversation(onConversationChange);
  const messages = useMessages({ 
    conversationId: conversation.conversationId, 
    onConversationChange 
  });

  // Handle conversation changes from parent
  useEffect(() => {
    if (selectedConversationId !== conversation.conversationId) {
      conversation.setConversationId(selectedConversationId || null);
      conversation.setConversationName(selectedConversationName);
      
      if (selectedConversationId) {
        messages.loadConversationMessages(selectedConversationId);
      } else {
        messages.clearMessages();
        conversation.setConversationName(undefined);
      }
    }
  }, [selectedConversationId, selectedConversationName, conversation, messages]);

  const handleNewChat = () => {
    messages.clearMessages();
    conversation.newConversation();
  };
  
  const contextValue: ChatContextType = {
    // Core chat state
    messages: messages.messages,
    isLoading: messages.isLoading,
    conversationId: conversation.conversationId,
    conversationName: conversation.conversationName,
    
    // Core chat actions
    onSendMessage: messages.sendMessage,
    onNewChat: handleNewChat,
    onNameUpdate: conversation.setConversationName,
    
    // Internal methods for effects
    setConversationId: conversation.setConversationId,
    setConversationName: conversation.setConversationName,
    loadConversationMessages: messages.loadConversationMessages,
    clearMessages: messages.clearMessages,
  };
  
  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};
