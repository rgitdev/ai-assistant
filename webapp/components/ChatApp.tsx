import React from 'react';
import { ChatContainer } from './ChatContainer';
import { ChatHeader } from './ChatHeader';
import { useChatContext } from '../context/ChatContext';

export const ChatApp: React.FC = () => {
  const {
    messages,
    isLoading,
    conversationId,
    conversationName,
    onSendMessage,
    onNewChat,
    onNameUpdate,
  } = useChatContext();

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
      />
    </div>
  );
};