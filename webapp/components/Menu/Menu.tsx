import React from 'react';
import { MenuItem } from './MenuItem';

interface MenuProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export const Menu: React.FC<MenuProps> = ({ activeView, onViewChange }) => {
  return (
    <div className="menu-panel">
      <div className="menu-header">
        <h1>AI Assistant Chat</h1>
      </div>
      <div className="menu-items">
        <MenuItem 
          label="Chat" 
          isActive={activeView === 'chat'} 
          onClick={() => onViewChange('chat')} 
        />
        <MenuItem 
          label="About" 
          isActive={activeView === 'about'} 
          onClick={() => onViewChange('about')} 
        />
      </div>
    </div>
  );
};