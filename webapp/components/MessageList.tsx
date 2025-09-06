import React, { useEffect, useMemo, useRef } from 'react';
import { ChatMessage, Message } from './ChatMessage';
import { ChatMarkdownMessage } from './ChatMarkdownMessage';
import { chatConfig } from '../config/chatConfig';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  markdownSupported?: boolean;
  onStartEditLast?: (messageId: string, content: string) => void;
  onResendLast?: (messageId: string, content: string) => void;
  editingLast?: boolean;
  editingValue?: string;
  onEditingChange?: (value: string) => void;
  onSubmitEdit?: () => void;
  onCancelEdit?: () => void;
  busy?: boolean;
}

export const MessageList: React.FC<MessageListProps> = (props: MessageListProps) => {
  const {
    messages,
    isLoading = false,
    markdownSupported = false,
    onStartEditLast,
    onResendLast,
    editingLast = false,
    editingValue = '',
    onEditingChange,
    onSubmitEdit,
    onCancelEdit,
    busy = false,
  } = props;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const lastUserIndex = useMemo<number>(() => {
    const indices = messages
      .map((m: Message, idx: number) => ({ m, idx }))
      .filter(({ m }: { m: Message; idx: number }) => m.role === 'user')
      .map(({ idx }: { m: Message; idx: number }) => idx);
    return indices.length > 0 ? indices[indices.length - 1] : -1;
  }, [messages]);

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
        {messages.map((message: Message, idx: number) => {
          // Use ChatMarkdownMessage for assistant messages when markdown is supported
          // Use ChatMessage for user messages or when markdown is disabled
          const isLastUser = idx === lastUserIndex;
          if (markdownSupported && message.role === 'assistant' && chatConfig.enableMarkdownForAssistant) {
            return <ChatMarkdownMessage key={message.id} message={message} />;
          } else if (markdownSupported && message.role === 'user' && chatConfig.enableMarkdownForUser) {
            if (isLastUser && editingLast) {
              return (
                <ChatMarkdownMessage key={message.id} message={message}>
                  <div className="inline-edit">
                    <textarea
                      className="inline-edit-textarea"
                      value={editingValue}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onEditingChange?.(e.target.value)}
                      onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          onSubmitEdit?.();
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          onCancelEdit?.();
                        }
                      }}
                      rows={3}
                    />
                    <div className="inline-edit-actions">
                      <button className="message-action-button secondary" onClick={onCancelEdit} disabled={busy}>Cancel</button>
                      <button className="message-action-button primary" onClick={onSubmitEdit} disabled={busy || !editingValue.trim()}>Update</button>
                    </div>
                  </div>
                </ChatMarkdownMessage>
              );
            }
            return (
              <>
                <ChatMarkdownMessage key={message.id} message={message} />
                {isLastUser && (
                  <div className="message-actions user">
                    <button
                      className="message-action-button"
                      title="Edit last message"
                      onClick={() => onStartEditLast?.(message.id, message.content)}
                      disabled={busy}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="message-action-button"
                      title="Regenerate response"
                      onClick={() => onResendLast?.(message.id, message.content)}
                      disabled={busy}
                    >
                      ↻ Regenerate
                    </button>
                  </div>
                )}
              </>
            );
          } else {
            if (isLastUser && editingLast) {
              return (
                <ChatMessage key={message.id} message={message}>
                  <div className="inline-edit">
                    <textarea
                      className="inline-edit-textarea"
                      value={editingValue}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onEditingChange?.(e.target.value)}
                      onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          onSubmitEdit?.();
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          onCancelEdit?.();
                        }
                      }}
                      rows={3}
                    />
                    <div className="inline-edit-actions">
                      <button className="message-action-button secondary" onClick={onCancelEdit} disabled={busy}>Cancel</button>
                      <button className="message-action-button primary" onClick={onSubmitEdit} disabled={busy || !editingValue.trim()}>Update</button>
                    </div>
                  </div>
                </ChatMessage>
              );
            }
            return (
              <>
                <ChatMessage key={message.id} message={message} />
                {isLastUser && (
                  <div className="message-actions user">
                    <button
                      className="message-action-button"
                      title="Edit last message"
                      onClick={() => onStartEditLast?.(message.id, message.content)}
                      disabled={busy}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="message-action-button"
                      title="Regenerate response"
                      onClick={() => onResendLast?.(message.id, message.content)}
                      disabled={busy}
                    >
                      ↻ Regenerate
                    </button>
                  </div>
                )}
              </>
            );
          }
        })}
        
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