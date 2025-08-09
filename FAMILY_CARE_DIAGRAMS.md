# Family Care Platform - Comprehensive Diagrams

## 🏗️ Platform Overview

**Family Care** is a comprehensive healthcare platform that connects patients with qualified caregivers through:
- **Backend API**: Express.js with TypeScript and Prisma ORM
- **Mobile App**: Expo React Native for caregivers and patients
- **Admin Panel**: Vite React web application for administrators
- **Real-time Features**: WebSocket communication and push notifications

---

## 1. UML Class Diagram - Core Models (Backend)

```mermaid
classDiagram
    class User {
        +Int id
        +String email
        +String passwordHash
        +String fullname
        +Role role
        +String photoUrl
        +String contact
        +DateTime dateOfBirth
        +String location
        +DateTime createdAt
        +DateTime updatedAt
        +createUser()
        +getUserByEmail()
        +getUserById()
    }

    class Admin {
        +Int id
        +Int userId
        +String[] permissions
        +createAdmin()
        +getAllAdmins()
        +auditLog()
    }

    class CaregiverProfile {
        +Int id
        +Int userId
        +String type
        +Boolean isVerified
        +Boolean isActive
        +Boolean isAvailable
        +String schedule
        +String bio
        +String educationLevel
        +createCaregiver()
        +updateCaregiver()
        +getCaregiverById()
    }

    class Patient {
        +Int id
        +Int userId
        +String medicalHistory
        +String condition
        +String years
        +String schedule
        +String description
        +String special
        +createPatient()
        +getPatientById()
        +getAllPatients()
    }

    class Assignment {
        +Int id
        +Int patientId
        +Int caregiverId
        +Int assignedBy
        +DateTime assignedAt
        +String status
        +String notes
        +createAssignment()
        +updateAssignment()
        +getAssignmentsByPatient()
    }

    class Verification {
        +Int id
        +Int caregiverProfileId
        +String documentType
        +String document
        +String photo
        +VerificationStatus status
        +Int approvedBy
        +DateTime approvedAt
        +createVerification()
        +approveVerification()
        +rejectVerification()
    }

    class Qualification {
        +Int id
        +Int caregiverProfileId
        +String title
        +String fileURL
        +DateTime createdAt
        +DateTime updatedAt
        +createQualification()
        +getQualifications()
        +deleteQualification()
    }

    class Chat {
        +Int id
        +Int userAId
        +Int userBId
        +DateTime createdAt
        +DateTime updatedAt
        +createChat()
        +getChatById()
    }

    class Message {
        +Int id
        +Int chatId
        +Int senderId
        +String content
        +DateTime createdAt
        +Boolean read
        +sendMessage()
        +markAsRead()
    }

    class Notification {
        +Int id
        +Int userId
        +String type
        +String message
        +Boolean isRead
        +DateTime createdAt
        +createNotification()
        +markAsRead()
        +getUserNotifications()
    }

    class AuditLog {
        +Int id
        +Int adminId
        +AuditAction action
        +Int targetUserId
        +String details
        +String ipAddress
        +String userAgent
        +DateTime createdAt
        +logAction()
        +getAuditLogs()
    }

    %% Relationships
    User ||--|| Admin : "has one"
    User ||--|| CaregiverProfile : "has one"
    User ||--|| Patient : "has one"
    User ||--o{ Notification : "receives"
    User ||--o{ Chat : "participates"
    User ||--o{ Message : "sends"

    CaregiverProfile ||--|| Verification : "has one"
    CaregiverProfile ||--o{ Qualification : "has many"
    CaregiverProfile ||--o{ Assignment : "assigned to"

    Patient ||--o{ Assignment : "assigned to"

    Admin ||--o{ AuditLog : "creates"
    Admin ||--o{ Verification : "approves"
    Admin ||--o{ Assignment : "assigns"

    Chat ||--o{ Message : "contains"

    %% Inheritance/Shared Fields
    note for User "Base entity with common fields:\n- id, email, fullname, role\n- photoUrl, contact, location\n- createdAt, updatedAt"
    
    note for CaregiverProfile "Extends User with:\n- Professional credentials\n- Availability status\n- Verification status"
    
    note for Patient "Extends User with:\n- Medical information\n- Care requirements\n- Assignment history"
    
    note for Admin "Extends User with:\n- Administrative permissions\n- Audit capabilities\n- System management"
```

---

## 2. API Integration Flow

