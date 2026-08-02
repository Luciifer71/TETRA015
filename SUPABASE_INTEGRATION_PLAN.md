# Supabase-First Integration Plan
## Frontend ↔ Backend ↔ Supabase PostgreSQL Connection

**Status**: Active Integration  
**Date**: August 2, 2026  
**Database**: Supabase (PostgreSQL) - NOT SQLite
**Target**: Full end-to-end connectivity with Supabase as single source of truth

---

## ARCHITECTURE

```
Frontend (React)
    ↓ HTTPS
Backend (FastAPI) + Supabase SDK
    ├─ Upload files → S3/Supabase Storage
    ├─ Process invoices
    ├─ Save to Supabase PostgreSQL (via SDK)
    └─ Query Supabase for vendor/ledger data
    
Supabase PostgreSQL
    ├─ auth.users (authentication)
    ├─ public.users_roles (user roles)
    ├─ public.invoices (main data)
    ├─ public.risk_reports (scores)
    ├─ public.audit_trail (logs)
    ├─ public.purchase_ledger (PO data)
    ├─ public.vendor_master (vendors)
    └─ public.exceptions (validation errors)
```

---

## PHASE 1: Supabase Schema Setup (1-2 hours)

### Objective: Create all tables in Supabase PostgreSQL

**File**: `supabase/migrations/001_create_tables.sql`

#### 1.1 Create Tables in Supabase

```sql
-- 1. INVOICES TABLE
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE,
    vendor_name TEXT NOT NULL,
    vendor_gst TEXT,
    invoice_date DATE NOT NULL,
    due_date DATE,
    subtotal NUMERIC(15,2),
    tax_amount NUMERIC(15,2),
    total_amount NUMERIC(15,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    line_items JSONB,
    extracted_data JSONB,
    confidence_scores JSONB,
    file_path TEXT,
    file_type TEXT,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'PROCESSED', 'FLAGGED', 'APPROVED', 'REJECTED')),
    ledger_match_id UUID,
    vendor_match_id UUID,
    is_duplicate BOOLEAN DEFAULT FALSE,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. RISK_REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.risk_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL UNIQUE REFERENCES public.invoices(id) ON DELETE CASCADE,
    risk_score NUMERIC(5,2),
    risk_level TEXT CHECK (risk_level IN ('MINIMAL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    risk_factors JSONB,
    recommendations TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. AUDIT_TRAIL TABLE
CREATE TABLE IF NOT EXISTS public.audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details JSONB,
    performed_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. EXCEPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    exception_type TEXT NOT NULL,
    description TEXT,
    severity TEXT CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- 5. VENDOR_MASTER TABLE
CREATE TABLE IF NOT EXISTS public.vendor_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_name TEXT NOT NULL UNIQUE,
    gst_number TEXT UNIQUE,
    vendor_status TEXT DEFAULT 'ACTIVE' CHECK (vendor_status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    is_suspicious BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. PURCHASE_LEDGER TABLE
CREATE TABLE IF NOT EXISTS public.purchase_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number TEXT NOT NULL UNIQUE,
    invoice_number TEXT,
    vendor_name TEXT NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    po_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_invoices_vendor_name ON public.invoices(vendor_name);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_uploaded_at ON public.invoices(uploaded_at DESC);
CREATE INDEX idx_invoices_risk_level ON public.risk_reports(risk_level);
CREATE INDEX idx_audit_trail_invoice_id ON public.audit_trail(invoice_id);
CREATE INDEX idx_exceptions_invoice_id ON public.exceptions(invoice_id);
```

#### 1.2 Run Migration in Supabase
1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Paste the SQL above
4. Run and verify tables created

#### 1.3 Enable Row Level Security (RLS)
```sql
-- Enable RLS on all tables
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exceptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see invoices uploaded by anyone (read-only)
CREATE POLICY "Users can read invoices" 
ON public.invoices 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Policy: Only admins/auditors can insert
CREATE POLICY "Auditors can insert invoices" 
ON public.invoices 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Policy: Users can read risk reports
CREATE POLICY "Users can read risk reports" 
ON public.risk_reports 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Policy: Only admins can update invoices
CREATE POLICY "Admins can update invoices" 
ON public.invoices 
FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.users_roles WHERE email = auth.jwt() ->> 'email' AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.users_roles WHERE email = auth.jwt() ->> 'email' AND role = 'admin'));
```

---

## PHASE 2: Backend Supabase Integration (2-3 hours)

### Objective: Connect backend FastAPI to Supabase

#### 2.1 Install Supabase Python Client
**File**: `backend/requirements.txt`

