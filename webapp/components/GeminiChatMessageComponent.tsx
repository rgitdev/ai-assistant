import React, { useState, useEffect } from 'react';

// --- Helper Icon Components (using inline SVG for portability) ---
const GeminiLogo = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-500">
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

const UserAvatar = () => (
    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold text-sm">
        Y
    </div>
);

const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
);

const ThumbsUpIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
        <path d="M7 10v12" />
        <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a2 2 0 0 1 1.79 1.11L15 5.88Z" />
    </svg>
);

const ThumbsDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
        <path d="M17 14V2" />
        <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a2 2 0 0 1-1.79-1.11L9 18.12Z" />
    </svg>
);

interface GeminiChatMessageProps {
    sender: string;
    message: string;
    role?: 'user' | 'assistant';
}

export const GeminiChatMessage: React.FC<GeminiChatMessageProps> = ({ 
    sender, 
    message, 
    role = 'assistant' 
}) => {
    const [htmlContent, setHtmlContent] = useState('');
    const isGemini = role === 'assistant' || sender === 'Gemini' || sender === 'assistant';

    useEffect(() => {
        // Convert markdown to HTML when the component mounts or message changes
        if (window.showdown) {
            const converter = new window.showdown.Converter({
                tables: true,
                strikethrough: true,
                tasklists: true,
                simpleLineBreaks: true,
            });
            setHtmlContent(converter.makeHtml(message));
        } else {
            // Fallback for when showdown is not loaded yet
            setHtmlContent(message.replace(/\n/g, '<br/>'));
        }
    }, [message]);

    const copyToClipboard = () => {
        const tempTextArea = document.createElement('textarea');
        tempTextArea.value = message;
        document.body.appendChild(tempTextArea);
        tempTextArea.select();
        document.execCommand('copy');
        document.body.removeChild(tempTextArea);
    };

    return (
        <div className="flex items-start gap-4 p-4 my-2">
            <div className="flex-shrink-0 w-8 h-8">
                {isGemini ? <GeminiLogo /> : <UserAvatar />}
            </div>
            <div className="flex-grow">
                <p className="font-bold text-gray-800 dark:text-gray-200 mb-2">
                    {isGemini ? 'Gemini' : sender}
                </p>
                <div 
                    className="prose prose-sm max-w-none text-gray-800 dark:text-gray-300"
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
                {isGemini && (
                    <div className="flex items-center gap-3 mt-3">
                        <button 
                            onClick={copyToClipboard} 
                            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            title="Copy message"
                        >
                            <CopyIcon />
                        </button>
                        <button 
                            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            title="Thumbs up"
                        >
                           <ThumbsUpIcon />
                        </button>
                         <button 
                            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            title="Thumbs down"
                        >
                           <ThumbsDownIcon />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
