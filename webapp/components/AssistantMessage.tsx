import React, { useState, useEffect } from 'react';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isTyping?: boolean;
}

interface AssistantMessageProps {
  message: Message;
}

const AssistantAvatar = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="assistant-avatar__icon">
    <path d="M12 4.5C11.3 4.5 10.6 4.5 10 4.6C10 3.7 9.3 3 8.5 3C7.7 3 7 3.7 7 4.5C7 5.3 7.7 6 8.5 6C9.3 6 10 5.3 10 4.6C10.6 4.5 11.3 4.5 12 4.5C16.1 4.5 19.5 7.9 19.5 12C19.5 16.1 16.1 19.5 12 19.5C7.9 19.5 4.5 16.1 4.5 12C4.5 11.3 4.5 10.6 4.6 10C5.5 10 6.3 9.3 6.3 8.5C6.3 7.7 5.5 7 4.6 7C4.5 7 4.5 7 4.5 7C3.7 7 3 7.7 3 8.5C3 9.3 3.7 10 4.5 10C4.5 10.6 4.5 11.3 4.5 12C4.5 16.1 7.9 19.5 12 19.5C16.1 19.5 19.5 16.1 19.5 12C19.5 7.9 16.1 4.5 12 4.5Z" fill="url(#gemini-gradient)"/>
    <defs>
      <linearGradient id="gemini-gradient" x1="3" y1="3" x2="19.5" y2="19.5" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4285F4"/>
        <stop offset="0.5" stopColor="#9B72F9"/>
        <stop offset="1" stopColor="#F4B400"/>
      </linearGradient>
    </defs>
  </svg>
);

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

const ThumbsUpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 10v12" />
    <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a2 2 0 0 1 1.79 1.11L15 5.88Z" />
  </svg>
);

const ThumbsDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 14V2" />
    <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a2 2 0 0 1-1.79-1.11L9 18.12Z" />
  </svg>
);

const TypingDots = () => (
  <div className="assistant-message__typing-dots">
    <span></span>
    <span></span>
    <span></span>
  </div>
);

declare global {
  interface Window {
    showdown: any;
  }
}

export const AssistantMessage: React.FC<AssistantMessageProps> = ({ message }) => {
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    if (message.isTyping) return;

    if (window.showdown) {
      const converter = new window.showdown.Converter({
        tables: true,
        strikethrough: true,
        tasklists: true,
        simpleLineBreaks: true,
      });
      setHtmlContent(converter.makeHtml(message.content));
    } else {
      setHtmlContent(message.content.replace(/\n/g, '<br/>'));
    }
  }, [message.content, message.isTyping]);

  const copyToClipboard = () => {
    const tempTextArea = document.createElement('textarea');
    tempTextArea.value = message.content;
    document.body.appendChild(tempTextArea);
    tempTextArea.select();
    document.execCommand('copy');
    document.body.removeChild(tempTextArea);
  };

  if (message.isTyping) {
    return (
      <div className="assistant-message typing">
        <div className="assistant-message__container">
          <div className="assistant-message__avatar">
            <AssistantAvatar />
          </div>
          <div className="assistant-message__content">
            <div className="assistant-message__header">
              <span className="assistant-message__sender">Assistant</span>
            </div>
            <div className="assistant-message__text">
              <TypingDots />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="assistant-message">
      <div className="assistant-message__container">
        <div className="assistant-message__avatar">
          <AssistantAvatar />
        </div>
        <div className="assistant-message__content">
          <div className="assistant-message__header">
            <span className="assistant-message__sender">Assistant</span>
          </div>
          <div 
            className="assistant-message__text markdown-content"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
          <div className="assistant-message__actions">
            <button 
              onClick={copyToClipboard} 
              className="assistant-message__action-button"
              title="Copy message"
            >
              <CopyIcon />
            </button>
            <button 
              className="assistant-message__action-button"
              title="Thumbs up"
            >
              <ThumbsUpIcon />
            </button>
            <button 
              className="assistant-message__action-button"
              title="Thumbs down"
            >
              <ThumbsDownIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};