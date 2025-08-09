import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import jwt from 'jsonwebtoken';

export default function requireAuth(req: Request & { user?: any }, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;

  if (!auth) return res.status(401).json({ error: 'Missing token' });
  const token = auth.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    console.log(payload);
    if (!payload) throw new Error('Invalid token');
    req.user = payload;
    next();
  } catch (err: any) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
} 