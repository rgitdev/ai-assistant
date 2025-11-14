import React from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from '../UI/ChatInput';
import { Message } from '../Messages';

interface ChatContainerProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  conversationId: string | null;
  onMessagesReload: (conversationId: string) => Promise<void>;
  onError?: (errorMessage: string) => void;
  onNewChat?: () => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = (props: ChatContainerProps) => {
  const {
    messages,
    onSendMessage,
    isLoading = false,
    conversationId,
    onMessagesReload,
    onError,
    onNewChat,
  } = props;
  
  return (
    <div className="chat-container">
      <div className="chat-body">
        <MessageList 
          messages={messages}
          isLoading={isLoading}
          conversationId={conversationId}
          onMessagesReload={onMessagesReload}
          onError={onError}
          onNewChat={onNewChat}
          onSendMessage={onSendMessage}
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