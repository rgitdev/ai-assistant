import React, { useEffect, useRef } from 'react';
import { ChatMessage, Message } from './ChatMessage';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isLoading = false }) => {
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
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        
        {isLoading && (
          <div className="chat-message assistant-message">
            <div className="message-avatar">
              <div className="assistant-avatar">🤖</div>
            </div>
            <div className="message-content">
              <div className="message-header">
                <span className="message-role">Assistant</span>
                <span className="message-timestamp">
                  {new Date().toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              <div className="message-text">
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};