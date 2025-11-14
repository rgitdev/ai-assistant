import React from 'react';

interface TypingIndicatorProps {
  isVisible: boolean;
  text?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  isVisible, 
  text = "Assistant is typing..." 
}) => {
  if (!isVisible) return null;

  return (
    <div className="typing-indicator">
      <div className="typing-avatar">
        <div className="assistant-avatar">🤖</div>
      </div>
      <div className="typing-content">
        <div className="typing-text">{text}</div>
        <div className="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
};