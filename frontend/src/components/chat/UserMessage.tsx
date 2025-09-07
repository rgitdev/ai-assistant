import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../../types';
import { EditButton } from './EditButton';

interface UserMessageProps {
  message: ChatMessage;
  isLoading?: boolean;
  onEditMessage?: (messageId: string, newContent: string) => void;
}

export const UserMessage: React.FC<UserMessageProps> = ({ 
  message, 
  isLoading = false,
  onEditMessage 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    console.log('handleStartEdit: ', message.id, message.content, !isLoading);
    if (!isLoading) {
      setEditContent(message.content);
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    console.log('handleSaveEdit triggered:', {
      hasOnEditMessage: !!onEditMessage,
      editContent: editContent,
      editContentTrimmed: editContent.trim(),
      hasContent: !!editContent.trim()
    });
    
    if (onEditMessage && editContent.trim()) {
      console.log('Calling onEditMessage with:', message.id, editContent.trim());
      onEditMessage(message.id, editContent.trim());
      setIsEditing(false);
    } else {
      console.log('Save blocked - missing onEditMessage or empty content');
      // For now, just exit editing mode even without onEditMessage
      if (editContent.trim()) {
        setIsEditing(false);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };
  return (
    <div className="message user-message">
      <div className="user-message-container">
        <EditButton 
          onEdit={handleStartEdit}
          isVisible={true}
        />
        <div className="message-input-container">
          <input
            ref={inputRef}
            type="text"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`user-message-input ${isEditing ? 'editing' : 'locked'}`}
            readOnly={!isEditing}
          />
          <div className="message-timestamp">
            {message.timestamp.toLocaleTimeString()}
          </div>
          {isEditing && (
            <div className="message-edit-buttons">
              <button 
                onClick={handleSaveEdit}
                disabled={!editContent.trim()}
                className="edit-save-button"
              >
                Save
              </button>
              <button 
                onClick={handleCancelEdit}
                className="edit-cancel-button"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};