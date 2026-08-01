import { supabase } from '@/lib/supabase';

export type UserRole = 'admin' | 'auditor' | 'user';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  department?: string;
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  // Get user role from users_roles table
  const { data, error } = await supabase
    .from('users_roles')
    .select('role, full_name, department')
    .eq('email', user.email)
    .single();
  
  if (error) {
    console.error('Error fetching user role:', error);
    return null;
  }
  
  return {
    id: user.id,
    email: user.email || '',
    role: data?.role || 'user',
    full_name: data?.full_name,
    department: data?.department,
  } as AuthUser;
}

export async function assignUserRole(
  email: string,
  role: UserRole,
  full_name?: string,
  department?: string
) {
  const { data: userData } = await supabase.auth.admin.listUsers();
  const user = userData?.users?.find((u) => u.email === email);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  const { data, error } = await supabase
    .from('users_roles')
    .upsert({
      auth_id: user.id,
      email,
      role,
      full_name,
      department,
    }, {
      onConflict: 'email'
    });
  
  return { data, error };
}

export async function isAdmin(user: AuthUser | null) {
  return user?.role === 'admin';
}

export async function isAuditor(user: AuthUser | null) {
  return user?.role === 'admin' || user?.role === 'auditor';
}

export async function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const user = await getCurrentUser();
      callback(user);
    } else {
      callback(null);
    }
  });
  
  return subscription;
}
