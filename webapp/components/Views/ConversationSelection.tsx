import React, { useState, useEffect } from 'react';
import { conversationClient, Conversation } from '../../client/ConversationClient';
import { ConversationListItem } from '../UI/ConversationListItem';
import './ConversationSelection.css';

interface ConversationSelectionProps {
  selectedConversationId?: string | null;
  onConversationSelect: (id: string | null, name?: string) => void;
}

export const ConversationSelection: React.FC<ConversationSelectionProps> = ({
  selectedConversationId,
  onConversationSelect
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('About to call conversationClient.getAllConversations()');
      const fetchedConversations = await conversationClient.getAllConversations();
      console.log('fetchedConversations:', fetchedConversations);
      setConversations(fetchedConversations);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const generateConversationName = (conversation: Conversation): string => {
    if (conversation.name) {
      return conversation.name;
    }
    const date = new Date(conversation.createdAt);
    return `Chat from ${date.toLocaleDateString()}`;
  };

  const handleNewChat = () => {
    onConversationSelect(null);
  };

  const handleConversationSelect = (conversation: any) => {
    onConversationSelect(conversation.id, conversation.name);
  };

  return (
    <div className="conversation-history">
      <div className="conversation-history-header">
        <h2>Chat History</h2>
        <button className="new-chat-button" onClick={handleNewChat}>
          New Chat
        </button>
      </div>
      
      <div className="conversation-list">
        {loading ? (
          <div className="loading-conversations">
            <p>Loading conversations...</p>
          </div>
        ) : error ? (
          <div className="error-conversations">
            <p>Error loading conversations: {error}</p>
            <button className="retry-button" onClick={loadConversations}>
              Retry
            </button>
          </div>
        ) : conversations.length === 0 ? (
          <div className="empty-conversations">
            <p>No conversations yet. Start a new chat to begin!</p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <ConversationListItem
              key={conversation.id}
              conversation={conversation}
              isActive={selectedConversationId === conversation.id}
              onClick={() => handleConversationSelect(conversation)}
              displayName={generateConversationName(conversation)}
            />
          ))
        )}
      </div>
    </div>
  );
};