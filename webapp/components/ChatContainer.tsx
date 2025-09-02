import React from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { Message } from './ChatMessage';

interface ChatContainerProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  markdownSupported?: boolean;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  onSendMessage,
  isLoading = false,
  disabled = false,
  markdownSupported = false
}) => {
  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>AI Assistant</h2>
        <div className="status-indicator">
          <div className={`status-dot ${isLoading ? 'loading' : 'ready'}`}></div>
          <span>{isLoading ? 'Thinking...' : 'Ready'}</span>
        </div>
      </div>
      
      <div className="chat-body">
        <MessageList messages={messages} isLoading={isLoading} markdownSupported={markdownSupported} />
      </div>
      
      <div className="chat-footer">
        <ChatInput 
          onSendMessage={onSendMessage}
          disabled={disabled || isLoading}
          placeholder={isLoading ? "Please wait for the response..." : "Type your message here..."}
        />
      </div>
    </div>
  );
};