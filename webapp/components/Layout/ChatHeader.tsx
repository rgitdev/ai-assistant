import React from 'react';
import { AssistantStatus } from '../UI/AssistantStatus';
import { ChatTitle } from '../UI/ChatTitle';

interface ChatHeaderProps {
  messageCount: number;
  isLoading: boolean;
  conversationId: string | null;
  conversationName?: string;
  onNewChat: () => void;
  onNameUpdate?: (newName: string) => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  messageCount,
  isLoading,
  conversationId,
  conversationName,
  onNewChat,
  onNameUpdate
}) => {
  return (
    <div className="chat-header">
      <div className="chat-header-content">
        <div className="header-left">
          <ChatTitle
            conversationId={conversationId}
            conversationName={conversationName}
            onNameUpdate={onNameUpdate}
          />
        </div>
        
        <div className="header-center">
          <button 
            onClick={onNewChat}
            className="new-chat-button"
            disabled={isLoading}
          >
            New Chat
          </button>
          
          <div className="message-count">
            {messageCount} message{messageCount !== 1 ? 's' : ''}
          </div>
        </div>
        
        <div className="header-right">
          <AssistantStatus 
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};