import { create } from 'zustand';
import { AuthUser } from '@/services/auth';
import { onAuthStateChange } from '@/services/auth';

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
    
    setUser: (user) => set({ user }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    
    initializeAuth: () => {
      subscription = onAuthStateChange((user) => {
        set({ user, loading: false });
      });
    },
  };
});
