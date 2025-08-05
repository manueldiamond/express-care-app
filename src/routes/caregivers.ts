import { Router, Request, Response } from 'express';
import { getFilteredCaregivers, createQualification, updateQualification, deleteQualification, getQualificationsByCaregiverProfileId, getQualificationById, createVerification, updateVerification, getVerificationByCaregiverProfileId } from '../db';
import { qualificationSchema, updateQualificationSchema, verificationSchema } from '../zod/profileSchemas';
import { getPublicUrl, upload, handleFileUpload } from '../db/storage';
import { z } from 'zod';

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

// Add qualification to caregiver (with file upload)
router.post('/:caregiverId/qualifications', upload.single('document'), async (req: Request & { user?: any }, res: Response) => {
  console.log('[CAREGIVERS] POST /:caregiverId/qualifications - Qualification creation request started', { 
    caregiverId: req.params.caregiverId,
    body: req.body,
    ip: req.ip
  });

  console.log('[CAREGIVERS] POST /:caregiverId/qualifications - Validating request body');
  const parseResult = qualificationSchema.safeParse(req.body);
  if (!parseResult.success) {
    console.log('[CAREGIVERS] POST /:caregiverId/qualifications - Validation failed', { 
      errors: z.treeifyError(parseResult.error) 
    });
    return res.status(400).json({ error: 'Invalid input', details: z.treeifyError(parseResult.error) });
  }

  const r = req as any;
  if (!r.file) {
    console.log('[CAREGIVERS] POST /:caregiverId/qualifications - No file uploaded');
    return res.status(400).json({ error: 'No document file uploaded' });
  }

  console.log('[CAREGIVERS] POST /:caregiverId/qualifications - File uploaded successfully', { 
    filename: r.file.filename,
    originalname: r.file.originalname,
    size: r.file.size,
    mimetype: r.file.mimetype
  });

  const caregiverId = parseInt(req.params.caregiverId);
  if (isNaN(caregiverId)) {
    console.log('[CAREGIVERS] POST /:caregiverId/qualifications - Invalid caregiver ID', { caregiverId: req.params.caregiverId });
    return res.status(400).json({ error: 'Invalid caregiver ID' });
  }

  // Use helper function to handle file upload
  const { relativeUrl, publicUrl } = handleFileUpload(req, r.file);
  console.log('[CAREGIVERS] POST /:caregiverId/qualifications - Creating qualification with file URL', { 
    caregiverId,
    title: parseResult.data.title,
    fileURL: relativeUrl 
  });

  try {
    const qualification = await createQualification(caregiverId, {
      title: parseResult.data.title,
      fileURL: relativeUrl
    });
    console.log('[CAREGIVERS] POST /:caregiverId/qualifications - Qualification created successfully', { 
      qualificationId: qualification.id,
      caregiverProfileId: qualification.caregiverProfileId 
    });

    // Return the qualification with public URL
    const response = {
      ...qualification,
      fileURL: publicUrl
    };

    return res.json(response);
  } catch (err) {
    console.log('[CAREGIVERS] POST /:caregiverId/qualifications - Failed to create qualification', { 
      error: err instanceof Error ? err.message : err,
      caregiverId 
    });
    return res.status(500).json({ error: 'Failed to create qualification', details: err instanceof Error ? err.message : err });
  }
});



