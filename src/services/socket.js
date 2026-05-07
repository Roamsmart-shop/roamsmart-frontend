// src/services/socket.js
import io from 'socket.io-client';

// Use the same production URL as your API (remove /api)
const SOCKET_URL = 'https://roamsmart-backend-production.up.railway.app';

console.log('🔌 Socket.IO will connect to:', SOCKET_URL);

let socket = null;
let isConnecting = false;

export const initializeSocket = () => {
  // Don't create multiple connections
  if (socket && socket.connected) {
    console.log('Socket already connected');
    return socket;
  }
  
  if (isConnecting) {
    console.log('Socket connection already in progress');
    return socket;
  }
  
  isConnecting = true;
  
  const token = localStorage.getItem('roamsmart_token');
  
  try {
    socket = io(SOCKET_URL, {
      path: '/socket.io',
      transports: ['polling'], // Start with polling only (more reliable)
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      autoConnect: true,
      auth: {
        token: token
      }
    });
    
    socket.on('connect', () => {
      console.log('✅ Socket.IO connected successfully to:', SOCKET_URL);
      isConnecting = false;
    });
    
    socket.on('connect_error', (error) => {
      console.warn('⚠️ Socket.IO connection error (non-critical):', error.message);
      isConnecting = false;
      // Don't show error to user - just log silently
    });
    
    socket.on('disconnect', (reason) => {
      console.log('📡 Socket.IO disconnected:', reason);
    });
    
    socket.on('error', (error) => {
      console.error('Socket.IO error:', error);
    });
    
  } catch (error) {
    console.error('Failed to initialize socket:', error);
    isConnecting = false;
  }
  
  return socket;
};

export const getSocket = () => {
  if (!socket && !isConnecting) {
    return initializeSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    isConnecting = false;
  }
};

export default { initializeSocket, getSocket, disconnectSocket };