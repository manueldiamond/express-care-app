import { Router, Request, Response } from 'express';
import prisma from '../db/prisma';
import requireAuth from '../middleware/requireAuth';

const router = Router();

// Get all chats for the current user
router.get('/', requireAuth, async (req: Request & { user?: any }, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const chats = await prisma.chat.findMany({
      where: {
        OR: [
          { userAId: userId },
          { userBId: userId }
        ]
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Get user details for each chat
    const chatsWithUsers = await Promise.all(
      chats.map(async (chat) => {
        const [userA, userB] = await Promise.all([
          prisma.user.findUnique({
            where: { id: chat.userAId },
            select: { id: true, fullname: true, photoUrl: true, email: true }
          }),
          prisma.user.findUnique({
            where: { id: chat.userBId },
            select: { id: true, fullname: true, photoUrl: true, email: true }
          })
        ]);

        return {
          ...chat,
          userA,
          userB
        };
      })
    );

    res.json(chatsWithUsers);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// Get messages for a specific chat
router.get('/:chatId/messages', requireAuth, async (req: Request & { user?: any }, res: Response) => {
  const { chatId } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const chat = await prisma.chat.findUnique({
      where: { id: parseInt(chatId) }
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Check if user is part of this chat
    if (chat.userAId !== userId && chat.userBId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await prisma.message.findMany({
      where: { chatId: parseInt(chatId) },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Get sender details for each message
    const messagesWithSenders = await Promise.all(
      messages.map(async (message) => {
        const sender = await prisma.user.findUnique({
          where: { id: message.senderId },
          select: { id: true, fullname: true, photoUrl: true }
        });

        return {
          ...message,
          sender
        };
      })
    );

    res.json(messagesWithSenders);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Create a new chat or get existing chat between two users
router.post('/', requireAuth, async (req: Request & { user?: any }, res: Response) => {
  const { otherUserId } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!otherUserId || userId === otherUserId) {
    return res.status(400).json({ error: 'Invalid other user ID' });
  }

  try {
    // Check if chat already exists
    let chat = await prisma.chat.findFirst({
      where: {
        OR: [
          { userAId: userId, userBId: otherUserId },
          { userAId: otherUserId, userBId: userId }
        ]
      }
    });

    if (!chat) {
      // Create new chat
      chat = await prisma.chat.create({
        data: {
          userAId: userId,
          userBId: otherUserId
        }
      });
    }

    // Get user details for the chat
    const [userA, userB] = await Promise.all([
      prisma.user.findUnique({
        where: { id: chat.userAId },
        select: { id: true, fullname: true, photoUrl: true, email: true }
      }),
      prisma.user.findUnique({
        where: { id: chat.userBId },
        select: { id: true, fullname: true, photoUrl: true, email: true }
      })
    ]);

    const chatWithUsers = {
      ...chat,
      userA,
      userB
    };

    res.json(chatWithUsers);
  } catch (error) {
    console.error('Error creating/finding chat:', error);
    res.status(500).json({ error: 'Failed to create/find chat' });
  }
});

export default router; 