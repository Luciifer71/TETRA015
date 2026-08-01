import { create } from 'zustand';
import { AuthUser } from '@/services/auth';
import { onAuthStateChange, getCurrentUser } from '@/services/auth';

interface AuthStore {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set) => {
  // Listen for auth changes
  let subscription: any;
  
  return {
    user: null,
    loading: true,
    error: null,
    
    setUser: (user) => {
      set({ user, loading: false });
    },
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    
    initializeAuth: () => {
      // Check localStorage first
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser) as AuthUser;
          set({ user, loading: false });
          return;
        } catch (e) {
          localStorage.removeItem('user');
        }
      }

      // Then check Supabase
      getCurrentUser().then((user) => {
        set({ user, loading: false });
      });

      subscription = onAuthStateChange((user) => {
        set({ user, loading: false });
      });
    },
  };
});
