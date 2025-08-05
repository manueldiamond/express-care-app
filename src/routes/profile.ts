import { Router, Request, Response } from 'express';
import requireAuth from '../middleware/requireAuth';
import { getPublicUrl, upload, handleFileUpload } from '../db/storage';
import { 
  getUserWithProfiles, 
  updateUser, 
  updateUserPhoto,
  getPatientByUserId,
  createPatient,
  updatePatient,
  getCaregiverByUserId,
  createCaregiver,
  updateCaregiver
} from '../db';
import { User, Role } from '@prisma/client';
import { z } from 'zod';
import { updateProfileSchema, updatePatientSchema, updateCaregiverProfileSchema } from '../zod/profileSchemas';

const router = Router();

// Get current user's profile (with role-specific info)
router.get('/', requireAuth, async (req: Request & { user?: any }, res: Response) => {
  console.log('[PROFILE] GET / - Profile request started', { 
    userId: req.user?.userId,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  console.log('[PROFILE] GET / - Fetching user with profiles');
  const user = await getUserWithProfiles(req.user.userId);
  if (!user) {
    console.log('[PROFILE] GET / - User not found', { userId: req.user.userId });
    return res.status(404).json({ error: 'User not found' });
  }

  console.log('[PROFILE] GET / - User found, processing photo URL');
  const photoUrl = user.photoUrl ? getPublicUrl(req, user.photoUrl) : null;
  
  const baseProfile = {
    ...user,
    passwordHash:undefined,
    photoUrl,
  }as User;

  console.log('[PROFILE] GET / - Building response based on user role', { role: user.role });

  let response: any = { ... baseProfile };

  if (user.role === 'caregiver' && user.caregiver) {
    console.log('[PROFILE] GET / - Returning caregiver profile', { userId: user.id });
    response = { ...baseProfile, caregiverProfile: user.caregiver };
  } else if (user.role === 'patient' && user.patient) {
    console.log('[PROFILE] GET / - Returning patient profile', { userId: user.id });
    response = { ...baseProfile, patientProfile: user.patient };
  } else {
    console.log('[PROFILE] GET / - Returning basic user profile', response);
  }

  res.json({user:response});
});

// Update current user's profile
router.put('/', requireAuth, async (req: Request & { user?: any }, res: Response) => {
  console.log('[PROFILE] PUT / - Profile update request started', { 
    userId: req.user?.userId,
    body: req.body,
    ip: req.ip
  });

  console.log('[PROFILE] PUT / - Validating request body');
  const parseResult = updateProfileSchema.safeParse(req.body);
  if (!parseResult.success) {
    console.log('[PROFILE] PUT / - Validation failed', { 
      errors: z.treeifyError(parseResult.error) 
    });
    return res.status(400).json({ error: 'Invalid input', details:z.treeifyError(parseResult.error)});
  }

  const data = parseResult.data;
  console.log('[PROFILE] PUT / - Validation successful', { fieldsToUpdate: Object.keys(data) });
  
  if (Object.keys(data).length === 0) {
    console.log('[PROFILE] PUT / - No fields to update');
    return res.status(400).json({ error: 'No fields to update' });
  }

  console.log('[PROFILE] PUT / - Updating user in database');
  const user = await updateUser(req.user.userId, data);
  console.log('[PROFILE] PUT / - User updated successfully', { userId: user.id });

  console.log('[PROFILE] PUT / - Processing photo URL');
  const publicPhotoUrl = user.photoUrl ? getPublicUrl(req, user.photoUrl) : null;
  
  console.log('[PROFILE] PUT / - Profile update completed successfully', { userId: user.id });
  res.json({user:{ ...user, photoUrl:publicPhotoUrl } as User});
});

// Update patient info (merged model)
router.put('/patient', requireAuth, async (req: Request & { user?: any }, res: Response) => {
  console.log('[PROFILE] PUT /patient - Patient profile update request started', { 
    userId: req.user?.userId,
    body: req.body,
    ip: req.ip
  });

  console.log('[PROFILE] PUT /patient - Validating request body');
  const parseResult = updatePatientSchema.safeParse(req.body);
  if (!parseResult.success) {
    console.log('[PROFILE] PUT /patient - Validation failed', { 
      errors: z.treeifyError(parseResult.error) 
    });
    return res.status(400).json({ error: 'Invalid input', details: z.treeifyError(parseResult.error) });
  }

  console.log('[PROFILE] PUT /patient - Validation successful, checking if patient profile exists');
  let patient = await getPatientByUserId(req.user.userId);
  
  if (!patient) {
    console.log('[PROFILE] PUT /patient - Patient profile does not exist, creating new profile');
    // Create the patient profile if it doesn't exist
    try {
      console.log('[PROFILE] PUT /patient - Creating patient profile with data', { 
        userId: req.user.userId,
        data: parseResult.data 
      });
      patient = await createPatient(req.user.userId, parseResult.data);
      console.log('[PROFILE] PUT /patient - Patient profile created successfully', { 
        patientId: patient.id,
        userId: patient.userId 
      });
      return res.json(patient);
    } catch (err) {
      console.log('[PROFILE] PUT /patient - Failed to create patient profile', { 
        error: err instanceof Error ? err.message : err,
        userId: req.user.userId 
      });
      return res.status(500).json({ error: 'Failed to create patient profile', details: err instanceof Error ? err.message : err });
    }
  } else {
    console.log('[PROFILE] PUT /patient - Patient profile exists, updating');
    // Update the patient profile if it exists
    console.log('[PROFILE] PUT /patient - Updating patient profile with data', { 
      patientId: patient.id,
      data: parseResult.data 
    });
    const updated = await updatePatient(req.user.userId, parseResult.data);
    console.log('[PROFILE] PUT /patient - Patient profile updated successfully', { 
      patientId: updated.id,
      userId: updated.userId 
    });
    return res.json(updated);
  }
});

// Update caregiver profile (create if not exists)
router.put('/caregiver', requireAuth, async (req: Request & { user?: any }, res: Response) => {
  console.log('[PROFILE] PUT /caregiver - Caregiver profile update request started', { 
    userId: req.user?.userId,
    body: req.body,
    ip: req.ip
  });

  console.log('[PROFILE] PUT /caregiver - Validating request body');
  const parseResult = updateCaregiverProfileSchema.safeParse(req.body);
  if (!parseResult.success) {
    console.log('[PROFILE] PUT /caregiver - Validation failed', { 
      errors: JSON.stringify(z.treeifyError(parseResult.error).properties)
    });
    return res.status(400).json({ error: 'Invalid input', details: z.treeifyError(parseResult.error).errors });
  }

  console.log('[PROFILE] PUT /caregiver - Validation successful, checking if caregiver profile exists');
  let caregiver = await getCaregiverByUserId(req.user.userId);
  
  if (!caregiver) {
    console.log('[PROFILE] PUT /caregiver - Caregiver profile does not exist, creating new profile');
    // Create the caregiver profile if it doesn't exist
    try {
      console.log('[PROFILE] PUT /caregiver - Creating caregiver profile with data', { 
        userId: req.user.userId,
        data: parseResult.data 
      });
      caregiver = await createCaregiver(req.user.userId, parseResult.data);
      console.log('[PROFILE] PUT /caregiver - Caregiver profile created successfully', { 
        caregiverId: caregiver.id,
        userId: caregiver.userId 
      });
      return res.json(caregiver);
    } catch (err) {
      console.log('[PROFILE] PUT /caregiver - Failed to create caregiver profile', { 
        error: err instanceof Error ? err.message : err,
        userId: req.user.userId 
      });
      return res.status(500).json({ error: 'Failed to create caregiver profile', details: err instanceof Error ? err.message : err });
    }
  } else {
    console.log('[PROFILE] PUT /caregiver - Caregiver profile exists, updating');
    // Update the caregiver profile if it exists
    console.log('[PROFILE] PUT /caregiver - Updating caregiver profile with data', { 
      caregiverId: caregiver.id,
      data: parseResult.data 
    });
    const updated = await updateCaregiver(req.user.userId, parseResult.data);
    console.log('[PROFILE] PUT /caregiver - Caregiver profile updated successfully', { 
      caregiverId: updated.id,
      userId: updated.userId 
    });
    return res.json(updated);
  }
});

// Upload profile photo
router.post('/photo', requireAuth, upload.single('photo'), async (req: Request & { user?: any }, res: Response) => {
  console.log('[PROFILE] POST /photo - Photo upload request started', { 
    userId: req.user?.userId,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  const r = req as any;
  if (!r.file) {
    console.log('[PROFILE] POST /photo - No file uploaded');
    return res.status(400).json({ error: 'No file uploaded' });
  }

  console.log('[PROFILE] POST /photo - File uploaded successfully', { 
    filename: r.file.filename,
    originalname: r.file.originalname,
    size: r.file.size,
    mimetype: r.file.mimetype
  });

  // Use helper function to handle file upload
  const { relativeUrl, publicUrl } = handleFileUpload(req, r.file);
  console.log('[PROFILE] POST /photo - Updating user photo URL in database', { 
    userId: req.user.userId,
    photoUrl: relativeUrl 
  });
  
  await updateUserPhoto(req.user.userId, relativeUrl);
  console.log('[PROFILE] POST /photo - Photo URL updated in database successfully');

  console.log('[PROFILE] POST /photo - Photo upload completed successfully', { 
    userId: req.user.userId,
    publicUrl 
  });
  
  res.json({ photoUrl: publicUrl });
});

export default router; 