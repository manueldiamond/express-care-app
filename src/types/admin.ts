// Admin API Types

// User Management
export interface AdminUser {
  id: number;
  email: string;
  fullname: string;
  role: 'admin' | 'caregiver' | 'patient';
  photoUrl: string | null;
  contact: string | null;
  dateOfBirth: string | null;
  location: string | null;
  admin?: AdminProfile;
  caregiver?: CaregiverProfile;
  patient?: PatientProfile;
}

export interface AdminProfile {
  id: number;
  userId: number;
  permissions: string[];
}

export interface CaregiverProfile {
  id: number;
  userId: number;
  type: string | null;
  isVerified: boolean;
  isActive: boolean;
  isAvailable: boolean;
  availability: boolean;
  timeAvailable: string | null;
  educationLevel: string | null;
  skills: string[];
  verification?: Verification;
}

export interface PatientProfile {
  id: number;
  userId: number;
  medicalHistory: string | null;
  condition: string;
  years: string;
  schedule: string;
  description: string | null;
  special: string | null;
  assignments: Assignment[];
}

export interface Verification {
  id: number;
  caregiverProfileId: number;
  documentType: string;
  document: string;
  legalName: string;
  isApproved: boolean;
  approvedBy: number | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: number;
  patientId: number;
  caregiverId: number;
  assignedBy: number;
  assignedAt: string;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  caregiver?: CaregiverProfile;
  patient?: PatientProfile;
}

// Request Types
export interface CreateAdminRequest {
  userId: number;
  permissions?: string[];
}

export interface AssignCaregiverRequest {
  caregiverId: number;
  patientId: number;
  notes?: string;
}

export interface ApproveCaregiverRequest {
  // No body needed, uses URL param
}

export interface RejectCaregiverRequest {
  // No body needed, uses URL param
}

export interface ApproveVerificationRequest {
  // No body needed, uses URL param
}

export interface RejectVerificationRequest {
  // No body needed, uses URL param
}

// Response Types
export interface AdminUsersResponse {
  users: AdminUser[];
}

export interface AdminUserResponse {
  user: AdminUser;
}

export interface AdminPatientsResponse {
  patients: PatientProfile[];
}

export interface AdminCaregiversResponse {
  caregivers: CaregiverProfile[];
}

export interface AdminAssignmentsResponse {
  assignments: Assignment[];
}

export interface AdminAdminsResponse {
  admins: AdminProfile[];
}

export interface AuditLog {
  id: number;
  adminId: number;
  action: string;
  targetUserId: number | null;
  details: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  admin: {
    user: {
      id: number;
      email: string;
      fullname: string;
    };
  };
}

export interface AuditLogsResponse {
  auditLogs: AuditLog[];
}

export interface SuccessResponse {
  message: string;
  [key: string]: any;
}

export interface ErrorResponse {
  error: string;
  details?: any;
}

// Query Parameters
export interface AdminQueryParams {
  search?: string;
  viewing?: 'available' | 'all';
  limit?: number;
}

// URL Parameters
export interface AdminUrlParams {
  userId?: string;
  patientId?: string;
  caregiverId?: string;
  verificationId?: string;
} 