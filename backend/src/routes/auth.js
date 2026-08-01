import express from 'express';
import { z } from 'zod';
import { getSupabase } from '../config/supabase.js';
import crypto from 'crypto';

const router = express.Router();

// Simple hash function for storing passwords (use bcrypt in production)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Custom login endpoint (bypass Supabase Auth)
router.post('/login', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password required'
      });
    }

    // Get user from users_roles table
    const { data: user, error: userError } = await supabase
      .from('users_roles')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Get password hash from auth_credentials table
    const { data: creds, error: credsError } = await supabase
      .from('auth_credentials')
      .select('password_hash')
      .eq('email', email)
      .single();

    if (credsError || !creds) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Verify password
    const passwordHash = hashPassword(password);
    if (creds.password_hash !== passwordHash) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Return user data (frontend will store in session/localStorage)
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        department: user.department
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Validation schemas
const SignUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().optional(),
  role: z.enum(['admin', 'auditor', 'user']).default('user')
});

const AssignRoleSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'auditor', 'user'])
});

// Sign up
router.post('/signup', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { email, password, full_name, role } = SignUpSchema.parse(req.body);

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    });

    if (authError) throw authError;

    // Assign role in database
    const { data: roleData, error: roleError } = await supabase
      .from('users_roles')
      .insert({
        auth_id: authData.user.id,
        email,
        role,
        full_name,
        is_active: true
      })
      .select();

    if (roleError) throw roleError;

    res.json({
      success: true,
      message: `User created with role: ${role}`,
      user_id: authData.user.id
    });
  } catch (error) {
    if (error.issues) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation error',
        details: error.issues 
      });
    }
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Assign role
router.post('/assign-role', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { email, role } = AssignRoleSchema.parse(req.body);

    // First, check if user exists in users_roles
    const { data: existing } = await supabase
      .from('users_roles')
      .select('*')
      .eq('email', email)
      .single();

    if (existing) {
      // Update existing user
      const { data, error } = await supabase
        .from('users_roles')
        .update({
          role,
          updated_at: new Date().toISOString()
        })
        .eq('email', email)
        .select();

      if (error) throw error;

      return res.json({
        success: true,
        message: `Role updated to ${role}`,
        data: data[0]
      });
    } else {
      // User doesn't exist - can't assign role without auth_id
      return res.status(404).json({
        success: false,
        error: 'User not found. Create user with signup first.'
      });
    }
  } catch (error) {
    if (error.issues) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation error',
        details: error.issues 
      });
    }
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// List all users (admin only)
router.get('/users', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('users_roles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get user role
router.get('/user-role/:email', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { email } = req.params;

    const { data, error } = await supabase
      .from('users_roles')
      .select('role, full_name, department')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    res.json({
      success: true,
      role: data?.role || 'user',
      full_name: data?.full_name,
      department: data?.department
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;
