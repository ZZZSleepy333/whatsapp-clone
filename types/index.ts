import { User } from "firebase/auth";
import { Timestamp } from "firebase/firestore";

export interface Conversation {
  users: string[];
}

export interface AppUser {
  email: string;
  lastSeen: Timestamp;
  photoURL: string;
  displayName: string;
  password: string;
}

export interface IMessage {
  id: string;
  conversation_id: string;
  text: string;
  sent_at: string;
  user: string;
  fileUrl?: string;
  conversationId?: string; // Thêm cho socket
}

// Thêm các kiểu dữ liệu cho Socket
export interface TypingStatus {
  user: string;
  isTyping: boolean;
  conversationId: string;
}

export interface SocketMessageData extends IMessage {
  conversationId: string;
}
