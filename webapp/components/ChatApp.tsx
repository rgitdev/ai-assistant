import React, { useState, useCallback, useEffect } from 'react';
import { ChatContainer } from './ChatContainer';
import { AssistantStatus } from './AssistantStatus';
import { Message } from './ChatMessage';
import { chatConfig } from '../config/chatConfig';

export const ChatApp: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);


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
  }, [conversationId]);

  const clearChat = async () => {
    // Clear conversation on backend if we have a conversation ID
    if (conversationId) {
      try {
        await fetch(`/api/assistant/conversations/${conversationId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Error clearing conversation on backend:', error);
        // Continue with local clear even if backend fails
      }
    }
    
    // Clear local state
    setMessages([]);
    setConversationId(null);
  };

  return (
    <div className="chat-app">
      <div className="chat-controls">
        <div className="controls-left">
          <button 
            onClick={clearChat}
            className="clear-button"
            disabled={messages.length === 0}
          >
            Clear Chat
          </button>
          
          <div className="message-count">
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </div>
        </div>
        
        <div className="controls-right">
          <AssistantStatus 
            isLoading={isLoading}
          />
        </div>
      </div>
      
      <ChatContainer
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        markdownSupported={chatConfig.markdownSupported}
      />
    </div>
  );
};