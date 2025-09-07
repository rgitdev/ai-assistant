import React from 'react';
import { SendIcon } from '../Icons/SendIcon';

interface SubmitButtonProps {
  disabled?: boolean;
  title?: string;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  disabled = false,
  title = "Send message (Enter)",
  className = "send-button",
  type = "submit"
}) => {
  return (
    <button
      type={type}
      disabled={disabled}
      className={className}
      title={title}
    >
      <SendIcon />
    </button>
  );
};
