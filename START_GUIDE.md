# Invoice Audit Platform - START GUIDE

**Last Updated:** August 2, 2026  
**Status:** Production Ready  
**LLM Provider:** Groq (llama-3.3-70b-versatile)

---

## Architecture Overview

```
Frontend (React + TypeScript)
    ↓ http://localhost:5173
    ├─→ FastAPI Backend (:8000) - File upload, OCR, extraction, validation, risk scoring
    └─→ Node API (:8001) - Dashboard, auth, invoice CRUD, Supabase queries
         ↓
    Supabase PostgreSQL - invoices, risk_reports, audit_trail, etc.
```

---

## Key File Locations

| Purpose | Path | DO NOT RUN DIRECTLY |
|---------|------|-------------------|
| FastAPI Server | `backend/main.py` | ❌ |
| Node API Server | `backend/server.js` | ❌ |
| Frontend App | `frontend/package.json` | ❌ |
| Real AI Extractor (used by FastAPI) | `backend/app/services/ai_extractor.py` | ❌ (called by FastAPI) |
| Old helper (not used in app flow) | `backend/ai_service/invoice_extractor.py` | ❌ (legacy, don't run) |

---

## Quick Start (3 Terminals)

### Terminal 1: FastAPI (Port 8000)

```powershell
cd C:\Users\patel\Desktop\NUV\Invoice-Audit-Platform\backend
.\venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

**If blocked by PowerShell execution policy:**
```powershell
cd C:\Users\patel\Desktop\NUV\Invoice-Audit-Platform\backend
.\venv\Scripts\Activate.ps1
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

✅ Expected output: `Uvicorn running on http://127.0.0.1:8000`

---

### Terminal 2: Node Backend (Port 8001)

```powershell
cd C:\Users\patel\Desktop\NUV\Invoice-Audit-Platform\backend
node server.js
```

**If npm/node is blocked:**
```powershell
cmd /c npm.cmd install
cmd /c node server.js
```

✅ Expected output: `✓ Node backend running on port 8001`

---

### Terminal 3: Frontend (Port 5173)

```powershell
cd C:\Users\patel\Desktop\NUV\Invoice-Audit-Platform\frontend
npm run dev
```

**If npm is blocked:**
```powershell
cmd /c npm.cmd install
cmd /c npm.cmd run dev
```

✅ Expected output: `Local: http://localhost:5173`

---

## What Each Service Does

| Service | Port | Function |
|---------|------|----------|
| **FastAPI** | 8000 | Uploads files, runs OCR with PaddleOCR, extracts invoice data via Groq LLM, validates, calculates risk |
| **Node API** | 8001 | Serves dashboard data, authentication, invoice CRUD, queries Supabase |
| **Frontend** | 5173 | React UI - upload invoices, view dashboard, see risk scores |

---

## Environment Configuration

**Backend (.env already configured):**
```
ACTIVE_LLM_PROVIDER=groq
GROQ_API_KEY=<your-groq-api-key>
GROQ_MODEL=llama-3.3-70b-versatile
SUPABASE_URL=https://lujjfxzmswxiihksssyc.supabase.co
SUPABASE_KEY=<your-supabase-key>
```

> Note: Credentials are in backend/.env (not committed to git)

**Frontend (.env already configured):**
```
VITE_API_URL=http://localhost:8001/api/v1
VITE_SUPABASE_URL=https://lujjfxzmswxiihksssyc.supabase.co
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

> Note: Credentials are in frontend/.env (not committed to git)

---

## Health Checks

**FastAPI Health:**
```powershell
curl http://127.0.0.1:8000/health
```

**Node Health:**
```powershell
curl http://localhost:8001/health
```

---

## Test Real Invoices

**Option 1: Batch test (10 PDFs):**
```powershell
cd C:\Users\patel\Desktop\NUV\Invoice-Audit-Platform\backend
.\venv\Scripts\python.exe test_all_invoices.py
```

**Option 2: Via Frontend UI:**
1. Open http://localhost:5173
2. Navigate to upload page
3. Drop a PDF from `docs/invoices/` folder
4. Wait for extraction and risk scoring
5. View results on dashboard

---

## Test Data

10 sample PDFs ready in: `docs/invoices/`
- demo-invoice-20tax-1.pdf through demo-invoice-20tax-10.pdf

---

## Troubleshooting

**"ModuleNotFoundError: No module named..."**
- Ensure venv is activated for FastAPI terminal
- Run: `.\venv\Scripts\python.exe -m uvicorn main:app ...`

**"Port already in use"**
- Kill process on port: `taskkill /PID <PID> /F`
- Or use different port: `--port 8001` in uvicorn command

**"Cannot find module 'express'"**
- Run: `npm install` in backend folder

**"Frontend can't reach API"**
- Check VITE_API_URL in frontend/.env is `http://localhost:8001/api/v1`
- Verify Node backend is running

**PowerShell script execution blocked**
- Use `cmd /c` prefix: `cmd /c npm.cmd install`
- Or use direct python: `.\venv\Scripts\python.exe ...`

---

## Production Checklist

- ✅ FastAPI configured with Groq LLM provider
- ✅ Node backend connected to Supabase
- ✅ Frontend API endpoints configured
- ✅ Database tables created
- ✅ 10 test invoices ready
- ✅ CORS configured for local development
- ✅ Rate limiting enabled (15 req/60s)

---

## Important: Do NOT Run These Directly

These are service/helper files, **not** executable entry points:
- ❌ `backend/ai_service/invoice_extractor.py` - Helper for legacy code
- ❌ `backend/app/services/ai_extractor.py` - Called by FastAPI internally

**Only run these three:**
1. Terminal 1: `python -m uvicorn main:app ...` (FastAPI)
2. Terminal 2: `node server.js` (Node API)
3. Terminal 3: `npm run dev` (Frontend)

---

## Database

Supabase PostgreSQL with 6 tables:
- `invoices` - Main invoice data
- `risk_reports` - Risk scores and factors
- `audit_trail` - Audit logs
- `exceptions` - Business rule violations
- `vendor_master` - Vendor info
- `purchase_ledger` - Purchase history

All connected via `.env` credentials.

---

## Support

For issues, check:
1. Health endpoints (both services responding?)
2. .env files configured correctly
3. Ports not in use (8000, 8001, 5173)
4. Venv activated for Python commands
5. Node modules installed (`npm install`)

---

**Ready to start? Follow the 3 Terminals section above. 🚀**
