import prisma from './prisma';
import { Admin, AuditLog, AuditAction, User, CaregiverProfile, Patient, Assignment, Verification } from '@prisma/client';

export async function createAdmin(userId: number, permissions: string[] = []): Promise<Admin> {
  return await prisma.admin.create({
    data: {
      userId,
      permissions,
    },
  });
}

export async function getAdminByUserId(userId: number): Promise<Admin | null> {
  return await prisma.admin.findUnique({
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

export async function getAllAdmins() {
  return await prisma.admin.findMany({
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

export async function getAllUsersForAdmin() {
  return await prisma.user.findMany({
    include: {
      admin: true,
      caregiver: {
        include: {
          verification: true,
        },
      },
      patient: true,
    },
  });
}

export async function getUserByIdForAdmin(userId: number) {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      admin: true,
      caregiver: {
        include: {
          verification: true,
        },
      },
      patient: true,
    },
  });
}

export async function deleteUser(userId: number): Promise<User> {
  return await prisma.user.delete({
    where: { id: userId },
  });
}

export async function approveCaregiver(caregiverId: number, adminId: number): Promise<CaregiverProfile> {
  const updatedCaregiver = await prisma.caregiverProfile.update({
    where: { id: caregiverId },
    data: {
      isVerified: true,
      isActive: true,
    },
  });
  // Send notification to caregiver
  await prisma.notification.create({
    data: {
      userId: updatedCaregiver.userId,
      type: 'CAREGIVER_APPROVED',
      message: 'Your caregiver profile has been approved by an admin.',
    },
  });
  return updatedCaregiver;
}

export async function deactivateCaregiver(caregiverId: number, adminId: number): Promise<CaregiverProfile> {
  const updatedCaregiver = await prisma.caregiverProfile.update({
    where: { id: caregiverId },
    data: {
      isActive: false,
    },
  });
  // Send notification to caregiver
  await prisma.notification.create({
    data: {
      userId: updatedCaregiver.userId,
      type: 'CAREGIVER_REJECTED',
      message: 'Your caregiver profile has been rejected by an admin.',
    },
  });
  return updatedCaregiver;
}

export async function approveVerification(verificationId: number, adminId: number): Promise<Verification> {
  return await prisma.verification.update({
    where: { id: verificationId },
    data: {
      status: 'APPROVED',
      approvedBy: adminId,
      approvedAt: new Date(),
    },
  });
}

export async function rejectVerification(verificationId: number, adminId: number): Promise<Verification> {
  return await prisma.verification.update({
    where: { id: verificationId },
    data: {
      status: 'REJECTED',
      approvedBy: adminId,
      approvedAt: new Date(),
    },
  });
}

export async function getAllPatientsForAdmin() {
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

export async function getAllCaregiversForAdmin() {
  return await prisma.caregiverProfile.findMany({
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
      assignments: {
        include: {
          patient: {
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

export async function assignCaregiverToPatient(
  caregiverId: number, 
  patientId: number, 
  adminId: number, 
  notes?: string
): Promise<Assignment> {
  return await prisma.assignment.create({
    data: {
      caregiverId,
      patientId,
      assignedBy: adminId,
      notes,
    },
  });
}

export async function unassignCaregiverFromPatient(
  caregiverId: number, 
  patientId: number
): Promise<Assignment> {
  return await prisma.assignment.update({
    where: {
      patientId_caregiverId: {
        patientId,
        caregiverId,
      },
    },
    data: {
      status: 'cancelled',
    },
  });
}

export async function getAssignmentsByPatientId(patientId: number) {
  return await prisma.assignment.findMany({
    where: { patientId },
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
  });
}

export async function createAuditLog(
  adminId: number,
  action: AuditAction,
  targetUserId: number | null,
  details: any,
  ipAddress?: string,
  userAgent?: string
): Promise<AuditLog> {
  return await prisma.auditLog.create({
    data: {
      adminId,
      action,
      targetUserId,
      details: JSON.stringify(details),
      ipAddress,
      userAgent,
    },
  });
}

export async function getAuditLogs(adminId?: number, limit: number = 100) {
  const where = adminId ? { adminId } : {};
  return await prisma.auditLog.findMany({
    where,
    include: {
      admin: {
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
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function notifyVerificationStatus(verificationId: number, status: string) {
  const verification = await prisma.verification.findUnique({
    where: { id: verificationId },
    include: { caregiverProfile: true },
  });
  if (verification && verification.caregiverProfile) {
    await prisma.notification.create({
      data: {
        userId: verification.caregiverProfile.userId,
        type: `VERIFICATION_${status}`,
        message: `Your verification has been ${status.toLowerCase()} by an admin.`,
      },
    });
  }
}