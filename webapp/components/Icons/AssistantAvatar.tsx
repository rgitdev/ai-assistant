import React from 'react';

export const AssistantAvatar = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="assistant-avatar__icon">
    <path d="M12 4.5C11.3 4.5 10.6 4.5 10 4.6C10 3.7 9.3 3 8.5 3C7.7 3 7 3.7 7 4.5C7 5.3 7.7 6 8.5 6C9.3 6 10 5.3 10 4.6C10.6 4.5 11.3 4.5 12 4.5C16.1 4.5 19.5 7.9 19.5 12C19.5 16.1 16.1 19.5 12 19.5C7.9 19.5 4.5 16.1 4.5 12C4.5 11.3 4.5 10.6 4.6 10C5.5 10 6.3 9.3 6.3 8.5C6.3 7.7 5.5 7 4.6 7C4.5 7 4.5 7 4.5 7C3.7 7 3 7.7 3 8.5C3 9.3 3.7 10 4.5 10C4.5 10.6 4.5 11.3 4.5 12C4.5 16.1 7.9 19.5 12 19.5C16.1 19.5 19.5 16.1 19.5 12C19.5 7.9 16.1 4.5 12 4.5Z" fill="url(#gemini-gradient)"/>
    <defs>
      <linearGradient id="gemini-gradient" x1="3" y1="3" x2="19.5" y2="19.5" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4285F4"/>
        <stop offset="0.5" stopColor="#9B72F9"/>
        <stop offset="1" stopColor="#F4B400"/>
      </linearGradient>
    </defs>
  </svg>
);