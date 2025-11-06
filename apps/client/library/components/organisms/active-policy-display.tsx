"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/library/components/atoms/card";
import { Button } from "@/library/components/atoms/button";
import { Badge } from "@/library/components/atoms/badge";
import { Separator } from "@/library/components/atoms/separator";
import { CheckCircle2, Edit, Copy, Clock } from "lucide-react";
import type { UserPolicy } from "@/library/api/types";

interface ActivePolicyDisplayProps {
  policy?: UserPolicy;
  onEdit: () => void;
  onDuplicate: () => void;
  isLoading?: boolean;
}

export function ActivePolicyDisplay({ policy, onEdit, onDuplicate, isLoading }: ActivePolicyDisplayProps) {
  if (!policy) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <CardTitle>Active Policy</CardTitle>
            <Badge variant="outline" className="text-xs">Secondary</Badge>
          </div>
          <CardDescription>No active policy found for this sector</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Create a new policy or select a template to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="border-green-200 dark:border-green-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <CardTitle>Active Policy</CardTitle>
            <Badge variant="outline" className="text-xs">Secondary</Badge>
            <Badge variant="default" className="bg-green-500">
              Version {policy.version}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onDuplicate}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </Button>
            <Button size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>
        <CardDescription className="flex items-center gap-2">
          <Clock className="h-3 w-3" />
          Last updated: {formatDate(policy.updatedAt || policy.createdAt)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Investment Strategy */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            Investment Strategy
            <Badge variant="secondary" className="text-xs">
              {policy.policyDocument.investment_strategy.strategy_type}
            </Badge>
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <PolicyMetric
              label="DCA Allocation"
              value={`${policy.policyDocument.investment_strategy.dca_percentage}%`}
            />
            <PolicyMetric
              label="Momentum Allocation"
              value={`${policy.policyDocument.investment_strategy.momentum_percentage}%`}
            />
            <PolicyMetric
              label="Yield Farming"
              value={policy.policyDocument.investment_strategy.yield_farming_enabled ? 'Enabled' : 'Disabled'}
            />
            <PolicyMetric
              label="Target Return"
              value={`${policy.policyDocument.investment_strategy.target_annual_return}% annually`}
            />
          </div>
        </div>

        <Separator />

        {/* Risk Management */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Risk Management</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <PolicyMetric
              label="Max Position Size"
              value={`${policy.policyDocument.risk_management.max_position_size_percent}%`}
            />
            <PolicyMetric
              label="Stop Loss"
              value={`${policy.policyDocument.risk_management.stop_loss_percent}%`}
            />
            <PolicyMetric
              label="Take Profit"
              value={`${policy.policyDocument.risk_management.take_profit_percent}%`}
            />
            <PolicyMetric
              label="Max Drawdown"
              value={`${policy.policyDocument.risk_management.max_drawdown_percent}%`}
            />
            <PolicyMetric
              label="Daily Loss Limit"
              value={`${policy.policyDocument.risk_management.daily_loss_limit}%`}
            />
          </div>
        </div>

        <Separator />

        {/* Trading Preferences */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Trading Preferences</h4>
          <div className="space-y-2 text-sm">
            <PolicyMetric
              label="Trading Frequency"
              value={`Every ${policy.policyDocument.trading_preferences.frequency_minutes} minutes`}
              fullWidth
            />
            <PolicyMetric
              label="Enabled Markets"
              value={policy.policyDocument.trading_preferences.enabled_markets.join(', ')}
              fullWidth
            />
            <PolicyMetric
              label="Preferred Exchanges"
              value={policy.policyDocument.trading_preferences.preferred_exchanges.join(', ')}
              fullWidth
            />
            <PolicyMetric
              label="Max Slippage"
              value={`${policy.policyDocument.trading_preferences.max_slippage_percent}%`}
              fullWidth
            />
            <div className="grid grid-cols-2 gap-3">
              <PolicyMetric
                label="Base Currency (ETH)"
                value={policy.policyDocument.trading_preferences.base_currency.ethereum}
              />
              <PolicyMetric
                label="Base Currency (SOL)"
                value={policy.policyDocument.trading_preferences.base_currency.solana}
              />
            </div>
          </div>
        </div>

        {policy.aiCritique && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">AI Critique</h4>
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-muted-foreground">{policy.aiCritique}</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function PolicyMetric({ label, value, fullWidth = false }: { label: string; value: string; fullWidth?: boolean }) {
  return (
    <div className={fullWidth ? "col-span-2" : ""}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
