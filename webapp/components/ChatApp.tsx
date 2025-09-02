import React, { useState, useCallback } from 'react';
import { ChatContainer } from './ChatContainer';
import { Message } from './ChatMessage';

export const ChatApp: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const simulateAIResponse = async (userMessage: string): Promise<string> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Simple mock responses based on user input
    const responses = [
      "I understand your message. How can I help you further?",
      "That's an interesting question. Let me think about that...",
      "I'd be happy to assist you with that. Could you provide more details?",
      "Thank you for sharing that with me. What would you like to explore next?",
      "I see what you're asking about. Here's what I think...",
      "That's a great point! Let me elaborate on that topic.",
      "I appreciate your question. Here's my perspective on that matter.",
      "Interesting! I'd like to learn more about your thoughts on this."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
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
      // Simulate AI response
      const aiResponse = await simulateAIResponse(content);
      
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
        content: "I'm sorry, I encountered an error. Please try again.",
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="chat-app">
      <div className="chat-controls">
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
      
      <ChatContainer
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
    </div>
  );
};