"use client";

import { ArrowLeft, Info, Lightbulb, BookOpen, Sparkles, ChevronDown, HelpCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useCreateStrategy } from "@/library/api/hooks/use-strategies";
import { Alert, AlertDescription, AlertTitle } from "@/library/components/atoms/alert";
import { Button } from "@/library/components/atoms/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/library/components/atoms/card";
import { Input } from "@/library/components/atoms/input";
import { Label } from "@/library/components/atoms/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/library/components/atoms/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/library/components/atoms/tooltip";
import { StrategyEditor } from "@/library/components/organisms/strategy-editor";
import { DEFAULT_STRATEGY_CODE } from "@/library/templates/strategy-templates";
import { useBacktestStore } from "@/library/store/backtest-store";

export default function NewStrategyPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState(DEFAULT_STRATEGY_CODE);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const { backtestConfig, setBacktestConfig } = useBacktestStore();
  const { mutate: createStrategy, isPending } = useCreateStrategy();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    createStrategy(
      { name: name.trim(), initialCode: code },
      {
        onSuccess: (strategy) => {
          router.push(`/observatory/strategies/${strategy.id}`);
        },
      }
    );
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-6">
        <Link href="/observatory/strategies">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 size-4" />
            Back to Strategies
          </Button>
        </Link>
      </div>

      {/* Welcome Section */}
      <div className="mb-8 space-y-4">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-primary/10 p-3 mt-1">
            <Sparkles className="size-6 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Create Your First Test Strategy</h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Test strategies let you simulate trading algorithms on historical data to see how they would have performed.
              It's a safe way to validate ideas before risking real capital.
            </p>
          </div>
        </div>

        <Alert className="border-primary/20 bg-primary/5">
          <Lightbulb className="size-4 text-primary" />
          <AlertTitle className="text-primary">Getting Started</AlertTitle>
          <AlertDescription className="text-sm text-muted-foreground mt-1">
            We've pre-filled a popular trading strategy (SMA Crossover) to get you started. Give it a name,
            review the settings, and create your strategy. You can customize the code after creation.
          </AlertDescription>
        </Alert>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Basic Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center size-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                1
              </div>
              <div>
                <CardTitle>Name Your Strategy</CardTitle>
                <CardDescription className="mt-1">
                  Choose a memorable name that describes what your strategy does
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="name">Strategy Name</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="size-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    Pick a clear, descriptive name like "Bitcoin SMA Strategy" or "Ethereum Momentum Trader"
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Bitcoin SMA Crossover Strategy"
                required
                className="text-base"
              />
              <p className="text-xs text-muted-foreground">
                You can always rename this later
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Quick Start or Customize */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center size-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                2
              </div>
              <div className="flex-1">
                <CardTitle>Review Default Settings</CardTitle>
                <CardDescription className="mt-1">
                  We've set up a proven SMA Crossover strategy. You can use it as-is or customize it.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="text-xs font-medium text-muted-foreground mb-1">Strategy Type</div>
                <div className="text-sm font-semibold">SMA Crossover</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Buys when fast MA crosses above slow MA
                </div>
              </div>
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="text-xs font-medium text-muted-foreground mb-1">Test Period</div>
                <div className="text-sm font-semibold">1 Year (2023)</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Historical data for backtesting
                </div>
              </div>
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="text-xs font-medium text-muted-foreground mb-1">Initial Capital</div>
                <div className="text-sm font-semibold">$10,000</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Simulated starting portfolio
                </div>
              </div>
            </div>

            {/* Collapsible Advanced Section */}
            <Collapsible open={isEditorOpen} onOpenChange={setIsEditorOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="size-4" />
                    {isEditorOpen ? "Hide" : "View & Customize"} Strategy Code & Settings
                  </span>
                  <ChevronDown className={`size-4 transition-transform ${isEditorOpen ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <div className="rounded-lg border bg-card">
                  <div className="p-4 border-b bg-muted/50">
                    <div className="flex items-start gap-2">
                      <Info className="size-4 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">About This Strategy</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          The Simple Moving Average (SMA) Crossover is a classic trading strategy. It uses two moving averages:
                          a fast one (10 periods) and a slow one (20 periods). When the fast line crosses above the slow line,
                          it signals a buy opportunity. When it crosses below, it signals a sell.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-1">
                    <StrategyEditor
                      code={code}
                      onCodeChange={setCode}
                      config={backtestConfig}
                      onConfigChange={setBacktestConfig}
                      onSaveRevision={() => {}} // Not needed for new strategy
                      onRunBacktest={() => {}} // Not needed for new strategy
                      canSave={false}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Don't worry if the code looks complex - you can refine it after creating the strategy.
                  The default settings work great for learning!
                </p>
              </CollapsibleContent>
            </Collapsible>

            {!isEditorOpen && (
              <p className="text-sm text-muted-foreground text-center py-2">
                Using default SMA Crossover strategy. Click above to customize if needed.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Sparkles className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Ready to create your strategy?</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    You'll be able to backtest and refine it on the next page
                  </p>
                </div>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <Link href="/observatory/strategies" className="flex-1 sm:flex-none">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={isPending || !name.trim() || !code.trim()}
                  className="flex-1 sm:flex-none"
                >
                  {isPending ? "Creating..." : "Create Strategy"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Learning Resources */}
      <Card className="mt-6 border-muted">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <BookOpen className="size-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium mb-2">New to trading strategies?</p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Backtesting shows how a strategy would have performed using historical data</p>
                <p>• Past performance doesn't guarantee future results, but it's a useful learning tool</p>
                <p>• Start with the default strategy, run a backtest, then experiment with modifications</p>
                <p>• You can create multiple test strategies to compare different approaches</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
