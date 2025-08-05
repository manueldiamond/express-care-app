import { Router, Request, Response } from 'express';
import { getFilteredCaregivers, updateCaregiver } from '../db';
import { getPublicUrl, upload, handleFileUpload } from '../db/storage';
import { z } from 'zod';
import { requireCaregiver } from '../middleware/requireRole';
import { isCaregiverActive } from '../middleware/isCaregiverActive';
import caregiverQualificationsRouter from './caregiverQualifications';
import caregiverVerificationRouter from './caregiverVerification';

const router = Router();

// Get all caregivers with filtering
router.get('/', async (req: Request, res: Response) => {
  console.log('[CAREGIVERS] GET / - Caregivers listing request started', { 
    query: req.query,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  const { search, viewing = 'available', limit } = req.query;
  const limitNum = limit ? parseInt(limit as string) : undefined;

  console.log('[CAREGIVERS] GET / - Applying filters', { 
    search: search as string, 
    viewing: viewing as string, 
    limit: limitNum 
  });

  try {
    const caregivers = await getFilteredCaregivers(
      search as string,
      viewing as 'available' | 'all',
      false, // isAdmin = false for public endpoint
      limitNum
    );

    console.log('[CAREGIVERS] GET / - Caregivers retrieved successfully', { 
      count: caregivers.length,
      filters: { search, viewing, limit: limitNum }
    });

    res.json(caregivers);
  } catch (error) {
    console.log('[CAREGIVERS] GET / - Failed to retrieve caregivers', { 
      error: error instanceof Error ? error.message : error 
    });
    res.status(500).json({ error: 'Failed to retrieve caregivers' });
  }
});

// Nested: /api/caregivers/qualifications
router.use('/qualifications', caregiverQualificationsRouter);
// Nested: /api/caregivers/verification
router.use('/verification', caregiverVerificationRouter);

// Update caregiver availability
router.put('/availability', requireCaregiver, isCaregiverActive, async (req: Request & { user?: any }, res: Response) => {
  console.log('[CAREGIVERS] PUT /availability - Availability update request started', { 
    userId: req.user?.userId,
    caregiverId: req.user?.caregiverId,
    body: req.body,
    ip: req.ip
  });

  // Use the caregiver ID from JWT token
  const caregiverId = req.user?.caregiverId;
  if (!caregiverId) {
    console.log('[CAREGIVERS] PUT /availability - No caregiver ID in token', { userId: req.user?.userId });
    return res.status(400).json({ error: 'Caregiver profile not found' });
  }

  const { isAvailable } = req.body;
  if (typeof isAvailable !== 'boolean') {
    console.log('[CAREGIVERS] PUT /availability - Invalid isAvailable value', { isAvailable });
    return res.status(400).json({ error: 'isAvailable must be a boolean' });
  }

  console.log('[CAREGIVERS] PUT /availability - Updating caregiver availability', { 
    caregiverId,
    isAvailable 
  });

  try {
    const updatedCaregiver = await updateCaregiver(req.user.userId, { isAvailable });
    console.log('[CAREGIVERS] PUT /availability - Availability updated successfully', { 
      caregiverId: updatedCaregiver.id,
      isAvailable: updatedCaregiver.isAvailable 
    });

    return res.json({
      message: 'Availability updated successfully',
      caregiver: {
        id: updatedCaregiver.id,
        isAvailable: updatedCaregiver.isAvailable
      }
    });
  } catch (err) {
    console.log('[CAREGIVERS] PUT /availability - Failed to update availability', { 
      error: err instanceof Error ? err.message : err,
      caregiverId 
    });
    return res.status(500).json({ error: 'Failed to update availability', details: err instanceof Error ? err.message : err });
  }
});

export default router;