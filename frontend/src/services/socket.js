import { io } from 'socket.io-client';

const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.'));

const SOCKET_URL = isLocalhost
  ? 'http://127.0.0.1:5000'
  : (import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');

let socket = null;

export const getSocket = () => {
  if (!socket) {
    const token = localStorage.getItem('studyhub_token');
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
