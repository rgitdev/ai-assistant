import "./index.css";
import "./styles/markdown.css";
import "./styles/menu.css";
import React, { useState } from 'react';
import { ChatApp } from "./components/ChatApp";
import { Menu } from "./components/Menu/Menu";
import { About } from "./components/About";

export function App() {
  const [currentView, setCurrentView] = useState<string>('chat');

  const handleViewChange = (view: string) => {
    setCurrentView(view);
  };

  return (
    <div className="app">
      <div className="app-layout">
        <Menu activeView={currentView} onViewChange={handleViewChange} />
        
        <div className="app-content">
          {currentView === 'chat' ? (
            <ChatApp />
          ) : (
            <About />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
