import { Router, Request, Response } from 'express';
import requireAuth from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireRole';
import { 
  getAllUsersForAdmin,
  getUserByIdForAdmin,
  deleteUser,
  approveCaregiver,
  rejectCaregiver,
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
  getAllAdmins
} from '../db/admin';
import { getFilteredCaregivers } from '../db/caregiver';
import { createUser } from '../db/user';
import { AuditAction } from '@prisma/client';
import { z } from 'zod';

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
      req.user.userId,
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
router.post('/users', requireAuth, requireAdmin, async (req: Request & { user?: any }, res: Response) => {
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

// Get all users (admin only)
router.get('/users', requireAuth, requireAdmin, async (req: Request & { user?: any }, res: Response) => {
  console.log('[ADMIN] GET /users - Admin requesting all users', { 
    adminId: req.user?.userId,
    ip: req.ip
  });

  try {
    const users = await getAllUsersForAdmin();
    console.log('[ADMIN] GET /users - Retrieved all users successfully', { 
      count: users.length 
    });
    
    await logAdminAction(req, AuditAction.VIEW_USER_INFO, null, { action: 'view_all_users', count: users.length });
    
    res.json(users);
  } catch (error) {
    console.log('[ADMIN] GET /users - Error retrieving users', { error });
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

// Get specific user (admin only)
router.get('/users/:userId', requireAuth, requireAdmin, async (req: Request & { user?: any }, res: Response) => {
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
    
    res.json(user);
  } catch (error) {
    console.log('[ADMIN] GET /users/:userId - Error retrieving user', { error, userId });
    res.status(500).json({ error: 'Failed to retrieve user' });
  }
});

// Update user (admin only)
router.put('/users/:userId', requireAuth, requireAdmin, async (req: Request & { user?: any }, res: Response) => {
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
router.delete('/users/:userId', requireAuth, requireAdmin, async (req: Request & { user?: any }, res: Response) => {
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
router.get('/patients', requireAuth, requireAdmin, async (req: Request & { user?: any }, res: Response) => {
  console.log('[ADMIN] GET /patients - Admin requesting all patients', { 
    adminId: req.user?.userId,
    ip: req.ip
  });

  try {
    const patients = await getAllPatientsForAdmin();
    console.log('[ADMIN] GET /patients - Retrieved all patients successfully', { 
      count: patients.length 
    });
    
    await logAdminAction(req, AuditAction.VIEW_ALL_PATIENTS, null, { action: 'view_all_patients', count: patients.length });
    
    res.json(patients);
  } catch (error) {
    console.log('[ADMIN] GET /patients - Error retrieving patients', { error });
    res.status(500).json({ error: 'Failed to retrieve patients' });
  }
});

// Get all caregivers (admin only) - Enhanced with filtering
router.get('/caregivers', requireAuth, requireAdmin, async (req: Request & { user?: any }, res: Response) => {
  console.log('[ADMIN] GET /caregivers - Admin requesting caregivers', { 
    adminId: req.user?.userId,
    ip: req.ip,
    query: req.query
  });

  // Extract query parameters
  const search = req.query.search as string;
  const viewing = (req.query.viewing as 'available' | 'all') || 'all';
  const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

  console.log('[ADMIN] GET /caregivers - Applying filters', { 
    search,
    viewing,
    limit
  });

  try {
    const caregivers = await getFilteredCaregivers(search, viewing, true, limit); // isAdmin = true
    console.log('[ADMIN] GET /caregivers - Retrieved filtered caregivers successfully', { 
      count: caregivers.length,
      filters: { search, viewing, limit }
    });
    
    await logAdminAction(req, AuditAction.VIEW_ALL_CAREGIVERS, null, { 
      action: 'view_all_caregivers', 
      count: caregivers.length,
      filters: { search, viewing, limit }
    });
    
    res.json(caregivers);
  } catch (error) {
    console.log('[ADMIN] GET /caregivers - Error retrieving caregivers', { error });
    res.status(500).json({ error: 'Failed to retrieve caregivers' });
  }
});

// Approve caregiver (admin only)
router.post('/caregivers/:caregiverId/approve', requireAuth, requireAdmin, async (req: Request & { user?: any }, res: Response) => {
  const caregiverId = parseInt(req.params.caregiverId);
  console.log('[ADMIN] POST /caregivers/:caregiverId/approve - Admin approving caregiver', { 
    adminId: req.user?.userId,
    caregiverId,
    ip: req.ip
  });

  try {
    const approvedCaregiver = await approveCaregiver(caregiverId, req.user.userId);
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
router.post('/caregivers/:caregiverId/reject', requireAuth, requireAdmin, async (req: Request & { user?: any }, res: Response) => {
  const caregiverId = parseInt(req.params.caregiverId);
  console.log('[ADMIN] POST /caregivers/:caregiverId/reject - Admin rejecting caregiver', { 
    adminId: req.user?.userId,
    caregiverId,
    ip: req.ip
  });

  try {
    const rejectedCaregiver = await rejectCaregiver(caregiverId, req.user.userId);
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
router.post('/verifications/:verificationId/approve', requireAuth, requireAdmin, async (req: Request & { user?: any }, res: Response) => {
  const verificationId = parseInt(req.params.verificationId);
  console.log('[ADMIN] POST /verifications/:verificationId/approve - Admin approving verification', { 
    adminId: req.user?.userId,
    verificationId,
    ip: req.ip
  });

  try {
    const approvedVerification = await approveVerification(verificationId, req.user.userId);
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
router.post('/verifications/:verificationId/reject', requireAuth, requireAdmin, async (req: Request & { user?: any }, res: Response) => {
  const verificationId = parseInt(req.params.verificationId);
  console.log('[ADMIN] POST /verifications/:verificationId/reject - Admin rejecting verification', { 
    adminId: req.user?.userId,
    verificationId,
    ip: req.ip
  });

  try {
    const rejectedVerification = await rejectVerification(verificationId, req.user.userId);
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
router.post('/assignments', requireAuth, requireAdmin, async (req: Request & { user?: any }, res: Response) => {
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
router.delete('/assignments/:caregiverId/:patientId', requireAuth, requireAdmin, async (req: Request & { user?: any }, res: Response) => {
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
router.get('/patients/:patientId/assignments', requireAuth, requireAdmin, async (req: Request & { user?: any }, res: Response) => {
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
router.post('/admins', requireAuth, requireAdmin, async (req: Request & { user?: any }, res: Response) => {
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
router.get('/admins', requireAuth, requireAdmin, async (req: Request & { user?: any }, res: Response) => {
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
router.get('/audit-logs', requireAuth, requireAdmin, async (req: Request & { user?: any }, res: Response) => {
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

export default router; 