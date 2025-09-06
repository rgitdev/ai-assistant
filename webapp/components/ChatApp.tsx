import React, { useState, useCallback, useEffect } from 'react';
import { ChatContainer } from './ChatContainer';
import { ChatHeader } from './ChatHeader';
import { Message } from './ChatMessage';
import { chatConfig } from '../config/chatConfig';
import { conversationClient } from '../client/ConversationClient';
import { assistantClient } from '../client/AssistantClient';

interface ChatAppProps {
  selectedConversationId?: string | null;
  selectedConversationName?: string;
  onConversationChange?: (conversationId: string | null) => void;
}

export const ChatApp: React.FC<ChatAppProps> = (props: ChatAppProps) => {
  const { selectedConversationId, selectedConversationName, onConversationChange } = props;
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationName, setConversationName] = useState<string | undefined>(undefined);
  const [editingLast, setEditingLast] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

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
      const data = await assistantClient.sendMessage({
        message: userMessage,
        conversationId: conversationId || undefined,
      });
      return {
        content: data.content,
        conversationId: data.conversationId,
      };
    } catch (error) {
      console.error('Error sending message to API:', error);
      throw error;
    }
  };

  const handleSendMessage = useCallback(async (content: string) => {
    if (editingLast && editingMessageId) {
      // ignore send during edit
      return;
    }
    // Add user message
    const userMessage: Message = {
      id: generateId(),
      content,
      role: 'user',
      timestamp: new Date()
    };

    setMessages((prev: Message[]) => [...prev, userMessage]);
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

      setMessages((prev: Message[]) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      const errorMessage: Message = {
        id: generateId(),
        content: "I'm sorry, I encountered an error connecting to the AI service. Please try again.",
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages((prev: Message[]) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, onConversationChange]);

  const startEditLast = useCallback((messageId: string, content: string) => {
    setEditingLast(true);
    setEditingMessageId(messageId);
    setEditingValue(content);
  }, []);

  const cancelEditLast = useCallback(() => {
    setEditingLast(false);
    setEditingMessageId(null);
    setEditingValue('');
  }, []);

  const submitEditLast = useCallback(async () => {
    if (!editingLast || !editingMessageId || !conversationId) return;
    try {
      setIsLoading(true);
      // Optimistically update the last user message content
      setMessages((prev: Message[]) => prev.map((m: Message) => (m.id === editingMessageId ? { ...m, content: editingValue } : m)));
      const data = await assistantClient.editLastMessage(editingMessageId, { message: editingValue, conversationId });
      const assistantMessage: Message = {
        id: generateId(),
        content: data.content,
        role: 'assistant',
        timestamp: new Date()
      };
      // Remove any messages after the edited message, then add assistant response
      setMessages((prev: Message[]) => {
        const editedIndex = prev.findIndex((m: Message) => m.id === editingMessageId);
        const truncated = editedIndex >= 0 ? prev.slice(0, editedIndex + 1) : prev;
        return [...truncated, assistantMessage];
      });
    } catch (error) {
      console.error('Error editing last message:', error);
    } finally {
      setIsLoading(false);
      cancelEditLast();
    }
  }, [editingLast, editingMessageId, conversationId, editingValue, cancelEditLast]);

  const resendLast = useCallback(async (messageId: string, content: string) => {
    if (!conversationId) return;
    try {
      setIsLoading(true);
      // Reuse edit endpoint but with same content (no message change)
      const data = await assistantClient.editLastMessage(messageId, { message: content, conversationId });
      const assistantMessage: Message = {
        id: generateId(),
        content: data.content,
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages((prev: Message[]) => {
        const editedIndex = prev.findIndex((m: Message) => m.id === messageId);
        const truncated = editedIndex >= 0 ? prev.slice(0, editedIndex + 1) : prev;
        return [...truncated, assistantMessage];
      });
    } catch (error) {
      console.error('Error regenerating response:', error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

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
        disabled={editingLast}
        markdownSupported={chatConfig.markdownSupported}
        onStartEditLast={startEditLast}
        onResendLast={resendLast}
        editingLast={editingLast}
        editingValue={editingValue}
        onEditingChange={setEditingValue}
        onSubmitEdit={submitEditLast}
        onCancelEdit={cancelEditLast}
      />
    </div>
  );
};