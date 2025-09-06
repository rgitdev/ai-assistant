// src/App.tsx
import { useChat } from './hooks/useChat';
import { ChatInterface } from './components/chat/ChatInterface';
//import './App.css';
import { JSX } from 'react';

export function App(): JSX.Element {
  const { messages, isLoading, sendMessage } = useChat();

  return (
    <div className="App">
      <h1>My Bun + React + TS Chatbot</h1>
      <ChatInterface
        messages={messages}
        isLoading={isLoading}
        onSendMessage={sendMessage}
      />
    </div>
  );
}

export default App;