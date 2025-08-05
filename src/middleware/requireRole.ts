import type { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

export function requireRole(role: Role) {
  return (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    console.log('[REQUIRE_ROLE] Checking role access', { 
      requiredRole: role, 
      userRole: req.user?.role,
      userId: req.user?.userId 
    });

    // Check specific role requirement
    if (!req.user || req.user.role !== role) {
      console.log('[REQUIRE_ROLE] Access denied - insufficient role', { 
        requiredRole: role, 
        userRole: req.user?.role,
        userId: req.user?.userId 
      });
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    
    console.log('[REQUIRE_ROLE] Role access granted', { 
      role, 
      userId: req.user.userId 
    });
    next();
  };
}

export const requireAdmin = requireRole(Role.admin);
export const requireCaregiver = requireRole(Role.caregiver);
export const requirePatient = requireRole(Role.patient); 