import React, { useState, useEffect } from 'react';
import { AssistantAvatar } from '../Icons/AssistantAvatar';
import { CopyIcon } from '../Icons/CopyIcon';
import { ThumbsUpIcon } from '../Icons/ThumbsUpIcon';
import { ThumbsDownIcon } from '../Icons/ThumbsDownIcon';
import { Message } from '../../types/Message';
import './AssistantMessage.css';

interface AssistantMessageProps {
  message: Message;
}


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