```mermaid
sequenceDiagram
    participant Frontend as Frontend (React/Expo)
    participant Axios as Axios Client
    participant API as Express API
    participant Middleware as Middleware Layer
    participant Controller as Route Controller
    participant Prisma as Prisma ORM
    participant DB as PostgreSQL
    participant Storage as File Storage
    participant JWT as JWT Service
    participant Zod as Zod Validation

    Note over Frontend,DB: Authentication Flow
    Frontend->>Axios: POST /api/login
    Axios->>API: HTTP Request
    API->>Zod: Validate request body
    Zod->>API: Validation result
    API->>Controller: Route to auth controller
    Controller->>Prisma: Query user by email
    Prisma->>DB: SQL Query
    DB->>Prisma: User data
    Prisma->>Controller: User object
    Controller->>JWT: Generate JWT token
    JWT->>Controller: Token
    Controller->>API: Response with token
    API->>Axios: JSON Response
    Axios->>Frontend: Token stored

    Note over Frontend,DB: Protected API Request
    Frontend->>Axios: GET /api/caregivers (with JWT)
    Axios->>API: HTTP Request with Authorization header
    API->>Middleware: requireAuth middleware
    Middleware->>JWT: Verify JWT token
    JWT->>Middleware: Decoded user info
    Middleware->>API: User attached to request
    API->>Zod: Validate query parameters
    Zod->>API: Validation result
    API->>Controller: Route to caregivers controller
    Controller->>Prisma: Query caregivers
    Prisma->>DB: SQL Query
    DB->>Prisma: Caregiver data
    Prisma->>Controller: Caregiver objects
    Controller->>Storage: getPublicUrl() for photos
    Storage->>Controller: Full URLs
    Controller->>API: Response with mapped URLs
    API->>Axios: JSON Response
    Axios->>Frontend: Caregiver list with photos

    Note over Frontend,DB: File Upload Flow
    Frontend->>Axios: POST /api/caregivers/qualifications (with file)
    Axios->>API: Multipart form data
    API->>Zod: Validate file and data
    Zod->>API: Validation result
    API->>Controller: Route to qualifications controller
    Controller->>Storage: Save file to uploads/
    Storage->>Controller: File path
    Controller->>Prisma: Save qualification record
    Prisma->>DB: SQL Insert
    DB->>Prisma: Qualification ID
    Prisma->>Controller: Qualification object
    Controller->>API: Response with qualification
    API->>Axios: JSON Response
    Axios->>Frontend: Qualification created
```

---

## 3. AI Matching System (@caregiverMatching.ts)

```mermaid
graph TB
    subgraph "Input Data"
        Patient[Patient Data]
        Caregivers[Caregiver Profiles]
        PatientText[Patient Text Representation]
        CaregiverTexts[Caregiver Text Representations]
    end

    subgraph "Text Processing"
        TP1[Extract patient condition]
        TP2[Extract patient schedule]
        TP3[Extract patient special needs]
        TP4[Extract caregiver qualifications]
        TP5[Extract caregiver bio]
        TP6[Extract caregiver type]
    end

    subgraph "AI Matching Engine"
        EmbeddingModel[Xenova/all-MiniLM-L6-v2]
        PatientEmbedding[Patient Embedding]
        CaregiverEmbeddings[Caregiver Embeddings]
        CosineSimilarity[Cosine Similarity Calculator]
        LocationMatcher[Location Similarity Calculator]
    end

    subgraph "Scoring System"
        SemanticScore[Semantic Score 70%]
        LocationScore[Location Score 30%]
        FinalScore[Combined Final Score]
        MinScoreFilter[Minimum Score Filter]
    end

    subgraph "Ghana Location Mapping"
        Regions[Ghanaian Regions]
        Cities[Major Cities]
        NearbyRegions[Nearby Regions Logic]
        LocationScoreCalc[Location Score Calculator]
    end

    subgraph "Output"
        RankedCaregivers[Ranked Caregiver Matches]
        MatchScores[Individual Match Scores]
        FilteredResults[Filtered Results]
    end

    Patient --> PatientText
    Caregivers --> CaregiverTexts
    
    PatientText --> TP1
    PatientText --> TP2
    PatientText --> TP3
    CaregiverTexts --> TP4
    CaregiverTexts --> TP5
    CaregiverTexts --> TP6

    TP1 --> EmbeddingModel
    TP2 --> EmbeddingModel
    TP3 --> EmbeddingModel
    TP4 --> EmbeddingModel
    TP5 --> EmbeddingModel
    TP6 --> EmbeddingModel

    EmbeddingModel --> PatientEmbedding
    EmbeddingModel --> CaregiverEmbeddings

    PatientEmbedding --> CosineSimilarity
    CaregiverEmbeddings --> CosineSimilarity
    CosineSimilarity --> SemanticScore

    Patient --> LocationMatcher
    Caregivers --> LocationMatcher
    LocationMatcher --> Regions
    LocationMatcher --> Cities
    LocationMatcher --> NearbyRegions
    Regions --> LocationScoreCalc
    Cities --> LocationScoreCalc
    NearbyRegions --> LocationScoreCalc
    LocationScoreCalc --> LocationScore

    SemanticScore --> FinalScore
    LocationScore --> FinalScore
    FinalScore --> MinScoreFilter
    MinScoreFilter --> RankedCaregivers
    RankedCaregivers --> MatchScores
    MatchScores --> FilteredResults

    style EmbeddingModel fill:#ff9999
    style CosineSimilarity fill:#99ccff
    style LocationMatcher fill:#99ff99
    style FinalScore fill:#ffcc99
```

