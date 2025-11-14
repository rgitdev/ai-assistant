import React, { useState, useEffect, useRef } from 'react';
import { conversationClient } from '../../client/ConversationClient';

interface ChatTitleProps {
  conversationId: string | null;
  conversationName?: string;
  onNameUpdate?: (newName: string) => void;
}

export const ChatTitle: React.FC<ChatTitleProps> = ({
  conversationId,
  conversationName,
  onNameUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update display name when props change
  useEffect(() => {
    const name = conversationName || 'New Chat';
    setDisplayName(name);
    setEditValue(name);
  }, [conversationName, conversationId]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    if (!conversationId) {
      // Can't edit name of new chat that hasn't been created yet
      return;
    }
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditValue(displayName);
  };

  const handleSaveEdit = async () => {
    if (!conversationId || !editValue.trim()) {
      handleCancelEdit();
      return;
    }

    const trimmedValue = editValue.trim();
    if (trimmedValue === displayName) {
      setIsEditing(false);
      return;
    }

    try {
      setIsUpdating(true);
      await conversationClient.updateConversation(conversationId, { name: trimmedValue });
      
      setDisplayName(trimmedValue);
      setIsEditing(false);
      
      // Notify parent component of the name change
      onNameUpdate?.(trimmedValue);
    } catch (error) {
      console.error('Failed to update conversation name:', error);
      // Revert to original name on error
      setEditValue(displayName);
      setIsEditing(false);
      
      // Could show a toast notification here
      alert('Failed to update conversation name. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  if (isEditing) {
    return (
      <div className="chat-title-container editing">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleSaveEdit}
          className="chat-title-input"
          disabled={isUpdating}
          maxLength={100}
        />
        {isUpdating && <div className="chat-title-updating">Updating...</div>}
      </div>
    );
  }

  return (
    <div className="chat-title-container">
      <h2 
        className={`chat-title ${conversationId ? 'editable' : 'not-editable'}`}
        onClick={handleStartEdit}
        title={conversationId ? 'Click to edit conversation name' : 'Start a conversation to edit the name'}
      >
        {displayName}
      </h2>
      {conversationId && (
        <button
          className="edit-icon"
          onClick={handleStartEdit}
          title="Edit conversation name"
          type="button"
        >
          ✏️
        </button>
      )}
    </div>
  );
};