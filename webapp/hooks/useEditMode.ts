import { useState, useCallback } from 'react';

interface UseEditModeReturn {
  editingLast: boolean;
  editingMessageId: string | null;
  editingValue: string;
  startEdit: (messageId: string, content: string) => void;
  cancelEdit: () => void;
  updateEditingValue: (value: string) => void;
  isEditing: (messageId: string) => boolean;
}

export const useEditMode = (): UseEditModeReturn => {
  const [editingLast, setEditingLast] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  const startEdit = useCallback((messageId: string, content: string) => {
    setEditingLast(true);
    setEditingMessageId(messageId);
    setEditingValue(content);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingLast(false);
    setEditingMessageId(null);
    setEditingValue('');
  }, []);

  const updateEditingValue = useCallback((value: string) => {
    setEditingValue(value);
  }, []);

  const isEditing = useCallback((messageId: string) => {
    return editingLast && editingMessageId === messageId;
  }, [editingLast, editingMessageId]);

  return {
    editingLast,
    editingMessageId,
    editingValue,
    startEdit,
    cancelEdit,
    updateEditingValue,
    isEditing,
  };
};
