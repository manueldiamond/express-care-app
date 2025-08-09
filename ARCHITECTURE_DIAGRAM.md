# Express Care App - Architecture Diagrams

## 🏗️ System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        Web[Web App]
        Mobile[Mobile App]
        Admin[Admin Dashboard]
    end
    
    subgraph "API Gateway"
        Express[Express.js Server]
        Auth[Authentication Middleware]
        RBAC[Role-Based Access Control]
    end
    
    subgraph "Business Logic Layer"
        AuthService[Auth Service]
        CaregiverService[Caregiver Service]
        PatientService[Patient Service]
        AdminService[Admin Service]
        ChatService[Chat Service]
        NotificationService[Notification Service]
    end
    
    subgraph "Data Layer"
        Prisma[Prisma ORM]
        PostgreSQL[(PostgreSQL Database)]
        FileStorage[File Storage]
    end
    
    subgraph "Real-time Layer"
        SocketIO[Socket.io Server]
        WebSocket[WebSocket Connections]
    end
    
    Web --> Express
    Mobile --> Express
    Admin --> Express
    
    Express --> Auth
    Auth --> RBAC
    
    Express --> AuthService
    Express --> CaregiverService
    Express --> PatientService
    Express --> AdminService
    Express --> ChatService
    Express --> NotificationService
    
    AuthService --> Prisma
    CaregiverService --> Prisma
    PatientService --> Prisma
    AdminService --> Prisma
    ChatService --> Prisma
    NotificationService --> Prisma
    
    Prisma --> PostgreSQL
    CaregiverService --> FileStorage
    PatientService --> FileStorage
    
    ChatService --> SocketIO
    NotificationService --> SocketIO
    SocketIO --> WebSocket
    WebSocket --> Web
    WebSocket --> Mobile
    WebSocket --> Admin
```

## 🔄 Data Flow Diagram

```mermaid
sequenceDiagram
    participant Client
    participant Express
    participant Auth
    participant Service
    participant Prisma
    participant Database
    participant SocketIO
    participant Notification

    Client->>Express: API Request
    Express->>Auth: Validate JWT Token
    Auth->>Express: Token Valid/Invalid
    
    alt Token Valid
        Express->>Service: Route to Service Layer
        Service->>Prisma: Database Query
        Prisma->>Database: Execute Query
        Database->>Prisma: Return Data
        Prisma->>Service: Processed Data
        Service->>Express: Response Data
        
        alt Real-time Event
            Service->>SocketIO: Emit Event
            SocketIO->>Notification: Send Notification
            Notification->>Client: Push Notification
        end
        
        Express->>Client: API Response
    else Token Invalid
        Express->>Client: 401 Unauthorized
    end
```

## 👥 User Role Relationships

```mermaid
erDiagram
    User {
        int id PK
        string email
        string passwordHash
        string fullname
        enum role
        string photoUrl
        string contact
        date dateOfBirth
        string location
        datetime createdAt
        datetime updatedAt
    }
    
    Admin {
        int id PK
        int userId FK
        string[] permissions
    }
    
    CaregiverProfile {
        int id PK
        int userId FK
        string type
        boolean isVerified
        boolean isActive
        boolean isAvailable
        string schedule
        string bio
        string educationLevel
    }
    
    Patient {
        int id PK
        int userId FK
        string medicalHistory
        string condition
        string years
        string schedule
        string description
        string special
    }
    
    Assignment {
        int id PK
        int patientId FK
        int caregiverId FK
        int assignedBy FK
        datetime assignedAt
        string status
        string notes
    }
    
    Verification {
        int id PK
        int caregiverProfileId FK
        string documentType
        string document
        string photo
        enum status
        int approvedBy FK
        datetime approvedAt
    }
    
    Qualification {
        int id PK
        int caregiverProfileId FK
        string title
        string fileURL
        datetime createdAt
        datetime updatedAt
    }
    
    Chat {
        int id PK
        int userAId FK
        int userBId FK
        datetime createdAt
        datetime updatedAt
    }
    
    Message {
        int id PK
        int chatId FK
        int senderId FK
        string content
        datetime createdAt
        boolean read
    }
    
    Notification {
        int id PK
        int userId FK
        string type
        string message
        boolean isRead
        datetime createdAt
    }
    
    AuditLog {
        int id PK
        int adminId FK
        enum action
        int targetUserId FK
        string details
        string ipAddress
        string userAgent
        datetime createdAt
    }
    
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
```

## 🔐 Authentication & Authorization Flow

```mermaid
flowchart TD
    A[User Login] --> B{Valid Credentials?}
    B -->|No| C[Return 401 Error]
    B -->|Yes| D[Generate JWT Token]
    D --> E[Return Token to Client]
    
    F[API Request] --> G{Token Present?}
    G -->|No| H[Return 401 Unauthorized]
    G -->|Yes| I[Verify JWT Token]
    I --> J{Token Valid?}
    J -->|No| K[Return 401 Unauthorized]
    J -->|Yes| L[Extract User Info]
    L --> M{Required Role?}
    M -->|No| N[Process Request]
    M -->|Yes| O{User Has Role?}
    O -->|No| P[Return 403 Forbidden]
    O -->|Yes| Q[Process Request]
    
    N --> R[Return Response]
    Q --> R
