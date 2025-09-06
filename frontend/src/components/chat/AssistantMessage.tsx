import type { ChatMessage } from '../../types';

interface AssistantMessageProps {
  message: ChatMessage;
}

export const AssistantMessage: React.FC<AssistantMessageProps> = ({ message }) => {
  return (
    <div className="message assistant-message">
      <div className="message-content">
        {message.content}
      </div>
      <div className="message-timestamp">
        {message.timestamp.toLocaleTimeString()}
      </div>
    </div>
  );
};