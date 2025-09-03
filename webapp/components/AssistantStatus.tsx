import React, { useState, useEffect } from 'react';

interface AssistantStatusProps {
  isLoading?: boolean;
  pollInterval?: number; // in milliseconds, default 30 seconds
}

export const AssistantStatus: React.FC<AssistantStatusProps> = ({
  isLoading = false,
  pollInterval = 30000
}) => {
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);

  const checkBackendHealth = async () => {
    try {
      const response = await fetch('/api/assistant/health');
      
      if (!response.ok) {
        console.error(`Health check failed with status: ${response.status}`);
        setIsBackendHealthy(false);
        return false;
      }
      
      const data = await response.json();
      const isHealthy = data.backend;
      setIsBackendHealthy(isHealthy);
      return isHealthy;
    } catch (error) {
      console.error('Health check failed:', error);
      setIsBackendHealthy(false);
      return false;
    }
  };

  useEffect(() => {
    // Check backend health on component mount
    checkBackendHealth();
    
    // Set up periodic health checks
    const healthCheckInterval = setInterval(checkBackendHealth, pollInterval);
    
    return () => clearInterval(healthCheckInterval);
  }, [pollInterval]);

  const getStatusInfo = () => {
    if (isLoading) {
      return {
        className: 'loading',
        text: 'Thinking...'
      };
    }
    
    if (isBackendHealthy === null) {
      return {
        className: 'checking',
        text: 'Checking...'
      };
    }
    
    if (isBackendHealthy) {
      return {
        className: 'ready',
        text: 'Ready'
      };
    }
    
    return {
      className: 'error',
      text: 'Backend Offline'
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="status-indicator">
      <div className={`status-dot ${statusInfo.className}`}></div>
      <span>{statusInfo.text}</span>
    </div>
  );
};