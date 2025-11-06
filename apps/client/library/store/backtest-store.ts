import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { BacktestConfig, ResultsTab } from "@/library/types/backtest";
import { DEFAULT_BACKTEST_CONFIG } from "@/library/templates/strategy-templates";

interface BacktestState {
  backtestConfig: BacktestConfig;
  selectedRevisionIndex: number;
  resultsTab: ResultsTab;
  comparisonSelection: number[];
  codePreviewOpen: boolean;
}

interface BacktestActions {
  setBacktestConfig: (config: Partial<BacktestConfig>) => void;
  resetBacktestConfig: () => void;
  setSelectedRevisionIndex: (index: number) => void;
  setResultsTab: (tab: ResultsTab) => void;
  toggleComparisonSelection: (index: number) => void;
  clearComparisonSelection: () => void;
  setCodePreviewOpen: (open: boolean) => void;
}

type BacktestStore = BacktestState & BacktestActions;

export const useBacktestStore = create<BacktestStore>()(
  devtools(
    (set) => ({
      backtestConfig: DEFAULT_BACKTEST_CONFIG,
      selectedRevisionIndex: 0,
      resultsTab: "metrics",
      comparisonSelection: [],
      codePreviewOpen: false,

      setBacktestConfig: (config) =>
        set((state) => ({
          backtestConfig: { ...state.backtestConfig, ...config },
        })),

      resetBacktestConfig: () =>
        set({
          backtestConfig: DEFAULT_BACKTEST_CONFIG,
        }),

      setSelectedRevisionIndex: (index) =>
        set({
          selectedRevisionIndex: index,
        }),

      setResultsTab: (tab) =>
        set({
          resultsTab: tab,
        }),

      toggleComparisonSelection: (index) =>
        set((state) => {
          const exists = state.comparisonSelection.includes(index);
          return {
            comparisonSelection: exists
              ? state.comparisonSelection.filter((i) => i !== index)
              : [...state.comparisonSelection, index].slice(0, 5),
          };
        }),

      clearComparisonSelection: () =>
        set({
          comparisonSelection: [],
        }),

      setCodePreviewOpen: (open) =>
        set({
          codePreviewOpen: open,
        }),
    }),
    { name: "BacktestStore" }
  )
);