// Delete qualification (admin only)
router.delete('/:caregiverId/qualifications/:qualificationId', async (req: Request & { user?: any }, res: Response) => {
  console.log('[CAREGIVERS] DELETE /:caregiverId/qualifications/:qualificationId - Qualification deletion request started', { 
    caregiverId: req.params.caregiverId,
    qualificationId: req.params.qualificationId,
    ip: req.ip
  });

  const caregiverId = parseInt(req.params.caregiverId);
  const qualificationId = parseInt(req.params.qualificationId);
  
  if (isNaN(caregiverId) || isNaN(qualificationId)) {
    console.log('[CAREGIVERS] DELETE /:caregiverId/qualifications/:qualificationId - Invalid IDs', { 
      caregiverId: req.params.caregiverId,
      qualificationId: req.params.qualificationId 
    });
    return res.status(400).json({ error: 'Invalid caregiver or qualification ID' });
  }

  console.log('[CAREGIVERS] DELETE /:caregiverId/qualifications/:qualificationId - Checking if qualification exists and belongs to caregiver');
  const qualification = await getQualificationById(qualificationId);
  if (!qualification) {
    console.log('[CAREGIVERS] DELETE /:caregiverId/qualifications/:qualificationId - Qualification not found', { qualificationId });
    return res.status(404).json({ error: 'Qualification not found' });
  }

  if (qualification.caregiverProfileId !== caregiverId) {
    console.log('[CAREGIVERS] DELETE /:caregiverId/qualifications/:qualificationId - Qualification does not belong to caregiver', { 
      qualificationId,
      qualificationCaregiverId: qualification.caregiverProfileId,
      requestedCaregiverId: caregiverId 
    });
    return res.status(403).json({ error: 'Qualification does not belong to this caregiver' });
  }

  console.log('[CAREGIVERS] DELETE /:caregiverId/qualifications/:qualificationId - Deleting qualification');
  try {
    await deleteQualification(qualificationId);
    console.log('[CAREGIVERS] DELETE /:caregiverId/qualifications/:qualificationId - Qualification deleted successfully', { qualificationId });
    return res.json({ message: 'Qualification deleted successfully' });
  } catch (err) {
    console.log('[CAREGIVERS] DELETE /:caregiverId/qualifications/:qualificationId - Failed to delete qualification', { 
      error: err instanceof Error ? err.message : err,
      qualificationId 
    });
    return res.status(500).json({ error: 'Failed to delete qualification', details: err instanceof Error ? err.message : err });
  }
});

// Get qualifications for a caregiver
router.get('/:caregiverId/qualifications', async (req: Request & { user?: any }, res: Response) => {
  console.log('[CAREGIVERS] GET /:caregiverId/qualifications - Qualifications request started', { 
    caregiverId: req.params.caregiverId,
    ip: req.ip
  });

  const caregiverId = parseInt(req.params.caregiverId);
  if (isNaN(caregiverId)) {
    console.log('[CAREGIVERS] GET /:caregiverId/qualifications - Invalid caregiver ID', { caregiverId: req.params.caregiverId });
    return res.status(400).json({ error: 'Invalid caregiver ID' });
  }

  console.log('[CAREGIVERS] GET /:caregiverId/qualifications - Fetching qualifications');
  try {
    const qualifications = await getQualificationsByCaregiverProfileId(caregiverId);
    console.log('[CAREGIVERS] GET /:caregiverId/qualifications - Qualifications retrieved successfully', { 
      count: qualifications.length,
      caregiverProfileId: caregiverId 
    });

    // Convert relative URLs to public URLs
    const qualificationsWithPublicUrls = qualifications.map(qualification => ({
      ...qualification,
      fileURL: getPublicUrl(req, qualification.fileURL)
    }));

    return res.json(qualificationsWithPublicUrls);
  } catch (err) {
    console.log('[CAREGIVERS] GET /:caregiverId/qualifications - Failed to fetch qualifications', { 
      error: err instanceof Error ? err.message : err,
      caregiverProfileId: caregiverId 
    });
    return res.status(500).json({ error: 'Failed to fetch qualifications', details: err instanceof Error ? err.message : err });
  }
});

