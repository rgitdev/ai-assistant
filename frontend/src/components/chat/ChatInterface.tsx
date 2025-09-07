import type { ChatMessage } from '../../types';
import { AssistantMessage } from './AssistantMessage';
import { UserMessage } from './UserMessage';
import { UserInput } from './UserInput';
import '../../styles/chat.css';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  isLoading, 
  onSendMessage, 
  onEditMessage 
}) => {
  return (
    <div className="chat-container">
      <div className="message-list">
        {messages.map((msg) => (
          msg.role === 'user' ? (
            <UserMessage 
              key={msg.id} 
              message={msg}
              isLoading={isLoading}
              onEditMessage={onEditMessage}
            />
          ) : (
            <AssistantMessage key={msg.id} message={msg} />
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