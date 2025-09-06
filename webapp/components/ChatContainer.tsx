import React from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { Message } from './ChatMessage';

interface ChatContainerProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  markdownSupported?: boolean;
}

export const ChatContainer: React.FC<ChatContainerProps> = (props: ChatContainerProps) => {
  const {
    messages,
    onSendMessage,
    isLoading = false,
    markdownSupported = false,
  } = props;
  
  return (
    <div className="chat-container">
      <div className="chat-body">
        <MessageList 
          messages={messages}
          isLoading={isLoading}
          markdownSupported={markdownSupported}
        />
      </div>
      
      <div className="chat-footer">
        <ChatInput 
          onSendMessage={onSendMessage}
          disabled={isLoading}
          placeholder={isLoading ? "Please wait for the response..." : "Type your message here..."}
        />
      </div>
    </div>
  );
};