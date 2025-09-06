import React from 'react';
import { GeminiChatMessage } from './GeminiChatMessageComponent';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isTyping?: boolean;
}

interface ChatMessageProps {
  message: Message;
  children?: React.ReactNode;
}

export const ChatMessage: React.FC<ChatMessageProps> = (props: ChatMessageProps) => {
  const { message, children } = props;
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  // Use GeminiChatMessage for a modern look
  if (children) {
    return (
      <div className="message-text-content">
        {children}
      </div>
    );
  }

  if (message.isTyping) {
    return (
      <div className="flex items-start gap-4 p-4 my-2">
        <div className="flex-shrink-0 w-8 h-8">
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
        <div className="flex-grow">
          <p className="font-bold text-gray-800 dark:text-gray-200 mb-2">Assistant</p>
          <div className="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <GeminiChatMessage
      sender={isUser ? 'You' : 'Assistant'}
      message={message.content}
      role={message.role}
    />
  );
};