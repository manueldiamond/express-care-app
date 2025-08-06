import { Router, Request, Response } from 'express';
import { requireAdmin } from '../middleware/requireRole';
import { 
  getAllUsersForAdmin,
  getUserByIdForAdmin,
  deleteUser,
  approveCaregiver,
  deactivateCaregiver,
  approveVerification,
  rejectVerification,
  getAllPatientsForAdmin,
  getAllCaregiversForAdmin,
  assignCaregiverToPatient,
  unassignCaregiverFromPatient,
  getAssignmentsByPatientId,
  createAuditLog,
  getAuditLogs,
  createAdmin,
  getAllAdmins,
  getCaregiverById,
  getPatientById,
  getAllAssignments,
  getAllVerifications,
  getDashboardStats,
  getReports
} from '../db/admin';
import { getFilteredCaregivers } from '../db/caregiver';
import { createUser } from '../db/user';
import { AuditAction, CaregiverProfile, Patient, Qualification, User, Verification } from '@prisma/client';
import { z } from 'zod';
import { sendNotification } from '../socket/notifications';
import { prisma } from '../db';
import { getPublicUrl } from '../db/storage';

import {
  mapCaregiverWithPhoto,
  mapPatientWithPhoto,
  mapQualificationWithPhoto,
  mapUserWithPhoto,
  mapVerificationWithPhoto
} from '../utils/publicUrlMappings'


const router = Router();

// Helper function to log admin actions
async function logAdminAction(
  req: Request & { user?: any },
  action: AuditAction,
  targetUserId: number | null,
  details: any
) {
  try {
    await createAuditLog(
      req.user.adminId,
      action,
      targetUserId,
      details,
      req.ip,
      req.get('User-Agent')
    );
  } catch (error) {
    console.error('[ADMIN] Failed to create audit log:', error);
  }
}