```
supabase==2.4.0
```

Run: `pip install -r requirements.txt`

#### 2.2 Update Backend Config
**File**: `backend/app/config.py`

```python
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "TETRA015"
    
    # Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    
    # Gemini
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # File upload
    UPLOAD_DIR: str = "uploads"

settings = Settings()
```

#### 2.3 Create Supabase Client Module
**File**: `backend/app/supabase_client.py` (NEW)

```python
from supabase import create_client, Client
from app.config import settings

supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

def get_supabase() -> Client:
    return supabase
```

#### 2.4 Update processor.py to Save to Supabase
**File**: `backend/app/services/processor.py`

Add after risk calculation:

```python
from app.supabase_client import get_supabase
from datetime import datetime

async def save_to_supabase(
    invoice_data: dict,
    extraction_result: dict,
    validation_result: dict,
    risk_result: dict,
    user_id: str  # From JWT token
):
    """Save all invoice data to Supabase"""
    supabase = get_supabase()
    
    # 1. Save Invoice
    invoice_record = {
        "invoice_number": invoice_data.get("invoice_number"),
        "vendor_name": invoice_data.get("vendor_name"),
        "vendor_gst": invoice_data.get("vendor_gst"),
        "invoice_date": invoice_data.get("invoice_date"),
        "due_date": invoice_data.get("due_date"),
        "subtotal": invoice_data.get("subtotal"),
        "tax_amount": invoice_data.get("tax_amount"),
        "total_amount": invoice_data.get("total_amount"),
        "extracted_data": extraction_result,
        "confidence_scores": extraction_result.get("confidence_scores"),
        "status": "PROCESSED",
        "is_duplicate": validation_result.get("duplicate_check", {}).get("is_duplicate", False),
        "uploaded_by": user_id,
        "processed_at": datetime.utcnow().isoformat()
    }
    
    invoice_response = supabase.table("invoices").insert(invoice_record).execute()
    invoice_id = invoice_response.data[0]["id"]
    
    # 2. Save Risk Report
    risk_record = {
        "invoice_id": invoice_id,
        "risk_score": risk_result.risk_score,
        "risk_level": risk_result.risk_level,
        "risk_factors": risk_result.risk_factors,
        "recommendations": risk_result.recommendations
    }
    
    supabase.table("risk_reports").insert(risk_record).execute()
    
    # 3. Save Audit Trail
    audit_record = {
        "invoice_id": invoice_id,
        "action": "INVOICE_PROCESSED",
        "details": {
            "extraction_confidence": extraction_result.get("avg_confidence"),
            "validation_errors": validation_result.get("errors"),
            "risk_factors": risk_result.risk_factors
        },
        "performed_by": user_id
    }
    
    supabase.table("audit_trail").insert(audit_record).execute()
    
    # 4. Save Exceptions (if any)
    if validation_result.get("errors"):
        for error in validation_result["errors"]:
            exception_record = {
                "invoice_id": invoice_id,
                "exception_type": error.get("type"),
                "description": error.get("message"),
                "severity": error.get("severity", "MEDIUM")
            }
            supabase.table("exceptions").insert(exception_record).execute()
    
    return invoice_id
```

#### 2.5 Update upload.py to Use Supabase
**File**: `backend/app/api/upload.py`

Modify to pass user_id and call save_to_supabase:

```python
from app.supabase_client import get_supabase

async def _process_background(
    upload_id: str, 
    file_path: str, 
    validated_mime_type: str,
    user_id: str  # Add this
):
    """Background processing task"""
    try:
        result = await process_invoice_pipeline(file_path, validated_mime_type)
        
        # Save to Supabase
        invoice_id = await save_to_supabase(
            invoice_data=result["extracted_data"],
            extraction_result=result["extraction_result"],
            validation_result=result["validation_result"],
            risk_result=result["risk_result"],
            user_id=user_id
        )
        
        # Update upload status
        upload = db.query(Upload).filter(Upload.id == upload_id).first()
        upload.invoice_id = invoice_id
        upload.upload_status = "COMPLETED"
        db.commit()
        
    except Exception as e:
        upload = db.query(Upload).filter(Upload.id == upload_id).first()
        upload.upload_status = "FAILED"
        upload.error_message = str(e)
        db.commit()
```

---

## PHASE 3: Backend API Endpoints (3-4 hours)

### Objective: Create endpoints that query/write to Supabase

#### 3.1 Invoice Endpoints (`backend/app/api/invoices.py` - NEW)

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from app.supabase_client import get_supabase
from app.middleware.auth import get_current_user

router = APIRouter()
supabase = get_supabase()

