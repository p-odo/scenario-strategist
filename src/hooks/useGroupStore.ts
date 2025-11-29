import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GroupStore {
  groupId: string | null;
  groupName: string | null;
  setGroup: (id: string, name: string) => void;
  clearGroup: () => void;
}

export const useGroupStore = create<GroupStore>()(
  persist(
    (set) => ({
      groupId: null,
      groupName: null,
      setGroup: (id, name) => set({ groupId: id, groupName: name }),
      clearGroup: () => set({ groupId: null, groupName: null }),
    }),
    {
      name: 'group-storage',
    }
  )
);
