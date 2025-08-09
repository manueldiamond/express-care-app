# Express Care App - API Endpoints Diagram

## 🔗 Complete API Endpoints Overview

```mermaid
graph TB
    subgraph "Authentication Endpoints"
        A1[POST /api/register]
        A2[POST /api/login]
        A3[GET /api/profile]
        A4[PUT /api/profile]
    end
    
    subgraph "Admin Management Endpoints"
        AD1[GET /api/admin/users]
        AD2[POST /api/admin/users]
        AD3[DELETE /api/admin/users/:id]
        AD4[GET /api/admin/caregivers]
        AD5[GET /api/admin/patients]
        AD6[POST /api/admin/assign]
        AD7[POST /api/admin/verifications/:id/approve]
        AD8[POST /api/admin/verifications/:id/reject]
        AD9[GET /api/admin/dashboard]
        AD10[GET /api/admin/reports]
    end
    
    subgraph "Caregiver Management Endpoints"
        C1[GET /api/caregivers]
        C2[GET /api/caregivers/:id]
        C3[PUT /api/caregivers/availability]
        C4[POST /api/caregivers/qualifications]
        C5[GET /api/caregivers/qualifications]
        C6[DELETE /api/caregivers/qualifications/:id]
        C7[POST /api/caregivers/verification]
        C8[GET /api/caregivers/verification]
    end
    
    subgraph "Patient Management Endpoints"
        P1[GET /api/patients]
        P2[GET /api/patients/:id]
        P3[POST /api/patients]
        P4[PUT /api/patients/:id]
    end
    
    subgraph "Chat System Endpoints"
        CH1[GET /api/chat]
        CH2[POST /api/chat]
        CH3[GET /api/chat/:chatId/messages]
        CH4[POST /api/chat/:chatId/messages]
    end
    
    subgraph "Notification Endpoints"
        N1[GET /api/notifications]
        N2[PUT /api/notifications/:id/read]
        N3[DELETE /api/notifications/:id]
    end
    
    subgraph "Matching Endpoints"
        M1[GET /api/matches]
        M2[POST /api/matches/request]
    end
    
    subgraph "File Upload Endpoints"
        F1[POST /api/upload/photo]
        F2[POST /api/upload/document]
        F3[GET /uploads/:filename]
    end
```

## 🔐 Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant Auth
    participant Database
    participant JWT

    Note over Client,JWT: Registration Flow
    Client->>Auth: POST /api/register
    Auth->>Database: Check if user exists
    Database->>Auth: User not found
    Auth->>Auth: Hash password
    Auth->>Database: Create user
    Database->>Auth: User created
    Auth->>JWT: Generate JWT token
    JWT->>Auth: Token generated
    Auth->>Client: Return token

    Note over Client,JWT: Login Flow
    Client->>Auth: POST /api/login
    Auth->>Database: Find user by email
    Database->>Auth: User found
    Auth->>Auth: Verify password
    Auth->>JWT: Generate JWT token
    JWT->>Auth: Token generated
    Auth->>Client: Return token
```

## 👥 User Role Access Matrix

```mermaid
graph LR
    subgraph "Public Endpoints"
        P1[POST /api/register]
        P2[POST /api/login]
        P3[GET /api/caregivers]
        P4[GET /api/matches]
    end
    
    subgraph "Patient Endpoints"
        PAT1[GET /api/profile]
        PAT2[PUT /api/profile]
        PAT3[GET /api/patients]
        PAT4[GET /api/chat]
        PAT5[GET /api/notifications]
    end
    
    subgraph "Caregiver Endpoints"
        CAR1[PUT /api/caregivers/availability]
        CAR2[POST /api/caregivers/qualifications]
        CAR3[POST /api/caregivers/verification]
        CAR4[GET /api/caregivers/verification]
    end
    
    subgraph "Admin Endpoints"
        ADM1[GET /api/admin/users]
        ADM2[POST /api/admin/users]
        ADM3[DELETE /api/admin/users/:id]
        ADM4[POST /api/admin/assign]
        ADM5[POST /api/admin/verifications/:id/approve]
        ADM6[GET /api/admin/dashboard]
    end
    
    P1 --> P2
    P2 --> P3
    P3 --> P4
    
    PAT1 --> PAT2
    PAT2 --> PAT3
    PAT3 --> PAT4
    PAT4 --> PAT5
    
    CAR1 --> CAR2
    CAR2 --> CAR3
    CAR3 --> CAR4
    
    ADM1 --> ADM2
    ADM2 --> ADM3
    ADM3 --> ADM4
    ADM4 --> ADM5
    ADM5 --> ADM6
```

## 📊 API Response Structure

```mermaid
graph TD
    subgraph "Success Response"
        S1[Status: 200/201]
        S2[Data: Object/Array]
        S3[Message: String]
    end
    
    subgraph "Error Response"
        E1[Status: 400/401/403/404/500]
        E2[Error: String]
        E3[Details: Object]
    end
    
    subgraph "Paginated Response"
        P1[Data: Array]
        P2[Pagination: Object]
        P3[Total: Number]
        P4[Page: Number]
        P5[Limit: Number]
    end
    
    S1 --> S2
    S2 --> S3
    
    E1 --> E2
    E2 --> E3
    
    P1 --> P2
    P2 --> P3
    P3 --> P4
    P4 --> P5
