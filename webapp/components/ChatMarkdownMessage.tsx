import React from 'react';
import { MarkdownRenderer } from '@webapp/utils/markdown';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isTyping?: boolean;
}

interface ChatMarkdownMessageProps {
  message: Message;
  children?: React.ReactNode;
}

export const ChatMarkdownMessage: React.FC<ChatMarkdownMessageProps> = (props: ChatMarkdownMessageProps) => {
  const { message, children } = props;
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`chat-message ${isUser ? 'user-message' : 'assistant-message'}`}>
      <div className="message-avatar">
        {isUser ? (
          <div className="user-avatar">👤</div>
        ) : (
          <div className="assistant-avatar">🤖</div>
        )}
      </div>
      
      <div className="message-content">
        <div className="message-header">
          <span className="message-role">
            {isUser ? 'You' : 'Assistant'}
          </span>
          <span className="message-timestamp">
            {message.timestamp.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>
        
        <div className="message-text">
          {message.isTyping ? (
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          ) : (
            children ? (
              <div className="message-text-content markdown-content">{children}</div>
            ) : (
              <div className="message-text-content markdown-content">
                {isAssistant ? MarkdownRenderer.parseAndRender(message.content) : message.content}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};