-- Make auth_id nullable to allow setup without auth during rate limit
ALTER TABLE public.users_roles 
ALTER COLUMN auth_id DROP NOT NULL;

-- Create index for null auth_id if needed
CREATE INDEX IF NOT EXISTS idx_users_roles_auth_id_null 
ON public.users_roles(auth_id) WHERE auth_id IS NULL;

SELECT 'Constraint relaxed - auth_id is now nullable' as status;
