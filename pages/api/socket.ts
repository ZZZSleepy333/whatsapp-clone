import { Server as SocketIOServer } from "socket.io";
import type { NextApiRequest, NextApiResponse } from "next";
import { Server as NetServer } from "http";

export const config = {
  api: {
    bodyParser: false,
  },
};

const SocketHandler = (req: NextApiRequest, res: NextApiResponse) => {
  if (!(res.socket as any)?.server?.io) {
    console.log("Khởi tạo Socket.io server...");
    const httpServer: NetServer = (res.socket as any)?.server as any;
    const io = new SocketIOServer(httpServer, {
      path: "/api/socket",
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    // Lưu trữ người dùng online
    const onlineUsers = new Map();

    // Định nghĩa các sự kiện socket
    io.on("connection", (socket) => {
      console.log(`Người dùng đã kết nối: ${socket.id}`);

      // Xử lý khi người dùng đăng nhập và cập nhật trạng thái online
      socket.on("user-online", (userEmail) => {
        onlineUsers.set(userEmail, socket.id);
        // Thông báo cho tất cả người dùng biết ai đang online
        io.emit("online-users", Array.from(onlineUsers.keys()));
      });

      // Tham gia vào phòng chat (conversation)
      socket.on("join-conversation", (conversationId) => {
        socket.join(conversationId);
        console.log(
          `Người dùng ${socket.id} đã tham gia cuộc trò chuyện: ${conversationId}`
        );
      });

      // Xử lý tin nhắn mới
      socket.on("send-message", (messageData) => {
        console.log("Tin nhắn mới:", messageData);
        // Gửi tin nhắn đến tất cả người dùng trong cuộc trò chuyện
        io.to(messageData.conversationId).emit("new-message", messageData);
      });

      // Xử lý khi người dùng đang nhập
      socket.on("typing", (data) => {
        socket.to(data.conversationId).emit("user-typing", {
          user: data.user,
          isTyping: data.isTyping,
        });
      });

      // Xử lý khi người dùng ngắt kết nối
      socket.on("disconnect", () => {
        console.log(`Người dùng đã ngắt kết nối: ${socket.id}`);

        // Tìm và xóa người dùng khỏi danh sách online
        let disconnectedUser = null;
        Array.from(onlineUsers.entries()).forEach(([user, id]) => {
          if (id === socket.id) {
            disconnectedUser = user;
            return;
          }
        });
        if (disconnectedUser) {
          onlineUsers.delete(disconnectedUser);
          // Thông báo cho tất cả người dùng biết ai đã offline
          io.emit("online-users", Array.from(onlineUsers.keys()));
        }
      });
    });

    // Lưu trữ instance của io vào server
    ((res.socket as any).server as any).io = io;
  }

  res.end();
};

export default SocketHandler;