// Create new user (admin only)
router.post('/users',   async (req: Request & { user?: any }, res: Response) => {
  console.log('[ADMIN] POST /users - Admin creating new user', { 
    adminId: req.user?.userId,
    body: req.body,
    ip: req.ip
  });

  const { email, password, fullname, role } = req.body;
  
  if (!email || !password || !fullname || !role) {
    console.log('[ADMIN] POST /users - Missing required fields');
    return res.status(400).json({ error: 'email, password, fullname, and role are required' });
  }

  try {
    const newUser = await createUser(email, password, fullname, role);
    console.log('[ADMIN] POST /users - User created successfully', { 
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role
    });
    
    await logAdminAction(req, AuditAction.CREATE_USER, newUser.id, { 
      action: 'create_user',
      email: newUser.email,
      role: newUser.role
    });
    
    res.json(newUser);
  } catch (error) {
    console.log('[ADMIN] POST /users - Error creating user', { error });
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Get all users (admin only, paginated)
router.get('/users', async (req: Request & { user?: any }, res: Response) => {
  console.log('[ADMIN] GET /users - Admin requesting all users', { 
    adminId: req.user?.userId,
    ip: req.ip,
    query: req.query
  });

  // Extract pagination and filter params
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string || '';
  const role = (req.query.role as 'all' | 'admin' | 'caregiver' | 'patient') || 'all';
  const status = (req.query.status as 'all' | 'active' | 'inactive') || 'all';

  try {
    const { users, total, totalPages } = await getAllUsersForAdmin({
      page,
      limit,
      search,
      role,
      status,
    });

    console.log('[ADMIN] GET /users - Retrieved paginated users', { 
      count: users.length, total, page, limit, totalPages
    });

    logAdminAction(req, AuditAction.VIEW_USER_INFO, null, { 
      action: 'view_all_users',
      count: users.length,
      page,
      limit,
      total,
      totalPages
    });

    res.json({
      data: users,
      total,
      page,
      limit,
      totalPages
    });
  } catch (error) {
    console.log('[ADMIN] GET /users - Error retrieving users', { error });
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

// Get specific user (admin only)
router.get('/users/:userId',   async (req: Request & { user?: any }, res: Response) => {
  const userId = parseInt(req.params.userId);
  console.log('[ADMIN] GET /users/:userId - Admin requesting user details', { 
    adminId: req.user?.userId,
    targetUserId: userId,
    ip: req.ip
  });

  try {
    const user = await getUserByIdForAdmin(userId);
    if (!user) {
      console.log('[ADMIN] GET /users/:userId - User not found', { userId });
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('[ADMIN] GET /users/:userId - Retrieved user successfully', { userId });
    await logAdminAction(req, AuditAction.VIEW_USER_INFO, userId, { action: 'view_user_details' });
    
    res.json(mapUserWithPhoto(req, user));
  } catch (error) {
    console.log('[ADMIN] GET /users/:userId - Error retrieving user', { error, userId });
    res.status(500).json({ error: 'Failed to retrieve user' });
  }
});

// Update user (admin only)
router.put('/users/:userId',   async (req: Request & { user?: any }, res: Response) => {
  const userId = parseInt(req.params.userId);
  console.log('[ADMIN] PUT /users/:userId - Admin updating user', { 
    adminId: req.user?.userId,
    targetUserId: userId,
    body: req.body,
    ip: req.ip
  });

  try {
    // This would need a separate updateUser function in admin.ts
    // For now, just log the action
    console.log('[ADMIN] PUT /users/:userId - User update requested', { userId, updates: req.body });
    
    await logAdminAction(req, AuditAction.UPDATE_USER, userId, { 
      action: 'update_user',
      updates: req.body
    });
    
    res.json({ message: 'User update functionality to be implemented' });
  } catch (error) {
    console.log('[ADMIN] PUT /users/:userId - Error updating user', { error, userId });
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (admin only)
router.delete('/users/:userId',   async (req: Request & { user?: any }, res: Response) => {
  const userId = parseInt(req.params.userId);
  console.log('[ADMIN] DELETE /users/:userId - Admin deleting user', { 
    adminId: req.user?.userId,
    targetUserId: userId,
    ip: req.ip
  });

  try {
    const deletedUser = await deleteUser(userId);
    console.log('[ADMIN] DELETE /users/:userId - User deleted successfully', { userId });
    
    await logAdminAction(req, AuditAction.DELETE_USER, userId, { action: 'delete_user' });
    
    res.json({ message: 'User deleted successfully', userId });
  } catch (error) {
    console.log('[ADMIN] DELETE /users/:userId - Error deleting user', { error, userId });
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get all patients (admin only)
router.get('/patients',   async (req: Request & { user?: any }, res: Response) => {
  console.log('[ADMIN] GET /patients - Admin requesting all patients', { 
    adminId: req.user?.userId,
    ip: req.ip
  });

  // Extract pagination and filter params
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string || '';
  const status = (req.query.status as 'all' | 'active' | 'inactive') || 'all';

  try {
    const { patients, total, totalPages } = await getAllPatientsForAdmin({
      page,
      limit,
      search,
      status,
    });

    console.log('[ADMIN] GET /patients - Retrieved paginated patients', {
      count: patients.length, total, page, limit, totalPages
    });

    await logAdminAction(req, AuditAction.VIEW_ALL_PATIENTS, null, {
      action: 'view_all_patients',
      count: patients.length,
      page,
      limit,
      total,
      totalPages
    });

    res.json({
      data: patients.map(p => mapPatientWithPhoto(req, p)),
      total,
      page,
      limit,
      totalPages
    });
  } catch (error) {
    console.log('[ADMIN] GET /patients - Error retrieving patients', { error });
    res.status(500).json({ error: 'Failed to retrieve patients' });
  }
});

// Get all caregivers (admin only) - Enhanced with filtering
router.get('/caregivers',   async (req: Request & { user?: any }, res: Response) => {
  console.log('[ADMIN] GET /caregivers - Admin requesting caregivers', { 
    adminId: req.user?.userId,
    ip: req.ip,
    query: req.query
  });

  // Extract pagination and filter params
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string || '';
  const status = (req.query.status as 'all' | 'active' | 'inactive') || 'all';

  try {
    const { caregivers, total, totalPages } = await getAllCaregiversForAdmin({
      page,
      limit,
      search,
      status,
    });

    console.log('[ADMIN] GET /caregivers - Retrieved paginated caregivers', { 
      count: caregivers.length, total, page, limit, totalPages
    });

    await logAdminAction(req, AuditAction.VIEW_ALL_CAREGIVERS, null, { 
      action: 'view_all_caregivers',
      count: caregivers.length,
      page,
      limit,
      total,
      totalPages
    });

    res.json({
      data: caregivers.map(c => mapCaregiverWithPhoto(req, c)),
      total,
      page,
      limit,
      totalPages
    });
  } catch (error) {
    console.log('[ADMIN] GET /caregivers - Error retrieving caregivers', { error });
    res.status(500).json({ error: 'Failed to retrieve caregivers' });
  }
});

// Approve caregiver (admin only)
router.post('/caregivers/:caregiverId/approve',   async (req: Request & { user?: any }, res: Response) => {
  const caregiverId = parseInt(req.params.caregiverId);
  console.log('[ADMIN] POST /caregivers/:caregiverId/approve - Admin approving caregiver', { 
    adminId: req.user?.userId,
    caregiverId,
    ip: req.ip
  });

  try {
    const approvedCaregiver = await approveCaregiver(caregiverId, req.user.userId);
    // Send notification to caregiver
    await sendNotification(approvedCaregiver.userId, 'CAREGIVER_APPROVED', 'Your caregiver profile has been approved by an admin.');
    console.log('[ADMIN] POST /caregivers/:caregiverId/approve - Caregiver approved successfully', { caregiverId });
    
    await logAdminAction(req, AuditAction.APPROVE_CAREGIVER, approvedCaregiver.userId, { 
      action: 'approve_caregiver',
      caregiverId 
    });
    
    res.json(approvedCaregiver);
  } catch (error) {
    console.log('[ADMIN] POST /caregivers/:caregiverId/approve - Error approving caregiver', { error, caregiverId });
    res.status(500).json({ error: 'Failed to approve caregiver' });
  }
});

// Reject caregiver (admin only)
router.post('/caregivers/:caregiverId/reject',   async (req: Request & { user?: any }, res: Response) => {
  const caregiverId = parseInt(req.params.caregiverId);
  console.log('[ADMIN] POST /caregivers/:caregiverId/reject - Admin rejecting caregiver', { 
    adminId: req.user?.userId,
    caregiverId,
    ip: req.ip
  });

  try {
    const rejectedCaregiver = await deactivateCaregiver(caregiverId, req.user.userId);
    // Send notification to caregiver
    await sendNotification(rejectedCaregiver.userId, 'CAREGIVER_REJECTED', 'Your caregiver profile has been rejected by an admin.');
    console.log('[ADMIN] POST /caregivers/:caregiverId/reject - Caregiver rejected successfully', { caregiverId });
    
    await logAdminAction(req, AuditAction.REJECT_CAREGIVER, rejectedCaregiver.userId, { 
      action: 'reject_caregiver',
      caregiverId 
    });
    
    res.json(rejectedCaregiver);
  } catch (error) {
    console.log('[ADMIN] POST /caregivers/:caregiverId/reject - Error rejecting caregiver', { error, caregiverId });
    res.status(500).json({ error: 'Failed to reject caregiver' });
  }
});

// Approve verification (admin only)
router.post('/verifications/:verificationId/approve',   async (req: Request & { user?: any }, res: Response) => {
  const verificationId = parseInt(req.params.verificationId);
  console.log('[ADMIN] POST /verifications/:verificationId/approve - Admin approving verification', { 
    adminId: req.user?.userId,
    verificationId,
    ip: req.ip
  });

  try {
    const approvedVerification = await approveVerification(verificationId, req.user.userId);
    // Get caregiver userId from verification
    const caregiverUserId = approvedVerification.caregiverProfileId ? (await getUserIdFromCaregiverProfile(approvedVerification.caregiverProfileId)) : null;
    if (caregiverUserId) {
      await sendNotification(caregiverUserId, 'VERIFICATION_APPROVED', 'Your verification has been approved by an admin.');
    }
    console.log('[ADMIN] POST /verifications/:verificationId/approve - Verification approved successfully', { verificationId });
    
    await logAdminAction(req, AuditAction.APPROVE_VERIFICATION, null, { 
      action: 'approve_verification',
      verificationId 
    });
    
    res.json(approvedVerification);
  } catch (error) {
    console.log('[ADMIN] POST /verifications/:verificationId/approve - Error approving verification', { error, verificationId });
    res.status(500).json({ error: 'Failed to approve verification' });
  }
});

// Reject verification (admin only)
router.post('/verifications/:verificationId/reject',   async (req: Request & { user?: any }, res: Response) => {
  const verificationId = parseInt(req.params.verificationId);
  console.log('[ADMIN] POST /verifications/:verificationId/reject - Admin rejecting verification', { 
    adminId: req.user?.userId,
    verificationId,
    ip: req.ip
  });

  try {
    const rejectedVerification = await rejectVerification(verificationId, req.user.userId);
    // Get caregiver userId from verification
    const caregiverUserId = rejectedVerification.caregiverProfileId ? (await getUserIdFromCaregiverProfile(rejectedVerification.caregiverProfileId)) : null;
    if (caregiverUserId) {
      await sendNotification(caregiverUserId, 'VERIFICATION_REJECTED', 'Your verification has been rejected by an admin.');
    }
    console.log('[ADMIN] POST /verifications/:verificationId/reject - Verification rejected successfully', { verificationId });
    
    await logAdminAction(req, AuditAction.REJECT_VERIFICATION, null, { 
      action: 'reject_verification',
      verificationId 
    });
    
    res.json(rejectedVerification);
  } catch (error) {
    console.log('[ADMIN] POST /verifications/:verificationId/reject - Error rejecting verification', { error, verificationId });
    res.status(500).json({ error: 'Failed to reject verification' });
  }
});

// Assign caregiver to patient (admin only)
router.post('/assignments',   async (req: Request & { user?: any }, res: Response) => {
  console.log('[ADMIN] POST /assignments - Admin creating assignment', { 
    adminId: req.user?.userId,
    body: req.body,
    ip: req.ip
  });

  const { caregiverId, patientId, notes } = req.body;
  
  if (!caregiverId || !patientId) {
    console.log('[ADMIN] POST /assignments - Missing required fields');
    return res.status(400).json({ error: 'caregiverId and patientId are required' });
  }

  try {
    const assignment = await assignCaregiverToPatient(caregiverId, patientId, req.user.userId, notes);
    console.log('[ADMIN] POST /assignments - Assignment created successfully', { 
      assignmentId: assignment.id,
      caregiverId,
      patientId 
    });
    
    await logAdminAction(req, AuditAction.ASSIGN_CAREGIVER, null, { 
      action: 'assign_caregiver',
      assignmentId: assignment.id,
      caregiverId,
      patientId 
    });
    
    res.json(assignment);
  } catch (error) {
    console.log('[ADMIN] POST /assignments - Error creating assignment', { error });
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// Unassign caregiver from patient (admin only)
router.delete('/assignments/:caregiverId/:patientId',   async (req: Request & { user?: any }, res: Response) => {
  const caregiverId = parseInt(req.params.caregiverId);
  const patientId = parseInt(req.params.patientId);
  
  console.log('[ADMIN] DELETE /assignments/:caregiverId/:patientId - Admin unassigning caregiver', { 
    adminId: req.user?.userId,
    caregiverId,
    patientId,
    ip: req.ip
  });

  try {
    const assignment = await unassignCaregiverFromPatient(caregiverId, patientId);
    console.log('[ADMIN] DELETE /assignments/:caregiverId/:patientId - Assignment cancelled successfully', { 
      assignmentId: assignment.id,
      caregiverId,
      patientId 
    });
    
    await logAdminAction(req, AuditAction.UNASSIGN_CAREGIVER, null, { 
      action: 'unassign_caregiver',
      assignmentId: assignment.id,
      caregiverId,
      patientId 
    });
    
    res.json(assignment);
  } catch (error) {
    console.log('[ADMIN] DELETE /assignments/:caregiverId/:patientId - Error cancelling assignment', { error });
    res.status(500).json({ error: 'Failed to cancel assignment' });
  }
});

// Get assignments for a patient (admin only)
router.get('/patients/:patientId/assignments',   async (req: Request & { user?: any }, res: Response) => {
  const patientId = parseInt(req.params.patientId);
  console.log('[ADMIN] GET /patients/:patientId/assignments - Admin requesting patient assignments', { 
    adminId: req.user?.userId,
    patientId,
    ip: req.ip
  });

  try {
    const assignments = await getAssignmentsByPatientId(patientId);
    console.log('[ADMIN] GET /patients/:patientId/assignments - Retrieved assignments successfully', { 
      patientId,
      count: assignments.length 
    });
    
    await logAdminAction(req, AuditAction.VIEW_USER_INFO, null, { 
      action: 'view_patient_assignments',
      patientId,
      count: assignments.length 
    });
    
    res.json(assignments);
  } catch (error) {
    console.log('[ADMIN] GET /patients/:patientId/assignments - Error retrieving assignments', { error, patientId });
    res.status(500).json({ error: 'Failed to retrieve assignments' });
  }
});

// Create new admin (admin only)
router.post('/admins',   async (req: Request & { user?: any }, res: Response) => {
  console.log('[ADMIN] POST /admins - Admin creating new admin', { 
    adminId: req.user?.userId,
    body: req.body,
    ip: req.ip
  });

  const { userId, permissions } = req.body;
  
  if (!userId) {
    console.log('[ADMIN] POST /admins - Missing userId');
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const newAdmin = await createAdmin(userId, permissions || []);
    console.log('[ADMIN] POST /admins - Admin created successfully', { 
      adminId: newAdmin.id,
      userId 
    });
    
    await logAdminAction(req, AuditAction.CREATE_ADMIN, userId, { 
      action: 'create_admin',
      newAdminId: newAdmin.id,
      permissions 
    });
    
    res.json(newAdmin);
  } catch (error) {
    console.log('[ADMIN] POST /admins - Error creating admin', { error });
    res.status(500).json({ error: 'Failed to create admin' });
  }
});

// Get all admins (admin only)
router.get('/admins',   async (req: Request & { user?: any }, res: Response) => {
  console.log('[ADMIN] GET /admins - Admin requesting all admins', { 
    adminId: req.user?.userId,
    ip: req.ip
  });

  try {
    const admins = await getAllAdmins();
    console.log('[ADMIN] GET /admins - Retrieved all admins successfully', { 
      count: admins.length 
    });
    
    await logAdminAction(req, AuditAction.VIEW_USER_INFO, null, { 
      action: 'view_all_admins',
      count: admins.length 
    });
    
    res.json(admins);
  } catch (error) {
    console.log('[ADMIN] GET /admins - Error retrieving admins', { error });
    res.status(500).json({ error: 'Failed to retrieve admins' });
  }
});

// Get audit logs (admin only)
router.get('/audit-logs',   async (req: Request & { user?: any }, res: Response) => {
  console.log('[ADMIN] GET /audit-logs - Admin requesting audit logs', { 
    adminId: req.user?.userId,
    ip: req.ip
  });

  const limit = parseInt(req.query.limit as string) || 100;

  try {
    const auditLogs = await getAuditLogs(undefined, limit);
    console.log('[ADMIN] GET /audit-logs - Retrieved audit logs successfully', { 
      count: auditLogs.length,
      limit 
    });
    
    res.json(auditLogs);
  } catch (error) {
    console.log('[ADMIN] GET /audit-logs - Error retrieving audit logs', { error });
    res.status(500).json({ error: 'Failed to retrieve audit logs' });
  }
});

// Get single caregiver by ID
router.get('/caregivers/:caregiverId',   async (req: Request & { user?: any }, res: Response) => {
  const caregiverId = parseInt(req.params.caregiverId);
  console.log('[ADMIN] GET /caregivers/:caregiverId - Admin requesting caregiver', { 
    adminId: req.user?.userId,
    caregiverId,
    ip: req.ip
  });
  try {
    let caregiver = await getCaregiverById(caregiverId);
    caregiver = mapCaregiverWithPhoto(req, caregiver);
    if (!caregiver) {
      console.log('[ADMIN] GET /caregivers/:caregiverId - Caregiver not found', { caregiverId });
      return res.status(404).json({ error: 'Caregiver not found' });
    }
    console.log('[ADMIN] GET /caregivers/:caregiverId - Caregiver retrieved', { caregiverId });
    res.json(caregiver);
  } catch (error) {
    console.log('[ADMIN] GET /caregivers/:caregiverId - Error fetching caregiver', { error, caregiverId });
    res.status(500).json({ error: 'Failed to fetch caregiver' });
  }
});

// Get single patient by ID
router.get('/patients/:patientId',   async (req: Request & { user?: any }, res: Response) => {
  const patientId = parseInt(req.params.patientId);
  console.log('[ADMIN] GET /patients/:patientId - Admin requesting patient', { 
    adminId: req.user?.userId,
    patientId,
    ip: req.ip
  });
  try {
    let patient = await getPatientById(patientId);
    patient = mapPatientWithPhoto(req, patient);
    if (!patient) {
      console.log('[ADMIN] GET /patients/:patientId - Patient not found', { patientId });
      return res.status(404).json({ error: 'Patient not found' });
    }
    console.log('[ADMIN] GET /patients/:patientId - Patient retrieved', { patientId });
    res.json(patient);
  } catch (error) {
    console.log('[ADMIN] GET /patients/:patientId - Error fetching patient', { error, patientId });
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

// Get all assignments
router.get('/assignments',   async (req: Request & { user?: any }, res: Response) => {
  console.log('[ADMIN] GET /assignments - Admin requesting all assignments', { 
    adminId: req.user?.userId,
    ip: req.ip
  });
  try {
    let assignments = await getAllAssignments();
    //assignments = mapAssignmentsWithPhoto(req, assignments);
    console.log('[ADMIN] GET /assignments - Assignments retrieved', { count: assignments.length });
    res.json(assignments);
  } catch (error) {
    console.log('[ADMIN] GET /assignments - Error fetching assignments', { error });
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Get all verifications (admin only, paginated)
router.get('/verifications', async (req: Request & { user?: any }, res: Response) => {
  console.log('[ADMIN] GET /verifications - Admin requesting all verifications', { 
    adminId: req.user?.userId,
    ip: req.ip,
    query: req.query
  });

  // Extract pagination and filter params
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string || '';
  const type = (req.query.type as string) || 'all';
  const status = (req.query.status as string) || 'all';

  try {
    const { verifications, total, totalPages } = await getAllVerifications({
      page,
      limit,
      search,
      type,
      status,
    });

    console.log('[ADMIN] GET /verifications - Retrieved paginated verifications', { 
      count: verifications.length, total, page, limit, totalPages
    });

    logAdminAction(req, AuditAction.VIEW_USER_INFO, null, { 
      action: 'view_all_verifications',
      count: verifications.length,
      page,
      limit,
      total,
      totalPages
    });

    res.json({
      data: verifications.map(v => mapVerificationWithPhoto(req, v)),
      total,
      page,
      limit,
      totalPages
    });
  } catch (error) {
    console.log('[ADMIN] GET /verifications - Error fetching verifications', { error });
    res.status(500).json({ error: 'Failed to fetch verifications' });
  }
});

// Dashboard stats
router.get('/dashboard/stats',   async (req: Request & { user?: any }, res: Response) => {
  console.log('[ADMIN] GET /dashboard/stats - Admin requesting dashboard stats', { 
    adminId: req.user?.userId,
    ip: req.ip
  });
  try {
    let stats = await getDashboardStats();
    console.log('[ADMIN] GET /dashboard/stats - Stats retrieved');
    res.json(stats);
  } catch (error) {
    console.log('[ADMIN] GET /dashboard/stats - Error fetching stats', { error });
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Reports
router.get('/reports',   async (req: Request & { user?: any }, res: Response) => {
  console.log('[ADMIN] GET /reports - Admin requesting reports', { 
    adminId: req.user?.userId,
    ip: req.ip
  });
  try {
    let reports = await getReports();
    console.log('[ADMIN] GET /reports - Reports retrieved', { count: reports?.length });
    res.json(reports);
  } catch (error) {
    console.log('[ADMIN] GET /reports - Error fetching reports', { error });
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Helper to get userId from caregiverProfileId
async function getUserIdFromCaregiverProfile(caregiverProfileId: number): Promise<number | null> {
  console.log('[ADMIN] getUserIdFromCaregiverProfile - Fetching userId for caregiverProfileId', { caregiverProfileId });
  const caregiverProfile = await prisma.caregiverProfile.findUnique({ where: { id: caregiverProfileId } });
  const userId = caregiverProfile?.userId || null;
  console.log('[ADMIN] getUserIdFromCaregiverProfile - userId fetched', { caregiverProfileId, userId });
  return userId;
}

export default router;
