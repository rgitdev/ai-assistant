import { useState, useCallback } from 'react';
import { conversationClient } from '../client/ConversationClient';

interface UseConversationReturn {
  conversationId: string | null;
  conversationName: string | undefined;
  setConversationId: (id: string | null) => void;
  setConversationName: (name: string | undefined) => void;
  loadConversation: (id: string) => Promise<void>;
  newConversation: () => void;
}

export const useConversation = (
  onConversationChange?: (conversationId: string | null) => void
): UseConversationReturn => {
  const [conversationId, setConversationIdState] = useState<string | null>(null);
  const [conversationName, setConversationName] = useState<string | undefined>(undefined);

  const setConversationId = useCallback((id: string | null) => {
    setConversationIdState(id);
    onConversationChange?.(id);
  }, [onConversationChange]);

  const loadConversation = useCallback(async (id: string) => {
    // This will be handled by the messages hook
    setConversationIdState(id);
  }, []);

  const newConversation = useCallback(() => {
    setConversationIdState(null);
    setConversationName(undefined);
    onConversationChange?.(null);
  }, [onConversationChange]);

  return {
    conversationId,
    conversationName,
    setConversationId,
    setConversationName,
    loadConversation,
    newConversation,
  };
};