---

## 4. Caregiver Onboarding Flow

```mermaid
flowchart TD
    Start([User Registration]) --> Register[POST /api/register]
    Register --> RoleCheck{Role = Caregiver?}
    RoleCheck -->|No| End([End])
    RoleCheck -->|Yes| CreateProfile[Create Caregiver Profile]
    
    CreateProfile --> ProfileUpdate[Update Basic Profile]
    ProfileUpdate --> TypeSelection[Select Caregiver Type]
    TypeSelection --> ScheduleSelection[Set Availability Schedule]
    ScheduleSelection --> BioEntry[Add Professional Bio]
    BioEntry --> EducationLevel[Set Education Level]
    
    EducationLevel --> Qualifications[Add Qualifications]
    Qualifications --> UploadDocs[Upload Qualification Documents]
    UploadDocs --> QualificationValidation{Valid Documents?}
    QualificationValidation -->|No| RejectQual[Reject Qualifications]
    QualificationValidation -->|Yes| ApproveQual[Approve Qualifications]
    
    ApproveQual --> Verification[Submit Verification Documents]
    Verification --> UploadVerification[Upload ID/Photo Documents]
    UploadVerification --> AdminReview[Admin Review Process]
    AdminReview --> VerificationCheck{Documents Valid?}
    VerificationCheck -->|No| RejectVer[Reject Verification]
    VerificationCheck -->|Yes| ApproveVer[Approve Verification]
    
    ApproveVer --> AvailabilityToggle[Set Availability Status]
    AvailabilityToggle --> PlatformListing[List on Platform]
    PlatformListing --> Matching[Available for Patient Matching]
    
    subgraph "Admin Approval Process"
        AdminReview --> AdminDashboard[Admin Dashboard]
        AdminDashboard --> ReviewDocs[Review Documents]
        ReviewDocs --> Decision{Approve/Reject?}
        Decision -->|Approve| ApproveVer
        Decision -->|Reject| RejectVer
    end
    
    subgraph "Document Types"
        IDCard[National ID Card]
        DriversLicense[Driver's License]
        Passport[Passport]
        ProfessionalLicense[Professional License]
    end
    
    subgraph "Qualification Types"
        NursingCert[Nursing Certificate]
        FirstAidCert[First Aid Certification]
        CPRTraining[CPR Training]
        MedicalAssistant[Medical Assistant Certificate]
    end
    
    subgraph "Caregiver Types"
        Nurse[Nurse]
        Doctor[Doctor]
        TrainedCaregiver[Trained Caregiver]
        Individual[Individual]
    end
    
    subgraph "Availability Options"
        FullTime[Full-time]
        WeekDays[Week Days]
        WeekEnds[Weekends]
        Emergency[Emergency]
    end
    
    style Start fill:#e1f5fe
    style PlatformListing fill:#c8e6c9
    style AdminDashboard fill:#fff3e0
    style RejectVer fill:#ffcdd2
    style ApproveVer fill:#c8e6c9
```

---

## 5. File Storage & URL Mapping System

