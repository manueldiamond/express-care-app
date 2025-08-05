import prisma from './prisma';
import { Role, User as PrismaUser } from '@prisma/client';

type User = PrismaUser;

export async function createUser(email: string, passwordHash: string, fullname: string, role: Role): Promise<User> {
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email, passwordHash, fullname, role },
    });

    // Depending on the role, create an empty patient or caregiver profile
    if (role === 'patient') {
      await tx.patient.create({
        data: {
          userId: user.id,
          condition: '', // required fields, set to empty string
          years: '',
          schedule: ''
        },
      });
    } else if (role === 'caregiver') {
      await tx.caregiverProfile.create({
        data: {
          userId: user.id,
        },
      });
    }

    return user;
  });
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return await prisma.user.findUnique({ where: { email } });
}

export async function getUserById(id: number): Promise<User | null> {
  return await prisma.user.findUnique({ where: { id } });
}

export async function getUserWithProfiles(userId: number) {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      caregiver: true,
      patient: true,
    },
  });
}

export async function updateUser(userId: number, data: Partial<Omit<User, 'dateOfBirth'>> & { dateOfBirth?: string }) {
  // Convert dateOfBirth string to Date if provided
  const updateData: any = { ...data };
  if (updateData.dateOfBirth && typeof updateData.dateOfBirth === 'string') {
    updateData.dateOfBirth = new Date(updateData.dateOfBirth);
  }
  
  return await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { 
      id: true, 
      email: true, 
      fullname: true, 
      role: true, 
      photoUrl: true, 
      contact: true, 
      dateOfBirth: true, 
      location: true 
    },
  });
}

export async function updateUserPhoto(userId: number, photoUrl: string) {
  return await prisma.user.update({
    where: { id: userId },
    data: { photoUrl },
  });
}

export async function getAllPatients() {
  return await prisma.user.findMany({ 
    where: { role: 'patient' },
    include: {
      patient: true,
    }
  });
}

export async function getAllCaregivers() {
  return await prisma.user.findMany({ 
    where: { role: 'caregiver' },
    include: {
      caregiver: true,
    }
  });
}

export async function getAllActiveCaregivers() {
  return await prisma.user.findMany({ 
    where: { 
      role: 'caregiver',
      caregiver: {
        isActive: true,
        isAvailable: true
      }
    },
    include: {
      caregiver: true,
    }
  });
}

export async function getAllVerifiedCaregivers() {
  return await prisma.user.findMany({ 
    where: { 
      role: 'caregiver',
      caregiver: {
        isVerified: true,
        isActive: true
      }
    },
    include: {
      caregiver: true,
    }
  });
} 