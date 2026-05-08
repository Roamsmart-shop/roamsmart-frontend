// src/services/socket.js
import io from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'https://roamsmart-backend-production.up.railway.app';

let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;

export const initializeSocket = () => {
  if (socket?.connected) return socket;
  
  const token = localStorage.getItem('roamsmart_token');
  if (!token) return null;
  
  try {
    socket = io(SOCKET_URL, {
      path: '/socket.io',
      transports: ['polling', 'websocket'], // Try polling first, then upgrade
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      timeout: 10000, // 10 second timeout
      forceNew: true,
      rejectUnauthorized: false
    });
    
    socket.on('connect', () => {
      console.log('✅ Socket.IO connected');
      reconnectAttempts = 0;
    });
    
    socket.on('connect_error', (error) => {
      console.warn('⚠️ Socket.IO connection error:', error.message);
      reconnectAttempts++;
      
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.log('Stopping socket reconnection attempts');
        socket.disconnect();
      }
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        socket.connect();
      }
    });
    
    socket.on('error', (error) => {
      console.warn('Socket.IO error:', error);
    });
    
  } catch (error) {
    console.warn('Failed to initialize socket:', error.message);
    socket = null;
  }
  
  return socket;
};

export const getSocket = () => socket;
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    reconnectAttempts = 0;
  }
};

export default { initializeSocket, getSocket, disconnectSocket };