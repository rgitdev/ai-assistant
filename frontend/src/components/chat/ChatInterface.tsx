import type { ChatMessage } from '../../types';
import { AssistantMessage } from './AssistantMessage';
import { UserMessage } from './UserMessage';
import { UserInput } from './UserInput';
import '../../styles/chat.css';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, isLoading, onSendMessage }) => {
  return (
    <div className="chat-container">
      <div className="message-list">
        {messages.map((msg, index) => (
          msg.role === 'user' ? (
            <UserMessage key={index} message={msg} />
          ) : (
            <AssistantMessage key={index} message={msg} />
          )
        ))}
        {isLoading && (
          <div className="message assistant-message">
            <div className="message-content">Thinking...</div>
          </div>
        )}
      </div>
      <UserInput onSendMessage={onSendMessage} isLoading={isLoading} />
    </div>
  );
};