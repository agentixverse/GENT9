import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export type StrategyType =
  | "rsi"
  | "sma_cross"
  | "position_monitor"
  | "time_limit";

export interface Orb {
  id: string; // Temporary ID for UI
  name: string;
  network_thread_registry_id: string | null;
  selectedChain: string | null; // Derived from selected thread for display
  assets: string[];
  strategyType: StrategyType | null;
}

interface OnboardingState {
  // Navigation
  currentSlide: number;
  isCompleted: boolean;

  // Slide 6: Sector + Policy
  sectorName: string;
  policyText: string;

  // Slide 7: Orbs
  orbs: Orb[];

  // Slide 9: Profile
  username: string;
  email: string;
  password: string;
}

interface OnboardingActions {
  // Navigation
  setCurrentSlide: (slide: number) => void;
  resetOnboarding: () => void;
  completeOnboarding: () => void;

  // Sector & Policy
  setSectorName: (name: string) => void;
  setPolicyText: (text: string) => void;

  // Orbs
  addOrb: () => void;
  updateOrb: (id: string, updates: Partial<Orb>) => void;
  removeOrb: (id: string) => void;

  // Profile
  setProfileData: (data: {
    username: string;
    email: string;
    password: string;
  }) => void;
}

type OnboardingStore = OnboardingState & OnboardingActions;

const initialState: OnboardingState = {
  currentSlide: 0,
  isCompleted: false,
  sectorName: "",
  policyText: "",
  orbs: [
    {
      id: crypto.randomUUID(),
      name: "",
      network_thread_registry_id: null,
      selectedChain: null,
      assets: [],
      strategyType: null,
    },
  ], // Start with one empty orb
  username: "",
  email: "",
  password: "",
};

export const useOnboardingStore = create<OnboardingStore>()(
  devtools(
    persist(
      immer((set) => ({
        ...initialState,

        // Navigation
        setCurrentSlide: (slide: number) => {
          set((state) => {
            state.currentSlide = slide;
          });
        },

        resetOnboarding: () => {
          set((state) => {
            Object.assign(state, initialState);
          });
        },

        completeOnboarding: () => {
          set((state) => {
            state.isCompleted = true;
          });
        },

        // Sector & Policy
        setSectorName: (name: string) => {
          set((state) => {
            state.sectorName = name;
          });
        },

        setPolicyText: (text: string) => {
          set((state) => {
            state.policyText = text;
          });
        },

        // Orbs
        addOrb: () => {
          set((state) => {
            state.orbs.push({
              id: crypto.randomUUID(),
              name: "",
              network_thread_registry_id: null,
              selectedChain: null,
              assets: [],
              strategyType: null,
            });
          });
        },

        updateOrb: (id: string, updates: Partial<Orb>) => {
          set((state) => {
            const orb = state.orbs.find((o) => o.id === id);
            if (orb) {
              Object.assign(orb, updates);
            }
          });
        },

        removeOrb: (id: string) => {
          set((state) => {
            state.orbs = state.orbs.filter((o) => o.id !== id);
          });
        },

        // Profile
        setProfileData: (data: {
          username: string;
          email: string;
          password: string;
        }) => {
          set((state) => {
            state.username = data.username;
            state.email = data.email;
            state.password = data.password;
          });
        },
      })),
      {
        name: "agentix-onboarding",
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          currentSlide: state.currentSlide,
          isCompleted: state.isCompleted,
          sectorName: state.sectorName,
          policyText: state.policyText,
          orbs: state.orbs,
          username: state.username,
          email: state.email,
          // Exclude password from persistence for security
        }),
      }
    ),
    { name: "OnboardingStore" }
  )
);
