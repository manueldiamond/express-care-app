import prisma from './prisma';
import { Patient } from '@prisma/client';

export async function getPatientByUserId(userId: number): Promise<Patient | null> {
  return await prisma.patient.findUnique({ 
    where: { userId } 
  });
}

export async function createPatient(userId: number, data: {
  condition: string;
  years: string;
  schedule: string;
  medicalHistory?: string;
  description?: string;
  special?: string;
}): Promise<Patient> {
  return await prisma.patient.create({
    data: {
      userId,
      ...data,
    },
  });
}

export async function updatePatient(userId: number, data: {
  condition?: string;
  years?: string;
  schedule?: string;
  medicalHistory?: string;
  description?: string;
  special?: string;
}): Promise<Patient> {
  return await prisma.patient.update({
    where: { userId },
    data,
  });
}

export async function getPatientWithUser(userId: number) {
  return await prisma.patient.findUnique({
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
    },
  });
}

export async function getPatientWithAssignments(patientId: number) {
  return await prisma.patient.findUnique({
    where: { id: patientId },
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
      assignments: {
        include: {
          caregiver: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  fullname: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function getAllPatientsWithAssignments() {
  return await prisma.patient.findMany({
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
      assignments: {
        include: {
          caregiver: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  fullname: true,
                },
              },
            },
          },
        },
      },
    },
  });
} 

export async function getPatientByIdWithUser(patientId: number) {
  return await prisma.patient.findUnique({
    where: { id: patientId },
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
    },
  });
} 