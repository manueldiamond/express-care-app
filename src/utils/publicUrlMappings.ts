import { getPublicUrl } from "../db";
import { AuditAction, CaregiverProfile, Patient, Qualification, User, Verification } from '@prisma/client';
import type { Request } from 'express';

export function mapUserWithPhoto(req: Request, user:any) {
  if (!user) return user;
  return {
    ...user,
    photoUrl: getPublicUrl(req, user.photoUrl),
  };
}
export function mapPatientWithPhoto(req: Request, patient:any) {
  if (!patient) return patient;
  return {
    ...patient,
    user: mapUserWithPhoto(req, patient.user),
  } as Patient
}

export function mapCaregiverWithPhoto(req: Request, caregiver:any) {
  if (!caregiver) return caregiver;
  return {
    ...caregiver,
    user: mapUserWithPhoto(req, caregiver.user),
    verification: mapVerificationWithPhoto(req, caregiver.verification),
    qualifications: caregiver?.qualifications?.map(q => mapQualificationWithPhoto(req, q)), 
  } as CaregiverProfile;
}

export function mapVerificationWithPhoto(req: Request, verification:any) {
  if (!verification) return verification;
  return {
    ...verification,
    document: getPublicUrl(req, verification.document),
    photo: getPublicUrl(req, verification.photo),
    caregiverProfile:mapCaregiverWithPhoto(req,verification.caregiverProfile)
  } as Verification
}

export function mapQualificationWithPhoto(req: Request, qualification:any) {
  if(!qualification) return qualification;
  return{
    ...qualification,
    fileURL:qualification.fileURL?getPublicUrl(req,qualification.fileURL):qualification.fileURL,
    caregiverProfile:mapCaregiverWithPhoto(req,qualification.caregiverProfile)
  } as Qualification
}