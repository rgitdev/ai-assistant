import React, { useState, useCallback, useEffect } from 'react';
import { ChatContainer } from './ChatContainer';
import { ChatHeader } from './ChatHeader';
import { Message } from './ChatMessage';
import { chatConfig } from '../config/chatConfig';
import { conversationClient } from '../client/ConversationClient';

interface ChatAppProps {
  selectedConversationId?: string | null;
  selectedConversationName?: string;
  onConversationChange?: (conversationId: string | null) => void;
}

export const ChatApp: React.FC<ChatAppProps> = ({ 
  selectedConversationId,
  selectedConversationName, 
  onConversationChange 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationName, setConversationName] = useState<string | undefined>(undefined);

  // Effect to handle conversation changes from parent
  useEffect(() => {
    if (selectedConversationId !== conversationId) {
      setConversationId(selectedConversationId || null);
      setConversationName(selectedConversationName);
      
      if (selectedConversationId) {
        // Load conversation messages from API
        loadConversationMessages(selectedConversationId);
      } else {
        // New chat - clear messages and name
        setMessages([]);
        setConversationName(undefined);
      }
    }
  }, [selectedConversationId, selectedConversationName, conversationId]);

  const loadConversationMessages = async (conversationId: string) => {
    try {
      setIsLoading(true);
      const conversationData = await conversationClient.getConversation(conversationId);
      
      // Convert ChatMessage[] to Message[]
      const convertedMessages: Message[] = conversationData.messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        timestamp: new Date(msg.timestamp)
      }));
      
      setMessages(convertedMessages);
    } catch (error) {
      console.error('Failed to load conversation messages:', error);
      
      const errorMessage: Message = {
        id: generateId(),
        content: "Failed to load conversation history. Please try again.",
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages([errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };



  const sendMessageToAPI = async (userMessage: string): Promise<{ content: string; conversationId: string }> => {
    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversationId: conversationId || undefined
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        content: data.content,
        conversationId: data.conversationId
      };
    } catch (error) {
      console.error('Error sending message to API:', error);
      throw error;
    }
  };

  const handleSendMessage = useCallback(async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: generateId(),
      content,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Send message to API
      const { content: aiResponse, conversationId: newConversationId } = await sendMessageToAPI(content);
      
      // Update conversation ID if this is the first message
      if (!conversationId) {
        setConversationId(newConversationId);
        onConversationChange?.(newConversationId);
      }
      
      const assistantMessage: Message = {
        id: generateId(),
        content: aiResponse,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      const errorMessage: Message = {
        id: generateId(),
        content: "I'm sorry, I encountered an error connecting to the AI service. Please try again.",
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, onConversationChange]);

  const newChat = async () => {
    // Start a new conversation
    setMessages([]);
    setConversationId(null);
    setConversationName(undefined);
    // Notify parent component about conversation change
    onConversationChange?.(null);
  };

  const handleNameUpdate = (newName: string) => {
    setConversationName(newName);
    // Could also notify parent component if needed
  };

  return (
    <div className="chat-app">
      <ChatHeader
        messageCount={messages.length}
        isLoading={isLoading}
        conversationId={conversationId}
        conversationName={conversationName}
        onNewChat={newChat}
        onNameUpdate={handleNameUpdate}
      />
      
      <ChatContainer
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        markdownSupported={chatConfig.markdownSupported}
      />
    </div>
  );
};