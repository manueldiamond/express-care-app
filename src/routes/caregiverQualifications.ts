import { Router, Request, Response } from 'express';
import { createQualification, updateQualification, deleteQualification, getQualificationsByCaregiverProfileId, getQualificationById } from '../db';
import { qualificationSchema, updateQualificationSchema } from '../zod/profileSchemas';
import { getPublicUrl, upload, handleFileUpload } from '../db/storage';
import { requireCaregiver } from '../middleware/requireRole';
import { z } from 'zod';

const router = Router();

// Public/admin: Get qualifications for a caregiver by ID
router.get('/:caregiverId', async (req: Request, res: Response) => {
  console.log('[CAREGIVER_QUALIFICATIONS] GET /:caregiverId - Request started', {
    caregiverIdParam: req.params.caregiverId,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  const caregiverId = parseInt(req.params.caregiverId);
  console.log('[CAREGIVER_QUALIFICATIONS] GET /:caregiverId - Parsed caregiverId', { caregiverId });

  if (isNaN(caregiverId)) {
    console.log('[CAREGIVER_QUALIFICATIONS] GET /:caregiverId - Invalid caregiver ID', { caregiverIdParam: req.params.caregiverId });
    return res.status(400).json({ error: 'Invalid caregiver ID' });
  }

  try {
    console.log('[CAREGIVER_QUALIFICATIONS] GET /:caregiverId - Fetching qualifications from DB', { caregiverId });
    const qualifications = await getQualificationsByCaregiverProfileId(caregiverId);

    console.log('[CAREGIVER_QUALIFICATIONS] GET /:caregiverId - Mapping qualifications to include public URLs', { count: qualifications.length });
    const qualificationsWithPublicUrls = qualifications.map(qualification => {
      const publicUrl = getPublicUrl(req, qualification.fileURL);
      console.log('[CAREGIVER_QUALIFICATIONS] GET /:caregiverId - Generated public URL for qualification', { qualificationId: qualification.id, publicUrl });
      return {
        ...qualification,
        fileURL: publicUrl
      };
    });

    console.log('[CAREGIVER_QUALIFICATIONS] GET /:caregiverId - Returning qualifications', { count: qualificationsWithPublicUrls.length });
    return res.json(qualificationsWithPublicUrls);
  } catch (err) {
    console.log('[CAREGIVER_QUALIFICATIONS] GET /:caregiverId - Failed to fetch qualifications', {
      error: err instanceof Error ? err.message : err,
      caregiverId
    });
    return res.status(500).json({ error: 'Failed to fetch qualifications', details: err instanceof Error ? err.message : err });
  }
});

// Caregiver self-service: Add qualification (with file upload)
router.post('/', requireCaregiver, upload.single('document'), async (req: Request & { user?: any }, res: Response) => {
  console.log('[CAREGIVER_QUALIFICATIONS] POST / - Qualification creation request started', { 
    userId: req.user?.userId,
    caregiverId: req.user?.caregiverId,
    body: req.body,
    ip: req.ip
  });

  console.log('[CAREGIVER_QUALIFICATIONS] POST / - Validating request body');
  const parseResult = qualificationSchema.safeParse(req.body);
  if (!parseResult.success) {
    console.log('[CAREGIVER_QUALIFICATIONS] POST / - Validation failed', { 
      errors: z.treeifyError(parseResult.error) 
    });
    return res.status(400).json({ error: 'Invalid input', details: z.treeifyError(parseResult.error) });
  }

  const r = req as any;
  if (!r.file) {
    console.log('[CAREGIVER_QUALIFICATIONS] POST / - No file uploaded');
    return res.status(400).json({ error: 'No document file uploaded' });
  }

  console.log('[CAREGIVER_QUALIFICATIONS] POST / - File uploaded successfully', { 
    filename: r.file.filename,
    originalname: r.file.originalname,
    size: r.file.size,
    mimetype: r.file.mimetype
  });

  // Use the caregiver ID from JWT token
  const caregiverId = req.user?.caregiverId;
  if (!caregiverId) {
    console.log('[CAREGIVER_QUALIFICATIONS] POST / - No caregiver ID in token', { userId: req.user?.userId });
    return res.status(400).json({ error: 'Caregiver profile not found' });
  }

  // Use helper function to handle file upload
  const { relativeUrl, publicUrl } = handleFileUpload(req, r.file);
  console.log('[CAREGIVER_QUALIFICATIONS] POST / - Creating qualification with file URL', { 
    caregiverId,
    title: parseResult.data.title,
    fileURL: relativeUrl 
  });

  try {
    const qualification = await createQualification(caregiverId, {
      title: parseResult.data.title,
      fileURL: relativeUrl
    });
    console.log('[CAREGIVER_QUALIFICATIONS] POST / - Qualification created successfully', { 
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
    console.log('[CAREGIVER_QUALIFICATIONS] POST / - Failed to create qualification', { 
      error: err instanceof Error ? err.message : err,
      caregiverId 
    });
    return res.status(500).json({ error: 'Failed to create qualification', details: err instanceof Error ? err.message : err });
  }
});

// Caregiver self-service: Update qualification (with file upload)
router.put('/:qualificationId', requireCaregiver, upload.single('document'), async (req: Request & { user?: any }, res: Response) => {
  console.log('[CAREGIVER_QUALIFICATIONS] PUT /:qualificationId - Qualification update request started', { 
    userId: req.user?.userId,
    caregiverId: req.user?.caregiverId,
    qualificationId: req.params.qualificationId,
    body: req.body,
    ip: req.ip
  });

  console.log('[CAREGIVER_QUALIFICATIONS] PUT /:qualificationId - Validating request body');
  const parseResult = updateQualificationSchema.safeParse(req.body);
  if (!parseResult.success) {
    console.log('[CAREGIVER_QUALIFICATIONS] PUT /:qualificationId - Validation failed', { 
      errors: z.treeifyError(parseResult.error) 
    });
    return res.status(400).json({ error: 'Invalid input', details: z.treeifyError(parseResult.error) });
  }

  const qualificationId = parseInt(req.params.qualificationId);
  if (isNaN(qualificationId)) {
    console.log('[CAREGIVER_QUALIFICATIONS] PUT /:qualificationId - Invalid qualification ID', { qualificationId: req.params.qualificationId });
    return res.status(400).json({ error: 'Invalid qualification ID' });
  }

  // Use the caregiver ID from JWT token
  const caregiverId = req.user?.caregiverId;
  if (!caregiverId) {
    console.log('[CAREGIVER_QUALIFICATIONS] PUT /:qualificationId - No caregiver ID in token', { userId: req.user?.userId });
    return res.status(400).json({ error: 'Caregiver profile not found' });
  }

  console.log('[CAREGIVER_QUALIFICATIONS] PUT /:qualificationId - Checking if qualification exists and belongs to caregiver');
  const qualification = await getQualificationById(qualificationId);
  if (!qualification) {
    console.log('[CAREGIVER_QUALIFICATIONS] PUT /:qualificationId - Qualification not found', { qualificationId });
    return res.status(404).json({ error: 'Qualification not found' });
  }

  if (qualification.caregiverProfileId !== caregiverId) {
    console.log('[CAREGIVER_QUALIFICATIONS] PUT /:qualificationId - Qualification does not belong to caregiver', { 
      qualificationId,
      qualificationCaregiverId: qualification.caregiverProfileId,
      requestedCaregiverId: caregiverId 
    });
    return res.status(403).json({ error: 'Qualification does not belong to this caregiver' });
  }

  const r = req as any;
  const updateData: any = {
    title: parseResult.data.title
  };

  // If a new file was uploaded, update the file URL
  if (r.file) {
    console.log('[CAREGIVER_QUALIFICATIONS] PUT /:qualificationId - New file uploaded', { 
      filename: r.file.filename,
      originalname: r.file.originalname,
      size: r.file.size,
      mimetype: r.file.mimetype
    });
    const { relativeUrl } = handleFileUpload(req, r.file);
    updateData.fileURL = relativeUrl;
  }

  console.log('[CAREGIVER_QUALIFICATIONS] PUT /:qualificationId - Updating qualification');
  try {
    const updatedQualification = await updateQualification(qualificationId, updateData);
    console.log('[CAREGIVER_QUALIFICATIONS] PUT /:qualificationId - Qualification updated successfully', { 
      qualificationId: updatedQualification.id,
      caregiverProfileId: updatedQualification.caregiverProfileId 
    });

    // Return the qualification with public URL
    const publicUrl = getPublicUrl(req, updatedQualification.fileURL);
    const response = {
      ...updatedQualification,
      fileURL: publicUrl
    };

    return res.json(response);
  } catch (err) {
    console.log('[CAREGIVER_QUALIFICATIONS] PUT /:qualificationId - Failed to update qualification', { 
      error: err instanceof Error ? err.message : err,
      qualificationId 
    });
    return res.status(500).json({ error: 'Failed to update qualification', details: err instanceof Error ? err.message : err });
  }
});

// Caregiver self-service: Delete qualification
router.delete('/:qualificationId', requireCaregiver, async (req: Request & { user?: any }, res: Response) => {
  console.log('[CAREGIVER_QUALIFICATIONS] DELETE /:qualificationId - Qualification deletion request started', { 
    userId: req.user?.userId,
    caregiverId: req.user?.caregiverId,
    qualificationId: req.params.qualificationId,
    ip: req.ip
  });

  const qualificationId = parseInt(req.params.qualificationId);
  if (isNaN(qualificationId)) {
    console.log('[CAREGIVER_QUALIFICATIONS] DELETE /:qualificationId - Invalid qualification ID', { qualificationId: req.params.qualificationId });
    return res.status(400).json({ error: 'Invalid qualification ID' });
  }

  // Use the caregiver ID from JWT token
  const caregiverId = req.user?.caregiverId;
  if (!caregiverId) {
    console.log('[CAREGIVER_QUALIFICATIONS] DELETE /:qualificationId - No caregiver ID in token', { userId: req.user?.userId });
    return res.status(400).json({ error: 'Caregiver profile not found' });
  }

  console.log('[CAREGIVER_QUALIFICATIONS] DELETE /:qualificationId - Checking if qualification exists and belongs to caregiver');
  const qualification = await getQualificationById(qualificationId);
  if (!qualification) {
    console.log('[CAREGIVER_QUALIFICATIONS] DELETE /:qualificationId - Qualification not found', { qualificationId });
    return res.status(404).json({ error: 'Qualification not found' });
  }

  if (qualification.caregiverProfileId !== caregiverId) {
    console.log('[CAREGIVER_QUALIFICATIONS] DELETE /:qualificationId - Qualification does not belong to caregiver', { 
      qualificationId,
      qualificationCaregiverId: qualification.caregiverProfileId,
      requestedCaregiverId: caregiverId 
    });
    return res.status(403).json({ error: 'Qualification does not belong to this caregiver' });
  }

  console.log('[CAREGIVER_QUALIFICATIONS] DELETE /:qualificationId - Deleting qualification');
  try {
    await deleteQualification(qualificationId);
    console.log('[CAREGIVER_QUALIFICATIONS] DELETE /:qualificationId - Qualification deleted successfully', { qualificationId });
    return res.json({ message: 'Qualification deleted successfully' });
  } catch (err) {
    console.log('[CAREGIVER_QUALIFICATIONS] DELETE /:qualificationId - Failed to delete qualification', { 
      error: err instanceof Error ? err.message : err,
      qualificationId 
    });
    return res.status(500).json({ error: 'Failed to delete qualification', details: err instanceof Error ? err.message : err });
  }
});

export default router; 