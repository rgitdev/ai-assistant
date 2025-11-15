import React from 'react';
import { CloseIcon } from '../Icons/CloseIcon';
import './ImagePreview.css';

interface ImagePreviewProps {
  file: File;
  onRemove: () => void;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ file, onRemove }) => {
  const [preview, setPreview] = React.useState<string>('');

  React.useEffect(() => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [file]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const truncateName = (name: string, maxLength: number = 20): string => {
    if (name.length <= maxLength) return name;
    const ext = name.substring(name.lastIndexOf('.'));
    const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
    const truncated = nameWithoutExt.substring(0, maxLength - ext.length - 3);
    return truncated + '...' + ext;
  };

  return (
    <div className="image-preview-card">
      <div className="image-preview-thumbnail">
        {preview && <img src={preview} alt={file.name} />}
      </div>
      <div className="image-preview-info">
        <span className="image-preview-name" title={file.name}>
          {truncateName(file.name)}
        </span>
        <span className="image-preview-size">{formatFileSize(file.size)}</span>
      </div>
      <button
        type="button"
        className="image-preview-remove"
        onClick={onRemove}
        aria-label="Remove image"
      >
        <CloseIcon />
      </button>
    </div>
  );
};
