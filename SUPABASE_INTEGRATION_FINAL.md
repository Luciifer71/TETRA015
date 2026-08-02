# Supabase Integration Plan - FINAL
## Node Backend + FastAPI AI + Supabase PostgreSQL

**Architecture:**
```
Frontend (React)
    ↓ HTTPS
Node Backend (Main - Auth, CRUD, Dashboard)
    ├─ Handle auth & user sessions
    ├─ CRUD operations on invoices
    ├─ Dashboard queries
    ├─ Search & filtering
    └─ Call FastAPI for AI tasks

FastAPI (Python - AI Only)
    ├─ AI extraction (Gemini)
    ├─ Risk scoring
    ├─ Validation logic
    └─ Query Supabase for vendor/ledger data

Supabase PostgreSQL (Single Source of Truth)
    ├─ auth.users
    ├─ users_roles
    ├─ invoices
    ├─ risk_reports
    ├─ audit_trail
    ├─ exceptions
    ├─ purchase_ledger
    └─ vendor_master
```

---

## PHASE 1: Supabase Schema Setup (1 hour)

### Step 1.1: Create Tables (RLS DISABLED)

**File**: `supabase/migrations/001_create_tables.sql`

Copy and run in Supabase SQL Editor:

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
    uploaded_by UUID,
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
    performed_by TEXT,
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

-- CREATE INDEXES FOR PERFORMANCE
CREATE INDEX idx_invoices_vendor_name ON public.invoices(vendor_name);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_uploaded_at ON public.invoices(uploaded_at DESC);
CREATE INDEX idx_risk_reports_risk_level ON public.risk_reports(risk_level);
CREATE INDEX idx_audit_trail_invoice_id ON public.audit_trail(invoice_id);
CREATE INDEX idx_exceptions_invoice_id ON public.exceptions(invoice_id);
CREATE INDEX idx_purchase_ledger_vendor ON public.purchase_ledger(vendor_name);
```

### Step 1.2: Disable RLS on All Tables

```sql
-- DISABLE RLS (no security policies needed - auth handled at API layer)
ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_trail DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exceptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_master DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_ledger DISABLE ROW LEVEL SECURITY;
```

---

## PHASE 2: Node Backend Integration (2-3 hours)

### Step 2.1: Install Supabase Client

**File**: `backend/package.json`

```json
{
  "dependencies": {
    "supabase": "^2.44.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3"
  }
}
```

Run: `npm install`

### Step 2.2: Create Supabase Client Module

**File**: `backend/src/config/supabaseClient.js` (NEW)

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function getSupabaseClient() {
  return supabase;
}
```

### Step 2.3: Update .env

**File**: `backend/.env`

```
SUPABASE_URL=https://lujjfxzmswxiihksssyc.supabase.co
SUPABASE_KEY=sb_publishable_JWmkaGZKby7OaMwk-M-jTw_-58ttYDz
PORT=8000
NODE_ENV=development
```

### Step 2.4: Create Invoice Routes

**File**: `backend/src/routes/invoices.js` (NEW)

```javascript
import express from 'express';
import { supabase } from '../config/supabaseClient.js';

const router = express.Router();

// GET all invoices with filters
router.get('/', async (req, res) => {
  try {
    const { skip = 0, limit = 25, status, vendor } = req.query;

    let query = supabase
      .from('invoices')
      .select('*');

    if (status) {
      query = query.eq('status', status);
    }
    if (vendor) {
      query = query.ilike('vendor_name', `%${vendor}%`);
    }

    const { data, error, count } = await query
      .order('uploaded_at', { ascending: false })
      .range(skip, skip + limit - 1);

    if (error) throw error;

    return res.json({
      success: true,
      data,
      count,
      total: count
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET single invoice with risk report and audit trail
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (invoiceError) throw invoiceError;

    // Get risk report
    const { data: riskReport } = await supabase
      .from('risk_reports')
      .select('*')
      .eq('invoice_id', id)
      .single();

    // Get audit trail
    const { data: auditTrail } = await supabase
      .from('audit_trail')
      .select('*')
      .eq('invoice_id', id);

    // Get exceptions
    const { data: exceptions } = await supabase
      .from('exceptions')
      .select('*')
      .eq('invoice_id', id);

    return res.json({
      success: true,
      data: {
        invoice,
        riskReport: riskReport || {},
        auditTrail: auditTrail || [],
        exceptions: exceptions || []
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// UPDATE invoice status
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const { data, error } = await supabase
      .from('invoices')
      .update({ status, notes, updated_at: new Date() })
      .eq('id', id)
      .select();

    if (error) throw error;

    // Log to audit trail
    await supabase
      .from('audit_trail')
      .insert({
        invoice_id: id,
        action: 'INVOICE_UPDATED',
        details: { status, notes },
        performed_by: req.user?.email || 'system'
      });

    return res.json({
      success: true,
      data: data[0]
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
```

### Step 2.5: Create Dashboard Routes

**File**: `backend/src/routes/dashboard.js` (NEW)

