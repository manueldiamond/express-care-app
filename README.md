# Express Care App

A comprehensive healthcare platform that connects patients with qualified caregivers. Built with Express.js, TypeScript, Prisma ORM, and PostgreSQL.

## 🏗️ Architecture Overview

The Express Care App is a full-stack healthcare platform with the following architecture:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (Client Apps) │◄──►│   Express.js    │◄──►│   PostgreSQL    │
└─────────────────┘    │   TypeScript    │    │   Prisma ORM    │
                       └─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐
                       │   WebSocket     │
                       │   Socket.io     │
                       │   Real-time     │
                       └─────────────────┘
```

## 🎯 Core Features

### 👥 User Management
- **Multi-role System**: Admin, Caregiver, and Patient roles
- **Authentication**: JWT-based authentication with role-based access control
- **Profile Management**: Complete user profiles with photos and contact information
- **Password Security**: Bcrypt hashing for secure password storage

### 🏥 Caregiver Management
- **Profile System**: Detailed caregiver profiles with qualifications and verification
- **Verification Process**: Document-based verification system with admin approval
- **Qualifications**: Support for multiple qualifications with file uploads
- **Availability Management**: Real-time availability status updates
- **Specialization**: Support for various medical specializations

### 👤 Patient Management
- **Medical Profiles**: Comprehensive patient medical information
- **Condition Tracking**: Medical history and current condition management
- **Assignment System**: Admin-controlled caregiver-patient assignments
- **Schedule Management**: Flexible scheduling options

### 🔐 Admin Dashboard
- **User Management**: Complete user administration capabilities
- **Verification Approval**: Document verification approval system
- **Assignment Management**: Caregiver-patient assignment controls
- **Audit Logging**: Comprehensive audit trail for all admin actions
- **Dashboard Analytics**: Statistics and reporting features

### 💬 Real-time Communication
- **Chat System**: Real-time messaging between users
- **Notifications**: Push notifications for important events
- **WebSocket Integration**: Socket.io for real-time features

### 📁 File Management
- **File Uploads**: Support for documents, photos, and qualification files
- **Storage System**: Organized file storage with public URL mapping
- **Security**: Secure file access with proper validation

### 🤝 Caregiver Matching System

- **Intelligent Matching**: The system uses advanced semantic similarity and location-based algorithms to match patients with the most suitable caregivers.
- **@caregiverMatching**: Implements the core matching logic, combining patient needs, caregiver profiles, qualifications, and geographic proximity.
- **Features**:
  - Considers medical condition, schedule, special requirements, and qualifications.
  - Uses the @xenova/transformers library and the Xenova/all-MiniLM-L6-v2 model for AI semantic matching analysis, leveraging embeddings and cosine similarity.
  - Location similarity scoring for Ghanaian regions and cities.
  - Returns ranked caregiver matches with detailed scoring.

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.io for WebSocket connections
- **File Upload**: Multer for file handling
- **Validation**: Zod for request validation
- **Password Hashing**: Bcrypt

### Development Tools
- **Package Manager**: Bun (recommended) or npm
- **Type Checking**: TypeScript
- **Code Quality**: ESLint and Prettier
- **Database Migrations**: Prisma CLI

## 📁 Project Structure

```
express-care-app/
├── src/
│   ├── app.ts                 # Express app configuration
│   ├── index.ts               # Server entry point
│   ├── db/                    # Database layer
│   │   ├── prisma.ts          # Prisma client
│   │   ├── admin.ts           # Admin database operations
│   │   ├── caregiver.ts       # Caregiver database operations
│   │   ├── patient.ts         # Patient database operations
│   │   ├── user.ts            # User database operations
│   │   └── storage.ts         # File storage operations
│   ├── routes/                # API routes
│   │   ├── auth.ts            # Authentication routes
│   │   ├── admin.ts           # Admin management routes
│   │   ├── caregivers.ts      # Caregiver management routes
│   │   ├── patients.ts        # Patient management routes
│   │   ├── profile.ts         # Profile management routes
│   │   ├── chat.ts            # Chat system routes
│   │   ├── notifications.ts   # Notification routes
│   │   └── patientCaregiverMatching.ts # Matching routes
│   ├── middleware/            # Express middleware
│   │   ├── requireAuth.ts     # Authentication middleware
│   │   ├── requireRole.ts     # Role-based access control
│   │   ├── isVerified.ts      # Verification middleware
│   │   └── isCaregiverActive.ts # Caregiver status middleware
│   ├── utils/                 # Utility functions
│   │   ├── jwt.ts             # JWT utilities
│   │   ├── password.ts        # Password hashing utilities
│   │   ├── caregiverMatching.ts # Caregiver matching logic
│   │   └── publicUrlMappings.ts # File URL mapping utilities
│   ├── socket/                # WebSocket handlers
│   │   ├── index.ts           # Socket initialization
│   │   └── notifications.ts   # Notification socket logic
│   ├── types/                 # TypeScript type definitions
│   │   └── admin.ts           # Admin-specific types
│   └── zod/                   # Zod validation schemas
│       ├── authSchemas.ts     # Authentication validation
│       └── profileSchemas.ts  # Profile validation
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── uploads/                   # File upload directory
├── package.json               # Dependencies and scripts
└── README.md                  # This file
```

## 🗄️ Database Schema

### Core Models

#### User
- Basic user information (email, password, name, role)
- Profile photo and contact details
- Role-based access (admin, caregiver, patient)

#### CaregiverProfile
- Caregiver-specific information
- Verification status and availability
- Qualifications and specializations
- Schedule and bio information

#### Patient
- Medical history and current conditions
- Assignment relationships with caregivers
- Schedule and special requirements

#### Admin
- Administrative permissions and audit capabilities
- Verification approval authority

#### Assignment
- Caregiver-patient relationships
- Assignment status and notes
- Admin assignment tracking

#### Verification
- Document-based verification system
- Approval workflow with admin oversight
- Status tracking (pending, approved, rejected)

#### Qualification
- Caregiver qualifications and certifications
- File upload support for documents
- Verification and approval system

#### Chat & Messages
- Real-time messaging system
- Message history and read status
- User-to-user communication

#### Notification
- System notifications
- Real-time push notifications
- Read status tracking

#### AuditLog
- Comprehensive audit trail
- Admin action logging
- Security and compliance tracking

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- Bun (recommended) or npm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd express-care-app
   ```

