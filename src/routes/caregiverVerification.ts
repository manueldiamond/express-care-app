import { Router, Request, Response } from 'express';
import { createVerification, updateVerification, getVerificationByCaregiverProfileId } from '../db';
import { verificationSchema } from '../zod/profileSchemas';
import { getPublicUrl, upload, handleFileUpload } from '../db/storage';
import { requireCaregiver } from '../middleware/requireRole';
import { z } from 'zod';

const router = Router();

// Public/admin: Get verification for a caregiver by ID
router.get('/:caregiverId', async (req: Request, res: Response) => {
  console.log('[CAREGIVER_VERIFICATION] GET /:caregiverId - Request started', {
    caregiverIdParam: req.params.caregiverId,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  const caregiverId = parseInt(req.params.caregiverId);
  console.log('[CAREGIVER_VERIFICATION] GET /:caregiverId - Parsed caregiverId', { caregiverId });

  if (isNaN(caregiverId)) {
    console.log('[CAREGIVER_VERIFICATION] GET /:caregiverId - Invalid caregiver ID', { caregiverIdParam: req.params.caregiverId });
    return res.status(400).json({ error: 'Invalid caregiver ID' });
  }

  try {
    console.log('[CAREGIVER_VERIFICATION] GET /:caregiverId - Fetching verification from DB', { caregiverId });
    const verification = await getVerificationByCaregiverProfileId(caregiverId);

    if (!verification) {
      console.log('[CAREGIVER_VERIFICATION] GET /:caregiverId - No verification found', { caregiverId });
      return res.json({ verification: null });
    }

    console.log('[CAREGIVER_VERIFICATION] GET /:caregiverId - Verification found', { verificationId: verification.id });

    // Log document field
    console.log('[CAREGIVER_VERIFICATION] GET /:caregiverId - Generating public URL for document', { document: verification.document });
    const fullDocumentUrl = getPublicUrl(req, verification.document);

    // Log photo field (may not exist on type, so check existence)
    let fullPhotoUrl = null;
    if ('photo' in verification && verification.photo) {
      console.log('[CAREGIVER_VERIFICATION] GET /:caregiverId - Generating public URL for photo', { photo: verification.photo });
      fullPhotoUrl = getPublicUrl(req, (verification as any).photo);
    } else {
      console.log('[CAREGIVER_VERIFICATION] GET /:caregiverId - No photo field present on verification');
    }

    const response = {
      ...verification,
      document: fullDocumentUrl,
      photo: fullPhotoUrl
    };

    console.log('[CAREGIVER_VERIFICATION] GET /:caregiverId - Returning verification response', { response });

    return res.json({ verification: response });
  } catch (err) {
    console.log('[CAREGIVER_VERIFICATION] GET /:caregiverId - Failed to fetch verification', {
      error: err instanceof Error ? err.message : err,
      caregiverId
    });
    return res.status(500).json({ error: 'Failed to fetch verification', details: err instanceof Error ? err.message : err });
  }
});

// Caregiver self-service: Add verification (with file uploads)
router.post('/', requireCaregiver, upload.fields([
  { name: 'document', maxCount: 1 },
  { name: 'photo', maxCount: 1 }
]), async (req: Request & { user?: any }, res: Response) => {
  console.log('[CAREGIVER_VERIFICATION] POST / - Verification creation request started', { 
    userId: req.user?.userId,
    caregiverId: req.user?.caregiverId,
    body: req.body,
    ip: req.ip
  });

  console.log('[CAREGIVER_VERIFICATION] POST / - Validating request body');
  const parseResult = verificationSchema.safeParse(req.body);
  if (!parseResult.success) {
    console.log('[CAREGIVER_VERIFICATION] POST / - Validation failed', { 
      errors: z.treeifyError(parseResult.error) 
    });
    return res.status(400).json({ error: 'Invalid input', details: z.treeifyError(parseResult.error) });
  }

  const r = req as any;
  if (!r.files || !r.files.document || !r.files.photo) {
    console.log('[CAREGIVER_VERIFICATION] POST / - Missing required files', { 
      hasDocument: !!r.files?.document,
      hasPhoto: !!r.files?.photo
    });
    return res.status(400).json({ error: 'Both document and photo files are required' });
  }

  console.log('[CAREGIVER_VERIFICATION] POST / - Files uploaded successfully', { 
    documentFile: {
      filename: r.files.document[0].filename,
      originalname: r.files.document[0].originalname,
      size: r.files.document[0].size,
      mimetype: r.files.document[0].mimetype
    },
    photoFile: {
      filename: r.files.photo[0].filename,
      originalname: r.files.photo[0].originalname,
      size: r.files.photo[0].size,
      mimetype: r.files.photo[0].mimetype
    }
  });

  // Use the caregiver ID from JWT token
  const caregiverId = req.user?.caregiverId;
  if (!caregiverId) {
    console.log('[CAREGIVER_VERIFICATION] POST / - No caregiver ID in token', { userId: req.user?.userId });
    return res.status(400).json({ error: 'Caregiver profile not found' });
  }

  // Use helper function to handle file uploads
  const { relativeUrl: relativeDocumentUrl, publicUrl: fullDocumentUrl } = handleFileUpload(req, r.files.document[0]);
  const { relativeUrl: relativePhotoUrl, publicUrl: fullPhotoUrl } = handleFileUpload(req, r.files.photo[0]);
  
  console.log('[CAREGIVER_VERIFICATION] POST / - Creating verification with file URLs', { 
    caregiverId,
    documentType: parseResult.data.documentType,
    documentURL: relativeDocumentUrl,
    photoURL: relativePhotoUrl
  });

  try {
    const verification = await createVerification(caregiverId, {
      documentType: parseResult.data.documentType,
      document: relativeDocumentUrl,
      photo: relativePhotoUrl
    });
    console.log('[CAREGIVER_VERIFICATION] POST / - Verification created successfully', { 
      verificationId: verification.id,
      caregiverProfileId: verification.caregiverProfileId 
    });

    // Return the verification with public URLs
    const response = {
      ...verification,
      document: fullDocumentUrl,
      photo: fullPhotoUrl
    };

    return res.json(response);
  } catch (err) {
    console.log('[CAREGIVER_VERIFICATION] POST / - Failed to create verification', { 
      error: err instanceof Error ? err.message : err,
      caregiverId 
    });
    return res.status(500).json({ error: 'Failed to create verification', details: err instanceof Error ? err.message : err });
  }
});

// Caregiver self-service: Update verification (with file uploads)
router.put('/', requireCaregiver, upload.fields([
  { name: 'document', maxCount: 1 },
  { name: 'photo', maxCount: 1 }
]), async (req: Request & { user?: any }, res: Response) => {
  console.log('[CAREGIVER_VERIFICATION] PUT / - Verification update request started', { 
    userId: req.user?.userId,
    caregiverId: req.user?.caregiverId,
    body: req.body,
    ip: req.ip
  });

  console.log('[CAREGIVER_VERIFICATION] PUT / - Validating request body');
  const parseResult = verificationSchema.safeParse(req.body);
  if (!parseResult.success) {
    console.log('[CAREGIVER_VERIFICATION] PUT / - Validation failed', { 
      errors: z.treeifyError(parseResult.error) 
    });
    return res.status(400).json({ error: 'Invalid input', details: z.treeifyError(parseResult.error) });
  }

  // Use the caregiver ID from JWT token
  const caregiverId = req.user?.caregiverId;
  if (!caregiverId) {
    console.log('[CAREGIVER_VERIFICATION] PUT / - No caregiver ID in token', { userId: req.user?.userId });
    return res.status(400).json({ error: 'Caregiver profile not found' });
  }

  console.log('[CAREGIVER_VERIFICATION] PUT / - Checking if verification exists');
  let verification = await getVerificationByCaregiverProfileId(caregiverId);
  
  const r = req as any;
  const updateData: any = {
    documentType: parseResult.data.documentType
  };

  // Handle file uploads if provided
  if (r.files) {
    if (r.files.document) {
      console.log('[CAREGIVER_VERIFICATION] PUT / - New document file uploaded', { 
        filename: r.files.document[0].filename,
        originalname: r.files.document[0].originalname,
        size: r.files.document[0].size,
        mimetype: r.files.document[0].mimetype
      });
      const { relativeUrl } = handleFileUpload(req, r.files.document[0]);
      updateData.document = relativeUrl;
    }
    
    if (r.files.photo) {
      console.log('[CAREGIVER_VERIFICATION] PUT / - New photo file uploaded', { 
        filename: r.files.photo[0].filename,
        originalname: r.files.photo[0].originalname,
        size: r.files.photo[0].size,
        mimetype: r.files.photo[0].mimetype
      });
      const { relativeUrl } = handleFileUpload(req, r.files.photo[0]);
      updateData.photo = relativeUrl;
    }
  }
  
  if (!verification) {
    console.log('[CAREGIVER_VERIFICATION] PUT / - Verification does not exist, creating new verification');
    // For creation, both files are required
    if (!r.files || !r.files.document || !r.files.photo) {
      console.log('[CAREGIVER_VERIFICATION] PUT / - Missing required files for creation', { 
        hasDocument: !!r.files?.document,
        hasPhoto: !!r.files?.photo
      });
      return res.status(400).json({ error: 'Both document and photo files are required for creation' });
    }
    
    try {
      console.log('[CAREGIVER_VERIFICATION] PUT / - Creating verification with data', { 
        caregiverProfileId: caregiverId,
        data: updateData 
      });
      verification = await createVerification(caregiverId, updateData);
      console.log('[CAREGIVER_VERIFICATION] PUT / - Verification created successfully', { 
        verificationId: verification.id,
        caregiverProfileId: verification.caregiverProfileId 
      });
    } catch (err) {
      console.log('[CAREGIVER_VERIFICATION] PUT / - Failed to create verification', { 
        error: err instanceof Error ? err.message : err,
        caregiverProfileId: caregiverId 
      });
      return res.status(500).json({ error: 'Failed to create verification', details: err instanceof Error ? err.message : err });
    }
  } else {
    console.log('[CAREGIVER_VERIFICATION] PUT / - Verification exists, updating');
    console.log('[CAREGIVER_VERIFICATION] PUT / - Updating verification with data', { 
      verificationId: verification.id,
      data: updateData 
    });
    try {
      verification = await updateVerification(caregiverId, updateData);
      console.log('[CAREGIVER_VERIFICATION] PUT / - Verification updated successfully', { 
        verificationId: verification.id,
        caregiverProfileId: verification.caregiverProfileId 
      });
    } catch (err) {
      console.log('[CAREGIVER_VERIFICATION] PUT / - Failed to update verification', { 
        error: err instanceof Error ? err.message : err,
        verificationId: verification.id 
      });
      return res.status(500).json({ error: 'Failed to update verification', details: err instanceof Error ? err.message : err });
    }
  }

  // Return the full URLs with host to the client
  const fullDocumentUrl = getPublicUrl(req, verification.document);
  const fullPhotoUrl = getPublicUrl(req, verification.photo);
  const response = {
    ...verification,
    document: fullDocumentUrl,
    photo: fullPhotoUrl
  };

  return res.json(response);
});

export default router; 