```javascript
import express from 'express';
import { supabase } from '../config/supabaseClient.js';

const router = express.Router();

// GET dashboard summary
router.get('/summary', async (req, res) => {
  try {
    // Get invoices
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, status, total_amount');

    // Get risk reports
    const { data: risks } = await supabase
      .from('risk_reports')
      .select('risk_level');

    const totalCount = invoices?.length || 0;
    const processedCount = invoices?.filter(i => i.status === 'PROCESSED').length || 0;
    const pendingCount = invoices?.filter(i => i.status === 'PENDING').length || 0;
    const totalAmount = invoices?.reduce((sum, i) => sum + (i.total_amount || 0), 0) || 0;

    const riskDistribution = {};
    risks?.forEach(r => {
      riskDistribution[r.risk_level] = (riskDistribution[r.risk_level] || 0) + 1;
    });

    return res.json({
      success: true,
      data: {
        total_invoices: totalCount,
        processed: processedCount,
        pending: pendingCount,
        total_amount: totalAmount,
        risk_distribution: riskDistribution
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET recent invoices
router.get('/recent-invoices', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('id, invoice_number, vendor_name, total_amount, status, uploaded_at')
      .order('uploaded_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
```

### Step 2.6: Update server.js to Include Routes

**File**: `backend/server.js`

```javascript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './src/routes/auth.js';
import invoiceRoutes from './src/routes/invoices.js';
import dashboardRoutes from './src/routes/dashboard.js';

dotenv.config({ path: '.env' });

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`✓ Node backend running on port ${PORT}`);
});
```

---

## PHASE 3: FastAPI Integration with Supabase (1-2 hours)

### Step 3.1: Update FastAPI to Query Supabase

**File**: `backend/app/services/validation_service.py`

```python
import os
from supabase import create_client, Client

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

async def get_vendor_info(vendor_name: str, gst: str):
    """Get vendor from Supabase vendor_master"""
    try:
        response = supabase.table("vendor_master")\
            .select("*")\
            .eq("vendor_name", vendor_name)\
            .single()\
            .execute()
        
        return response.data if response.data else None
    except:
        return None

async def get_po_match(vendor_name: str, amount: float):
    """Get PO match from Supabase purchase_ledger"""
    try:
        response = supabase.table("purchase_ledger")\
            .select("*")\
            .eq("vendor_name", vendor_name)\
            .execute()
        
        if not response.data:
            return None
        
        # Find closest PO by amount
        closest_po = min(response.data, key=lambda x: abs(x["amount"] - amount))
        
        return {
            "matched": True,
            "po_number": closest_po["po_number"],
            "po_amount": closest_po["amount"],
            "variance": amount - closest_po["amount"],
            "amount_match": abs(amount - closest_po["amount"]) < 100
        }
    except:
        return None
```

### Step 3.2: Update processor.py to Save to Supabase

**File**: `backend/app/services/processor.py`

```python
import os
from supabase import create_client

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase = create_client(supabase_url, supabase_key)

async def save_to_supabase(
    invoice_data: dict,
    extraction_result: dict,
    validation_result: dict,
    risk_result: dict,
    user_email: str
):
    """Save invoice and related data to Supabase"""
    
    try:
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
            "uploaded_by": user_email,
        }
        
        invoice_response = supabase.table("invoices")\
            .insert(invoice_record)\
            .execute()
        
        invoice_id = invoice_response.data[0]["id"]
        
        # 2. Save Risk Report
        risk_record = {
            "invoice_id": invoice_id,
            "risk_score": risk_result.risk_score,
            "risk_level": risk_result.risk_level,
            "risk_factors": risk_result.risk_factors,
            "recommendations": risk_result.recommendations
        }
        
        supabase.table("risk_reports")\
            .insert(risk_record)\
            .execute()
        
        # 3. Save Audit Trail
        audit_record = {
            "invoice_id": invoice_id,
            "action": "INVOICE_PROCESSED",
            "details": {
                "extraction_confidence": extraction_result.get("avg_confidence"),
                "risk_score": risk_result.risk_score
            },
            "performed_by": user_email
        }
        
        supabase.table("audit_trail")\
            .insert(audit_record)\
            .execute()
        
        # 4. Save Exceptions
        if validation_result.get("errors"):
            for error in validation_result["errors"]:
                exception_record = {
                    "invoice_id": invoice_id,
                    "exception_type": error.get("type"),
                    "description": error.get("message"),
                    "severity": error.get("severity", "MEDIUM")
                }
                supabase.table("exceptions")\
                    .insert(exception_record)\
                    .execute()
        
        return invoice_id
        
    except Exception as e:
        print(f"Error saving to Supabase: {e}")
        raise
```

### Step 3.3: Update requirements.txt

**File**: `backend/requirements.txt`

```
supabase==2.4.0
google-generativeai==0.3.0
fastapi==0.100.0
uvicorn==0.23.0
python-multipart==0.0.6
pydantic==2.0.0
pydantic-settings==2.0.0
sqlalchemy==2.0.0
python-dotenv==1.0.0
```

