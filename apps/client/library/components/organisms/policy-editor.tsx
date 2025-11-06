"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/library/components/atoms/card";
import { Button } from "@/library/components/atoms/button";
import { Textarea } from "@/library/components/atoms/text-area";
import { Badge } from "@/library/components/atoms/badge";
import { Separator } from "@/library/components/atoms/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/library/components/atoms/select";
import { FileEdit, Save, History, AlertCircle } from "lucide-react";
import type { UserPolicy } from "@/library/api/types";

interface PolicyEditorProps {
  policy?: UserPolicy;
  policyHistory?: UserPolicy[];
  onSave: (policyText: string) => void;
  onSelectVersion?: (version: number) => void;
  isLoading?: boolean;
}

export function PolicyEditor({ policy, policyHistory, onSave, onSelectVersion, isLoading }: PolicyEditorProps) {
  const [policyText, setPolicyText] = useState(() => {
    if (!policy) return "";
    return formatPolicyToText(policy.policy_document);
  });

  const [selectedVersion, setSelectedVersion] = useState(policy?.version || 1);

  const characterCount = policyText.length;
  const wordCount = policyText.trim().split(/\s+/).filter(Boolean).length;
  const tokenEstimate = Math.ceil(wordCount * 1.3); // Rough token estimate

  const handleSave = () => {
    onSave(policyText);
  };

  const handleVersionChange = (version: string) => {
    const versionNum = parseInt(version);
    setSelectedVersion(versionNum);
    onSelectVersion?.(versionNum);

    const selectedPolicy = policyHistory?.find(p => p.version === versionNum);
    if (selectedPolicy) {
      setPolicyText(formatPolicyToText(selectedPolicy.policy_document));
    }
  };

  return (
    <Card className="border-blue-200 dark:border-blue-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileEdit className="h-5 w-5 text-blue-500" />
            <CardTitle>Policy Editor</CardTitle>
            <Badge variant="secondary" className="text-xs">Primary</Badge>
          </div>
          {policyHistory && policyHistory.length > 0 && (
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedVersion.toString()} onValueChange={handleVersionChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select version" />
                </SelectTrigger>
                <SelectContent>
                  {policyHistory.map((p) => (
                    <SelectItem key={p.version} value={p.version.toString()}>
                      Version {p.version} {p.is_active && "(Active)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <CardDescription>
          Write your sector's prime directive. This guides how your AI agent makes trading decisions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            value={policyText}
            onChange={(e) => setPolicyText(e.target.value)}
            placeholder="Write your policy directive here... For example: 'You are a conservative trader focused on capital preservation...'"
            className="min-h-[300px] font-mono text-sm"
            disabled={isLoading}
          />

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>{characterCount} characters</span>
              <span>{wordCount} words</span>
              <span>~{tokenEstimate} tokens</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              <span>Max 8000 tokens recommended</span>
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {policy?.created_at && (
              <span>Created: {new Date(policy.created_at).toLocaleString()}</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPolicyText(policy ? formatPolicyToText(policy.policy_document) : "")}
              disabled={isLoading}
            >
              Reset
            </Button>
            <Button onClick={handleSave} disabled={isLoading || !policyText.trim()}>
              <Save className="h-4 w-4 mr-2" />
              Save Policy
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to format policy document to readable text
function formatPolicyToText(policyDoc: UserPolicy['policy_document']): string {
  const sections: string[] = [];

  sections.push("# Trading Policy Directive\n");

  if (policyDoc.investment_strategy) {
    sections.push("## Investment Strategy");
    sections.push(`Strategy Type: ${policyDoc.investment_strategy.strategy_type}`);
    sections.push(`DCA Allocation: ${policyDoc.investment_strategy.dca_percentage}%`);
    sections.push(`Momentum Allocation: ${policyDoc.investment_strategy.momentum_percentage}%`);
    sections.push(`Yield Farming: ${policyDoc.investment_strategy.yield_farming_enabled ? 'Enabled' : 'Disabled'}`);
    sections.push(`Target Annual Return: ${policyDoc.investment_strategy.target_annual_return}%`);
    sections.push("");
  }

  if (policyDoc.risk_management) {
    sections.push("## Risk Management");
    sections.push(`Max Position Size: ${policyDoc.risk_management.max_position_size_percent}%`);
    sections.push(`Stop Loss: ${policyDoc.risk_management.stop_loss_percent}%`);
    sections.push(`Take Profit: ${policyDoc.risk_management.take_profit_percent}%`);
    sections.push(`Max Drawdown: ${policyDoc.risk_management.max_drawdown_percent}%`);
    sections.push(`Daily Loss Limit: ${policyDoc.risk_management.daily_loss_limit}%`);
    sections.push("");
  }

  if (policyDoc.trading_preferences) {
    sections.push("## Trading Preferences");
    sections.push(`Trading Frequency: Every ${policyDoc.trading_preferences.frequency_minutes} minutes`);
    sections.push(`Enabled Markets: ${policyDoc.trading_preferences.enabled_markets.join(', ')}`);
    sections.push(`Preferred Exchanges: ${policyDoc.trading_preferences.preferred_exchanges.join(', ')}`);
    sections.push(`Max Slippage: ${policyDoc.trading_preferences.max_slippage_percent}%`);
    sections.push(`Base Currency (ETH): ${policyDoc.trading_preferences.base_currency.ethereum}`);
    sections.push(`Base Currency (SOL): ${policyDoc.trading_preferences.base_currency.solana}`);
  }

  return sections.join("\n");
}
