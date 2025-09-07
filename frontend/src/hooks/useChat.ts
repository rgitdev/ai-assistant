// src/hooks/useChat.ts
import { v4 as uuidv4 } from 'uuid';
import { useState } from 'react';
import { getAiResponse } from '../services/chatService';
import type { ChatMessage } from '../types'; // Import our custom type

// Define the shape of the object returned by the hook for clarity
type UseChatReturn = {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (userMessage: string) => Promise<void>;
};

export const useChat = (): UseChatReturn => {
  // Our state is now an array of 'Message' objects
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const sendMessage = async (userMessage: string): Promise<void> => {
    if (!userMessage.trim()) return;

    const newUserMessage: ChatMessage = { content: userMessage, role: 'user', id: uuidv4(), timestamp: new Date() };
    setMessages(prev => [...prev, newUserMessage]);
    
    setIsLoading(true);

    try {
      const aiResponseText = await getAiResponse(userMessage);
      const newAiMessage: ChatMessage = { content: aiResponseText, role: 'assistant', id: uuidv4(), timestamp: new Date() };
      setMessages(prev => [...prev, newAiMessage]);
    } catch (error) {
      console.error("Failed to get AI response:", error);
      const errorMessage: ChatMessage = { content: "Sorry, I couldn't get a response.", role: 'assistant', id: uuidv4(), timestamp: new Date() };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, isLoading, sendMessage };
};