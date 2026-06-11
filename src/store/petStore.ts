import { create } from 'zustand';
import type { Pet } from '@/data/types';
import { mockPets } from '@/data/mockData';

interface PetState {
  pets: Pet[];
  selectedPet: Pet | null;
  loading: boolean;
  
  setSelectedPet: (pet: Pet | null) => void;
  addPet: (pet: Omit<Pet, 'id' | 'userId'>) => void;
  updatePet: (id: string, updates: Partial<Pet>) => void;
  deletePet: (id: string) => void;
  getPetsByUser: (userId: string) => Pet[];
}

export const usePetStore = create<PetState>((set, get) => ({
  pets: mockPets,
  selectedPet: null,
  loading: false,
  
  setSelectedPet: (pet) => set({ selectedPet: pet }),
  
  addPet: (petData) => {
    const { currentUser } = useAuthStore.getState();
    if (!currentUser) return;
    
    const newPet: Pet = {
      ...petData,
      id: `pet-${Date.now()}`,
      userId: currentUser.id,
    };
    set((state) => ({ pets: [...state.pets, newPet] }));
  },
  
  updatePet: (id, updates) => {
    set((state) => ({
      pets: state.pets.map((pet) =>
        pet.id === id ? { ...pet, ...updates } : pet
      ),
      selectedPet:
        state.selectedPet?.id === id
          ? { ...state.selectedPet, ...updates }
          : state.selectedPet,
    }));
  },
  
  deletePet: (id) => {
    set((state) => ({
      pets: state.pets.filter((pet) => pet.id !== id),
      selectedPet: state.selectedPet?.id === id ? null : state.selectedPet,
    }));
  },
  
  getPetsByUser: (userId) => {
    return get().pets.filter((pet) => pet.userId === userId);
  },
}));

import { useAuthStore } from './authStore';
