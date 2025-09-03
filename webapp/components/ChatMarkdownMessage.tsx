import React from 'react';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isTyping?: boolean;
}

interface ChatMarkdownMessageProps {
  message: Message;
}

// Simple markdown parser for basic formatting
const parseMarkdown = (text: string): React.ReactNode[] => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeBlockLanguage = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        elements.push(
          <pre key={`code-${i}`} className="markdown-code-block">
            <code className={`language-${codeBlockLanguage}`}>
              {codeBlockContent.join('\n')}
            </code>
          </pre>
        );
        inCodeBlock = false;
        codeBlockContent = [];
        codeBlockLanguage = '';
      } else {
        // Start of code block
        codeBlockLanguage = line.slice(3).trim();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Handle inline code
    if (line.includes('`')) {
      const parts = line.split('`');
      const processedLine: React.ReactNode[] = [];
      
      for (let j = 0; j < parts.length; j++) {
        if (j % 2 === 0) {
          // Regular text
          if (parts[j]) {
            processedLine.push(parseInlineMarkdown(parts[j]));
          }
        } else {
          // Inline code
          processedLine.push(
            <code key={`inline-code-${i}-${j}`} className="markdown-inline-code">
              {parts[j]}
            </code>
          );
        }
      }
      
      elements.push(
        <p key={`line-${i}`} className="markdown-paragraph">
          {processedLine}
        </p>
      );
      continue;
    }

    // Handle headers
    if (line.startsWith('#')) {
      const level = line.match(/^#+/)?.[0].length || 1;
      const text = line.replace(/^#+\s*/, '');
      
      const headerProps = {
        key: `header-${i}`,
        className: `markdown-header markdown-h${level}`
      };
      
      switch (Math.min(level, 6)) {
        case 1:
          elements.push(<h1 {...headerProps}>{parseInlineMarkdown(text)}</h1>);
          break;
        case 2:
          elements.push(<h2 {...headerProps}>{parseInlineMarkdown(text)}</h2>);
          break;
        case 3:
          elements.push(<h3 {...headerProps}>{parseInlineMarkdown(text)}</h3>);
          break;
        case 4:
          elements.push(<h4 {...headerProps}>{parseInlineMarkdown(text)}</h4>);
          break;
        case 5:
          elements.push(<h5 {...headerProps}>{parseInlineMarkdown(text)}</h5>);
          break;
        default:
          elements.push(<h6 {...headerProps}>{parseInlineMarkdown(text)}</h6>);
      }
      continue;
    }

    // Handle lists
    if (line.match(/^\s*[-*+]\s/) || line.match(/^\s*\d+\.\s/)) {
      const isOrdered = line.match(/^\s*\d+\.\s/);
      // Keep the original text with numbers/bullets, just remove leading whitespace
      const text = line.replace(/^\s+/, '');
      
      elements.push(
        <li key={`list-item-${i}`} className={isOrdered ? "markdown-ordered-list-item" : "markdown-unordered-list-item"}>
          {parseInlineMarkdown(text)}
        </li>
      );
      continue;
    }

    // Handle blockquotes
    if (line.startsWith('>')) {
      const text = line.replace(/^>\s*/, '');
      elements.push(
        <blockquote key={`quote-${i}`} className="markdown-blockquote">
          {parseInlineMarkdown(text)}
        </blockquote>
      );
      continue;
    }

    // Handle horizontal rules
    if (line.match(/^[-*_]{3,}$/)) {
      elements.push(<hr key={`hr-${i}`} className="markdown-hr" />);
      continue;
    }

    // Regular paragraph
    if (line.trim()) {
      elements.push(
        <p key={`line-${i}`} className="markdown-paragraph">
          {parseInlineMarkdown(line)}
        </p>
      );
    }
    // Skip empty lines to reduce excessive spacing
  }

  return elements;
};

// Parse inline markdown (bold, italic, links)
const parseInlineMarkdown = (text: string): React.ReactNode[] => {
  const elements: React.ReactNode[] = [];
  let currentText = text;
  let keyCounter = 0;

  // Handle bold text (**text** or __text__)
  const boldRegex = /(\*\*|__)(.*?)\1/g;
  let lastIndex = 0;
  let match;

  while ((match = boldRegex.exec(currentText)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      elements.push(currentText.slice(lastIndex, match.index));
    }
    
    // Add bold text
    elements.push(
      <strong key={`bold-${keyCounter++}`} className="markdown-bold">
        {parseInlineMarkdown(match[2])}
      </strong>
    );
    
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < currentText.length) {
    const remainingText = currentText.slice(lastIndex);
    
    // Handle italic text (*text* or _text_)
    const italicRegex = /(\*|_)(.*?)\1/g;
    let italicLastIndex = 0;
    let italicMatch;
    const italicElements: React.ReactNode[] = [];

    while ((italicMatch = italicRegex.exec(remainingText)) !== null) {
      // Add text before the italic match
      if (italicMatch.index > italicLastIndex) {
        italicElements.push(remainingText.slice(italicLastIndex, italicMatch.index));
      }
      
      // Add italic text
      italicElements.push(
        <em key={`italic-${keyCounter++}`} className="markdown-italic">
          {italicMatch[2]}
        </em>
      );
      
      italicLastIndex = italicMatch.index + italicMatch[0].length;
    }

    // Add remaining text after italic processing
    if (italicLastIndex < remainingText.length) {
      italicElements.push(remainingText.slice(italicLastIndex));
    }

    elements.push(...italicElements);
  }

  return elements.length > 0 ? elements : [text];
};

export const ChatMarkdownMessage: React.FC<ChatMarkdownMessageProps> = ({ message }) => {
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
            <div className="message-text-content markdown-content">
              {isAssistant ? parseMarkdown(message.content) : message.content}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};