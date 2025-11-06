"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/library/components/atoms/tabs";
import { MetricsSummary } from "@/library/components/molecules/metrics-summary";
import { HtmlReportViewer } from "@/library/components/organisms/html-report-viewer";
import type { BacktestResults, ResultsTab } from "@/library/types/backtest";

interface ResultsPanelProps {
  results: BacktestResults | null;
  htmlReport: string | null;
  activeTab: ResultsTab;
  onTabChange: (tab: ResultsTab) => void;
  isLoading?: boolean;
}

function ResultsPanel({
  results,
  htmlReport,
  activeTab,
  onTabChange,
  isLoading,
}: ResultsPanelProps) {
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!results && !htmlReport) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm">
          <h3 className="text-lg font-semibold mb-2">No Results Yet</h3>
          <p className="text-sm text-muted-foreground">
            Select a revision with results or run a new backtest to see performance metrics and reports.
          </p>
        </div>
      </div>
    );
  }

  if (results?.error_message) {
    return (
      <div className="h-full flex flex-col bg-red-50 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-red-700">❌ Backtest Failed</h3>
          <p className="text-sm text-red-600 mt-1">Python execution encountered an error</p>
        </div>
        <div className="flex-1 bg-gray-900 text-red-400 p-4 rounded-lg overflow-auto font-mono text-sm">
          <pre className="whitespace-pre-wrap">{results.error_message}</pre>
        </div>
        {results.started_at && (
          <p className="text-xs text-muted-foreground mt-3">
            Failed at: {new Date(results.started_at).toLocaleString()}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as ResultsTab)} className="flex-1 flex flex-col">
        <div className="border-b px-4">
          <TabsList>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="report">Report</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="metrics" className="h-full overflow-y-auto p-4 m-0">
            <MetricsSummary metrics={results?.metrics || null} />
          </TabsContent>

          <TabsContent value="report" className="h-full m-0">
            <HtmlReportViewer htmlContent={htmlReport} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

export { ResultsPanel };
