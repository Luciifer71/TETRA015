# Invoice Guard AI - Setup Instructions

## ✅ What's Already Done
- Backend Express API created
- Frontend with React/TypeScript set up
- Supabase auth integration ready
- Role-based authorization system designed
- Test files for verification

## 🚀 Next Steps to Complete Setup

### Step 1: Run SQL Setup in Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: `lujjfxzmswxiihksssyc`
3. Go to **SQL Editor**
4. Click **New Query**
5. Copy and paste the SQL from `supabase/run_setup.sql`
6. Click **Run**

This creates:
- `users_roles` table (tracks user roles)
- Helper functions for role management
- Proper permissions for authenticated users

### Step 2: Verify SQL Execution

In SQL Editor, run:
```sql
SELECT * FROM users_roles;
```

You should get an empty table (no error).

### Step 3: Start Backend

```bash
cd backend
npm start
```

Server should start on port 8000:
```
✓ Server running on port 8000
✓ Health check: http://localhost:8000/health
✓ API: http://localhost:8000/api/v1
```

### Step 4: Run Setup Script

In a new terminal:
```bash
# First, wait ~40 seconds between any auth attempts (Supabase rate limit)
node setup_admin.js
```

This will:
- Create admin user (admin@invoiceguard.com)
- Save credentials to .admin-credentials
- Disable the setup route for security

### Step 5: Start Frontend

```bash
cd frontend
npm run dev
```

Frontend starts on http://localhost:3000

### Step 6: Login

1. Visit http://localhost:3000/login
2. Use credentials from `.admin-credentials` file
3. Or use: admin@invoiceguard.com / SecureAdminPass123!

## 🔑 Key Credentials

**Admin User:**
- Email: `admin@invoiceguard.com`
- Password: `SecureAdminPass123!`

**Database:**
- Supabase URL: https://lujjfxzmswxiihksssyc.supabase.co
- Anon Key: `sb_publishable_JWmkaGZKby7OaMwk-M-jTw_-58ttYDz`

## ⚠️ Important Security Notes

1. **SQL Setup**: Must be run once in Supabase to create tables
2. **Setup Route**: Only enabled when `ENABLE_SETUP_ADMIN=true` in .env
3. **After Admin Creation**: Set `ENABLE_SETUP_ADMIN=false` in backend/.env
4. **Credentials File**: Move `.admin-credentials` to secure location, delete from repo
5. **Rate Limiting**: Wait 40+ seconds between consecutive auth requests

## 📊 Test the System

After everything is set up:

```bash
# Run auth system test
node test_auth_system.js
```

Expected results:
- ✅ Health Check (always passes)
- ✅ Signup (creates test user)
- ✅ Setup Admin (shows as disabled if ENABLE_SETUP_ADMIN=false)
- ✅ Assign Role (updates user role)
- ✅ Get User Role (retrieves user info)
- ✅ List Users (shows all users)

## 🐛 Troubleshooting

### "Could not find the table 'public.users_roles'"
- **Solution**: Run the SQL setup script in Supabase (Step 1)

### "For security purposes, you can only request this after X seconds"
- **Solution**: Wait the specified seconds before trying auth again (Supabase rate limit)

### "Setup admin route not found"
- **Solution**: Ensure `ENABLE_SETUP_ADMIN=true` in backend/.env

### "Cannot connect to http://localhost:8000"
- **Solution**: Ensure backend is running with `npm start`

## 📁 Important Files

- `.env` - Environment variables (credentials)
- `.admin-credentials` - Initial admin login (keep secure!)
- `setup_admin.js` - Script to create first admin
- `test_auth_system.js` - Test script to verify everything works
- `supabase/run_setup.sql` - SQL to create tables and functions
- `frontend/.env` - Frontend Supabase config
- `backend/.env` - Backend Supabase config

## 🎯 Architecture Overview

```
Frontend (React)
├── Login page (Supabase auth)
├── Admin setup page (first-time only)
└── Dashboard (after login)

Backend (Express/Node)
├── Auth routes (signup, login, assign-role)
├── Invoice routes (CRUD operations)
└── Supabase integration

Database (PostgreSQL via Supabase)
├── users_roles table (user + role mapping)
├── invoices table (invoice data)
├── purchase_ledger table (PO matching)
└── Other business tables

Auth Flow:
1. User signs up → Supabase Auth creates user
2. Role assigned → users_roles table stores role
3. Frontend checks role → Shows appropriate dashboard
4. All API requests → Supabase auth token verified
```

## ✅ Verification Checklist

- [ ] SQL setup script run in Supabase
- [ ] Backend server running on port 8000
- [ ] Frontend running on port 3000
- [ ] Admin user created
- [ ] Can login with admin credentials
- [ ] All 6 tests pass with `node test_auth_system.js`
- [ ] `ENABLE_SETUP_ADMIN=false` after initial setup

## 📚 Additional Resources

- Supabase Docs: https://supabase.com/docs
- Express Docs: https://expressjs.com
- React Docs: https://react.dev

---

**Status**: Ready for deployment after SQL setup
**Last Updated**: 2026-08-01
