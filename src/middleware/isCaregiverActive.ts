import { Request, Response, NextFunction } from 'express';
import { getCaregiverActiveStatus,} from '../db';

// Middleware to check if caregiver is verified
export async function isCaregiverActive(req: Request & { user?: any }, res: Response, next: NextFunction) {
  const caregiverId = req.user?.caregiverId;
  if (!caregiverId) {
    return res.status(401).json({ error: 'Caregiver ID not found in token' });
  }
  try {
    const isActive = await getCaregiverActiveStatus(caregiverId);
    console.log('[MIDDLEWARE] isCaregiverActive - Caregiver active status:', { caregiverId, isActive });
    if (!isActive){
      return res.status(403).json({ error: 'Caregiver is not Active or Verified' });
    }
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Failed to verify caregiver' });
  }
}
