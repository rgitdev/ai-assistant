import React from 'react';
import { AssistantStatus } from './AssistantStatus';

interface ChatHeaderProps {
  messageCount: number;
  isLoading: boolean;
  onClearChat: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  messageCount,
  isLoading,
  onClearChat
}) => {
  return (
    <div className="chat-header">
      <div className="chat-header-content">
        <div className="header-left">
          <h2>AI Assistant</h2>
        </div>
        
        <div className="header-center">
          <button 
            onClick={onClearChat}
            className="clear-button"
            disabled={messageCount === 0}
          >
            Clear Chat
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