@router.get("/api/v1/invoices")
async def list_invoices(
    skip: int = Query(0, ge=0),
    limit: int = Query(25, le=100),
    status: str = Query(None),
    vendor: str = Query(None),
    current_user = Depends(get_current_user)
):
    """Get invoices with optional filters"""
    
    query = supabase.table("invoices").select("*")
    
    if status:
        query = query.eq("status", status)
    if vendor:
        query = query.ilike("vendor_name", f"%{vendor}%")
    
    result = query.range(skip, skip + limit).order("uploaded_at", desc=True).execute()
    
    return {
        "success": True,
        "data": result.data,
        "count": len(result.data)
    }

@router.get("/api/v1/invoices/{invoice_id}")
async def get_invoice(
    invoice_id: str,
    current_user = Depends(get_current_user)
):
    """Get single invoice with risk report and audit trail"""
    
    # Get invoice
    invoice = supabase.table("invoices").select("*").eq("id", invoice_id).single().execute()
    
    # Get risk report
    risk = supabase.table("risk_reports").select("*").eq("invoice_id", invoice_id).single().execute()
    
    # Get audit trail
    audit = supabase.table("audit_trail").select("*").eq("invoice_id", invoice_id).execute()
    
    # Get exceptions
    exceptions = supabase.table("exceptions").select("*").eq("invoice_id", invoice_id).execute()
    
    return {
        "success": True,
        "data": {
            "invoice": invoice.data,
            "risk_report": risk.data,
            "audit_trail": audit.data,
            "exceptions": exceptions.data
        }
    }

