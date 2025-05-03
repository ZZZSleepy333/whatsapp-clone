import { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';

interface UseSocketEventsProps {
  conversationId: string;
  onNewMessage?: (message: any) => void;
  onUserTyping?: (data: { user: string; isTyping: boolean }) => void;
}

export const useSocketEvents = ({
  conversationId,
  onNewMessage,
  onUserTyping,
}: UseSocketEventsProps) => {
  const { socket, isConnected, joinConversation, onlineUsers } = useSocket();
  const [isUserTyping, setIsUserTyping] = useState<{ user: string; isTyping: boolean } | null>(null);

  useEffect(() => {
    if (!isConnected || !socket || !conversationId) return;

    // Tham gia vào cuộc trò chuyện
    joinConversation(conversationId);

    // Lắng nghe sự kiện tin nhắn mới
    if (onNewMessage) {
      socket.on('new-message', (message: any) => {
        if (message.conversationId === conversationId) {
          onNewMessage(message);
        }
      });
    }

    // Lắng nghe sự kiện người dùng đang nhập
    if (onUserTyping) {
      socket.on('user-typing', (data: { user: string; isTyping: boolean }) => {
        setIsUserTyping(data);
        onUserTyping(data);
      });
    }

    // Dọn dẹp khi component unmount
    return () => {
      socket.off('new-message');
      socket.off('user-typing');
    };
  }, [socket, isConnected, conversationId, onNewMessage, onUserTyping, joinConversation]);

  return {
    isUserTyping,
    onlineUsers,
  };
};