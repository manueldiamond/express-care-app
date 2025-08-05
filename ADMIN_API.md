# Admin API Endpoints

## Authentication
All endpoints require JWT token in Authorization header: `Bearer <token>`
Admin role required for all endpoints.

## User Management

### Create User
- **POST** `/api/admin/users`
- **Body**: `{ email, password, fullname, role }`
- **Response**: `AdminUser`

### Get All Users
- **GET** `/api/admin/users`
- **Query**: `search?`, `limit?`
- **Response**: `AdminUser[]`

### Get User by ID
- **GET** `/api/admin/users/:userId`
- **Response**: `AdminUser`

### Update User
- **PUT** `/api/admin/users/:userId`
- **Body**: `{ email?, fullname?, contact?, location?, dateOfBirth? }`
- **Response**: `SuccessResponse`

### Delete User
- **DELETE** `/api/admin/users/:userId`
- **Response**: `SuccessResponse`

## Patient Management

### Get All Patients
- **GET** `/api/admin/patients`
- **Query**: `search?`, `limit?`
- **Response**: `PatientProfile[]`

### Get Patient Assignments
- **GET** `/api/admin/patients/:patientId/assignments`
- **Response**: `Assignment[]`

## Caregiver Management

### Get All Caregivers
- **GET** `/api/admin/caregivers`
- **Query**: `search?`, `viewing?`, `limit?`
- **Response**: `CaregiverProfile[]`

### Approve Caregiver
- **POST** `/api/admin/caregivers/:caregiverId/approve`
- **Response**: `CaregiverProfile`

### Reject Caregiver
- **POST** `/api/admin/caregivers/:caregiverId/reject`
- **Response**: `CaregiverProfile`

## Verification Management

### Approve Verification
- **POST** `/api/admin/verifications/:verificationId/approve`
- **Response**: `Verification`

### Reject Verification
- **POST** `/api/admin/verifications/:verificationId/reject`
- **Response**: `Verification`

## Assignment Management

### Create Assignment
- **POST** `/api/admin/assignments`
- **Body**: `{ caregiverId, patientId, notes? }`
- **Response**: `Assignment`

### Remove Assignment
- **DELETE** `/api/admin/assignments/:caregiverId/:patientId`
- **Response**: `Assignment`

## Admin Management

### Create Admin
- **POST** `/api/admin/admins`
- **Body**: `{ userId, permissions? }`
- **Response**: `AdminProfile`

### Get All Admins
- **GET** `/api/admin/admins`
- **Response**: `AdminProfile[]`

## Audit & Monitoring

### Get Audit Logs
- **GET** `/api/admin/audit-logs`
- **Query**: `limit?`
- **Response**: `AuditLog[]`

## Query Parameters

### Search
- `search` - Fuzzy search across name, email, type, skills, location
- `viewing` - `available` | `all` (default: `all` for admin)
- `limit` - Number of results (optional)

## Response Types

```typescript
interface AdminUser {
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

interface AdminProfile {
  id: number;
  userId: number;
  permissions: string[];
}

interface CaregiverProfile {
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
  user: AdminUser;
}

interface PatientProfile {
  id: number;
  userId: number;
  medicalHistory: string | null;
  condition: string;
  years: string;
  schedule: string;
  description: string | null;
  special: string | null;
  assignments: Assignment[];
  user: AdminUser;
}

interface Assignment {
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

interface Verification {
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

interface AuditLog {
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

interface SuccessResponse {
  message: string;
  [key: string]: any;
}

interface ErrorResponse {
  error: string;
  details?: any;
}
```

## Example Responses

### Get All Users Response
```json
[
  {
    "id": 1,
    "email": "admin@example.com",
    "fullname": "Admin User",
    "role": "admin",
    "photoUrl": null,
    "contact": "+1-555-0000",
    "dateOfBirth": "1980-01-01T00:00:00.000Z",
    "location": "New York, NY",
    "admin": {
      "id": 1,
      "userId": 1,
      "permissions": ["user_management", "caregiver_approval"]
    }
  },
  {
    "id": 2,
    "email": "caregiver@example.com",
    "fullname": "John Doe",
    "role": "caregiver",
    "photoUrl": "/uploads/photo-123.jpg",
    "contact": "+1-555-0123",
    "dateOfBirth": "1985-03-15T00:00:00.000Z",
    "location": "Los Angeles, CA",
    "caregiver": {
      "id": 1,
      "userId": 2,
      "type": "Professional",
      "isVerified": true,
      "isActive": true,
      "isAvailable": true,
      "availability": true,
      "timeAvailable": "Weekdays 9AM-5PM",
      "educationLevel": "Bachelor's Degree",
      "skills": ["Elder Care", "Medication Management"],
      "verification": {
        "id": 1,
        "caregiverProfileId": 1,
        "documentType": "Driver's License",
        "document": "base64_encoded_document",
        "legalName": "John Michael Doe",
        "isApproved": true,
        "approvedBy": 1,
        "approvedAt": "2024-01-15T10:30:00.000Z",
        "createdAt": "2024-01-10T09:00:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    }
  }
]
```

