import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  activeModal: string | null; // e.g. 'create-project' | 'edit-project' | null
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveModal: (modal: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activeModal: null,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveModal: (modal) => set({ activeModal: modal }),
}));
export default useUIStore;
