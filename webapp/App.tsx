import "./index.css";
import "./styles/markdown.css";
import "./styles/menu.css";
import React, { useState, useCallback, useEffect } from 'react';
import { ChatApp, Menu, About, ConversationSelection } from "./components";
import { Message } from './types/Message';
import { ChatService } from './services/ChatService';

export function App() {
  const [currentView, setCurrentView] = useState<string>('chat');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedConversationName, setSelectedConversationName] = useState<string | undefined>(undefined);
  
  // Chat state - moved from ChatContext
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationIdState] = useState<string | null>(null);
  const [conversationName, setConversationNameState] = useState<string | undefined>(undefined);
  
  const chatService = new ChatService();

  // Chat management callbacks following geminichat pattern
  const setConversationId = useCallback((id: string | null) => {
    setConversationIdState(id);
    setSelectedConversationId(id);
  }, []);

  const setConversationName = useCallback((name: string | undefined) => {
    setConversationNameState(name);
    setSelectedConversationName(name);
  }, []);

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
    const userMessage = chatService.createUserMessage(content);
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const { content: aiResponse, conversationId: newConversationId } = 
        await chatService.sendMessage(content, conversationId);
      
      if (!conversationId && newConversationId) {
        console.log('Setting new conversationId:', newConversationId);
        setConversationId(newConversationId);
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
  }, [conversationId, chatService, setConversationId]);

  const handleNewChat = useCallback(() => {
    clearMessages();
    setConversationId(null);
    setConversationName(undefined);
  }, [clearMessages, setConversationId, setConversationName]);

  const handleError = useCallback((errorMessage: string) => {
    const errorMsg = chatService.createErrorMessage(errorMessage);
    setMessages(prev => [...prev, errorMsg]);
  }, [chatService]);

  const handleViewChange = (view: string) => {
    setCurrentView(view);
  };

  const handleConversationSelect = useCallback((id: string | null, name?: string) => {
    setSelectedConversationId(id);
    setSelectedConversationName(name);
    setCurrentView('chat');
    
    if (id) {
      setConversationId(id);
      setConversationName(name);
      loadConversationMessages(id);
    } else {
      handleNewChat();
    }
  }, [setConversationId, setConversationName, loadConversationMessages, handleNewChat]);

  // Handle conversation changes
  useEffect(() => {
    if (selectedConversationId !== conversationId) {
      if (selectedConversationId) {
        setConversationId(selectedConversationId);
        setConversationName(selectedConversationName);
        loadConversationMessages(selectedConversationId);
      } else {
        handleNewChat();
      }
    }
  }, [selectedConversationId, selectedConversationName, conversationId, setConversationId, setConversationName, loadConversationMessages, handleNewChat]);

  // Chat props to pass to ChatApp
  const chatProps = {
    messages,
    isLoading,
    conversationId,
    conversationName,
    onSendMessage: sendMessage,
    onNewChat: handleNewChat,
    onNameUpdate: setConversationName,
    onMessagesReload: loadConversationMessages,
    onError: handleError,
  };
  
  console.log('App chatProps:', { conversationId, messageCount: messages.length });

  return (
    <div className="app">
      <div className="app-layout">
        <Menu activeView={currentView} onViewChange={handleViewChange} />
        
        <div className="app-content">
          {currentView === 'chat' ? (
            <ChatApp {...chatProps} />
          ) : currentView === 'history' ? (
            <ConversationSelection 
              selectedConversationId={selectedConversationId}
              onConversationSelect={handleConversationSelect}
            />
          ) : (
            <About />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