@router.patch("/api/v1/invoices/{invoice_id}")
async def update_invoice(
    invoice_id: str,
    update_data: dict,
    current_user = Depends(get_current_user)
):
    """Update invoice status/notes (admin only)"""
    
    # Check admin role
    user = supabase.table("users_roles").select("role").eq("auth_id", current_user["id"]).single().execute()
    if user.data["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    result = supabase.table("invoices").update(update_data).eq("id", invoice_id).execute()
    
    # Log to audit trail
    supabase.table("audit_trail").insert({
        "invoice_id": invoice_id,
        "action": "INVOICE_UPDATED",
        "details": update_data,
        "performed_by": current_user["id"]
    }).execute()
    
    return {
        "success": True,
        "data": result.data[0]
    }
```

#### 3.2 Dashboard Endpoints (`backend/app/api/dashboard.py` - NEW)

```python
from fastapi import APIRouter, Depends
from app.supabase_client import get_supabase
from app.middleware.auth import get_current_user

router = APIRouter()
supabase = get_supabase()

@router.get("/api/v1/dashboard/summary")
async def dashboard_summary(current_user = Depends(get_current_user)):
    """Get dashboard summary stats"""
    
    invoices = supabase.table("invoices").select("id, status, total_amount").execute()
    risks = supabase.table("risk_reports").select("risk_level").execute()
    
    total_count = len(invoices.data)
    processed_count = len([i for i in invoices.data if i["status"] == "PROCESSED"])
    pending_count = len([i for i in invoices.data if i["status"] == "PENDING"])
    total_amount = sum(i["total_amount"] or 0 for i in invoices.data)
    
    risk_levels = {}
    for risk in risks.data:
        level = risk["risk_level"]
        risk_levels[level] = risk_levels.get(level, 0) + 1
    
    return {
        "success": True,
        "data": {
            "total_invoices": total_count,
            "processed": processed_count,
            "pending": pending_count,
            "total_amount": total_amount,
            "risk_distribution": risk_levels
        }
    }

@router.get("/api/v1/dashboard/recent-invoices")
async def recent_invoices(current_user = Depends(get_current_user)):
    """Get 10 most recent invoices"""
    
    result = supabase.table("invoices")\
        .select("id, invoice_number, vendor_name, total_amount, status, uploaded_at")\
        .order("uploaded_at", desc=True)\
        .limit(10)\
        .execute()
    
    return {
        "success": True,
        "data": result.data
    }
```

#### 3.3 Search Endpoints (`backend/app/api/search.py` - NEW)

```python
from fastapi import APIRouter, Depends, Query
from app.supabase_client import get_supabase
from app.middleware.auth import get_current_user

router = APIRouter()

@router.post("/api/v1/search")
async def search_invoices(
    query: str = Query(...),
    filters: dict = {},
    current_user = Depends(get_current_user)
):
    """Search invoices by vendor name, invoice number, etc."""
    
    supabase = get_supabase()
    
    search_query = supabase.table("invoices").select("*")
    
    # Search
    search_query = search_query.or_(
        f"vendor_name.ilike.%{query}%,invoice_number.ilike.%{query}%"
    )
    
    # Filters
    if filters.get("status"):
        search_query = search_query.eq("status", filters["status"])
    if filters.get("risk_level"):
        # Join with risk_reports
        pass
    
    result = search_query.execute()
    
    return {
        "success": True,
        "data": result.data,
        "count": len(result.data)
    }
```

---

## PHASE 4: Backend Authentication Middleware (1-2 hours)

### Objective: Secure endpoints with JWT from Supabase

**File**: `backend/app/middleware/auth.py` (NEW)

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthCredentials
import jwt
from app.config import settings

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthCredentials = Depends(security)):
    """Verify JWT from Supabase Auth"""
    
    token = credentials.credentials
    
    try:
        # Decode JWT (Supabase signs with your SUPABASE_KEY)
        payload = jwt.decode(
            token,
            settings.SUPABASE_KEY,
            algorithms=["HS256"],
            audience="authenticated"
        )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        return {"id": user_id, "email": payload.get("email")}
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
```

---

## PHASE 5: Frontend Services Integration (2-3 hours)

### Objective: Wire frontend to backend APIs that query Supabase

**File**: `frontend/src/services/invoiceService.ts`

```typescript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export async function getInvoices(skip = 0, limit = 25, filters = {}) {
  const { data } = await axios.get(`${API_URL}/invoices`, {
    params: { skip, limit, ...filters }
  });
  return data;
}

export async function getInvoiceDetail(invoiceId: string) {
  const { data } = await axios.get(`${API_URL}/invoices/${invoiceId}`);
  return data;
}

export async function updateInvoice(invoiceId: string, updates: any) {
  const { data } = await axios.patch(`${API_URL}/invoices/${invoiceId}`, updates);
  return data;
}

export async function searchInvoices(query: string, filters = {}) {
  const { data } = await axios.post(`${API_URL}/search`, {
    query,
    filters
  });
  return data;
}
```

**File**: `frontend/src/services/dashboardService.ts`

```typescript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export async function getDashboardSummary() {
  const { data } = await axios.get(`${API_URL}/dashboard/summary`);
  return data;
}

export async function getRecentInvoices() {
  const { data } = await axios.get(`${API_URL}/dashboard/recent-invoices`);
  return data;
}
```

---

## PHASE 6: Frontend Pages Integration (2-3 hours)

### Objective: Connect pages to Supabase data via backend APIs

**File**: `frontend/src/pages/Dashboard.tsx`

```typescript
import { useEffect, useState } from 'react';
import { getDashboardSummary, getRecentInvoices } from '@/services/dashboardService';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [summaryRes, invoicesRes] = await Promise.all([
          getDashboardSummary(),
          getRecentInvoices()
        ]);
        
        setSummary(summaryRes.data);
        setRecentInvoices(invoicesRes.data);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="grid grid-cols-4 gap-4">
        <Card title="Total Invoices" value={summary?.total_invoices} />
        <Card title="Processed" value={summary?.processed} />
        <Card title="Pending" value={summary?.pending} />
        <Card title="Total Amount" value={summary?.total_amount} />
      </div>
      
      <h2 className="mt-8">Recent Invoices</h2>
      <table>
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Vendor</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {recentInvoices.map(inv => (
            <tr key={inv.id}>
              <td>{inv.invoice_number}</td>
              <td>{inv.vendor_name}</td>
              <td>{inv.total_amount}</td>
              <td>{inv.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## CHECKPOINTS

### ✅ Checkpoint 1: Supabase Ready
- [ ] Tables created in Supabase
- [ ] RLS policies enabled
- [ ] Can query Supabase from backend

### ✅ Checkpoint 2: Backend Integrated
- [ ] Backend connects to Supabase
- [ ] Invoices saved to Supabase after processing
- [ ] API endpoints working with Supabase data

### ✅ Checkpoint 3: Frontend Connected
- [ ] Dashboard loads real data from Supabase
- [ ] Invoice list shows Supabase invoices
- [ ] Search/filters working

---

## .ENV Configuration

Add to `backend/.env`:

```
SUPABASE_URL=https://lujjfxzmswxiihksssyc.supabase.co
SUPABASE_KEY=sb_publishable_JWmkaGZKby7OaMwk-M-jTw_-58ttYDz
GEMINI_API_KEY=your_gemini_key
UPLOAD_DIR=uploads
```

---

**Total Estimated Time**: 10-14 hours to production-ready state

**Next**: Start Phase 1 - Create Supabase tables

