# System Architecture
## AI-Powered Invoice Audit & Risk Screening Platform

**Version**: 1.0  
**Date**: August 1, 2026  
**Status**: Design Document

---

## Table of Contents
1. [High-Level Architecture](#high-level-architecture)
2. [Component Architecture](#component-architecture)
3. [Data Flow](#data-flow)
4. [AI Pipeline](#ai-pipeline)
5. [Backend Architecture](#backend-architecture)
6. [Frontend Architecture](#frontend-architecture)
7. [Sequence Diagrams](#sequence-diagrams)
8. [Folder Structure](#folder-structure)
9. [Deployment Architecture](#deployment-architecture)
10. [Technology Stack](#technology-stack)

---

## High-Level Architecture

### System Overview

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[React + Vite UI]
        Router[React Router]
        State[State Management]
    end
    
    subgraph "Backend Layer"
        API[FastAPI Server]
        Upload[Upload Handler]
        Parser[Invoice Parser]
        Matcher[Matching Engine]
        Risk[Risk Engine]
    end
    
    subgraph "AI Layer"
        Gemini[Gemini Vision API]
        OCR[OCR Processor]
        Extract[Data Extractor]
    end
    
    subgraph "Data Layer"
        DB[(SQLite Database)]
        Files[File Storage]
        CSV[CSV Imports]
    end
    
    UI --> API
    API --> Upload
    Upload --> Parser
    Parser --> Gemini
    Gemini --> Extract
    Extract --> Matcher
    Matcher --> DB
    Matcher --> Risk
    Risk --> DB
    API --> DB
    API --> Files
    CSV --> DB
```


### Architecture Layers

**Presentation Layer**
- React-based Single Page Application (SPA)
- Responsive UI with Tailwind CSS
- Component library (shadcn/ui)
- Client-side routing (React Router)
- State management for global data

**Application Layer**
- RESTful API built with FastAPI
- Business logic modules (matching, risk scoring)
- File upload handling
- Request validation and error handling
- API documentation (Swagger/OpenAPI)

**AI/ML Layer**
- Gemini Vision API integration
- OCR and text extraction
- Structured JSON output
- Confidence scoring
- Image preprocessing (optional)

**Data Layer**
- SQLite database for structured data
- Local file system for uploaded files
- CSV import for master data
- Audit trail logging

**Integration Layer**
- External API calls (Gemini)
- File system operations
- Database transactions
- Error handling and retries

---

## Component Architecture

### Component Diagram

```mermaid
graph LR
    subgraph "Frontend Components"
        Dashboard[Dashboard]
        Upload[Upload Module]
        InvoiceList[Invoice List]
        InvoiceDetail[Invoice Detail]
        Search[Search & Filter]
        Charts[Charts & Analytics]
    end
    
    subgraph "Backend Services"
        UploadAPI[Upload API]
        InvoiceAPI[Invoice API]
        MatchingService[Matching Service]
        RiskService[Risk Service]
        SearchAPI[Search API]
    end
    
    subgraph "Core Modules"
        AIExtractor[AI Extractor]
        Validator[Data Validator]
        DuplicateDetector[Duplicate Detector]
        GSTValidator[GST Validator]
        AuditLogger[Audit Logger]
    end
    
    Dashboard --> InvoiceAPI
    Upload --> UploadAPI
    UploadAPI --> AIExtractor
    AIExtractor --> Validator
    Validator --> MatchingService
    MatchingService --> RiskService
    RiskService --> AuditLogger
```



### Core Components Description

**Frontend Components**
- **Dashboard**: Summary cards, charts, recent invoices
- **Upload Module**: File picker, drag-drop, progress tracking
- **Invoice List**: Table view, search, filters, pagination
- **Invoice Detail**: Full invoice view, extracted data, risk analysis
- **Search & Filter**: Advanced filtering, sorting
- **Charts & Analytics**: Risk distribution, vendor stats, trends

**Backend Services**
- **Upload API**: File handling, validation, storage
- **Invoice API**: CRUD operations, queries
- **Matching Service**: Ledger matching, vendor verification
- **Risk Service**: Risk rule evaluation, scoring
- **Search API**: Full-text search, filtering

**Core Modules**
- **AI Extractor**: Gemini API integration, OCR
- **Data Validator**: Field validation, type checking
- **Duplicate Detector**: Invoice comparison, similarity
- **GST Validator**: Format checking, validation
- **Audit Logger**: Immutable logging, tracking

---

## Data Flow

### End-to-End Invoice Processing Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Parser
    participant Gemini
    participant Matcher
    participant Risk
    participant DB
    
    User->>Frontend: Upload Invoice
    Frontend->>API: POST /upload (file)
    API->>API: Validate file
    API->>Parser: Extract data
    Parser->>Gemini: OCR request
    Gemini-->>Parser: JSON response
    Parser->>Parser: Validate extraction
    Parser->>Matcher: Match invoice
    Matcher->>DB: Query ledger
    DB-->>Matcher: Ledger data
    Matcher->>Matcher: Compare data
    Matcher->>Risk: Calculate risk
    Risk->>Risk: Apply rules
    Risk->>DB: Store invoice
    DB-->>Risk: Confirm
    Risk-->>API: Return result
    API-->>Frontend: Invoice data + risk
    Frontend-->>User: Display result
```



### Upload Pipeline

```mermaid
flowchart TD
    A[User Selects File] --> B{Validate File}
    B -->|Invalid| C[Show Error]
    B -->|Valid| D[Generate UUID]
    D --> E[Save to /uploads/]
    E --> F[Create DB Record]
    F --> G[Trigger AI Extraction]
    G --> H[Process Invoice]
    H --> I[Update Status]
    I --> J[Notify Frontend]
```

### Invoice Processing Workflow

```mermaid
flowchart LR
    subgraph "Stage 1: Upload"
        Upload[Upload File] --> Validate[Validate Format]
        Validate --> Store[Store File]
    end
    
    subgraph "Stage 2: Extraction"
        Store --> AI[AI Extraction]
        AI --> Parse[Parse JSON]
        Parse --> ValidateData[Validate Data]
    end
    
    subgraph "Stage 3: Matching"
        ValidateData --> LedgerMatch[Match Ledger]
        LedgerMatch --> VendorMatch[Match Vendor]
        VendorMatch --> DupeCheck[Duplicate Check]
    end
    
    subgraph "Stage 4: Risk"
        DupeCheck --> RiskRules[Apply Risk Rules]
        RiskRules --> CalcScore[Calculate Score]
        CalcScore --> SaveDB[Save to DB]
    end
    
    SaveDB --> Complete[Complete]
```

---

## AI Pipeline

### Gemini Vision API Integration

```mermaid
flowchart TD
    A[Invoice Image/PDF] --> B[Convert to Base64]
    B --> C[Prepare Gemini Prompt]
    C --> D{File Type}
    D -->|PDF| E[Extract Pages]
    D -->|Image| F[Process Image]
    E --> G[Send to Gemini]
    F --> G
    G --> H[Receive JSON Response]
    H --> I{Validate Response}
    I -->|Invalid| J[Retry/Fallback]
    I -->|Valid| K[Parse Fields]
    K --> L[Calculate Confidence]
    L --> M[Return Structured Data]
```

### AI Extraction Process

**Input**: Invoice file (PDF/JPEG/PNG)

**Processing Steps**:
1. File preprocessing (resize, compress if needed)
2. Convert to base64 encoding
3. Construct structured prompt with expected JSON schema
4. Call Gemini Vision API
5. Parse response
6. Validate extracted fields
7. Calculate confidence scores
8. Store raw response for debugging

**Output**: Structured JSON with fields + confidence scores

**Schema Example**:
```json
{
  "invoice_number": "INV-2024-001",
  "vendor_name": "ABC Supplies Ltd",
  "vendor_gst": "29ABCDE1234F1Z5",
  "invoice_date": "2024-07-15",
  "due_date": "2024-08-15",
  "subtotal": 50000.00,
  "tax_amount": 9000.00,
  "total_amount": 59000.00,
  "currency": "INR",
  "line_items": [...],
  "confidence_scores": {...}
}
```



---

## Backend Architecture

### FastAPI Application Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app initialization
│   ├── config.py            # Configuration & env vars
│   ├── database.py          # SQLite connection
│   │
│   ├── api/                 # API routes
│   │   ├── __init__.py
│   │   ├── upload.py        # Upload endpoints
│   │   ├── invoices.py      # Invoice CRUD
│   │   ├── dashboard.py     # Dashboard stats
│   │   ├── search.py        # Search & filter
│   │   └── audit.py         # Audit trail
│   │
│   ├── models/              # Database models
│   │   ├── __init__.py
│   │   ├── invoice.py
│   │   ├── ledger.py
│   │   ├── vendor.py
│   │   ├── exception.py
│   │   ├── risk_report.py
│   │   └── audit_trail.py
│   │
│   ├── schemas/             # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── invoice.py
│   │   ├── risk.py
│   │   └── response.py
│   │
│   ├── services/            # Business logic
│   │   ├── __init__.py
│   │   ├── ai_extractor.py
│   │   ├── matching_engine.py
│   │   ├── risk_engine.py
│   │   ├── duplicate_detector.py
│   │   ├── gst_validator.py
│   │   └── audit_logger.py
│   │
│   ├── utils/               # Utilities
│   │   ├── __init__.py
│   │   ├── file_handler.py
│   │   ├── validators.py
│   │   └── helpers.py
│   │
│   └── tests/               # Test suite
│       ├── __init__.py
│       ├── test_api.py
│       └── test_services.py
│
├── uploads/                 # Uploaded files
├── data/                    # CSV imports
├── requirements.txt
├── Dockerfile
└── README.md
```

### Backend Flow Diagram

```mermaid
graph TD
    A[HTTP Request] --> B[FastAPI Router]
    B --> C{Route Type}
    
    C -->|Upload| D[Upload Handler]
    D --> E[File Validation]
    E --> F[Save File]
    F --> G[AI Extractor Service]
    
    C -->|Query| H[Invoice Service]
    H --> I[Database Query]
    
    C -->|Dashboard| J[Analytics Service]
    J --> K[Aggregate Data]
    
    G --> L[Matching Engine]
    L --> M[Risk Engine]
    M --> N[Audit Logger]
    N --> O[Save to DB]
    
    I --> P[Return Response]
    K --> P
    O --> P
    
    P --> Q[JSON Response]
```



---

## Frontend Architecture

### React Application Structure

```
frontend/
├── src/
│   ├── main.tsx             # App entry point
│   ├── App.tsx              # Root component
│   ├── index.css            # Global styles
│   │
│   ├── components/          # Reusable components
│   │   ├── ui/              # shadcn components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── table.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Layout.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── SummaryCards.tsx
│   │   │   ├── RiskChart.tsx
│   │   │   ├── RecentInvoices.tsx
│   │   │   └── ExceptionAlerts.tsx
│   │   │
│   │   ├── invoice/
│   │   │   ├── InvoiceCard.tsx
│   │   │   ├── InvoiceTable.tsx
│   │   │   ├── InvoiceDetail.tsx
│   │   │   └── RiskBadge.tsx
│   │   │
│   │   └── upload/
│   │       ├── DropZone.tsx
│   │       ├── UploadProgress.tsx
│   │       └── FilePreview.tsx
│   │
│   ├── pages/               # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Upload.tsx
│   │   ├── InvoiceList.tsx
│   │   ├── InvoiceDetails.tsx
│   │   ├── Search.tsx
│   │   ├── AuditTrail.tsx
│   │   └── Settings.tsx
│   │
│   ├── hooks/               # Custom hooks
│   │   ├── useInvoices.ts
│   │   ├── useUpload.ts
│   │   ├── useSearch.ts
│   │   └── useAuth.ts
│   │
│   ├── services/            # API services
│   │   ├── api.ts           # Axios instance
│   │   ├── invoiceService.ts
│   │   ├── uploadService.ts
│   │   └── dashboardService.ts
│   │
│   ├── types/               # TypeScript types
│   │   ├── invoice.ts
│   │   ├── risk.ts
│   │   └── api.ts
│   │
│   ├── utils/               # Utilities
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── constants.ts
│   │
│   └── lib/                 # Config
│       └── utils.ts         # shadcn utils
│
├── public/                  # Static assets
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.ts
```

### Frontend Component Tree

```mermaid
graph TD
    App[App.tsx] --> Layout[Layout Component]
    Layout --> Header[Header]
    Layout --> Sidebar[Sidebar]
    Layout --> Main[Main Content]
    Layout --> Footer[Footer]
    
    Main --> Dashboard[Dashboard Page]
    Main --> Upload[Upload Page]
    Main --> InvoiceList[Invoice List]
    Main --> InvoiceDetail[Invoice Detail]
    
    Dashboard --> SummaryCards
    Dashboard --> Charts
    Dashboard --> RecentTable
    
    Upload --> DropZone
    Upload --> UploadProgress
    
    InvoiceList --> SearchBar
    InvoiceList --> FilterPanel
    InvoiceList --> InvoiceTable
    
    InvoiceDetail --> InvoiceCard
    InvoiceDetail --> RiskPanel
    InvoiceDetail --> AuditLog
```



---

## Sequence Diagrams

### Upload & Process Invoice Sequence

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend
    participant API as FastAPI
    participant FS as File System
    participant AI as Gemini API
    participant Match as Matcher
    participant Risk as Risk Engine
    participant DB as Database
    
    User->>UI: Select & Upload Invoice
    UI->>API: POST /api/upload (FormData)
    API->>API: Validate file (size, type)
    API->>FS: Save file to /uploads/
    FS-->>API: File path
    API->>DB: Create invoice record (PENDING)
    DB-->>API: Invoice ID
    API-->>UI: Upload success (invoice_id)
    UI-->>User: Show progress
    
    API->>AI: Extract invoice data
    AI-->>API: JSON data + confidence
    API->>Match: Match with ledger
    Match->>DB: Query purchase_ledger
    DB-->>Match: Ledger entries
    Match->>DB: Query vendor_master
    DB-->>Match: Vendor data
    Match-->>API: Match results
    
    API->>Risk: Calculate risk score
    Risk->>Risk: Apply 12 risk rules
    Risk-->>API: Risk score + factors
    
    API->>DB: Update invoice (PROCESSED)
    API->>DB: Create risk_report
    API->>DB: Log audit_trail
    DB-->>API: Confirm
    
    API-->>UI: Processing complete
    UI-->>User: Show invoice details
```

### Dashboard Data Fetch Sequence

```mermaid
sequenceDiagram
    participant UI as Dashboard UI
    participant API as FastAPI
    participant DB as Database
    
    UI->>API: GET /api/dashboard/summary
    API->>DB: SELECT COUNT(*), SUM(amount)...
    DB-->>API: Aggregate data
    API-->>UI: Summary stats
    
    UI->>API: GET /api/dashboard/risk-distribution
    API->>DB: SELECT risk_level, COUNT(*)...
    DB-->>API: Risk data
    API-->>UI: Risk chart data
    
    UI->>API: GET /api/invoices/recent?limit=10
    API->>DB: SELECT * FROM invoices...
    DB-->>API: Recent invoices
    API-->>UI: Invoice list
    
    UI->>UI: Render dashboard
```

### Search & Filter Sequence

```mermaid
sequenceDiagram
    participant User
    participant UI as Search UI
    participant API as FastAPI
    participant DB as Database
    
    User->>UI: Enter search query
    UI->>UI: Debounce input (300ms)
    UI->>API: GET /api/search?q=vendor&filters={...}
    API->>API: Parse query & filters
    API->>DB: SELECT * WHERE vendor LIKE %...%
    DB-->>API: Matching invoices
    API->>API: Format response
    API-->>UI: Search results (paginated)
    UI-->>User: Display results
    
    User->>UI: Apply filter (risk=HIGH)
    UI->>API: GET /api/search?filters={risk:'HIGH'}
    API->>DB: SELECT * WHERE risk_level='HIGH'
    DB-->>API: Filtered invoices
    API-->>UI: Filtered results
    UI-->>User: Update display
```



---

## Folder Structure

### Complete Project Structure

```
invoice-audit-platform/
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   │
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── upload.py
│   │   │   ├── invoices.py
│   │   │   ├── dashboard.py
│   │   │   ├── search.py
│   │   │   └── audit.py
│   │   │
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── invoice.py
│   │   │   ├── ledger.py
│   │   │   ├── vendor.py
│   │   │   ├── exception.py
│   │   │   ├── risk_report.py
│   │   │   └── audit_trail.py
│   │   │
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── invoice.py
│   │   │   ├── risk.py
│   │   │   └── response.py
│   │   │
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── ai_extractor.py
│   │   │   ├── matching_engine.py
│   │   │   ├── risk_engine.py
│   │   │   ├── duplicate_detector.py
│   │   │   ├── gst_validator.py
│   │   │   └── audit_logger.py
│   │   │
│   │   ├── utils/
│   │   │   ├── __init__.py
│   │   │   ├── file_handler.py
│   │   │   ├── validators.py
│   │   │   └── helpers.py
│   │   │
│   │   └── tests/
│   │       ├── __init__.py
│   │       ├── test_api.py
│   │       ├── test_services.py
│   │       └── test_models.py
│   │
│   ├── uploads/               # Invoice files
│   ├── data/                  # CSV imports
│   │   ├── purchase_ledger.csv
│   │   ├── vendor_master.csv
│   │   └── sample_invoices/
│   │
│   ├── database.db            # SQLite database
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env.example
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── index.css
│   │   │
│   │   ├── components/
│   │   │   ├── ui/            # shadcn components
│   │   │   ├── layout/
│   │   │   ├── dashboard/
│   │   │   ├── invoice/
│   │   │   └── upload/
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Upload.tsx
│   │   │   ├── InvoiceList.tsx
│   │   │   ├── InvoiceDetails.tsx
│   │   │   └── AuditTrail.tsx
│   │   │
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   └── lib/
│   │
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── Dockerfile
│   └── README.md
│
├── docs/
│   ├── PRD.md
│   ├── Architecture.md
│   ├── Database.md
│   ├── API.md
│   ├── Modules.md
│   ├── Routes.md
│   ├── UI.md
│   ├── Design.md
│   ├── Navigation.md
│   ├── Roadmap.md
│   └── TODO.md
│
├── docker-compose.yml
├── .gitignore
└── README.md
```



---

## Deployment Architecture

### Local Development Setup

```mermaid
graph LR
    subgraph "Developer Machine"
        subgraph "Frontend (Port 5173)"
            Vite[Vite Dev Server]
            React[React App]
        end
        
        subgraph "Backend (Port 8000)"
            FastAPI[FastAPI Server]
            SQLite[(SQLite DB)]
            Files[/uploads/]
        end
        
        subgraph "External"
            Gemini[Gemini API]
        end
    end
    
    React -->|API Calls| FastAPI
    FastAPI -->|Query| SQLite
    FastAPI -->|Store| Files
    FastAPI -->|Extract| Gemini
```

### Docker Deployment

```mermaid
graph TB
    subgraph "Docker Host"
        subgraph "Frontend Container"
            Nginx[Nginx]
            StaticFiles[Built React App]
        end
        
        subgraph "Backend Container"
            API[FastAPI App]
            DB[(SQLite Volume)]
            Uploads[Uploads Volume]
        end
        
        Network[Docker Network]
    end
    
    Browser[Web Browser] -->|Port 80| Nginx
    Nginx -->|Proxy /api| API
    Nginx --> StaticFiles
    API --> DB
    API --> Uploads
    API -->|HTTPS| External[Gemini API]
```

### Docker Compose Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./backend
    container_name: invoice-backend
    ports:
      - "8000:8000"
    volumes:
      - ./backend/uploads:/app/uploads
      - ./backend/data:/app/data
      - ./backend/database.db:/app/database.db
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - DATABASE_URL=sqlite:///./database.db
      - UPLOAD_DIR=/app/uploads
    networks:
      - invoice-network
    restart: unless-stopped

  frontend:
    build: ./frontend
    container_name: invoice-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    environment:
      - VITE_API_URL=http://backend:8000
    networks:
      - invoice-network
    restart: unless-stopped

networks:
  invoice-network:
    driver: bridge

volumes:
  uploads:
  database:
```

### Production Deployment (Cloud)

```mermaid
graph TB
    subgraph "Cloud Infrastructure"
        LB[Load Balancer]
        
        subgraph "Frontend"
            Vercel[Vercel CDN]
        end
        
        subgraph "Backend"
            Render[Render.com]
            Storage[Cloud Storage]
            DBService[(Managed DB)]
        end
        
        subgraph "External Services"
            Gemini[Gemini API]
        end
    end
    
    Users[Users] -->|HTTPS| Vercel
    Vercel -->|API Proxy| Render
    Render -->|Store| Storage
    Render -->|Query| DBService
    Render -->|Extract| Gemini
```



---

## Technology Stack

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2+ | UI library |
| **TypeScript** | 5.0+ | Type safety |
| **Vite** | 4.4+ | Build tool & dev server |
| **React Router** | 6.14+ | Client-side routing |
| **Tailwind CSS** | 3.3+ | Utility-first styling |
| **shadcn/ui** | Latest | Component library |
| **Recharts** | 2.7+ | Data visualization |
| **Framer Motion** | 10.12+ | Animations |
| **Axios** | 1.4+ | HTTP client |
| **React Hook Form** | 7.45+ | Form handling |
| **Zod** | 3.21+ | Schema validation |
| **date-fns** | 2.30+ | Date utilities |

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.10+ | Programming language |
| **FastAPI** | 0.100+ | Web framework |
| **Pydantic** | 2.0+ | Data validation |
| **SQLite** | 3.40+ | Database |
| **SQLAlchemy** | 2.0+ | ORM |
| **pandas** | 2.0+ | Data processing |
| **pdfplumber** | 0.9+ | PDF parsing |
| **Pillow** | 10.0+ | Image processing |
| **opencv-python** | 4.8+ | Image preprocessing |
| **python-multipart** | 0.0.6+ | File upload handling |
| **uvicorn** | 0.23+ | ASGI server |

### AI & ML

| Technology | Version | Purpose |
|------------|---------|---------|
| **Google Gemini** | 1.5 Pro | Vision & OCR |
| **google-generativeai** | 0.3+ | Python SDK |

### DevOps & Deployment

| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Multi-container orchestration |
| **Vercel** | Frontend hosting |
| **Render** | Backend hosting |
| **GitHub Actions** | CI/CD |

---

## Security Architecture

### Security Layers

```mermaid
graph TD
    A[Client Request] --> B[HTTPS/TLS Layer]
    B --> C[CORS Validation]
    C --> D[Input Validation]
    D --> E[File Type Validation]
    E --> F[Size Validation]
    F --> G[API Rate Limiting]
    G --> H[SQL Injection Prevention]
    H --> I[XSS Prevention]
    I --> J[Business Logic]
    J --> K[Audit Logging]
```

### Security Measures

**File Upload Security**
- File type validation (whitelist: PDF, JPEG, PNG)
- File size limit (10MB max)
- Virus scanning (future)
- Secure file storage with UUID names
- No executable files allowed

**API Security**
- CORS configuration
- Rate limiting (100 req/min)
- Input validation (Pydantic)
- SQL injection prevention (SQLAlchemy ORM)
- XSS prevention (output encoding)

**Data Security**
- Sensitive data encryption (future)
- Audit trail for all operations
- No hardcoded credentials
- Environment variable management
- Secure API key storage

---

## Performance Optimization

### Caching Strategy

```mermaid
graph LR
    A[API Request] --> B{Cache?}
    B -->|Hit| C[Return Cached]
    B -->|Miss| D[Query DB]
    D --> E[Cache Result]
    E --> F[Return Data]
```

**Cache Targets**:
- Dashboard statistics (5 min TTL)
- Vendor master data (1 hour TTL)
- Ledger entries (1 hour TTL)
- Risk rules config (startup only)

### Database Optimization

- Indexes on frequently queried columns
- Query optimization (avoid N+1)
- Connection pooling
- Batch inserts for bulk operations
- Pagination for large result sets

### Frontend Optimization

- Code splitting (React.lazy)
- Image optimization
- Lazy loading for tables
- Debounced search (300ms)
- Virtual scrolling for large lists

---

## Scalability Considerations

### Horizontal Scaling

```mermaid
graph TB
    LB[Load Balancer] --> API1[API Instance 1]
    LB --> API2[API Instance 2]
    LB --> API3[API Instance 3]
    
    API1 --> SharedDB[(Shared Database)]
    API2 --> SharedDB
    API3 --> SharedDB
    
    API1 --> SharedStorage[Shared File Storage]
    API2 --> SharedStorage
    API3 --> SharedStorage
```

**Scaling Strategy**:
- Stateless API design
- Shared database (upgrade from SQLite to PostgreSQL)
- Centralized file storage (S3/cloud storage)
- Session management (Redis for future auth)
- Message queue for async processing (Celery + Redis)

---

## Monitoring & Logging

### Monitoring Architecture

```mermaid
graph TD
    App[Application] --> Logs[Structured Logging]
    App --> Metrics[Performance Metrics]
    App --> Errors[Error Tracking]
    
    Logs --> LogAgg[Log Aggregation]
    Metrics --> Dashboard[Metrics Dashboard]
    Errors --> AlertSys[Alerting System]
```

**Monitoring Points**:
- API response times
- Error rates
- Upload success/failure rates
- AI extraction accuracy
- Database query performance
- File storage usage

**Logging Strategy**:
- Structured JSON logs
- Log levels (DEBUG, INFO, WARN, ERROR)
- Request/response logging
- Audit trail logging
- Rotation and retention policies

---

## Disaster Recovery

### Backup Strategy

```mermaid
graph LR
    A[Database] -->|Daily| B[Backup Storage]
    C[Uploads] -->|Daily| B
    B -->|Retention| D[30 Days]
    B -->|Recovery| E[Restore Process]
```

**Backup Plan**:
- Daily database backups
- Daily file storage backups
- 30-day retention
- Automated backup verification
- Disaster recovery runbook

---

**Version**: 1.0  
**Last Updated**: August 1, 2026  
**Next Review**: Post-Hackathon

---

**END OF ARCHITECTURE DOCUMENT**