2. **Install dependencies**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/express_care_app"
   JWT_SECRET="your-super-secret-jwt-key"
   PORT=3000
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   bun run prisma generate
   
   # Run database migrations
   bun run prisma migrate dev
   
   # (Optional) Seed the database
   bun run prisma db seed
   ```

5. **Start the development server**
   ```bash
   bun run dev
   # or
   npm run dev
   ```

The server will start on `http://localhost:3000`

## 📡 API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

### Admin Management
- `GET /api/admin/users` - Get all users (admin only)
- `POST /api/admin/users` - Create new user (admin only)
- `DELETE /api/admin/users/:id` - Delete user (admin only)
- `GET /api/admin/caregivers` - Get all caregivers (admin only)
- `GET /api/admin/patients` - Get all patients (admin only)
- `POST /api/admin/assign` - Assign caregiver to patient (admin only)
- `POST /api/admin/verifications/:id/approve` - Approve verification (admin only)
- `POST /api/admin/verifications/:id/reject` - Reject verification (admin only)

### Caregiver Management
- `GET /api/caregivers` - Get all caregivers (with filtering)
- `GET /api/caregivers/:id` - Get caregiver details
- `PUT /api/caregivers/availability` - Update availability
- `POST /api/caregivers/qualifications` - Add qualification
- `POST /api/caregivers/verification` - Submit verification documents

### Patient Management
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get patient details
- `POST /api/patients` - Create patient profile
- `PUT /api/patients/:id` - Update patient profile

### Chat System
- `GET /api/chat` - Get user chats
- `POST /api/chat` - Create new chat
- `GET /api/chat/:chatId/messages` - Get chat messages
- `POST /api/chat/:chatId/messages` - Send message

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read

### Patient-Caregiver Matching
- `GET /api/matches` - Get available caregiver matches for current signed in patient user


## 🔧 Development

### Available Scripts
```bash
# Development
bun run dev          # Start development server with hot reload
bun run kai          # Alternative dev command

# Production
bun run build        # Build TypeScript to JavaScript
bun run start        # Start production server

# Database
bun run prisma       # Run Prisma CLI commands
```

### Code Quality
- **TypeScript**: Full type safety throughout the application
- **ESLint**: Code linting and style enforcement
- **Prettier**: Code formatting
- **Zod**: Runtime type validation for API requests

### Database Management
```bash
# Generate Prisma client after schema changes
bun run prisma generate

# Create new migration
bun run prisma migrate dev --name migration_name

# Reset database (development only)
bun run prisma migrate reset

# View database in Prisma Studio
bun run prisma studio
```

## 🔐 Security Features

### Authentication & Authorization
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Middleware-based route protection
- Secure password hashing with bcrypt

### Data Protection
- Input validation with Zod schemas
- SQL injection prevention with Prisma ORM
- File upload security with Multer
- CORS configuration for cross-origin requests

### Audit & Compliance
- Comprehensive audit logging for admin actions
- User action tracking
- Data access monitoring
- Security event logging

## 📊 Real-time Features

### WebSocket Integration
- Real-time chat messaging
- Live notification delivery
- User presence tracking
- Instant status updates

### Notification System
- Push notifications for important events
- Email-style notification center
- Read/unread status tracking
- Customizable notification types

## 🚀 Deployment

### Environment Variables
```env
DATABASE_URL="postgresql://username:password@host:port/database"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3000
NODE_ENV="production"
```

### Production Build
```bash
# Install dependencies
bun install --production

# Build the application
bun run build

# Start production server
bun run start
```

### Docker Deployment (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation in the `/docs` folder

---

**Express Care App** - Connecting patients with qualified caregivers through a secure, real-time platform.
