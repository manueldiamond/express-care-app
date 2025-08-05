import type { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

export function requireRole(role: Role) {
  return (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    // Admins can access everything
    if (req.user?.role === 'admin') {
      return next();
    }
    
    // Check specific role requirement
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    next();
  };
}

export const requireAdmin = requireRole(Role.admin);
export const requireCaregiver = requireRole(Role.caregiver);
export const requirePatient = requireRole(Role.patient); 