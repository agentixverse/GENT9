import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface SectorState {
  activeSectorId: number | null;
}

interface SectorActions {
  setActiveSector: (id: number) => void;
  clearActiveSector: () => void;
}

type SectorStore = SectorState & SectorActions;

export const useSectorStore = create<SectorStore>()(
  devtools(
    persist(
      immer((set) => ({
        activeSectorId: null,

        setActiveSector: (id) =>
          set((state) => {
            state.activeSectorId = id;
          }),

        clearActiveSector: () =>
          set((state) => {
            state.activeSectorId = null;
          }),
      })),
      {
        name: "sector-storage",
        storage: createJSONStorage(() => localStorage),
      }
    ),
    { name: "SectorStore" }
  )
);
