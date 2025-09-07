import React, { useEffect, useRef } from 'react';
import { UserMessage, AssistantMessage, Message } from './Messages';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

export const MessageList: React.FC<MessageListProps> = (props: MessageListProps) => {
  const {
    messages,
    isLoading = false,
  } = props;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="message-list empty">
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <h3>Start a conversation</h3>
          <p>Send a message to begin chatting with the AI assistant.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="message-list">
      <div className="messages-container">
        {messages.map((message: Message) => {
          if (message.role === 'user') {
            return <UserMessage key={message.id} message={message} />;
          }
          
          return <AssistantMessage key={message.id} message={message} />;
        })}
        
        {isLoading && (
          <AssistantMessage 
            message={{
              id: 'typing',
              content: '',
              role: 'assistant',
              timestamp: new Date(),
              isTyping: true
            }} 
          />
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};