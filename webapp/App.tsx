import "./index.css";
import "./styles/markdown.css";
import "./styles/menu.css";
import React, { useState } from 'react';
import { ChatApp } from "./components/ChatApp";
import { Menu } from "./components/Menu/Menu";
import { About } from "./components/About";
import { ConversationSelection } from "./components/ConversationSelection";
import { Conversation } from "./client/ConversationClient";

export function App() {
  const [currentView, setCurrentView] = useState<string>('chat');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedConversationName, setSelectedConversationName] = useState<string | undefined>(undefined);

  const handleViewChange = (view: string) => {
    setCurrentView(view);
  };

  const handleConversationSelect = (id: string | null, name?: string) => {
    setSelectedConversationId(id);
    setSelectedConversationName(name);
    setCurrentView('chat');
  };

  const handleConversationChange = (conversationId: string | null) => {
    setSelectedConversationId(conversationId);
    if (!conversationId) {
      setSelectedConversationName(undefined);
    }
  };

  return (
    <div className="app">
      <div className="app-layout">
        <Menu activeView={currentView} onViewChange={handleViewChange} />
        
        <div className="app-content">
          {currentView === 'chat' ? (
            <ChatApp 
              selectedConversationId={selectedConversationId}
              selectedConversationName={selectedConversationName}
              onConversationChange={handleConversationChange}
            />
          ) : currentView === 'history' ? (
            <ConversationSelection 
              selectedConversationId={selectedConversationId}
              onConversationSelect={handleConversationSelect}
            />
          ) : (
            <About />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