```

## 📊 Database Schema Relationships

```mermaid
graph LR
    subgraph "Core Entities"
        User[User]
        Admin[Admin]
        Caregiver[CaregiverProfile]
        Patient[Patient]
    end
    
    subgraph "Relationships"
        Assignment[Assignment]
        Verification[Verification]
        Qualification[Qualification]
    end
    
    subgraph "Communication"
        Chat[Chat]
        Message[Message]
        Notification[Notification]
    end
    
    subgraph "Audit"
        AuditLog[AuditLog]
    end
    
    User --> Admin
    User --> Caregiver
    User --> Patient
    User --> Notification
    User --> Chat
    User --> Message
    
    Caregiver --> Verification
    Caregiver --> Qualification
    Caregiver --> Assignment
    
    Patient --> Assignment
    
    Admin --> AuditLog
    Admin --> Verification
    Admin --> Assignment
    
    Chat --> Message
```

## 🔄 Real-time Communication Flow

```mermaid
sequenceDiagram
    participant Client
    participant SocketIO
    participant NotificationService
    participant Database
    participant OtherClients

    Client->>SocketIO: Connect with userId
    SocketIO->>SocketIO: Join user room
    
    Note over Client,OtherClients: Real-time Events
    
    alt New Message
        Client->>SocketIO: Send Message
        SocketIO->>Database: Save Message
        SocketIO->>OtherClients: Broadcast Message
    end
    
    alt New Notification
        NotificationService->>SocketIO: Create Notification
        SocketIO->>Database: Save Notification
        SocketIO->>Client: Push Notification
    end
    
    alt Status Update
        Client->>SocketIO: Update Status
        SocketIO->>Database: Update Status
        SocketIO->>OtherClients: Broadcast Status
    end
```

## 🛡️ Security Architecture

```mermaid
graph TB
    subgraph "Client Security"
        HTTPS[HTTPS/TLS]
        JWTStorage[JWT Storage]
        InputValidation[Input Validation]
    end
    
    subgraph "API Security"
        RateLimiting[Rate Limiting]
        CORS[CORS Policy]
        Helmet[Security Headers]
    end
    
    subgraph "Authentication"
        JWTVerification[JWT Verification]
        PasswordHashing[Bcrypt Hashing]
        RoleValidation[Role Validation]
    end
    
    subgraph "Data Security"
        SQLInjection[SQL Injection Prevention]
        XSS[XSS Prevention]
        FileValidation[File Upload Validation]
    end
    
    subgraph "Audit & Monitoring"
        AuditLogging[Audit Logging]
        ErrorTracking[Error Tracking]
        SecurityMonitoring[Security Monitoring]
    end
    
    HTTPS --> RateLimiting
    RateLimiting --> CORS
    CORS --> Helmet
    Helmet --> JWTVerification
    JWTVerification --> PasswordHashing
    PasswordHashing --> RoleValidation
    RoleValidation --> SQLInjection
    SQLInjection --> XSS
    XSS --> FileValidation
    FileValidation --> AuditLogging
    AuditLogging --> ErrorTracking
    ErrorTracking --> SecurityMonitoring
```

## 📈 System Performance Metrics

```mermaid
graph LR
    subgraph "Performance Indicators"
        ResponseTime[Response Time]
        Throughput[Throughput]
        ErrorRate[Error Rate]
        Uptime[Uptime]
    end
    
    subgraph "Monitoring"
        APIMetrics[API Metrics]
        DatabaseMetrics[Database Metrics]
        WebSocketMetrics[WebSocket Metrics]
        FileUploadMetrics[File Upload Metrics]
    end
    
    subgraph "Optimization"
        Caching[Caching Strategy]
        DatabaseIndexing[Database Indexing]
        ConnectionPooling[Connection Pooling]
        LoadBalancing[Load Balancing]
    end
    
    ResponseTime --> APIMetrics
    Throughput --> DatabaseMetrics
    ErrorRate --> WebSocketMetrics
    Uptime --> FileUploadMetrics
    
    APIMetrics --> Caching
    DatabaseMetrics --> DatabaseIndexing
    WebSocketMetrics --> ConnectionPooling
    FileUploadMetrics --> LoadBalancing
```

---

These diagrams provide a comprehensive view of the Express Care App's architecture, data flow, security model, and performance considerations. The system is designed to be scalable, secure, and maintainable while providing real-time communication capabilities for healthcare professionals and patients. 