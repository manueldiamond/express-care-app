import { Router, Request, Response } from 'express';
import requireAuth from '../middleware/requireAuth';
import { requirePatient } from '../middleware/requireRole';
import { getPatientByIdWithUser } from '../db/patient';
import { getAvailableCaregiversForMatching } from '../db/caregiver';
import { matchCaregiverProfiles } from '../utils/caregiverMatching';
import { mapCaregiverWithPhoto } from '../utils/publicUrlMappings';

const router = Router();

/**
 * GET /api/patient-caregiver-matches
 * Get matched caregivers for the authenticated patient
 * Requires authentication and patient role
 */
router.get('/', requireAuth, requirePatient, async (req: Request & { user?: any }, res: Response) => {
  // Use req.user.patientId only, not from params
  const patientId = req.user?.patientId;
  // Get 'limit' from query params, default to undefined (no limit)
  let limit: number | undefined = undefined;
  if (req.query.limit !== undefined) {
    const parsedLimit = parseInt(req.query.limit as string, 10);
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      limit = parsedLimit;
    }
  }

  console.log('[PATIENT-CAREGIVER-MATCHING] GET / - Matching request started', { 
    patientId,
    userId: req.user?.userId,
    userRole: req.user?.role,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  if (!patientId || isNaN(patientId)) {
    console.log('[PATIENT-CAREGIVER-MATCHING] GET / - Invalid patient ID', { patientId });
    return res.status(400).json({ error: 'Invalid patient ID' });
  }

  try {
    // Get patient with user information
    const patient = await getPatientByIdWithUser(patientId);
    if (!patient) {
      console.log('[PATIENT-CAREGIVER-MATCHING] GET / - Patient not found', { patientId });
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Check if the authenticated user is the patient or has permission
    if (patient.userId !== req.user.userId && req.user.role !== 'admin') {
      console.log('[PATIENT-CAREGIVER-MATCHING] GET / - Access denied', { 
        patientUserId: patient.userId, 
        authenticatedUserId: req.user.userId 
      });
      return res.status(403).json({ error: 'Access denied: You can only view matches for your own patient profile' });
    }

    console.log('[PATIENT-CAREGIVER-MATCHING] GET / - Patient found, fetching available caregivers', { patientId });

    // Get available caregivers with user information and qualifications
    const availableCaregivers = await getAvailableCaregiversForMatching();
    
    if (availableCaregivers.length === 0) {
      console.log('[PATIENT-CAREGIVER-MATCHING] GET / - No available caregivers found', { patientId });
      return res.json({
        patient: {
          id: patient.id,
          condition: patient.condition,
          years: patient.years,
          schedule: patient.schedule,
          description: patient.description,
          special: patient.special,
          user: patient.user
        },
        matches: [],
        totalMatches: 0
      });
    }

    console.log('[PATIENT-CAREGIVER-MATCHING] GET / - Found available caregivers, computing matches', { 
      patientId, 
      caregiverCount: availableCaregivers.length 
    });

    // Perform matching
    const matchedCaregivers = await matchCaregiverProfiles(patient, availableCaregivers);

    console.log('[PATIENT-CAREGIVER-MATCHING] GET / - Matching completed', { 
      patientId, 
      matchCount: matchedCaregivers.length,
      topScore: matchedCaregivers[0]?.score || 0
    });

    // Map caregivers with photo URLs and format response
    const formattedMatches = matchedCaregivers.slice(0,limit).map(caregiver => ({
      ...mapCaregiverWithPhoto(req, caregiver),
      score: caregiver.score,
      //matchPercentage: Math.round(caregiver.score * 100)
    }));

    res.json(formattedMatches);

  } catch (error) {
    console.error('[PATIENT-CAREGIVER-MATCHING] GET / - Error during matching', { 
      error: error instanceof Error ? error.message : error,
      patientId 
    });
    res.status(500).json({ error: 'Failed to compute caregiver matches' });
  }
});

export default router; 