```

## 🔄 Real-time API Flow

```mermaid
sequenceDiagram
    participant Client
    participant WebSocket
    participant ChatService
    participant NotificationService
    participant Database

    Note over Client,Database: WebSocket Connection
    Client->>WebSocket: Connect with userId
    WebSocket->>WebSocket: Join user room
    
    Note over Client,Database: Real-time Chat
    Client->>WebSocket: Send message
    WebSocket->>ChatService: Process message
    ChatService->>Database: Save message
    ChatService->>WebSocket: Broadcast to recipients
    WebSocket->>Client: Deliver message
    
    Note over Client,Database: Real-time Notifications
    NotificationService->>WebSocket: Create notification
    WebSocket->>Database: Save notification
    WebSocket->>Client: Push notification
```

## 📁 File Upload Flow

```mermaid
flowchart TD
    A[Client Upload] --> B{File Type Valid?}
    B -->|No| C[Return 400 Error]
    B -->|Yes| D{File Size Valid?}
    D -->|No| E[Return 400 Error]
    D -->|Yes| F[Process File]
    F --> G[Save to Storage]
    G --> H[Generate Public URL]
    H --> I[Save URL to Database]
    I --> J[Return Success Response]
```

## 🔍 API Search & Filtering

```mermaid
graph LR
    subgraph "Search Parameters"
        SP1[search: String]
        SP2[viewing: String]
        SP3[limit: Number]
        SP4[page: Number]
        SP5[sort: String]
        SP6[filter: Object]
    end
    
    subgraph "Filter Options"
        FO1[Role-based filtering]
        FO2[Status filtering]
        FO3[Location filtering]
        FO4[Specialization filtering]
        FO5[Availability filtering]
    end
    
    subgraph "Search Results"
        SR1[Paginated results]
        SR2[Sorted results]
        SR3[Filtered results]
        SR4[Total count]
    end
    
    SP1 --> FO1
    SP2 --> FO2
    SP3 --> FO3
    SP4 --> FO4
    SP5 --> FO5
    SP6 --> SR1
    
    FO1 --> SR2
    FO2 --> SR3
    FO3 --> SR4
    FO4 --> SR1
    FO5 --> SR2
```

## 🛡️ API Security Layers

```mermaid
graph TB
    subgraph "Request Security"
        RS1[HTTPS/TLS]
        RS2[Rate Limiting]
        RS3[CORS Policy]
        RS4[Request Validation]
    end
    
    subgraph "Authentication"
        AUTH1[JWT Token Validation]
        AUTH2[Role-based Access]
        AUTH3[Permission Checking]
        AUTH4[Session Management]
    end
    
    subgraph "Data Security"
        DS1[Input Sanitization]
        DS2[SQL Injection Prevention]
        DS3[XSS Prevention]
        DS4[File Upload Security]
    end
    
    subgraph "Response Security"
        RESP1[Data Filtering]
        RESP2[Error Message Sanitization]
        RESP3[Security Headers]
        RESP4[Audit Logging]
    end
    
    RS1 --> RS2
    RS2 --> RS3
    RS3 --> RS4
    RS4 --> AUTH1
    AUTH1 --> AUTH2
    AUTH2 --> AUTH3
    AUTH3 --> AUTH4
    AUTH4 --> DS1
    DS1 --> DS2
    DS2 --> DS3
    DS3 --> DS4
    DS4 --> RESP1
    RESP1 --> RESP2
    RESP2 --> RESP3
    RESP3 --> RESP4
```

## 📈 API Performance Metrics

```mermaid
graph LR
    subgraph "Response Time"
        RT1[< 100ms: Excellent]
        RT2[100-500ms: Good]
        RT3[500ms-1s: Acceptable]
        RT4[> 1s: Poor]
    end
    
    subgraph "Throughput"
        TH1[Requests per second]
        TH2[Concurrent users]
        TH3[Database queries]
        TH4[File uploads]
    end
    
    subgraph "Error Rates"
        ER1[4xx Errors: < 1%]
        ER2[5xx Errors: < 0.1%]
        ER3[Timeout Errors: < 0.01%]
        ER4[Validation Errors: < 5%]
    end
    
    subgraph "Availability"
        AV1[Uptime: > 99.9%]
        AV2[Response Time: < 500ms]
        AV3[Error Rate: < 1%]
        AV4[Throughput: > 1000 req/s]
    end
    
    RT1 --> TH1
    RT2 --> TH2
    RT3 --> TH3
    RT4 --> TH4
    
    TH1 --> ER1
    TH2 --> ER2
    TH3 --> ER3
    TH4 --> ER4
    
    ER1 --> AV1
    ER2 --> AV2
    ER3 --> AV3
    ER4 --> AV4
```

---

This comprehensive API documentation provides a complete overview of all endpoints, their security measures, performance expectations, and real-time capabilities. The Express Care App API is designed to be secure, scalable, and user-friendly while maintaining high performance standards for healthcare applications. 
