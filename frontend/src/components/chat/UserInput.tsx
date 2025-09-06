import { useState } from 'react';

interface UserInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export const UserInput: React.FC<UserInputProps> = ({ onSendMessage, isLoading }) => {
  const [inputValue, setInputValue] = useState<string>('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="user-input-form">
      <input
        type="text"
        value={inputValue}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
        placeholder="Type your message..."
        disabled={isLoading}
        className="user-input-field"
      />
      <button 
        type="submit" 
        disabled={isLoading || !inputValue.trim()}
        className="user-input-button"
      >
        {isLoading ? 'Sending...' : 'Send'}
      </button>
    </form>
  );
};