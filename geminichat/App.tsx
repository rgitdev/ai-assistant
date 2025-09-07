import React, { useState, useCallback, useMemo } from 'react';

// --- Mock Data ---
// In a real app, this would come from an API or a database.
const initialConversations = {
  'conv-1': {
    id: 'conv-1',
    title: 'React Project Structure',
    messages: [
      { id: 'msg-1', role: 'user', text: 'How should I structure a new React project?' },
      { id: 'msg-2', role: 'ai', text: 'You should start by breaking down your UI into small, reusable components. Think about where state should live. For example, a chat app could have components like ChatHistory, ChatWindow, and MessageInput.' },
    ],
  },
  'conv-2': {
    id: 'conv-2',
    title: 'Grocery List',
    messages: [
      { id: 'msg-3', role: 'user', text: 'What should I buy for a pasta dinner?' },
      { id: 'msg-4', role: 'ai', text: 'You\'ll need pasta, tomatoes, garlic, onion, olive oil, and some fresh basil. Don\'t forget the parmesan cheese!' },
    ],
  },
};

// --- Helper Functions & Constants ---
const USER = 'user';
const AI = 'ai';

// --- Child Components ---
// These are defined first to be used in the main App component.

/**
 * ChatHistorySidebar: Displays a list of conversations and handles selection.
 */
const ChatHistorySidebar = ({ conversations, activeConversationId, onSelect, onNew }) => {
  return (
    <div className="w-1/4 max-w-xs bg-gray-900 text-white p-4 flex flex-col">
      <h2 className="text-xl font-bold mb-4">History</h2>
      <button
        onClick={onNew}
        className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-lg p-2 mb-4 transition-colors"
      >
        + New Chat
      </button>
      <div className="flex-grow overflow-y-auto">
        {Object.values(conversations).map((conv) => (
          <div
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={`p-2 my-1 rounded-lg cursor-pointer truncate ${
              activeConversationId === conv.id ? 'bg-gray-700' : 'hover:bg-gray-800'
            }`}
          >
            {conv.title}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Message: Renders a single chat message bubble. Handles the editing state for user messages.
 */
const Message = ({ message, isLastUserMessage, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);

  const handleSave = () => {
    onEdit(message.id, editText);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditText(message.text);
  };

  const isUser = message.role === USER;

  return (
    <div className={`flex my-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`p-3 rounded-lg max-w-lg ${isUser ? 'bg-blue-600 text-white' : 'bg-gray-700'}`}>
        {isEditing ? (
          <div>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-md p-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
            />
            <div className="flex justify-end mt-2 space-x-2">
              <button onClick={handleCancel} className="text-xs text-gray-400 hover:text-white">Cancel</button>
              <button onClick={handleSave} className="text-xs bg-green-600 hover:bg-green-700 px-2 py-1 rounded">Save</button>
            </div>
          </div>
        ) : (
          <div>
            <p>{message.text}</p>
            {isLastUserMessage && (
              <div className="text-right mt-1">
                <button onClick={() => setIsEditing(true)} className="text-xs text-blue-200 hover:text-white">
                  Edit
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * MessageList: Renders the list of messages for the active conversation.
 */
const MessageList = ({ messages, onEditMessage }) => {
  const lastUserMessageId = useMemo(() => {
    return [...messages].reverse().find(msg => msg.role === USER)?.id;
  }, [messages]);

  return (
    <div className="flex-grow p-4 overflow-y-auto">
      {messages.map((msg) => (
        <Message
          key={msg.id}
          message={msg}
          isLastUserMessage={msg.id === lastUserMessageId}
          onEdit={onEditMessage}
        />
      ))}
    </div>
  );
};


/**
 * ChatInput: The form for typing and sending a new message.
 */
const ChatInput = ({ onSendMessage, disabled }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() && !disabled) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div className="p-4 border-t border-gray-700">
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={disabled ? "AI is thinking..." : "Type your message..."}
          className="flex-grow bg-gray-800 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={disabled}
        />
        <button
          type="submit"
          disabled={disabled}
          className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-600 hover:bg-indigo-700 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
};


/**
 * ChatWindow: The main view, containing the message list and input form.
 */
const ChatWindow = ({ conversation, onSendMessage, onEditMessage }) => {
  const [isAiThinking, setIsAiThinking] = useState(false);

  // This function simulates the AI response and manages the loading state.
  const handleUserMessage = async (text) => {
    onSendMessage(text, USER);
    setIsAiThinking(true);

    // Simulate AI thinking time
    await new Promise(resolve => setTimeout(resolve, 1500));

    const aiResponse = `This is a simulated AI response to: "${text}". In a real app, this would be a call to an AI model API.`;
    onSendMessage(aiResponse, AI);
    setIsAiThinking(false);
  };
  
  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-800 text-gray-400">
        Select a conversation or start a new one.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-800">
      <MessageList messages={conversation.messages} onEditMessage={onEditMessage} />
      <ChatInput onSendMessage={handleUserMessage} disabled={isAiThinking} />
    </div>
  );
};


// --- Main App Component ---
// This is the root component that manages the overall state.
export default function App() {
  const [conversations, setConversations] = useState(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState('conv-1');

  const activeConversation = conversations[activeConversationId];

  /**
   * Adds a new message to the active conversation.
   * useCallback is used for performance optimization, preventing re-creation on every render.
   */
  const handleAddMessage = useCallback((text, role) => {
    const newMessage = {
      id: `msg-${Date.now()}`,
      role: role,
      text: text,
    };

    setConversations(prev => {
      const updatedConversation = {
        ...prev[activeConversationId],
        messages: [...prev[activeConversationId].messages, newMessage],
      };
      return {
        ...prev,
        [activeConversationId]: updatedConversation,
      };
    });
  }, [activeConversationId]);

  /**
   * Edits the text of a specific message in the active conversation.
   */
  const handleEditMessage = useCallback((messageId, newText) => {
    setConversations(prev => {
        const updatedMessages = prev[activeConversationId].messages.map(msg =>
            msg.id === messageId ? { ...msg, text: newText } : msg
        );
        const updatedConversation = {
            ...prev[activeConversationId],
            messages: updatedMessages,
        };
        return {
            ...prev,
            [activeConversationId]: updatedConversation,
        };
    });
  }, [activeConversationId]);

  /**
   * Creates a new, empty conversation and sets it as active.
   */
  const handleNewConversation = useCallback(() => {
    const newId = `conv-${Date.now()}`;
    const newConversation = {
      id: newId,
      title: 'New Conversation',
      messages: [],
    };

    setConversations(prev => ({
      ...prev,
      [newId]: newConversation,
    }));
    setActiveConversationId(newId);
  }, []);

  return (
    <div className="flex h-screen font-sans bg-gray-900 text-white">
      <ChatHistorySidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelect={setActiveConversationId}
        onNew={handleNewConversation}
      />
      <ChatWindow
        conversation={activeConversation}
        onSendMessage={handleAddMessage}
        onEditMessage={handleEditMessage}
      />
    </div>
  );
}