---

## PHASE 4: Frontend Services (1-2 hours)

### Step 4.1: Update API Service

**File**: `frontend/src/services/api.ts`

```typescript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Step 4.2: Create Invoice Service

**File**: `frontend/src/services/invoiceService.ts` (NEW)

```typescript
import api from './api';

export async function getInvoices(skip = 0, limit = 25, filters = {}) {
  const { data } = await api.get('/invoices', {
    params: { skip, limit, ...filters }
  });
  return data;
}

export async function getInvoiceDetail(invoiceId: string) {
  const { data } = await api.get(`/invoices/${invoiceId}`);
  return data;
}

export async function updateInvoice(invoiceId: string, updates: any) {
  const { data } = await api.patch(`/invoices/${invoiceId}`, updates);
  return data;
}

export async function searchInvoices(query: string, filters = {}) {
  const { data } = await api.get('/invoices', {
    params: { vendor: query, ...filters }
  });
  return data;
}
```

### Step 4.3: Create Dashboard Service

**File**: `frontend/src/services/dashboardService.ts` (NEW)

```typescript
import api from './api';

export async function getDashboardSummary() {
  const { data } = await api.get('/dashboard/summary');
  return data;
}

export async function getRecentInvoices() {
  const { data } = await api.get('/dashboard/recent-invoices');
  return data;
}
```

---

## PHASE 5: Frontend Pages Integration (2-3 hours)

### Step 5.1: Update Dashboard

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
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-gray-600">Total Invoices</h3>
          <p className="text-3xl font-bold">{summary?.total_invoices}</p>
        </div>
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-gray-600">Processed</h3>
          <p className="text-3xl font-bold">{summary?.processed}</p>
        </div>
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-gray-600">Pending</h3>
          <p className="text-3xl font-bold">{summary?.pending}</p>
        </div>
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-gray-600">Total Amount</h3>
          <p className="text-3xl font-bold">₹{summary?.total_amount?.toLocaleString()}</p>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4">Recent Invoices</h2>
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-4">Invoice #</th>
              <th className="text-left p-4">Vendor</th>
              <th className="text-left p-4">Amount</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {recentInvoices?.map(inv => (
              <tr key={inv.id} className="border-t hover:bg-gray-50">
                <td className="p-4">{inv.invoice_number}</td>
                <td className="p-4">{inv.vendor_name}</td>
                <td className="p-4">₹{inv.total_amount?.toLocaleString()}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    inv.status === 'PROCESSED' ? 'bg-green-100 text-green-800' :
                    inv.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {inv.status}
                  </span>
                </td>
                <td className="p-4">{new Date(inv.uploaded_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## .ENV Files

### backend/.env
```
SUPABASE_URL=https://lujjfxzmswxiihksssyc.supabase.co
SUPABASE_KEY=sb_publishable_JWmkaGZKby7OaMwk-M-jTw_-58ttYDz
GEMINI_API_KEY=your_gemini_key
PORT=8000
NODE_ENV=development
```

### frontend/.env.local
```
VITE_API_URL=http://localhost:8000/api/v1
VITE_SUPABASE_URL=https://lujjfxzmswxiihksssyc.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_JWmkaGZKby7OaMwk-M-jTw_-58ttYDz
```

---

## INTEGRATION FLOW

```
1. User uploads invoice
   ↓
2. Node backend receives file → sends to FastAPI
   ↓
3. FastAPI processes:
   - AI extraction via Gemini
   - Queries Supabase for vendor/PO data
   - Risk scoring
   ↓
4. FastAPI returns results to Node backend
   ↓
5. Node backend saves to Supabase:
   - invoices table
   - risk_reports table
   - audit_trail table
   - exceptions table (if any)
   ↓
6. Frontend fetches from Node backend APIs
   ↓
7. Node backend queries Supabase
   ↓
8. Data displayed in Dashboard/InvoiceList
```

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Supabase Schema
- [ ] Run SQL to create tables
- [ ] Verify tables created in Supabase
- [ ] Confirm RLS disabled

### Phase 2: Node Backend
- [ ] Install supabase package
- [ ] Create supabaseClient.js
- [ ] Create invoices.js routes
- [ ] Create dashboard.js routes
- [ ] Update server.js with new routes
- [ ] Test endpoints: GET /api/v1/invoices, /api/v1/dashboard/summary

### Phase 3: FastAPI Integration
- [ ] Install supabase package
- [ ] Update validation_service.py to query Supabase
- [ ] Update processor.py to save to Supabase
- [ ] Test FastAPI still processes invoices

### Phase 4: Frontend Services
- [ ] Create invoiceService.ts
- [ ] Create dashboardService.ts
- [ ] Update api.ts with interceptors

### Phase 5: Frontend Pages
- [ ] Update Dashboard.tsx to use new services
- [ ] Update InvoiceList.tsx (similar pattern)
- [ ] Update InvoiceDetail.tsx
- [ ] Test page loads with real data

---

**Total Time**: 8-10 hours to production-ready

**Ready to start Phase 1?**

