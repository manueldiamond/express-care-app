import { sendNotification } from '../socket/notifications';
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

export async function getAllUsersForAdmin({
  page = 1,
  limit = 10,
  search = '',
  role = 'all',
  status = 'all',
}: {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'all' | 'admin' | 'caregiver' | 'patient';
  status?: 'all' | 'active' | 'inactive';
}) {
  const skip = (page - 1) * limit;

  const where: any = {};

  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { fullname: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (role !== 'all') {
    where.role = role;
  }

  if (status !== 'all') {
    if (role === 'caregiver') {
      where.caregiver = { isActive: status === 'active' };
    } else if (role === 'patient') {
      where.patient = { isActive: status === 'active' };
    } else {
      where.isActive = status === 'active';
    }
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { id: 'desc' },
      /*include: {
        //admin: true,
        caregiver: {
          include: {
            verification: true,
          },
        },
        patient: true,
      },*/
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
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
    omit:{passwordHash:true}
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
      isAvailable:true,
    },
  });
  // Send notification to caregiver
  await sendNotification    (updatedCaregiver.userId, "CAREGIVER_APPROVED", "Your caregiver profile has been approved by an admin.");
  return updatedCaregiver;
}

export async function deactivateCaregiver(caregiverId: number, adminId: number): Promise<CaregiverProfile> {
  const updatedCaregiver = await prisma.caregiverProfile.update({
    where: { id: caregiverId },
    data: {
      isActive: false,
      isAvailable:false,
    },
  });
  // Send notification to caregiver
  await sendNotification(updatedCaregiver.userId, "CAREGIVER_REJECTED", "Your caregiver profile has been rejected by an admin.");
  return updatedCaregiver;
}

export async function approveVerification(verificationId: number, adminId: number): Promise<Verification> {
  const updatedVerification = await prisma.verification.update({
    where: { id: verificationId },
    data: {
      status: 'APPROVED',
      approvedBy: adminId,
      approvedAt: new Date(),
    },
  });
  await sendNotification(updatedVerification.caregiverProfileId, "VERIFICATION_APPROVED", "Your Identity has been verified by an admin.");
  return updatedVerification;
}

export async function rejectVerification(verificationId: number, adminId: number): Promise<Verification> {
  const updatedVerification = await prisma.verification.update({
    where: { id: verificationId },
    data: {
      status: 'REJECTED',
      approvedBy: adminId,
      approvedAt: new Date(),
    },
  });
  await sendNotification(updatedVerification.caregiverProfileId, "VERIFICATION_REJECTED", "Your verification documents were rejected. Please retry verification or contact support");
  return updatedVerification;
}

export async function getAllPatientsForAdmin({
  page = 1,
  limit = 10,
  search = '',
  status = 'all',
}: {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'all' | 'active' | 'inactive';
}) {
  const skip = (page - 1) * limit;
  const where: any = {};

  if (search) {
    where.OR = [
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { user: { fullname: { contains: search, mode: 'insensitive' } } },
    ];
  }
  if (status !== 'all') {
    where.isActive = status === 'active';
  }

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      skip,
      take: limit,
      orderBy: { id: 'desc' },
      include: {
        user: true,
        assignments: true,
      },
    }),
    prisma.patient.count({ where }),
  ]);

  return {
    patients,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getAllCaregiversForAdmin({
  page = 1,
  limit = 10,
  search = '',
  status = 'all',
}: {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'all' | 'active' | 'inactive';
}) {
  const skip = (page - 1) * limit;
  const where: any = {};

  if (search) {
    where.OR = [
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { user: { fullname: { contains: search, mode: 'insensitive' } } },
    ];
  }
  if (status !== 'all') {
    where.isActive = status === 'active';
  }

  const caregivers = await prisma.caregiverProfile.findMany({
      where,
      skip,
      take: limit,
      orderBy: { id: 'desc' },
      include: {
        user: true,
        verification: true,
        assignments: true,
      },
    });
 
  const total = caregivers?.length||0

  return {
    caregivers,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
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
              passwordHash:false,
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
              passwordHash:false,
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

export async function getCaregiverById(caregiverId: number) {
  return await prisma.caregiverProfile.findUnique({
    where: { id: caregiverId },
    include: {
      user:{omit:{passwordHash:true}},
      verification: true,
      qualifications:true,
      assignments: true,
    },
  });
}

export async function getPatientById(patientId: number) {
  return await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      user:{omit:{passwordHash:true}},
      assignments: true,
    },
  });
}

export async function getAllAssignments() {
  return await prisma.assignment.findMany({
    include: {
      caregiver: {
        include: { user: true },
      },
      patient: {
        include: { user: true },
      },
    },
  });
}

export async function getAllVerifications({
  page = 1,
  limit = 10,
  search = '',
  type = 'all',
  status = 'all',
}: {
  page?: number;
  limit?: number;
  search?: string;
  type?: 'all' | string;
  status?: 'all' | string;
}) {
  const skip = (page - 1) * limit;

  const where: any = {};

  if (search) {
    where.OR = [
      { 
        caregiverProfile: {
          user: {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { fullname: { contains: search, mode: 'insensitive' } },
            ]
          }
        }
      },
    ];
  }

  if (type !== 'all') {
    where.type = type;
  }

  if (status !== 'all') {
    where.status = status;
  }

  const [verifications, total] = await Promise.all([
    prisma.verification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { id: 'desc' },
      include: {
        caregiverProfile: {
          include: { user: {omit: {passwordHash: true}} },
        },
      },
    }),
    prisma.verification.count({ where }),
  ]);

  return {
    verifications,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getDashboardStats() {
  const totalUsers = await prisma.user.count();
  const totalCaregivers = await prisma.caregiverProfile.count();
  const totalPatients = await prisma.patient.count();
  const activeAssignments = await prisma.assignment.count({ where: { status: 'active' } });
  const pendingVerifications = await prisma.verification.count({ where: { status: 'PENDING' } });
  const completedAssignments = await prisma.assignment.count({ where: { status: 'completed' } });

  return {
    totalUsers,
    totalCaregivers,
    totalPatients,
    activeAssignments,
    pendingVerifications,
    completedAssignments,
  };
}


export async function getReports() {
  // Placeholder: implement custom reporting logic as needed
  return [{ message: 'Reports endpoint not implemented yet.' }];
}