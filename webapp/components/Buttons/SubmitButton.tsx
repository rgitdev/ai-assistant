import React from 'react';

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
      <svg 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
      </svg>
    </button>
  );
};
