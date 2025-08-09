import { Server } from 'socket.io';
import prisma from '../db/prisma';

let io: Server | null = null;

// --- Chat Socket Logic ---
// Remove unused Chat, Message imports
// Helper: get chat room name for a chatId
function chatRoom(chatId: string | number) {
  return `chat_${chatId.toString()}`;
}

// Helper: get user room name for a userId
function userRoom(userId: string | number) {
  return `user_${userId.toString()}`;
}

export function initNotificationSocket(server: any) {
  io = new Server(server, {
    cors: {
      origin: '*',
    },
  });

  io.on('connection', (socket) => {
    let userId = socket.handshake.query.userId;
    if (typeof userId === 'string') userId = parseInt(userId);
    if (Array.isArray(userId)) userId = parseInt(userId[0]);
    if (userId && !isNaN(userId)) {
      socket.join(userRoom(userId));
    }

    // --- Chat events ---
    // Join a chat room
    socket.on('join_chat', (chatId) => {
      if (typeof chatId === 'string') chatId = parseInt(chatId);
      if (Array.isArray(chatId)) chatId = parseInt(chatId[0]);
      if (chatId && !isNaN(chatId)) {
        socket.join(chatRoom(chatId));
      }
    });

    // Leave a chat room
    socket.on('leave_chat', (chatId) => {
      if (typeof chatId === 'string') chatId = parseInt(chatId);
      if (Array.isArray(chatId)) chatId = parseInt(chatId[0]);
      if (chatId && !isNaN(chatId)) {
        socket.leave(chatRoom(chatId));
      }
    });

    // Send a message
    socket.on('send_message', async (data) => {
      let { chatId, senderId, content } = data;
      if (typeof chatId === 'string') chatId = parseInt(chatId);
      if (Array.isArray(chatId)) chatId = parseInt(chatId[0]);
      if (typeof senderId === 'string') senderId = parseInt(senderId);
      if (Array.isArray(senderId)) senderId = parseInt(senderId[0]);
      if (!chatId || !senderId || !content) return;
      if (!io) return;

      // Create message object for immediate sending
      const messageData = {
        chatId,
        senderId,
        content,
        createdAt: new Date(),
        read: false,
        id: Date.now() // Temporary ID for immediate response
      };

      // Send immediately via socket
      io.to(chatRoom(chatId)).emit('receive_message', messageData);

      // Save to DB asynchronously (don't await)
      prisma.message.create({
        data: { chatId, senderId, content },
      }).catch(error => {
        console.error('Failed to save message to DB:', error);
        // Optionally emit an error event to the sender
        socket.emit('message_save_error', { error: 'Failed to save message' });
      });
    });
  });
}

export async function sendNotification(userId: number, type: string, message: string) {
    console.log(`Preparing to send notification to user ${userId} of type ${type}`);
    // Save notification in DB
    console.log('Saving notification to database...');
    await prisma.notification.create({
        data: { userId, type, message },
    });
    console.log('Notification saved to database.');
    // Emit notification to user
    if (io) {
        console.log(`Emitting notification to user_${userId} room via socket.io`);
        io.to(`user_${userId}`).emit('notification', { type, message });
        console.log('Notification emitted.');
    } else {
        console.log('Socket.io server not initialized. Notification not emitted.');
    }
}
