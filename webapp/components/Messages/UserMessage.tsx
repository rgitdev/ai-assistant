import React from 'react';
import { useMessageEdit } from '../../hooks/useMessageEdit';
import { EditIcon } from '../Icons/EditIcon';
import { Message } from '../../types/Message';

interface UserMessageProps {
  message: Message;
}


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