### Get All Caregivers Response
```json
[
  {
    "id": 1,
    "userId": 2,
    "type": "Professional",
    "isVerified": true,
    "isActive": true,
    "isAvailable": true,
    "availability": true,
    "timeAvailable": "Weekdays 9AM-5PM",
    "educationLevel": "Bachelor's Degree",
    "skills": ["Elder Care", "Medication Management", "First Aid"],
    "verification": {
      "id": 1,
      "caregiverProfileId": 1,
      "documentType": "Driver's License",
      "document": "base64_encoded_document",
      "legalName": "John Michael Doe",
      "isApproved": true,
      "approvedBy": 1,
      "approvedAt": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-10T09:00:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "user": {
      "id": 2,
      "email": "caregiver@example.com",
      "fullname": "John Doe",
      "role": "caregiver",
      "photoUrl": "/uploads/photo-123.jpg",
      "contact": "+1-555-0123",
      "dateOfBirth": "1985-03-15T00:00:00.000Z",
      "location": "Los Angeles, CA"
    }
  }
]
```

### Get All Patients Response
```json
[
  {
    "id": 1,
    "userId": 3,
    "medicalHistory": "Diabetes, Hypertension",
    "condition": "Elderly Care",
    "years": "5",
    "schedule": "Daily 8AM-6PM",
    "description": "Requires assistance with daily activities",
    "special": "Wheelchair accessible home",
    "assignments": [
      {
        "id": 1,
        "patientId": 1,
        "caregiverId": 1,
        "assignedBy": 1,
        "assignedAt": "2024-01-20T09:00:00.000Z",
        "status": "active",
        "notes": "Primary caregiver assignment",
        "createdAt": "2024-01-20T09:00:00.000Z",
        "updatedAt": "2024-01-20T09:00:00.000Z",
        "caregiver": {
          "id": 1,
          "userId": 2,
          "type": "Professional",
          "isVerified": true,
          "isActive": true,
          "isAvailable": true,
          "availability": true,
          "timeAvailable": "Weekdays 9AM-5PM",
          "educationLevel": "Bachelor's Degree",
          "skills": ["Elder Care", "Medication Management"],
          "user": {
            "id": 2,
            "email": "caregiver@example.com",
            "fullname": "John Doe",
            "role": "caregiver",
            "photoUrl": "/uploads/photo-123.jpg",
            "contact": "+1-555-0123",
            "dateOfBirth": "1985-03-15T00:00:00.000Z",
            "location": "Los Angeles, CA"
          }
        }
      }
    ],
    "user": {
      "id": 3,
      "email": "patient@example.com",
      "fullname": "Mary Smith",
      "role": "patient",
      "photoUrl": null,
      "contact": "+1-555-0456",
      "dateOfBirth": "1940-07-22T00:00:00.000Z",
      "location": "New York, NY"
    }
  }
]
```

### Create Assignment Response
```json
{
  "id": 2,
  "patientId": 2,
  "caregiverId": 1,
  "assignedBy": 1,
  "assignedAt": "2024-01-25T14:30:00.000Z",
  "status": "active",
  "notes": "Backup caregiver for weekends",
  "createdAt": "2024-01-25T14:30:00.000Z",
  "updatedAt": "2024-01-25T14:30:00.000Z"
}
```

### Audit Log Response
```json
[
  {
    "id": 1,
    "adminId": 1,
    "action": "APPROVE_CAREGIVER",
    "targetUserId": 2,
    "details": "{\"action\":\"approve_caregiver\",\"caregiverId\":1}",
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "admin": {
      "user": {
        "id": 1,
        "email": "admin@example.com",
        "fullname": "Admin User"
      }
    }
  }
]
```

### Success Response
```json
{
  "message": "User deleted successfully",
  "userId": 5
}
```

## Error Responses

```typescript
// 400 Bad Request
{ error: "Missing required fields", details?: any }

// 401 Unauthorized
{ error: "Invalid token" }

// 403 Forbidden
{ error: "Forbidden: insufficient role" }

// 404 Not Found
{ error: "User not found" }

// 500 Internal Server Error
{ error: "Failed to retrieve users" }
```

## Request Examples

### Create User
```bash
POST /api/admin/users
Content-Type: application/json
Authorization: Bearer <token>

{
  "email": "newuser@example.com",
  "password": "securepassword123",
  "fullname": "New User",
  "role": "caregiver"
}
```

### Create Assignment
```bash
POST /api/admin/assignments
Content-Type: application/json
Authorization: Bearer <token>

{
  "caregiverId": 1,
  "patientId": 2,
  "notes": "Primary caregiver assignment"
}
```

### Search Caregivers
```bash
GET /api/admin/caregivers?search=nurse&viewing=available&limit=10
Authorization: Bearer <token>
``` 