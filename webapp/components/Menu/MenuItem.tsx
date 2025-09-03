import React from 'react';

interface MenuItemProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export const MenuItem: React.FC<MenuItemProps> = ({ label, isActive, onClick }) => {
  return (
    <button 
      className={`menu-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};