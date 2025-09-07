interface EditButtonProps {
  onEdit: () => void;
  isVisible: boolean;
}

export const EditButton: React.FC<EditButtonProps> = ({ onEdit, isVisible }) => {
 if (!isVisible) return null;

  return (
    <button 
      onClick={onEdit}
      className="message-edit-button"
      title="Edit message"
    > 
      ✏️
    </button>
  );
};