import { useMemo } from "react";
import type { Strategy, StrategyRevision } from "@/library/types/backtest";

/**
 * Helper hook for working with strategy revisions
 * Provides computed values and utilities for revision management
 */
export const useRevisions = (strategy: Strategy | undefined) => {
  const revisions = useMemo(() => {
    if (!strategy) return [];
    return strategy.revisions || [];
  }, [strategy]);

  const activeRevision = useMemo(() => {
    if (!strategy || !revisions.length) return null;
    return revisions[strategy.active_revision_index] || null;
  }, [strategy, revisions]);

  const revisionsWithResults = useMemo(() => {
    return revisions.filter((rev) => rev.results !== null);
  }, [revisions]);

  const latestRevision = useMemo(() => {
    return revisions[0] || null;
  }, [revisions]);

  const hasResults = useMemo(() => {
    return revisionsWithResults.length > 0;
  }, [revisionsWithResults]);

  const maxReached = useMemo(() => {
    return revisions.length >= 5;
  }, [revisions]);

  return {
    revisions,
    activeRevision,
    revisionsWithResults,
    latestRevision,
    hasResults,
    count: revisions.length,
    maxReached,
  };
};