```mermaid
graph TB
    subgraph "File Upload Process"
        Upload[File Upload Request]
        Multer[Multer Middleware]
        Validation[File Validation]
        Storage[Local File Storage]
        Database[Save File Path to DB]
    end

    subgraph "URL Mapping System"
        Request[API Request]
        getPublicUrl[getPublicUrl Function]
        Protocol[Extract Protocol]
        Host[Extract Host]
        FullURL[Construct Full URL]
    end

    subgraph "Public URL Mappings"
        mapUserWithPhoto[mapUserWithPhoto]
        mapCaregiverWithPhoto[mapCaregiverWithPhoto]
        mapPatientWithPhoto[mapPatientWithPhoto]
        mapVerificationWithPhoto[mapVerificationWithPhoto]
        mapQualificationWithPhoto[mapQualificationWithPhoto]
    end

    subgraph "File Types"
        Photos[Profile Photos]
        Documents[Verification Documents]
        Qualifications[Qualification Files]
        MedicalDocs[Medical Documents]
    end

    subgraph "Storage Structure"
        UploadsDir[/uploads/]
        PhotosDir[/uploads/photos/]
        DocsDir[/uploads/documents/]
        QualDir[/uploads/qualifications/]
    end

    Upload --> Multer
    Multer --> Validation
    Validation --> Storage
    Storage --> Database
    Database --> Request

    Request --> getPublicUrl
    getPublicUrl --> Protocol
    getPublicUrl --> Host
    Protocol --> FullURL
    Host --> FullURL

    FullURL --> mapUserWithPhoto
    FullURL --> mapCaregiverWithPhoto
    FullURL --> mapPatientWithPhoto
    FullURL --> mapVerificationWithPhoto
    FullURL --> mapQualificationWithPhoto

    Photos --> PhotosDir
    Documents --> DocsDir
    Qualifications --> QualDir
    MedicalDocs --> DocsDir

    style getPublicUrl fill:#ff9999
    style mapCaregiverWithPhoto fill:#99ccff
    style FullURL fill:#99ff99
```

---

## 6. Scalability Plan Overview

```mermaid
graph TB
    subgraph "Current Architecture"
        CA1[Express.js Backend]
        CA2[PostgreSQL Database]
        CA3[Local File Storage]
        CA4[Socket.io WebSockets]
        CA5[Single Server Deployment]
    end

    subgraph "Phase 1: Performance Optimization"
        PO1[Redis Caching Layer]
        PO2[Database Connection Pooling]
        PO3[File Upload Optimization]
        PO4[API Response Caching]
        PO5[CDN for Static Assets]
    end

    subgraph "Phase 2: Infrastructure Scaling"
        IS1[Load Balancer (Nginx)]
        IS2[Multiple API Servers]
        IS3[Database Read Replicas]
        IS4[Redis Cluster]
        IS5[Object Storage (AWS S3/DO Spaces)]
    end

    subgraph "Phase 3: Advanced Features"
        AF1[WebRTC for Video Calls]
        AF2[Push Notifications (FCM/APNS)]
        AF3[Real-time Location Tracking]
        AF4[Advanced Analytics Dashboard]
        AF5[Machine Learning Pipeline]
    end

    subgraph "Phase 4: Cloud Migration"
        CM1[DigitalOcean App Platform]
        CM2[Google Cloud Platform]
        CM3[Kubernetes Orchestration]
        CM4[Auto-scaling Groups]
        CM5[Global CDN Distribution]
    end

    subgraph "Deployment Options"
        DO1[DigitalOcean Droplets]
        DO2[DigitalOcean App Platform]
        DO3[Google Cloud Run]
        DO4[Google Cloud Compute Engine]
        DO5[AWS EC2/AWS ECS]
    end

    CA1 --> PO1
    CA2 --> PO2
    CA3 --> PO3
    CA4 --> PO4
    CA5 --> PO5

    PO1 --> IS1
    PO2 --> IS2
    PO3 --> IS3
    PO4 --> IS4
    PO5 --> IS5

    IS1 --> AF1
    IS2 --> AF2
    IS3 --> AF3
    IS4 --> AF4
    IS5 --> AF5

    AF1 --> CM1
    AF2 --> CM2
    AF3 --> CM3
    AF4 --> CM4
    AF5 --> CM5

    CM1 --> DO1
    CM2 --> DO2
    CM3 --> DO3
    CM4 --> DO4
    CM5 --> DO5

    style CA1 fill:#e3f2fd
    style PO1 fill:#f3e5f5
    style IS1 fill:#e8f5e8
    style AF1 fill:#fff3e0
    style CM1 fill:#fce4ec
```

