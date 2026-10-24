import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || window.location.origin;

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (socketInstance) {
    return socketInstance;
  }

  const token = localStorage.getItem('wt_session_token') || '';

  socketInstance = io(SOCKET_URL, {
    auth: { token },
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    autoConnect: false,
  });

  return socketInstance;
}

export function connectSocket(): Socket {
  const token = localStorage.getItem('wt_session_token') || '';
  const socket = getSocket();
  socket.auth = { token };

  if (!socket.connected) {
    socket.connect();
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
  }
}
