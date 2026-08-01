import { create } from 'zustand';

export interface UserProfile {
  name: string;
  role: string;
  email: string;
  department: string;
  organization: string;
  avatarInitials: string;
}

interface AuthStore {
  isAuthenticated: boolean;
  user: UserProfile;
  login: (email?: string, password?: string) => void;
  logout: () => void;
  updateUser: (data: Partial<UserProfile>) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: true,
  user: {
    name: 'Priya Sharma',
    role: 'Senior Auditor',
    email: 'priya.sharma@enterprise.com',
    department: 'Finance & GSTN Risk Audit',
    organization: 'Enterprise FinTech Corp',
    avatarInitials: 'PS',
  },
  login: (email) =>
    set((state) => ({
      isAuthenticated: true,
      user: {
        ...state.user,
        email: email || state.user.email,
      },
    })),
  logout: () => set({ isAuthenticated: false }),
  updateUser: (data) =>
    set((state) => {
      const newName = data.name !== undefined ? data.name : state.user.name;
      const initials = newName
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

      return {
        user: {
          ...state.user,
          ...data,
          avatarInitials: initials || 'PS',
        },
      };
    }),
}));
