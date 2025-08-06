import { Router, Request, Response } from 'express';
import requireAuth from '../middleware/requireAuth';
import prisma from '../db/prisma';

const notificationRoutes = Router();

// Get current user's unread notifications
notificationRoutes.get('/', requireAuth, async (req: Request & { user?: any }, res: Response) => {
    const userId = req.user?.userId;

     try {
        const notifications = await prisma.notification.findMany({
            where: { userId, isRead: false },
            orderBy: { createdAt: 'desc' },
        });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Get all notifications for current user
notificationRoutes.get('/all', requireAuth, async (req: Request & { user?: any }, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Mark all as read
notificationRoutes.patch('/read-all', async (req: Request & { user?: any }, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    try {
        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to mark notifications as read' });
    }
});
// Mark a notification as read
notificationRoutes.patch('/:id/read', async (req: Request & { user?: any }, res: Response) => {
    const userId = req.user?.userId;
    const notificationId = Number(req.params.id);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const notification = await prisma.notification.updateMany({
            where: { id: notificationId, userId },
            data: { isRead: true },
        });
        if (notification.count === 0) return res.status(404).json({ error: 'Notification not found' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

// Delete a notification
notificationRoutes.delete('/:id', async (req: Request & { user?: any }, res: Response) => {
    const userId = req.user?.userId;
    const notificationId = Number(req.params.id);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const notification = await prisma.notification.deleteMany({
            where: { id: notificationId, userId },
        });
        if (notification.count === 0) return res.status(404).json({ error: 'Notification not found' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

export default notificationRoutes;
