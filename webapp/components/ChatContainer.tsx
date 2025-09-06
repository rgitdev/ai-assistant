import React from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { Message } from './ChatMessage';

interface ChatContainerProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  markdownSupported?: boolean;
  onStartEditLast?: (messageId: string, content: string) => void;
  onResendLast?: (messageId: string, content: string) => void;
  editingLast?: boolean;
  editingValue?: string;
  onEditingChange?: (value: string) => void;
  onSubmitEdit?: () => void;
  onCancelEdit?: () => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = (props: ChatContainerProps) => {
  const {
    messages,
    onSendMessage,
    isLoading = false,
    disabled = false,
    markdownSupported = false,
    onStartEditLast,
    onResendLast,
    editingLast,
    editingValue,
    onEditingChange,
    onSubmitEdit,
    onCancelEdit
  } = props;
  return (
    <div className="chat-container">
      <div className="chat-body">
        <MessageList 
          messages={messages}
          isLoading={isLoading}
          markdownSupported={markdownSupported}
          onStartEditLast={onStartEditLast}
          onResendLast={onResendLast}
          editingLast={!!editingLast}
          editingValue={editingValue}
          onEditingChange={onEditingChange}
          onSubmitEdit={onSubmitEdit}
          onCancelEdit={onCancelEdit}
          busy={disabled || isLoading}
        />
      </div>
      
      <div className="chat-footer">
        <ChatInput 
          onSendMessage={onSendMessage}
          disabled={disabled || isLoading}
          placeholder={isLoading ? "Please wait for the response..." : "Type your message here..."}
        />
      </div>
    </div>
  );
};