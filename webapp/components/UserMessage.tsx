import React from 'react';
import { useMessageEdit } from '../hooks/useMessageEdit';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isTyping?: boolean;
}

interface UserMessageProps {
  message: Message;
}

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export const UserMessage: React.FC<UserMessageProps> = ({ message }) => {
  const {
    isEditing,
    editingValue,
    isLoading,
    startEdit,
    cancelEdit,
    updateValue,
    submitEdit,
    resendMessage,
  } = useMessageEdit({
    messageId: message.id,
    initialContent: message.content,
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  if (isEditing) {
    return (
      <div className="user-message editing">
        <div className="user-message__container">
          <div className="user-message__avatar">
            <span>You</span>
          </div>
          <div className="user-message__content">
            <div className="user-message__header">
              <span className="user-message__sender">You</span>
              <span className="user-message__status">(editing)</span>
            </div>
            <div className="user-message__edit-form">
              <textarea
                value={editingValue}
                onChange={(e) => updateValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="user-message__edit-textarea"
                rows={3}
                placeholder="Edit your message..."
                disabled={isLoading}
                autoFocus
              />
              <div className="user-message__edit-actions">
                <button
                  onClick={cancelEdit}
                  disabled={isLoading}
                  className="user-message__edit-button user-message__edit-button--cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={submitEdit}
                  disabled={isLoading || !editingValue.trim()}
                  className="user-message__edit-button user-message__edit-button--update"
                >
                  {isLoading ? 'Updating...' : 'Update'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-message">
      <div className="user-message__container">
        <div className="user-message__avatar">
          <span>You</span>
        </div>
        <div className="user-message__content">
          <div className="user-message__header">
            <span className="user-message__sender">You</span>
            <button 
              onClick={startEdit}
              className="user-message__edit-trigger"
              title="Edit message"
            >
              <EditIcon />
            </button>
          </div>
          <div className="user-message__text">
            {message.content}
          </div>
        </div>
      </div>
    </div>
  );
};