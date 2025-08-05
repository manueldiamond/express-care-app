import { z } from 'zod';
import { Role } from '@prisma/client';

export const updateProfileSchema = z.object({
  fullname: z.string().min(1).optional(),
  email: z.string().email().optional(),
  contact: z.string().optional(),
  dateOfBirth: z.iso.datetime().optional(),
  location: z.string().optional(),
  //photoUrl: z.string().url().optional(),
  //role: z.nativeEnum(Role).optional(),
});

export const updatePatientSchema = z.object({
  medicalHistory: z.string().optional(),
  condition: z.string().min(1, 'Condition is required'),
  years: z.string().min(1, 'Years with condition is required'),
  schedule: z.string().min(1, 'Care schedule is required'),
  description: z.string().optional(),
  special: z.string().optional(),
}).refine((data) => data.condition !== 'Other' || !!data.description, {
  message: 'Description is required for Other condition',
  path: ['description'],
});

export const updateCaregiverProfileSchema = z.object({
  type: z.string(),
  schedule: z.string(),
  bio: z.string().optional(),
  educationLevel: z.string().optional(),
});

export const verificationSchema = z.object({
  documentType: z.string().min(1, 'Document type is required'),
  //document: z.string().min(1, 'Document is required'),
  //photo: z.string().min(1, 'Photo is required'),
});

export const qualificationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  //fileURL: z.string().url('Valid file URL is required'),
});

export const updateQualificationSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  //fileURL: z.string().url('Valid file URL is required').optional(),
}); 