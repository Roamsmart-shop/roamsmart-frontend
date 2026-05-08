// src/hooks/useSocketHealth.js
import { useEffect, useState } from 'react';
import { getSocket, initializeSocket } from '../services/socket';

export const useSocketHealth = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  useEffect(() => {
    let interval;
    const socket = getSocket() || initializeSocket();
    
    if (socket) {
      const checkHealth = () => {
        if (socket.connected) {
          setIsConnected(true);
          setRetryCount(0);
        } else if (retryCount < 3) {
          setRetryCount(prev => prev + 1);
          socket.connect();
        }
      };
      
      interval = setInterval(checkHealth, 30000);
      checkHealth();
      
      socket.on('connect', () => setIsConnected(true));
      socket.on('disconnect', () => setIsConnected(false));
    }
    
    return () => clearInterval(interval);
  }, [retryCount]);
  
  return { isConnected, retryCount };
};