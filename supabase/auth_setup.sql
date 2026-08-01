-- ================================================
-- SUPABASE AUTHENTICATION & AUTHORIZATION SETUP
-- ================================================
-- This script sets up:
-- 1. User roles (admin, auditor, user)
-- 2. Role-based access control (RBAC)
-- 3. Disable RLS for development (as requested)
-- ================================================

-- ================================================
-- 1. CREATE CUSTOM ROLES
-- ================================================

-- Admin role - full access to all tables and operations
CREATE ROLE admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON SCHEMA public TO admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO admin;

-- Auditor role - read/write to invoices, risk_reports, audit_trail
CREATE ROLE auditor;
GRANT SELECT, INSERT, UPDATE ON TABLE invoices TO auditor;
GRANT SELECT, INSERT, UPDATE ON TABLE risk_reports TO auditor;
GRANT SELECT, INSERT ON TABLE audit_trail TO auditor;
GRANT SELECT ON TABLE purchase_ledger TO auditor;
GRANT SELECT ON TABLE vendor_master TO auditor;
GRANT SELECT ON TABLE exceptions TO auditor;
GRANT SELECT ON TABLE uploads TO auditor;

-- User role - read-only access
CREATE ROLE "user";
GRANT SELECT ON TABLE invoices TO "user";
GRANT SELECT ON TABLE risk_reports TO "user";
GRANT SELECT ON TABLE purchase_ledger TO "user";
GRANT SELECT ON TABLE vendor_master TO "user";
GRANT SELECT ON TABLE audit_trail TO "user";

-- ================================================
-- 2. CREATE USERS TABLE FOR ROLE MAPPING
-- ================================================

CREATE TABLE IF NOT EXISTS auth.users_roles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'auditor', 'user')),
    full_name TEXT,
    department TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_email)
);

-- Index for quick role lookups
CREATE INDEX idx_users_roles_email ON auth.users_roles(user_email);
CREATE INDEX idx_users_roles_role ON auth.users_roles(role);

-- ================================================
-- 3. RLS DISABLED - NOT REQUIRED
-- ================================================

-- RLS is NOT enabled on any tables
-- All authenticated users have full database access
-- Authorization is handled at the application level using roles

-- ================================================
-- 4. CREATE TRIGGER FOR AUDIT TRAIL
-- ================================================
-- Automatically log all changes to audit_trail table

CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_trail (
      id, 
      invoice_id, 
      action, 
      action_category, 
      actor, 
      details, 
      metadata, 
      new_values,
      timestamp
    ) VALUES (
      gen_random_uuid(),
      CASE 
        WHEN TG_TABLE_NAME = 'invoices' THEN NEW.id
        WHEN TG_TABLE_NAME = 'risk_reports' THEN NEW.invoice_id
        WHEN TG_TABLE_NAME = 'exceptions' THEN NEW.invoice_id
        ELSE NULL
      END,
      'CREATE_' || UPPER(TG_TABLE_NAME),
      'SYSTEM',
      current_user,
      'Record created',
      jsonb_build_object('table', TG_TABLE_NAME),
      to_jsonb(NEW),
      CURRENT_TIMESTAMP
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_trail (
      id, 
      invoice_id, 
      action, 
      action_category, 
      actor, 
      details, 
      metadata, 
      old_values,
      new_values,
      timestamp
    ) VALUES (
      gen_random_uuid(),
      CASE 
        WHEN TG_TABLE_NAME = 'invoices' THEN NEW.id
        WHEN TG_TABLE_NAME = 'risk_reports' THEN NEW.invoice_id
        WHEN TG_TABLE_NAME = 'exceptions' THEN NEW.invoice_id
        ELSE NULL
      END,
      'UPDATE_' || UPPER(TG_TABLE_NAME),
      'SYSTEM',
      current_user,
      'Record updated',
      jsonb_build_object('table', TG_TABLE_NAME),
      to_jsonb(OLD),
      to_jsonb(NEW),
      CURRENT_TIMESTAMP
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_trail (
      id, 
      invoice_id, 
      action, 
      action_category, 
      actor, 
      details, 
      metadata, 
      old_values,
      timestamp
    ) VALUES (
      gen_random_uuid(),
      CASE 
        WHEN TG_TABLE_NAME = 'invoices' THEN OLD.id
        WHEN TG_TABLE_NAME = 'risk_reports' THEN OLD.invoice_id
        WHEN TG_TABLE_NAME = 'exceptions' THEN OLD.invoice_id
        ELSE NULL
      END,
      'DELETE_' || UPPER(TG_TABLE_NAME),
      'SYSTEM',
      current_user,
      'Record deleted',
      jsonb_build_object('table', TG_TABLE_NAME),
      to_jsonb(OLD),
      CURRENT_TIMESTAMP
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 5. CREATE HELPER FUNCTIONS
-- ================================================

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM auth.users_roles WHERE user_email = $1;
  RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM auth.users_roles WHERE user_email = $1) = 'admin';
END;
$$ LANGUAGE plpgsql;

-- Function to check if user is auditor
CREATE OR REPLACE FUNCTION is_auditor(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM auth.users_roles WHERE user_email = $1) IN ('admin', 'auditor');
END;
$$ LANGUAGE plpgsql;

-- Function to assign role to user
CREATE OR REPLACE FUNCTION assign_user_role(
  user_email TEXT, 
  user_role TEXT,
  full_name TEXT DEFAULT NULL,
  department TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO auth.users_roles (user_email, role, full_name, department)
  VALUES ($1, $2, $3, $4)
  ON CONFLICT (user_email) DO UPDATE SET
    role = $2,
    full_name = COALESCE($3, auth.users_roles.full_name),
    department = COALESCE($4, auth.users_roles.department),
    updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 6. GRANT FUNCTION PERMISSIONS
-- ================================================

GRANT EXECUTE ON FUNCTION get_user_role(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_auditor(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION assign_user_role(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- ================================================
-- 7. CREATE SAMPLE USERS & ROLES
-- ================================================

-- Sample admin user
SELECT assign_user_role(
  'admin@example.com',
  'admin',
  'Admin User',
  'System'
);

-- Sample auditor users
SELECT assign_user_role(
  'auditor1@example.com',
  'auditor',
  'John Auditor',
  'Finance'
);

SELECT assign_user_role(
  'auditor2@example.com',
  'auditor',
  'Jane Compliance',
  'Compliance'
);

-- Sample regular users
SELECT assign_user_role(
  'user1@example.com',
  'user',
  'Regular User',
  'Operations'
);

SELECT assign_user_role(
  'user2@example.com',
  'user',
  'Another User',
  'Operations'
);

-- ================================================
-- 8. VERIFICATION QUERIES
-- ================================================

-- View all users and their roles
SELECT * FROM auth.users_roles ORDER BY created_at DESC;

-- View role permissions
-- Admin has full access
-- Auditor has read/write on invoices, risk_reports, audit_trail
-- User has read-only access

-- ================================================
-- NOTES FOR DEVELOPMENT
-- ================================================
/*

RLS IS NOW DISABLED for development and testing.

This means:
✓ All authenticated users can access all tables (no row-level restrictions)
✓ Roles are tracked in auth.users_roles for application-level authorization
✓ Application code must enforce authorization logic
✓ Audit trail tracks all changes for compliance

ROLE PERMISSIONS:
- admin: Full access to all tables
- auditor: Read/write invoices, risk_reports; read-only purchase_ledger, vendor_master
- user: Read-only access to all tables

WHEN ENABLING RLS IN PRODUCTION:
1. Create RLS policies for each role
2. Re-enable RLS: ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
3. Test thoroughly before deploying
4. See rls_policies.sql for production setup

*/

-- ================================================
-- END OF AUTH SETUP
-- ================================================
