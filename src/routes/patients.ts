import { Router, Request, Response } from 'express';
import { getAllPatients } from '../db';
import requireAuth from '../middleware/requireAuth';

const router = Router();

router.get('/', async (req: Request & { user?: any }, res: Response) => {
  console.log('[PATIENTS] GET / - Patients list request started', { 
    userId: req.user?.userId,
    userRole: req.user?.role,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  console.log('[PATIENTS] GET / - Fetching all patients from database');
  // In a real app, filter by patients assigned to this caregiver (req.user.userId)
  // For now, return all patients
  const patients = await getAllPatients();
  console.log('[PATIENTS] GET / - Patients retrieved successfully', { 
    count: patients.length,
    patientIds: patients.map(p => p.id)
  });
  
  res.json(patients);
});

export default router; 