---

## 7. Platform Architecture Overview

```mermaid
graph TB
    subgraph "Frontend Applications"
        MobileApp[Expo React Native App<br/>Caregivers & Patients]
        AdminPanel[Vite React Admin Panel<br/>Administrators Only]
    end

    subgraph "Backend API Layer"
        ExpressAPI[Express.js API Server<br/>TypeScript + Prisma]
        AuthMiddleware[JWT Authentication<br/>Role-based Access]
        ValidationLayer[Zod Validation<br/>Request/Response]
        FileUpload[Multer File Upload<br/>Document Management]
    end

    subgraph "Real-time Communication"
        SocketIO[Socket.io Server<br/>WebSocket Connections]
        ChatSystem[Real-time Chat<br/>Instant Messaging]
        Notifications[Push Notifications<br/>Event Broadcasting]
    end

    subgraph "Data Layer"
        PostgreSQL[(PostgreSQL Database<br/>Primary Data Store)]
        PrismaORM[Prisma ORM<br/>Database Abstraction)]
        FileStorage[Local File Storage<br/>Uploads Directory]
    end

    subgraph "AI & Matching"
        MatchingEngine[AI Matching Engine<br/>@caregiverMatching.ts]
        EmbeddingModel[Xenova Transformers<br/>Semantic Analysis]
        LocationService[Location Matching<br/>Ghanaian Regions]
        ScoringSystem[Match Scoring<br/>Semantic + Location]
    end

    MobileApp --> ExpressAPI
    AdminPanel --> ExpressAPI
    
    ExpressAPI --> AuthMiddleware
    ExpressAPI --> ValidationLayer
    ExpressAPI --> FileUpload
    
    ExpressAPI --> SocketIO
    SocketIO --> ChatSystem
    SocketIO --> Notifications
    SocketIO --> PresenceTracking
    
    ExpressAPI --> PostgreSQL
    ExpressAPI --> PrismaORM
    ExpressAPI --> FileStorage
    
    ExpressAPI --> MatchingEngine
    MatchingEngine --> EmbeddingModel
    MatchingEngine --> LocationService
    MatchingEngine --> ScoringSystem
    
 

    style MobileApp fill:#e8f5e8
    style AdminPanel fill:#fff3e0
    style ExpressAPI fill:#e3f2fd
    style MatchingEngine fill:#fce4ec
```

---

## 8. Technology Stack Integration

```mermaid
graph LR
    subgraph "Frontend Stack"
        ReactNative[React Native<br/>Expo]
        ReactWeb[React<br/>Vite]
        TypeScript[TypeScript]
        TailwindCSS[Tailwind CSS]
    end

    subgraph "Backend Stack"
        NodeJS[Node.js]
        ExpressJS[Express.js]
        TypeScriptBackend[TypeScript]
        PrismaORM[Prisma ORM]
    end

    subgraph "Database & Storage"
        PostgreSQL[(PostgreSQL)]
        Redis[(Redis Cache)]
        LocalStorage[Local File Storage]
        CDN[CDN for Assets]
    end

    subgraph "Real-time & AI"
        SocketIO[Socket.io]
        XenovaTransformers[Xenova Transformers]
        AIEmbeddings[AI Embeddings]
        SemanticMatching[Semantic Matching]
    end

    subgraph "DevOps & Deployment"
        Bun[Bun Package Manager]
        Docker[Docker]
        DigitalOcean[DigitalOcean]
        GCP[Google Cloud Platform]
    end

    ReactNative --> ExpressJS
    ReactWeb --> ExpressJS
    TypeScript --> ExpressJS
    
    ExpressJS --> PostgreSQL
    ExpressJS --> Redis
    ExpressJS --> LocalStorage
    ExpressJS --> CDN
    
    ExpressJS --> SocketIO
    ExpressJS --> XenovaTransformers
    XenovaTransformers --> AIEmbeddings
    AIEmbeddings --> SemanticMatching
    
    ExpressJS --> Bun
    Bun --> Docker
    Docker --> DigitalOcean
    Docker --> GCP

    style ReactNative fill:#e8f5e8
    style ReactWeb fill:#fff3e0
    style ExpressJS fill:#e3f2fd
    style XenovaTransformers fill:#fce4ec
    style Bun fill:#f3e5f5
```

---

## 9. Security & Compliance Architecture

