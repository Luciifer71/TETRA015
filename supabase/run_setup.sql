-- Run this in Supabase SQL Editor to set up authentication and roles

-- Create users_roles table
CREATE TABLE IF NOT EXISTS public.users_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'auditor', 'user')),
    full_name TEXT,
    department TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_roles_email ON public.users_roles(email);
CREATE INDEX idx_users_roles_auth_id ON public.users_roles(auth_id);
CREATE INDEX idx_users_roles_role ON public.users_roles(role);

-- Helper functions
CREATE OR REPLACE FUNCTION get_user_role(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.users_roles WHERE email = $1;
  RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION is_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM public.users_roles WHERE email = $1) = 'admin';
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION is_auditor_or_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM public.users_roles WHERE email = $1) IN ('admin', 'auditor');
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Done
SELECT 'Auth setup completed successfully!' as status;
