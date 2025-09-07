import React from 'react';
import { ChatContainer } from './ChatContainer';
import { ChatHeader } from './ChatHeader';
import { Message } from '../types/Message';

interface ChatAppProps {
  messages: Message[];
  isLoading: boolean;
  conversationId: string | null;
  conversationName: string | undefined;
  onSendMessage: (content: string) => Promise<void>;
  onNewChat: () => void;
  onNameUpdate: (name: string) => void;
  onMessagesReload: (conversationId: string) => Promise<void>;
  onError?: (errorMessage: string) => void;
}

export const ChatApp: React.FC<ChatAppProps> = ({
  messages,
  isLoading,
  conversationId,
  conversationName,
  onSendMessage,
  onNewChat,
  onNameUpdate,
  onMessagesReload,
  onError,
}) => {

  return (
    <div className="chat-app">
      <ChatHeader
        messageCount={messages.length}
        isLoading={isLoading}
        conversationId={conversationId}
        conversationName={conversationName}
        onNewChat={onNewChat}
        onNameUpdate={onNameUpdate}
      />
      
      <ChatContainer
        messages={messages}
        onSendMessage={onSendMessage}
        isLoading={isLoading}
        conversationId={conversationId}
        onMessagesReload={onMessagesReload}
        onError={onError}
      />
    </div>
  );
};