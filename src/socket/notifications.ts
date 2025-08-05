import { Server } from 'socket.io';
import prisma from '../db/prisma';

let io: Server | null = null;

export function initNotificationSocket(server: any) {
  io = new Server(server, {
    cors: {
      origin: '*',
    },
  });

  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) {
      socket.join(`user_${userId}`);
    }
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
