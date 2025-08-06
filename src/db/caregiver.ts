import prisma from './prisma';
import { CaregiverProfile, Verification } from '@prisma/client';

export async function getCaregiverByUserId(userId: number): Promise<CaregiverProfile | null> {
  return await prisma.caregiverProfile.findUnique({ 
    where: { userId } 
  });
}

export async function createCaregiver(userId: number, data: {
  type?: string;
  isVerified?: boolean;
  isActive?: boolean;
  isAvailable?: boolean;
  availability?: boolean;
  timeAvailable?: string;
  educationLevel?: string;
  skills?: string[];
}): Promise<CaregiverProfile> {
  return await prisma.caregiverProfile.create({
    data: {
      userId,
      ...data,
    },
  });
}

export async function updateCaregiver(userId: number, data: {
  type?: string;
  isVerified?: boolean;
  isActive?: boolean;
  isAvailable?: boolean;
  availability?: boolean;
  timeAvailable?: string;
  educationLevel?: string;
  skills?: string[];
}): Promise<CaregiverProfile> {
  return await prisma.caregiverProfile.update({
    where: { userId },
    data,
  });
}

export async function getCaregiverWithUser(userId: number) {
  return await prisma.caregiverProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullname: true,
          role: true,
          photoUrl: true,
          contact: true,
          dateOfBirth: true,
          location: true,
        },
      },
      verification: true,
    },
  });
}

export async function createVerification(caregiverProfileId: number, data: {
  documentType: string;
  document: string;
  photo: string;
}): Promise<Verification> {
  return await prisma.$transaction(async (tx) => {
    // Delete existing verification for this caregiver, if any
    await tx.verification.deleteMany({
      where: { caregiverProfileId },
    });
    // Create new verification
    return await tx.verification.create({
      data: {
        caregiverProfileId,
        ...data,
      },
    });
  });
}

export async function updateVerification(caregiverProfileId: number, data: {
  documentType?: string;
  document?: string;
  photo?: string;
}): Promise<Verification> {
  return await prisma.verification.update({
    where: { caregiverProfileId },
    data,
  });
}

export async function getVerificationByCaregiverProfileId(caregiverProfileId: number): Promise<Verification | null> {
  return await prisma.verification.findUnique({
    where: { caregiverProfileId },
  });
}

export async function getAllActiveCaregivers() {
  return await prisma.caregiverProfile.findMany({
    where: { 
      isActive: true,
      isAvailable: true 
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullname: true,
          role: true,
          photoUrl: true,
          contact: true,
          dateOfBirth: true,
          location: true,
        },
      },
      verification: true,
    },
  });
}

export async function getAllVerifiedCaregivers() {
  return await prisma.caregiverProfile.findMany({
    where: { 
      isVerified: true,
      isActive: true 
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullname: true,
          role: true,
          photoUrl: true,
          contact: true,
          dateOfBirth: true,
          location: true,
        },
      },
      verification: true,
    },
  });
}

export async function getFilteredCaregivers(
  search?: string,
  viewing: 'available' | 'all' = 'available',
  isAdmin: boolean = false,
  limit?: number
) {
  // Build where clause based on filters
  const where: any = {};
  
  // For non-admins, always filter out inactive caregivers
  if (!isAdmin) {
    where.isActive = true;
  }
  
  // Filter by availability if requested
  if (viewing === 'available') {
    where.isAvailable = true;
  }
  
  // Add search filter if provided
  if (search && search.trim()) {
    const searchTerm = search.trim().toLowerCase();
    where.OR = [
      {
        user: {
          fullname: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        }
      },
      {
        user: {
          email: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        }
      },
      {
        type: {
          contains: searchTerm,
          mode: 'insensitive'
        }
      },
      {
        educationLevel: {
          contains: searchTerm,
          mode: 'insensitive'
        }
      },
      {
        timeAvailable: {
          contains: searchTerm,
          mode: 'insensitive'
        }
      },
      {
        skills: {
          hasSome: [searchTerm]
        }
      },
      {
        user: {
          location: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        }
      }
    ];
  }

  return await prisma.caregiverProfile.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullname: true,
          role: true,
          photoUrl: true,
          contact: true,
          dateOfBirth: true,
          location: true,
        },
      },
      verification: true,
    },
    orderBy: {
      user: {
        fullname: 'asc'
      }
    },
    ...(limit && { take: limit })
  });
} 

export async function createQualification(caregiverProfileId: number, data: { title: string; fileURL: string }) {
  return await prisma.qualification.create({
    data: {
      caregiverProfileId,
      title: data.title,
      fileURL: data.fileURL,
    },
  });
}

export async function updateQualification(qualificationId: number, data: { title?: string; fileURL?: string }) {
  return await prisma.qualification.update({
    where: { id: qualificationId },
    data,
  });
}

export async function deleteQualification(qualificationId: number) {
  return await prisma.qualification.delete({
    where: { id: qualificationId },
  });
}

export async function getQualificationsByCaregiverProfileId(caregiverProfileId: number) {
  return await prisma.qualification.findMany({
    where: { caregiverProfileId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getQualificationById(qualificationId: number) {
  return await prisma.qualification.findUnique({
    where: { id: qualificationId },
  });
} 

export async function getCaregiverActiveStatus(caregiverId: number) {
  const caregiver = await prisma.caregiverProfile.findUnique({
    where: { id: caregiverId },
    select: { isActive: true }
  });
  return caregiver?.isActive || false;
}

export async function setCaregiverActiveStatus(caregiverId: number, isActive: boolean) {
  return await prisma.caregiverProfile.update({
    where: { id: caregiverId },
    data: { isActive }
  });
}