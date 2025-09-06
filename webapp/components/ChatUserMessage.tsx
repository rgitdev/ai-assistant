import React from 'react';
import { Message } from './ChatMessage';
import { useMessageEdit } from '../hooks/useMessageEdit';
import { GeminiChatMessage } from './GeminiChatMessageComponent';

interface ChatUserMessageProps {
  message: Message;
}

export const ChatUserMessage: React.FC<ChatUserMessageProps> = ({ message }) => {
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
      <div className="flex items-start gap-4 p-4 my-2">
        <div className="flex-shrink-0 w-8 h-8">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">You</span>
          </div>
        </div>
        <div className="flex-grow">
          <div className="flex items-center gap-2 mb-2">
            <p className="font-bold text-gray-800 dark:text-gray-200">You</p>
            <span className="text-xs text-gray-500">(editing)</span>
          </div>
          <div className="space-y-2">
            <textarea
              value={editingValue}
              onChange={(e) => updateValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows={3}
              placeholder="Edit your message..."
              disabled={isLoading}
            />
            <div className="flex gap-2">
              <button
                onClick={submitEdit}
                disabled={isLoading || !editingValue.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={cancelEdit}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Cancel
              </button>
              <button
                onClick={resendMessage}
                disabled={isLoading || !editingValue.trim()}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Resend
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-4 p-4 my-2 group">
      <div className="flex-shrink-0 w-8 h-8">
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
          <span className="text-white font-bold text-sm">You</span>
        </div>
      </div>
      <div className="flex-grow">
        <div className="flex items-center justify-between mb-2">
          <p className="font-bold text-gray-800 dark:text-gray-200">You</p>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={startEdit}
              className="text-xs text-gray-500 hover:text-blue-500 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Edit
            </button>
          </div>
        </div>
        <GeminiChatMessage
          sender="You"
          message={message.content}
          role={message.role}
        />
      </div>
    </div>
  );
};
