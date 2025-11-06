"use client";

import * as React from "react";
import { RevisionListItem } from "@/library/components/molecules/revision-list-item";
import type { Strategy, StrategyRevision } from "@/library/types/backtest";

interface RevisionsSidebarProps {
  strategy: Strategy;
  selectedRevisionIndex: number;
  onSelectRevision: (index: number) => void;
  onRunBacktest: (index: number) => void;
  onSetActive: (index: number) => void;
}

function RevisionsSidebar({
  strategy,
  selectedRevisionIndex,
  onSelectRevision,
  onRunBacktest,
  onSetActive,
}: RevisionsSidebarProps) {
  return (
    <div className="h-full flex flex-col border-r bg-gray-50">
      <div className="p-4 border-b bg-white">
        <h3 className="font-semibold text-sm text-gray-700">Revisions</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {strategy.revisions.length} / 5 revisions
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {strategy.revisions.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <p>No revisions yet</p>
          </div>
        ) : (
          strategy.revisions.map((revision, index) => (
            <RevisionListItem
              key={index}
              revision={revision}
              index={index}
              isActive={index === strategy.active_revision_index}
              isSelected={index === selectedRevisionIndex}
              onSelect={() => onSelectRevision(index)}
              onRun={() => onRunBacktest(index)}
              onSetActive={() => onSetActive(index)}
            />
          ))
        )}
      </div>

      {strategy.revisions.length >= 5 && (
        <div className="p-3 border-t bg-yellow-50 text-xs text-yellow-800">
          <p className="font-semibold mb-1">⚠️ Maximum tests reached (5/5)</p>
          <p>New tests will automatically replace the oldest test (FIFO).</p>
        </div>
      )}
      {strategy.revisions.length > 0 && strategy.revisions.length < 5 && (
        <div className="p-3 border-t bg-blue-50 text-xs text-blue-700">
          <p className="font-semibold mb-1">📊 Version History</p>
          <p>You can save up to 5 test versions. Currently: {strategy.revisions.length}/5</p>
        </div>
      )}
    </div>
  );
}

export { RevisionsSidebar };
