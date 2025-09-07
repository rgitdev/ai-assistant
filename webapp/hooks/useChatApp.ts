import { useConversation } from './useConversation';
import { useMessages } from './useMessages';
import { useEditMode } from './useEditMode';

interface UseChatAppProps {
  selectedConversationId?: string | null;
  selectedConversationName?: string;
  onConversationChange?: (conversationId: string | null) => void;
}

export const useChatApp = (props: UseChatAppProps) => {
  const { selectedConversationId, selectedConversationName, onConversationChange } = props;
  
  const conversation = useConversation(onConversationChange);
  const messages = useMessages({ 
    conversationId: conversation.conversationId, 
    onConversationChange 
  });
  const editMode = useEditMode();

  // Enhanced handlers with business logic
  const handleSendMessage = async (content: string) => {
    if (editMode.editingLast && editMode.editingMessageId) return;
    await messages.sendMessage(content);
  };

  const handleSubmitEditLast = async () => {
    if (!editMode.editingLast || !editMode.editingMessageId) return;
    await messages.editMessage(editMode.editingMessageId, editMode.editingValue);
    editMode.cancelEdit();
  };

  const handleNewChat = () => {
    messages.clearMessages();
    conversation.newConversation();
  };

  return {
    // State
    messages: messages.messages,
    isLoading: messages.isLoading,
    conversationId: conversation.conversationId,
    conversationName: conversation.conversationName,
    editingLast: editMode.editingLast,
    editingValue: editMode.editingValue,
    
    // Actions
    onSendMessage: handleSendMessage,
    onStartEditLast: editMode.startEdit,
    onResendLast: messages.resendMessage,
    onEditingChange: editMode.updateEditingValue,
    onSubmitEdit: handleSubmitEditLast,
    onCancelEdit: editMode.cancelEdit,
    onNewChat: handleNewChat,
    onNameUpdate: conversation.setConversationName,
    
    // Internal methods for effects
    setConversationId: conversation.setConversationId,
    setConversationName: conversation.setConversationName,
    loadConversationMessages: messages.loadConversationMessages,
    clearMessages: messages.clearMessages,
  };
};
