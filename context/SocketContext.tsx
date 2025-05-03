import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../config/firebase';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: string[];
  joinConversation: (conversationId: string) => void;
  sendMessage: (messageData: any) => void;
  setTyping: (conversationId: string, isTyping: boolean) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [loggedInUser] = useAuthState(auth);

  useEffect(() => {
    // Chỉ kết nối socket khi người dùng đã đăng nhập
    if (!loggedInUser) return;

    // Khởi tạo kết nối socket
    const initSocket = async () => {
      // Đảm bảo máy chủ socket đã được khởi tạo
      await fetch('/api/socket');
      
      const socketInstance = io({
        path: '/api/socket',
      });

      socketInstance.on('connect', () => {
        console.log('Socket đã kết nối');
        setIsConnected(true);
        
        // Thông báo người dùng online
        if (loggedInUser?.email) {
          socketInstance.emit('user-online', loggedInUser.email);
        }
      });

      socketInstance.on('online-users', (users: string[]) => {
        setOnlineUsers(users);
      });

      socketInstance.on('disconnect', () => {
        console.log('Socket đã ngắt kết nối');
        setIsConnected(false);
      });

      setSocket(socketInstance);
    };

    initSocket();

    // Dọn dẹp khi component unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [loggedInUser]);

  // Tham gia vào một cuộc trò chuyện
  const joinConversation = (conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('join-conversation', conversationId);
    }
  };

  // Gửi tin nhắn
  const sendMessage = (messageData: any) => {
    if (socket && isConnected) {
      socket.emit('send-message', messageData);
    }
  };

  // Thông báo đang nhập
  const setTyping = (conversationId: string, isTyping: boolean) => {
    if (socket && isConnected && loggedInUser) {
      socket.emit('typing', {
        conversationId,
        user: loggedInUser.email,
        isTyping,
      });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUsers,
        joinConversation,
        sendMessage,
        setTyping,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket phải được sử dụng trong SocketProvider');
  }
  return context;
};