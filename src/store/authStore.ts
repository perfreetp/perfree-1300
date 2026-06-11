import { create } from 'zustand';
import type { User } from '@/data/types';
import { mockUsers } from '@/data/mockData';

interface AuthState {
  currentUser: User | null;
  users: User[];
  login: (userId: string) => void;
  logout: () => void;
  switchRole: (role: 'owner' | 'feeder' | 'admin') => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: mockUsers[0],
  users: mockUsers,
  
  login: (userId: string) => {
    const user = get().users.find(u => u.id === userId);
    if (user) {
      set({ currentUser: user });
    }
  },
  
  logout: () => {
    set({ currentUser: null });
  },
  
  switchRole: (role: 'owner' | 'feeder' | 'admin') => {
    const { currentUser } = get();
    if (currentUser) {
      set({ currentUser: { ...currentUser, role } });
    }
  },
}));
