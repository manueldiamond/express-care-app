import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { createVerification, createQualification, updateCaregiver } from '../db/caregiver';
import { hashPassword, comparePassword } from '../utils/password';
import { signJWT, createJWTPayload } from '../utils/jwt';

const router = Router();

// Document types for verification
const documentTypes = [
  'National ID Card',
  'Driver\'s License',
  'Passport',
  'Voter ID Card',
  'NHIS Card',
  'Professional License'
];

// Qualification titles
const qualificationTitles = [
  'Nursing Certificate',
  'First Aid Certification',
  'CPR Training',
  'Medical Assistant Certificate',
  'Caregiver Training Certificate',
  'Elderly Care Certification',
  'Pediatric Care Training',
  'Dementia Care Certification',
  'Medication Administration Certificate',
  'Wound Care Training'
];

// Random file URLs for documents and photos
const documentUrls = [
  '/uploads/doc-1.jpg',
  '/uploads/doc-2.jpg',
];

const photoUrls = [
  '/uploads/caregiver-photo-1.jpg',
  '/uploads/caregiver-photo-2.jpg',
  '/uploads/caregiver-photo-3.jpg',
];

const qualificationFileUrls = [
  '/uploads/doc-3.jpg',
  '/uploads/doc-4.jpg',
];

function getRandomInArray(array: any[]) {
  return array[Math.floor(Math.random() * array.length)];
}

router.get('/setup-caregivers', async (req: Request, res: Response) => {
  console.log('[BULK_SETUP] GET /setup-caregivers - Starting bulk setup process');

  try {
    // Get all caregivers with @ghana.com emails
    const caregiversUsers = await prisma.user.findMany({
      where: {
        email: {
          contains: '@ghana.com'
        },
        role: 'caregiver'
      },
      include: {
        caregiver: true
      }
    });

    console.log(`[BULK_SETUP] Found ${caregiversUsers.length} caregivers with @ghana.com emails`);

    const results = {
      total: caregiversUsers.length,
      processed: 0,
      verificationsCreated: 0,
      qualificationsCreated: 0,
      errors: []
    };

    for (const user of caregiversUsers) {
      try {
        console.log(`[BULK_SETUP] Processing caregiver: ${user.fullname} (${user.email})`);

        results.processed++;

        console.log(`[BULK_SETUP] updating caregiver profile for: ${user.fullname}`);
        const caregiverProfile = await updateCaregiver(user.id, {
          type: getRandomInArray(['nurse', 'doctor', 'trained caregiver', 'individual']),
          schedule: getRandomInArray(['Full-time', 'week-days', 'week-ends', 'Emergency']),
          bio: 'Experienced caregiver with a passion for helping others.',
          educationLevel: getRandomInArray(['Primary', 'JHS', 'SHS', 'Tertiary']),
        });

        if (!caregiverProfile) {
          console.log(`[BULK_SETUP] No caregiver profile found for: ${user.fullname}`);
          results.errors.push(`No caregiver profile: ${user.email}`);
          continue;
        }

        // Create verification (randomly for 70% of caregivers)
        if (Math.random() < 0.7) {
          try {
            const verification = await createVerification(caregiverProfile.id, {
              documentType: getRandomInArray(documentTypes),
              document: getRandomInArray(documentUrls),
              photo: getRandomInArray(photoUrls)
            });
            console.log(`[BULK_SETUP] Created verification for: ${user.fullname}`);
            results.verificationsCreated++;
          } catch (error) {
            console.log(`[BULK_SETUP] Failed to create verification for ${user.fullname}:`, error);
            results.errors.push(`Verification failed: ${user.email}`);
          }
        }

        // Create qualifications (randomly for 60% of caregivers, 1-3 qualifications each)
        const numQualifications = Math.floor(Math.random() * 3) + 1; // 1-3 qualifications
        if (Math.random() < 0.6) {
          for (let i = 0; i < numQualifications; i++) {
            try {
              await createQualification(caregiverProfile.id, {
                title: getRandomInArray(qualificationTitles),
                fileURL: getRandomInArray(qualificationFileUrls)
              });
              results.qualificationsCreated++;
            } catch (error) {
              console.log(`[BULK_SETUP] Failed to create qualification for ${user.fullname}:`, error);
              results.errors.push(`Qualification failed: ${user.email}`);
            }
          }
          console.log(`[BULK_SETUP] Created ${numQualifications} qualifications for: ${user.fullname}`);
        }

      } catch (error) {
        console.log(`[BULK_SETUP] Error processing ${user.email}:`, error);
        results.errors.push(`Processing error: ${user.email}`);
      }
    }

    console.log(`[BULK_SETUP] Bulk setup completed`);
    console.log(`[BULK_SETUP] Results:`, results);

    res.json({
      message: 'Bulk setup completed',
      results
    });

  } catch (error) {
    console.error('[BULK_SETUP] Bulk setup failed:', error);
    res.status(500).json({
      error: 'Bulk setup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 
