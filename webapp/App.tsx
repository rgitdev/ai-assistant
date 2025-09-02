import "./index.css";
import "./styles/markdown.css";
import { ChatApp } from "./components/ChatApp";

export function App() {
  return (
    <div className="app">
      <h1>AI Assistant Chat</h1>
      <p>
        Chat with an AI assistant powered by React and Bun
      </p>
      <ChatApp />
    </div>
  );
}

export default App;
