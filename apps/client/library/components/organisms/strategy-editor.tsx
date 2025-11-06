"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { githubLight, githubDark } from "@uiw/codemirror-theme-github";
import { python } from "@codemirror/lang-python";
import { Button } from "@/library/components/atoms/button";
import { Label } from "@/library/components/atoms/label";
import { BacktestConfigForm } from "@/library/components/molecules/backtest-config-form";
import { Save, Play } from "lucide-react";
import type { BacktestConfig } from "@/library/types/backtest";

// Dynamically import CodeMirror to avoid SSR issues
const CodeMirror = dynamic(
  () => import("@uiw/react-codemirror").then((mod) => mod.default),
  { ssr: false }
);

interface StrategyEditorProps {
  code: string;
  onCodeChange: (code: string) => void;
  config: BacktestConfig;
  onConfigChange: (config: Partial<BacktestConfig>) => void;
  onSaveRevision: () => void;
  onRunBacktest: () => void;
  isSaving?: boolean;
  isRunning?: boolean;
  canSave?: boolean;
}

function StrategyEditor({
  code,
  onCodeChange,
  config,
  onConfigChange,
  onSaveRevision,
  onRunBacktest,
  isSaving,
  isRunning,
  canSave = true,
}: StrategyEditorProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Simple: select theme based on resolvedTheme
  const editorTheme = resolvedTheme === "dark" ? githubDark : githubLight;

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Code Editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="strategy-code">Strategy Code (Python)</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={onSaveRevision}
              disabled={!canSave || isSaving}
            >
              <Save className="mr-2 size-4" />
              {isSaving ? "Saving..." : "Save as New Test"}
            </Button>
          </div>
          <div className="border rounded-lg overflow-hidden">
            {mounted ? (
              <CodeMirror
                value={code}
                height="400px"
                extensions={[python()]}
                onChange={(value) => onCodeChange(value)}
                theme={editorTheme}
                basicSetup={{
                  lineNumbers: true,
                  highlightActiveLineGutter: true,
                  highlightSpecialChars: true,
                  foldGutter: true,
                  drawSelection: true,
                  dropCursor: true,
                  allowMultipleSelections: true,
                  indentOnInput: true,
                  bracketMatching: true,
                  closeBrackets: true,
                  autocompletion: true,
                  rectangularSelection: true,
                  crosshairCursor: true,
                  highlightActiveLine: true,
                  highlightSelectionMatches: true,
                  closeBracketsKeymap: true,
                  searchKeymap: true,
                  foldKeymap: true,
                  completionKeymap: true,
                  lintKeymap: true,
                }}
                className="text-sm"
              />
            ) : (
              <div className="flex items-center justify-center h-[400px] bg-muted">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Write your strategy using the backtesting.py framework. The backtesting infrastructure is automatically configured.
          </p>
        </div>

        {/* Backtest Configuration */}
        <div className="space-y-2">
          <Label>Backtest Configuration</Label>
          <div className="border rounded-lg p-4">
            <BacktestConfigForm config={config} onChange={onConfigChange} />
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="border-t p-4 bg-muted/50 flex justify-end gap-3">
        <Button
          onClick={onRunBacktest}
          disabled={isRunning || !code.trim()}
          size="lg"
        >
          <Play className="mr-2 size-4" />
          {isRunning ? "Running Backtest..." : "Run Backtest"}
        </Button>
      </div>
    </div>
  );
}

export { StrategyEditor };
