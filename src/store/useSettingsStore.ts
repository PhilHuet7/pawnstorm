import { create } from "zustand";
import { persist } from "zustand/middleware";

type SettingsState = {
  muted: boolean;
  /** Which colour sits at the bottom of the board. Consumed from Phase 3 on. */
  orientation: "w" | "b";
  showCoordinates: boolean;

  toggleMuted: () => void;
  setOrientation: (o: "w" | "b") => void;
  flipOrientation: () => void;
  toggleCoordinates: () => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      muted: false,
      orientation: "w",
      showCoordinates: true,

      toggleMuted: () => set((s) => ({ muted: !s.muted })),
      setOrientation: (orientation) => set({ orientation }),
      flipOrientation: () =>
        set((s) => ({ orientation: s.orientation === "w" ? "b" : "w" })),
      toggleCoordinates: () =>
        set((s) => ({ showCoordinates: !s.showCoordinates })),
    }),
    {
      name: "pawnstorm-settings",
      // Rehydrating at module load would run before React hydrates, so the
      // first client render could disagree with the server HTML. ClientProvider
      // calls rehydrate() in an effect instead.
      skipHydration: true,
    },
  ),
);
