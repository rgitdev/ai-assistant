import React, { useState, useRef, useEffect } from 'react';
import { SubmitButton } from '../Buttons/SubmitButton';
import { ImageIcon } from '../Icons/ImageIcon';
import { ImagePreview } from './ImagePreview';
import './ChatInput.css';

interface ChatInputProps {
  onSendMessage: (message: string, images?: File[]) => void;
  disabled?: boolean;
  placeholder?: string;
  maxImages?: number;
  maxFileSize?: number;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = "Type your message here...",
  maxImages = 5,
  maxFileSize = 5 * 1024 * 1024 // 5MB default
}) => {
  const [message, setMessage] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || selectedImages.length > 0) && !disabled) {
      onSendMessage(message.trim(), selectedImages.length > 0 ? selectedImages : undefined);
      setMessage('');
      setSelectedImages([]);
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  };

  const validateAndAddImages = (files: FileList | File[]) => {
    const validImages: File[] = [];
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        console.warn(`Skipped non-image file: ${file.name}`);
        continue;
      }

      // Check file size
      if (file.size > maxFileSize) {
        console.warn(`File too large: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        continue;
      }

      validImages.push(file);
    }

    setSelectedImages(prev => {
      const combined = [...prev, ...validImages];
      return combined.slice(0, maxImages);
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddImages(e.target.files);
      // Reset input
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddImages(e.dataTransfer.files);
    }
  };

  // Focus textarea when component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  return (
    <div className="chat-input-container">
      <form onSubmit={handleSubmit} className="chat-input-form">
        {/* Image Previews */}
        {selectedImages.length > 0 && (
          <div className="image-previews-container">
            {selectedImages.map((file, index) => (
              <ImagePreview
                key={`${file.name}-${index}`}
                file={file}
                onRemove={() => handleRemoveImage(index)}
              />
            ))}
          </div>
        )}

        <div
          className={`input-wrapper ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            style={{ display: 'none' }}
          />

          {/* Image attachment button */}
          <button
            type="button"
            className="image-button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || selectedImages.length >= maxImages}
            title="Attach images"
          >
            <ImageIcon />
          </button>

          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="chat-textarea"
            rows={1}
            style={{
              minHeight: '44px',
              maxHeight: '200px',
              resize: 'none',
              overflow: 'auto'
            }}
          />

          <SubmitButton
            disabled={(!message.trim() && selectedImages.length === 0) || disabled}
          />
        </div>

        <div className="input-footer">
          <span className="input-hint">
            Press Enter to send, Shift+Enter for new line
            {selectedImages.length > 0 && ` • ${selectedImages.length}/${maxImages} images`}
          </span>
        </div>
      </form>
    </div>
  );
};