// Add verification document and photo (with file uploads)
router.post('/:caregiverId/verification', upload.fields([
  { name: 'document', maxCount: 1 },
  { name: 'photo', maxCount: 1 }
]), async (req: Request & { user?: any }, res: Response) => {
  console.log('[CAREGIVERS] POST /:caregiverId/verification - Verification creation request started', { 
    caregiverId: req.params.caregiverId,
    body: req.body,
    ip: req.ip
  });

  console.log('[CAREGIVERS] POST /:caregiverId/verification - Validating request body');
  const parseResult = verificationSchema.safeParse(req.body);
  if (!parseResult.success) {
    console.log('[CAREGIVERS] POST /:caregiverId/verification - Validation failed', { 
      errors: z.treeifyError(parseResult.error) 
    });
    return res.status(400).json({ error: 'Invalid input', details: z.treeifyError(parseResult.error) });
  }

  const r = req as any;
  if (!r.files || !r.files.document || !r.files.photo) {
    console.log('[CAREGIVERS] POST /:caregiverId/verification - Missing required files', { 
      hasDocument: !!r.files?.document,
      hasPhoto: !!r.files?.photo
    });
    return res.status(400).json({ error: 'Both document and photo files are required' });
  }

  console.log('[CAREGIVERS] POST /:caregiverId/verification - Files uploaded successfully', { 
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

  const caregiverId = parseInt(req.params.caregiverId);
  if (isNaN(caregiverId)) {
    console.log('[CAREGIVERS] POST /:caregiverId/verification - Invalid caregiver ID', { caregiverId: req.params.caregiverId });
    return res.status(400).json({ error: 'Invalid caregiver ID' });
  }

  // Use helper function to handle file uploads
  const { relativeUrl: relativeDocumentUrl, publicUrl: fullDocumentUrl } = handleFileUpload(req, r.files.document[0]);
  const { relativeUrl: relativePhotoUrl, publicUrl: fullPhotoUrl } = handleFileUpload(req, r.files.photo[0]);
  
  console.log('[CAREGIVERS] POST /:caregiverId/verification - Creating verification with file URLs', { 
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
    console.log('[CAREGIVERS] POST /:caregiverId/verification - Verification created successfully', { 
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
    console.log('[CAREGIVERS] POST /:caregiverId/verification - Failed to create verification', { 
      error: err instanceof Error ? err.message : err,
      caregiverId 
    });
    return res.status(500).json({ error: 'Failed to create verification', details: err instanceof Error ? err.message : err });
  }
});

// Update verification document and photo (with file uploads)
router.put('/:caregiverId/verification', upload.fields([
  { name: 'document', maxCount: 1 },
  { name: 'photo', maxCount: 1 }
]), async (req: Request & { user?: any }, res: Response) => {
  console.log('[CAREGIVERS] PUT /:caregiverId/verification - Verification update request started', { 
    caregiverId: req.params.caregiverId,
    body: req.body,
    ip: req.ip
  });

  console.log('[CAREGIVERS] PUT /:caregiverId/verification - Validating request body');
  const parseResult = verificationSchema.safeParse(req.body);
  if (!parseResult.success) {
    console.log('[CAREGIVERS] PUT /:caregiverId/verification - Validation failed', { 
      errors: z.treeifyError(parseResult.error) 
    });
    return res.status(400).json({ error: 'Invalid input', details: z.treeifyError(parseResult.error) });
  }

  const caregiverId = parseInt(req.params.caregiverId);
  if (isNaN(caregiverId)) {
    console.log('[CAREGIVERS] PUT /:caregiverId/verification - Invalid caregiver ID', { caregiverId: req.params.caregiverId });
    return res.status(400).json({ error: 'Invalid caregiver ID' });
  }

  console.log('[CAREGIVERS] PUT /:caregiverId/verification - Checking if verification exists');
  let verification = await getVerificationByCaregiverProfileId(caregiverId);
  
  const r = req as any;
  const updateData: any = {
    documentType: parseResult.data.documentType
  };

  // Handle file uploads if provided
  if (r.files) {
    if (r.files.document) {
      console.log('[CAREGIVERS] PUT /:caregiverId/verification - New document file uploaded', { 
        filename: r.files.document[0].filename,
        originalname: r.files.document[0].originalname,
        size: r.files.document[0].size,
        mimetype: r.files.document[0].mimetype
      });
      updateData.document = `/uploads/${r.files.document[0].filename}`;
    }
    
    if (r.files.photo) {
      console.log('[CAREGIVERS] PUT /:caregiverId/verification - New photo file uploaded', { 
        filename: r.files.photo[0].filename,
        originalname: r.files.photo[0].originalname,
        size: r.files.photo[0].size,
        mimetype: r.files.photo[0].mimetype
      });
      updateData.photo = `/uploads/${r.files.photo[0].filename}`;
    }
  }
  
  if (!verification) {
    console.log('[CAREGIVERS] PUT /:caregiverId/verification - Verification does not exist, creating new verification');
    // For creation, both files are required
    if (!r.files || !r.files.document || !r.files.photo) {
      console.log('[CAREGIVERS] PUT /:caregiverId/verification - Missing required files for creation', { 
        hasDocument: !!r.files?.document,
        hasPhoto: !!r.files?.photo
      });
      return res.status(400).json({ error: 'Both document and photo files are required for creation' });
    }
    
    try {
      console.log('[CAREGIVERS] PUT /:caregiverId/verification - Creating verification with data', { 
        caregiverProfileId: caregiverId,
        data: updateData 
      });
      verification = await createVerification(caregiverId, updateData);
      console.log('[CAREGIVERS] PUT /:caregiverId/verification - Verification created successfully', { 
        verificationId: verification.id,
        caregiverProfileId: verification.caregiverProfileId 
      });
    } catch (err) {
      console.log('[CAREGIVERS] PUT /:caregiverId/verification - Failed to create verification', { 
        error: err instanceof Error ? err.message : err,
        caregiverProfileId: caregiverId 
      });
      return res.status(500).json({ error: 'Failed to create verification', details: err instanceof Error ? err.message : err });
    }
  } else {
    console.log('[CAREGIVERS] PUT /:caregiverId/verification - Verification exists, updating');
    console.log('[CAREGIVERS] PUT /:caregiverId/verification - Updating verification with data', { 
      verificationId: verification.id,
      data: updateData 
    });
    try {
      verification = await updateVerification(caregiverId, updateData);
      console.log('[CAREGIVERS] PUT /:caregiverId/verification - Verification updated successfully', { 
        verificationId: verification.id,
        caregiverProfileId: verification.caregiverProfileId 
      });
    } catch (err) {
      console.log('[CAREGIVERS] PUT /:caregiverId/verification - Failed to update verification', { 
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

// Get verification for a caregiver
router.get('/:caregiverId/verification', async (req: Request & { user?: any }, res: Response) => {
  console.log('[CAREGIVERS] GET /:caregiverId/verification - Verification request started', { 
    caregiverId: req.params.caregiverId,
    ip: req.ip
  });

  const caregiverId = parseInt(req.params.caregiverId);
  if (isNaN(caregiverId)) {
    console.log('[CAREGIVERS] GET /:caregiverId/verification - Invalid caregiver ID', { caregiverId: req.params.caregiverId });
    return res.status(400).json({ error: 'Invalid caregiver ID' });
  }

  console.log('[CAREGIVERS] GET /:caregiverId/verification - Fetching verification');
  try {
    const verification = await getVerificationByCaregiverProfileId(caregiverId);
    
    if (!verification) {
      console.log('[CAREGIVERS] GET /:caregiverId/verification - Verification not found', { caregiverId });
      return res.json({ verification: null });
    }

    console.log('[CAREGIVERS] GET /:caregiverId/verification - Verification retrieved successfully', { 
      verificationId: verification.id,
      caregiverProfileId: verification.caregiverProfileId 
    });

    // Convert relative URLs to public URLs
    const fullDocumentUrl = getPublicUrl(req, verification.document);
    const fullPhotoUrl = getPublicUrl(req, verification.photo);
    const response = {
      ...verification,
      document: fullDocumentUrl,
      photo: fullPhotoUrl
    };

    return res.json({ verification: response });
  } catch (err) {
    console.log('[CAREGIVERS] GET /:caregiverId/verification - Failed to fetch verification', { 
      error: err instanceof Error ? err.message : err,
      caregiverProfileId: caregiverId 
    });
    return res.status(500).json({ error: 'Failed to fetch verification', details: err instanceof Error ? err.message : err });
  }
});

export default router; 