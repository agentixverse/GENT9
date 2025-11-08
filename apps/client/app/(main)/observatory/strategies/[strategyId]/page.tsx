"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/library/components/atoms/button";
import { StrategyEditor } from "@/library/components/organisms/strategy-editor";
import { RevisionsSidebar } from "@/library/components/organisms/revisions-sidebar";
import { ResultsPanel } from "@/library/components/organisms/results-panel";
import {
  useStrategy,
  useAddRevision,
  useSetActiveRevision,
} from "@/library/api/hooks/use-strategies";
import {
  useRunBacktest,
  useBacktestResults,
  useBacktestReport,
  useBacktestStatusPoller,
} from "@/library/api/hooks/use-backtest";
import { useRevisions } from "@/library/api/hooks/use-revisions";
import { useBacktestStore } from "@/library/store/backtest-store";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/library/components/atoms/alert";

export default function StrategyDetailPage() {
  const params = useParams();
  const strategyId = parseInt(params.strategyId as string);

  // FIX #2: Handle invalid strategyId (NaN)
  if (isNaN(strategyId)) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="size-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Invalid Strategy ID</h3>
          <p className="text-sm text-muted-foreground mb-4">
            The URL contains an invalid strategy identifier. Please check the URL and try again.
          </p>
          <Link href="/observatory/strategies">
            <Button>Back to Strategies</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { data: strategy, isLoading } = useStrategy(strategyId);
  const { revisions, activeRevision } = useRevisions(strategy);
  const { mutate: addRevision, isPending: isSaving } = useAddRevision(strategyId);
  const { mutate: setActiveRevision } = useSetActiveRevision(strategyId);

  // Store state
  const {
    backtestConfig,
    setBacktestConfig,
    selectedRevisionIndex,
    setSelectedRevisionIndex,
    resultsTab,
    setResultsTab,
  } = useBacktestStore();

  // Local state for code editing
  const [code, setCode] = useState("");

  // Backtest operations
  const { mutate: runBacktest, isPending: isRunning } = useRunBacktest(
    strategyId,
    selectedRevisionIndex
  );
  const { data: results, isLoading: resultsLoading } = useBacktestResults(
    strategyId,
    selectedRevisionIndex
  );
  const { data: htmlReport } = useBacktestReport(strategyId, selectedRevisionIndex);

  // Poll status when backtest is running
  useBacktestStatusPoller(strategyId);

  // FIX #5: Track if this is the first load to prevent re-initialization
  const isFirstLoad = useRef(true);

  // Initialize with active revision on first load only
  useEffect(() => {
    if (isFirstLoad.current && strategy && activeRevision) {
      setSelectedRevisionIndex(strategy.active_revision_index);
      setCode(activeRevision.code);
      isFirstLoad.current = false;
    }
  }, [strategy, activeRevision, setSelectedRevisionIndex]);

  // Update code when revision changes
  useEffect(() => {
    if (revisions[selectedRevisionIndex]) {
      setCode(revisions[selectedRevisionIndex].code);
    }
  }, [selectedRevisionIndex, revisions]);

  const handleSaveRevision = () => {
    if (!code.trim()) return;
    addRevision({ code });
  };

  const handleRunBacktest = () => {
    runBacktest(backtestConfig);
  };

  const handleSetActive = (index: number) => {
    setActiveRevision({ revisionIndex: index });
  };

  // FIX #4: Don't show stale results when backtest is running (race condition)
  const isBacktestActive = strategy?.status === "running" || strategy?.status === "queued";
  const shouldShowResults = results && !isBacktestActive;

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading strategy...</p>
        </div>
      </div>
    );
  }

  if (!strategy) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Strategy Not Found</h3>
          <Link href="/observatory/strategies">
            <Button>Back to Strategies</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b px-6 py-4 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/observatory/strategies">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 size-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{strategy.name}</h1>
              <p className="text-sm text-muted-foreground">
                {revisions.length} revision{revisions.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FIX #1: Responsive 3-Column Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Revisions Sidebar - Hidden on mobile, visible on large screens */}
        <div className="hidden lg:block lg:w-64 lg:flex-shrink-0 border-b lg:border-b-0">
          <RevisionsSidebar
            strategy={strategy}
            selectedRevisionIndex={selectedRevisionIndex}
            onSelectRevision={setSelectedRevisionIndex}
            onRunBacktest={(index) => {
              setSelectedRevisionIndex(index);
              handleRunBacktest();
            }}
            onSetActive={handleSetActive}
          />
        </div>

        {/* Center: Code Editor - Full width on mobile */}
        <div className="flex-1 lg:border-x overflow-hidden">
          <StrategyEditor
            code={code}
            onCodeChange={setCode}
            config={backtestConfig}
            onConfigChange={setBacktestConfig}
            onSaveRevision={handleSaveRevision}
            onRunBacktest={handleRunBacktest}
            isSaving={isSaving}
            isRunning={isRunning || isBacktestActive}
            canSave={code.trim() !== ""}
          />
        </div>

        {/* Right: Results Panel - Hidden on mobile/tablet, visible on xl screens */}
        <div className="hidden xl:block xl:w-96 xl:flex-shrink-0">
          <ResultsPanel
            results={shouldShowResults ? results : null}
            htmlReport={shouldShowResults ? htmlReport : null}
            activeTab={resultsTab}
            onTabChange={setResultsTab}
            isLoading={resultsLoading || isBacktestActive}
          />
        </div>
      </div>
    </div>
  );
}
