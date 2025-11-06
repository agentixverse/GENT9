"use client";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  CheckCircle,
  Clock,
  Send,
  Square,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  useTradeDetails,
  useTradeJournal,
  useTradeMutations,
} from "@/library/api/hooks/use-trades";
import type {
  AIAnalysisContent,
  AIDecisionContent,
  JournalEntry,
  TradeExecutionContent,
} from "@/library/api/types";
import { Badge } from "@/library/components/atoms/badge";
import { Button } from "@/library/components/atoms/button";
import { Card, CardContent } from "@/library/components/atoms/card";
import { Input } from "@/library/components/atoms/input";
import { Skeleton } from "@/library/components/atoms/skeleton";
import { EmptyState } from "@/library/components/molecules/empty-state";

export default function ActionDetailPage() {
  const params = useParams();
  const tradeId = params.actionId as string;

  const { data: trade, isLoading: tradeLoading } = useTradeDetails(tradeId);
  const { data: journalEntries, isLoading: journalLoading } = useTradeJournal(tradeId);
  const { approveTrade, rejectTrade, isApproving, isRejecting } = useTradeMutations();

  const [userInput, setUserInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [journalEntries, isGenerating]);

  if (tradeLoading || journalLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 justify-center">
        <EmptyState
          icon={AlertTriangle}
          title="Trade Not Found"
          description="The action you're looking for doesn't exist or has been removed."
        />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PROPOSED":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400";
      case "APPROVED":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400";
      case "EXECUTING":
        return "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400";
      case "COMPLETED":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400";
      case "FAILED":
        return "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400";
      case "CANCELLED":
        return "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400";
      default:
        return "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400";
    }
  };

  const handleSendMessage = () => {
    if (userInput.trim()) {
      setUserInput("");
      setIsGenerating(true);

      // Auto scroll when sending message
      setTimeout(scrollToBottom, 100);

      // Simulate AI response
      setTimeout(() => {
        setIsGenerating(false);
      }, 2000);
    }
  };

  const handleApprove = () => {
    approveTrade(tradeId);
  };

  const handleReject = () => {
    rejectTrade(tradeId);
  };

  return (
    <div className="flex flex-1 flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 pb-0">
        <div className="flex-1">
          <h1 className="text-xl font-semibold">
            {trade.summary || `${trade.tradeType.toUpperCase()} Trade #${trade.id}`}
          </h1>
          <p className="text-sm text-muted-foreground">
            Created {new Date(trade.createdAt).toLocaleDateString()} at{" "}
            {new Date(trade.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <Badge variant="outline" className={getStatusColor(trade.status)}>
          {trade.status}
        </Badge>
      </div>

      {/* Trade Actions */}
      {trade.status === "PROPOSED" && (
        <div className="flex gap-2 px-4 pb-4">
          <Button
            onClick={handleApprove}
            disabled={isApproving}
            className="bg-green-600 hover:bg-green-700"
          >
            {isApproving ? "Approving..." : "Approve Trade"}
          </Button>
          <Button onClick={handleReject} disabled={isRejecting} variant="destructive">
            {isRejecting ? "Rejecting..." : "Reject Trade"}
          </Button>
        </div>
      )}

      {/* Chat-style Journal */}
      <div ref={chatContainerRef} className="flex-1 overflow-auto p-4 space-y-4">
        {journalEntries?.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <EmptyState
              icon={Activity}
              title="No Conversation Yet"
              description="Ask a question or provide guidance to the AI below to start discussing this trade"
            />
          </div>
        ) : (
          journalEntries?.map((entry) => (
            <JournalEntryCard key={entry.id} entry={entry} />
          ))
        )}

        {isGenerating && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 flex items-center justify-center">
              <Brain className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="inline-block rounded-lg px-4 py-3 bg-blue-50 dark:bg-blue-950/50 text-foreground">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  <span className="text-sm">AI is analyzing...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input - Sticky */}
      <div className="sticky bottom-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Input
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !isGenerating) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask about this trade or provide guidance to the AI..."
              disabled={isGenerating}
              className="min-h-[44px]"
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!userInput.trim() || isGenerating}
            size="default"
            className="h-[44px] px-4"
          >
            {isGenerating ? <Square className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

function JournalEntryCard({ entry }: { entry: JournalEntry }) {
  const getEntryIcon = (entryType: string) => {
    switch (entryType) {
      case "AI_ANALYSIS":
        return <Brain className="h-4 w-4 text-blue-500" />;
      case "AI_DECISION":
        return <CheckCircle className="h-4 w-4 text-purple-500" />;
      case "TRADE_EXECUTION":
        return <Activity className="h-4 w-4 text-green-500" />;
      case "MARKET_DATA":
        return <BarChart3 className="h-4 w-4 text-orange-500" />;
      case "RISK_ANALYSIS":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "POSITION_MONITOR":
        return <Activity className="h-4 w-4 text-cyan-500" />;
      case "AI_RECOMMENDATION":
        return <Brain className="h-4 w-4 text-indigo-500" />;
      case "USER_ACTION":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getEntryTypeLabel = (entryType: string) => {
    switch (entryType) {
      case "AI_ANALYSIS":
        return "AI Analysis";
      case "AI_DECISION":
        return "AI Decision";
      case "TRADE_EXECUTION":
        return "Trade Execution";
      case "MARKET_DATA":
        return "Market Data";
      case "RISK_ANALYSIS":
        return "Risk Analysis";
      case "POSITION_MONITOR":
        return "Position Monitor";
      case "AI_RECOMMENDATION":
        return "AI Recommendation";
      case "USER_ACTION":
        return "User Action";
      default:
        return "System Event";
    }
  };

  const isAI =
    entry.type.startsWith("AI_") ||
    entry.type === "TRADE_EXECUTION" ||
    entry.type === "MARKET_DATA" ||
    entry.type === "RISK_ANALYSIS" ||
    entry.type === "POSITION_MONITOR";
  const isUser = entry.type === "USER_ACTION";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isAI
            ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
            : isUser
            ? "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400"
            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
        }`}
      >
        {getEntryIcon(entry.type)}
      </div>

      {/* Message Bubble */}
      <div className={`flex-1 max-w-[80%] ${isUser ? "text-right" : ""}`}>
        <div
          className={`inline-block rounded-lg px-4 py-3 ${
            isAI
              ? "bg-blue-50 dark:bg-blue-950/50"
              : isUser
              ? "bg-green-50 dark:bg-green-950/50"
              : "bg-gray-50 dark:bg-gray-900/50"
          } text-foreground`}
        >
          {/* Header */}
          <div
            className={`flex items-center gap-2 mb-2 ${isUser ? "flex-row-reverse" : ""}`}
          >
            <span className="text-xs font-medium">{getEntryTypeLabel(entry.type)}</span>
            {entry.confidenceScore && (
              <Badge variant="secondary" className="text-xs">
                {Math.round(entry.confidenceScore * 100)}% confident
              </Badge>
            )}
            <span className="text-xs opacity-60">
              {new Date(entry.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          {/* Main Content */}
          <div className="text-sm leading-relaxed mb-3">{entry.content.message}</div>

          {/* Details - Always Visible */}
          <div className="space-y-3 border-t border-border/20 pt-3">
            {entry.type === "AI_ANALYSIS" && (
              <AIAnalysisDetails content={entry.content as AIAnalysisContent} />
            )}
            {entry.type === "AI_DECISION" && (
              <AIDecisionDetails content={entry.content as AIDecisionContent} />
            )}
            {entry.type === "TRADE_EXECUTION" && (
              <TradeExecutionDetails content={entry.content as TradeExecutionContent} />
            )}
            {entry.metadata && (
              <div className="text-xs opacity-80">
                <strong>Metadata:</strong> {JSON.stringify(entry.metadata, null, 2)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AIAnalysisDetails({ content }: { content: AIAnalysisContent }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {content.analysis_type}
        </Badge>
      </div>
      {content.key_metrics && Object.keys(content.key_metrics).length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold opacity-80">Key Metrics</div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(content.key_metrics).map(([key, value]) => (
              <div key={key} className="bg-muted/50 rounded-md p-2 border border-border/20">
                <div className="text-xs opacity-70 capitalize">{key.replace("_", " ")}</div>
                <div className="text-sm font-semibold">{String(value)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AIDecisionDetails({ content }: { content: AIDecisionContent }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {content.decision_type}
        </Badge>
      </div>
      <div className="bg-muted/50 rounded-md p-3 border border-border/20">
        <div className="text-xs font-semibold opacity-80 mb-1">Reasoning</div>
        <div className="text-sm">{content.reasoning}</div>
      </div>
      {content.affected_positions && content.affected_positions.length > 0 && (
        <div>
          <div className="text-xs font-semibold opacity-80 mb-2">Affected Positions</div>
          <div className="flex flex-wrap gap-1">
            {content.affected_positions.map((position: string, idx: number) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {position}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TradeExecutionDetails({ content }: { content: TradeExecutionContent }) {
  if (!content.trade_details) return null;

  const details = content.trade_details;

  return (
    <div className="space-y-2">
      <div className="text-xs">
        <strong>Status:</strong> {content.status}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {details.proposalType === "ENTER_POSITION" && (
          <>
            <div className="bg-muted/50 rounded p-2">
              <div className="text-xs text-muted-foreground">Pair</div>
              <div className="text-sm font-medium">{details.pair}</div>
            </div>
            <div className="bg-muted/50 rounded p-2">
              <div className="text-xs text-muted-foreground">Amount</div>
              <div className="text-sm font-medium">{details.amount}</div>
            </div>
            <div className="bg-muted/50 rounded p-2">
              <div className="text-xs text-muted-foreground">Chain</div>
              <div className="text-sm font-medium">{details.chain}</div>
            </div>
            <div className="bg-muted/50 rounded p-2">
              <div className="text-xs text-muted-foreground">DEX</div>
              <div className="text-sm font-medium">{details.dex}</div>
            </div>
          </>
        )}
        {details.proposalType === "EXIT_POSITION" && (
          <>
            <div className="bg-muted/50 rounded p-2">
              <div className="text-xs text-muted-foreground">Position</div>
              <div className="text-sm font-medium">{details.positionId}</div>
            </div>
            <div className="bg-muted/50 rounded p-2">
              <div className="text-xs text-muted-foreground">Exit Amount</div>
              <div className="text-sm font-medium">{details.exitAmount}</div>
            </div>
            <div className="bg-muted/50 rounded p-2">
              <div className="text-xs text-muted-foreground">Exit Type</div>
              <div className="text-sm font-medium">{details.exitType}</div>
            </div>
            <div className="bg-muted/50 rounded p-2">
              <div className="text-xs text-muted-foreground">Chain</div>
              <div className="text-sm font-medium">{details.chain}</div>
            </div>
          </>
        )}
        {details.proposalType === "SWAP" && (
          <>
            <div className="bg-muted/50 rounded p-2">
              <div className="text-xs text-muted-foreground">From</div>
              <div className="text-sm font-medium">{details.fromToken}</div>
            </div>
            <div className="bg-muted/50 rounded p-2">
              <div className="text-xs text-muted-foreground">To</div>
              <div className="text-sm font-medium">{details.toToken}</div>
            </div>
            <div className="bg-muted/50 rounded p-2">
              <div className="text-xs text-muted-foreground">Amount</div>
              <div className="text-sm font-medium">{details.amount}</div>
            </div>
            <div className="bg-muted/50 rounded p-2">
              <div className="text-xs text-muted-foreground">Chain</div>
              <div className="text-sm font-medium">{details.chain}</div>
            </div>
          </>
        )}
      </div>
      {details.proposalType === "ENTER_POSITION" &&
        details.stopLossPrice &&
        details.takeProfitPrice && (
          <div className="flex gap-2">
            <div className="bg-red-500/10 text-red-500 rounded p-2 flex-1">
              <div className="text-xs">Stop Loss</div>
              <div className="text-sm font-medium">${details.stopLossPrice}</div>
            </div>
            <div className="bg-green-500/10 text-green-500 rounded p-2 flex-1">
              <div className="text-xs">Take Profit</div>
              <div className="text-sm font-medium">${details.takeProfitPrice}</div>
            </div>
          </div>
        )}
    </div>
  );
}
