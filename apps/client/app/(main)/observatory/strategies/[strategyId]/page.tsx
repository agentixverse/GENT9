"use client";

import { useState, useEffect } from "react";
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
import { ArrowLeft } from "lucide-react";

export default function StrategyDetailPage() {
  const params = useParams();
  const strategyId = parseInt(params.strategyId as string);

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

  // Update code when revision changes
  useEffect(() => {
    if (revisions[selectedRevisionIndex]) {
      setCode(revisions[selectedRevisionIndex].code);
    }
  }, [selectedRevisionIndex, revisions]);

  // Initialize with active revision
  useEffect(() => {
    if (strategy && activeRevision) {
      setSelectedRevisionIndex(strategy.active_revision_index);
      setCode(activeRevision.code);
    }
  }, [strategy?.id]); // Only run when strategy loads

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

      {/* 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Revisions Sidebar */}
        <div className="w-64 flex-shrink-0">
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

        {/* Center: Code Editor */}
        <div className="flex-1 border-x">
          <StrategyEditor
            code={code}
            onCodeChange={setCode}
            config={backtestConfig}
            onConfigChange={setBacktestConfig}
            onSaveRevision={handleSaveRevision}
            onRunBacktest={handleRunBacktest}
            isSaving={isSaving}
            isRunning={isRunning || strategy.status === "running" || strategy.status === "queued"}
            canSave={code.trim() !== ""}
          />
        </div>

        {/* Right: Results Panel */}
        <div className="w-96 flex-shrink-0">
          <ResultsPanel
            results={results || null}
            htmlReport={htmlReport || null}
            activeTab={resultsTab}
            onTabChange={setResultsTab}
            isLoading={resultsLoading}
          />
        </div>
      </div>
    </div>
  );
}
