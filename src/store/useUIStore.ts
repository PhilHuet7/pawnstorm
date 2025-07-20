import { create } from "zustand";

type UIState = {
  dragSource: string | null;
  setDragSource: (sq: string | null) => void;
};

export const useUIStore = create<UIState>((set) => ({
  dragSource: null,
  setDragSource: (sq) => set({ dragSource: sq }),
}));