```mermaid
graph TB
    subgraph "Authentication & Authorization"
        JWT[JWT Token System]
        RBAC[Role-Based Access Control]
        PasswordHashing[Bcrypt Password Hashing]
        SessionManagement[Session Management]
    end

    subgraph "Data Protection"
        InputValidation[Zod Input Validation]
        SQLInjection[SQL Injection Prevention]
        XSSPrevention[XSS Prevention]
        FileValidation[File Upload Security]
    end

    subgraph "Audit & Compliance"
        AuditLogging[Comprehensive Audit Logs]
        DataEncryption[Data Encryption at Rest]
        HTTPS[TLS/SSL Encryption]
        GDPRCompliance[GDPR Compliance]
    end

    subgraph "Healthcare Security"
        HIPAACompliance[HIPAA Compliance]
        MedicalDataProtection[Medical Data Protection]
        AccessLogging[Access Logging]
        DataRetention[Data Retention Policies]
    end

    subgraph "Infrastructure Security"
        Firewall[Network Firewall]
        DDoSProtection[DDoS Protection]
        BackupStrategy[Automated Backups]
        DisasterRecovery[Disaster Recovery Plan]
    end

    JWT --> RBAC
    RBAC --> PasswordHashing
    PasswordHashing --> SessionManagement
    
    SessionManagement --> InputValidation
    InputValidation --> SQLInjection
    SQLInjection --> XSSPrevention
    XSSPrevention --> FileValidation
    
    FileValidation --> AuditLogging
    AuditLogging --> DataEncryption
    DataEncryption --> HTTPS
    HTTPS --> GDPRCompliance
    
    GDPRCompliance --> HIPAACompliance
    HIPAACompliance --> MedicalDataProtection
    MedicalDataProtection --> AccessLogging
    AccessLogging --> DataRetention
    
    DataRetention --> Firewall
    Firewall --> DDoSProtection
    DDoSProtection --> BackupStrategy
    BackupStrategy --> DisasterRecovery

    style JWT fill:#e3f2fd
    style AuditLogging fill:#f3e5f5
    style HIPAACompliance fill:#e8f5e8
    style Firewall fill:#fff3e0
```

---

## 10. Mobile App & Admin Panel Integration

```mermaid
graph TB
    subgraph "Mobile App (Expo React Native)"
        MobileAuth[Authentication]
        MobileProfile[Profile Management]
        MobileChat[Real-time Chat]
        MobileNotifications[Push Notifications]
        MobileMatching[Caregiver Matching]
        MobileLocation[Location Services]
    end

    subgraph "Admin Panel (Vite React)"
        AdminAuth[Admin Authentication]
        AdminDashboard[Dashboard Analytics]
        AdminUsers[User Management]
        AdminVerifications[Verification Approval]
        AdminAssignments[Assignment Management]
        AdminReports[Reports & Analytics]
    end

    subgraph "Shared Backend API"
        SharedAPI[Express.js API]
        SharedAuth[JWT Authentication]
        SharedValidation[Zod Validation]
        SharedFileUpload[File Upload]
        SharedWebSocket[Socket.io]
    end

    subgraph "Database & Storage"
        SharedDB[(PostgreSQL)]
        SharedCache[(Redis)]
        SharedStorage[File Storage]
        SharedAI[AI Matching Engine]
    end

    MobileAuth --> SharedAPI
    MobileProfile --> SharedAPI
    MobileChat --> SharedAPI
    MobileNotifications --> SharedAPI
    MobileMatching --> SharedAPI
    MobileLocation --> SharedAPI

    AdminAuth --> SharedAPI
    AdminDashboard --> SharedAPI
    AdminUsers --> SharedAPI
    AdminVerifications --> SharedAPI
    AdminAssignments --> SharedAPI
    AdminReports --> SharedAPI

    SharedAPI --> SharedAuth
    SharedAPI --> SharedValidation
    SharedAPI --> SharedFileUpload
    SharedAPI --> SharedWebSocket

    SharedAuth --> SharedDB
    SharedValidation --> SharedDB
    SharedFileUpload --> SharedStorage
    SharedWebSocket --> SharedCache
    SharedAPI --> SharedAI

    style MobileAuth fill:#e8f5e8
    style AdminAuth fill:#fff3e0
    style SharedAPI fill:#e3f2fd
    style SharedAI fill:#fce4ec
```

---

**Family Care Platform** - A comprehensive healthcare solution connecting patients with qualified caregivers through intelligent matching, real-time communication, and secure administrative oversight. 