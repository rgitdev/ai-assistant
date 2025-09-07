import React from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { Message } from './Messages';

interface ChatContainerProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
}

export const ChatContainer: React.FC<ChatContainerProps> = (props: ChatContainerProps) => {
  const {
    messages,
    onSendMessage,
    isLoading = false,
  } = props;
  
  return (
    <div className="chat-container">
      <div className="chat-body">
        <MessageList 
          messages={messages}
          isLoading={isLoading}
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