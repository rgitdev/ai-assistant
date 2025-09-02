import React from 'react';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isTyping?: boolean;
}

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
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
            <div className="message-text-content">
              {message.content.split('\n').map((line, index) => (
                <React.Fragment key={index}>
                  {line}
                  {index < message.content.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};