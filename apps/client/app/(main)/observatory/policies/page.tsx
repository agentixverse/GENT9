"use client";

import { useState } from "react";
import { useSectorStore } from "@/library/store/sector-store";
import { useSectorPolicy, useSectorPolicyHistory, useCreateSectorPolicy } from "@/library/api/hooks/use-policy";
import { PolicyEditor } from "@/library/components/organisms/policy-editor";
import { PolicyTemplatesGallery } from "@/library/components/organisms/policy-templates-gallery";
import { ActivePolicyDisplay } from "@/library/components/organisms/active-policy-display";
import { PolicyTestingArea } from "@/library/components/organisms/policy-testing-area";
import { Badge } from "@/library/components/atoms/badge";
import { Skeleton } from "@/library/components/atoms/skeleton";
import { Card, CardContent, CardHeader } from "@/library/components/atoms/card";
import { Alert, AlertDescription } from "@/library/components/atoms/alert";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { PolicyTemplate } from "@/library/constants/policy-templates";
import type { UserPolicy } from "@/library/api/types";

export default function PoliciesPage() {
  const activeSectorId = useSectorStore((state) => state.activeSectorId);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<UserPolicy | null>(null);

  // Fetch policy data
  const { data: policy, isLoading: isPolicyLoading } = useSectorPolicy(activeSectorId || 0);
  const { data: policyHistory, isLoading: isHistoryLoading } = useSectorPolicyHistory(activeSectorId || 0);
  const createPolicyMutation = useCreateSectorPolicy(activeSectorId || 0);

  // Handle template selection
  const handleSelectTemplate = (template: PolicyTemplate) => {
    const mockPolicy: UserPolicy = {
      id: 0, // Will be assigned by backend
      sector_id: activeSectorId || 0,
      policy_document: template.policyDocument,
      version: (policy?.version || 0) + 1,
      is_active: true,
      ai_critique: null,
      created_at: new Date(),
    };
    setEditingPolicy(mockPolicy);
    setIsEditing(true);
    toast.success(`Template "${template.name}" loaded`);
  };

  // Handle policy save
  const handleSavePolicy = (policyText: string) => {
    if (!activeSectorId) {
      toast.error("No active sector selected");
      return;
    }

    // In a real implementation, this would parse the policyText
    // and convert it back to the policy_document structure
    // For now, we'll use the existing policy document or a default one
    const policyDocument = editingPolicy?.policy_document || policy?.policy_document || getDefaultPolicyDocument();

    createPolicyMutation.mutate(policyDocument, {
      onSuccess: () => {
        setIsEditing(false);
        setEditingPolicy(null);
      },
    });
  };

  // Handle edit action
  const handleEdit = () => {
    if (policy) {
      setEditingPolicy(policy);
      setIsEditing(true);
    }
  };

  // Handle duplicate action
  const handleDuplicate = () => {
    if (policy) {
      const duplicated = {
        ...policy,
        id: 0, // Will be assigned by backend
        version: policy.version + 1,
        is_active: false,
      };
      setEditingPolicy(duplicated);
      setIsEditing(true);
      toast.info("Policy duplicated. Make changes and save to create a new version.");
    }
  };

  // Handle test run
  const handleRunTest = async (scenario: string) => {
    // This would call a backend endpoint in production
    return new Promise((resolve) => {
      setTimeout(() => resolve({ success: true }), 2000);
    });
  };

  // Handle version selection
  const handleSelectVersion = (version: number) => {
    const selectedPolicy = policyHistory?.find(p => p.version === version);
    if (selectedPolicy) {
      setEditingPolicy(selectedPolicy);
    }
  };

  // Loading state
  if (isPolicyLoading || isHistoryLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // No sector selected
  if (!activeSectorId) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4">
        <div>
          <h1 className="text-3xl font-bold">Policies</h1>
          <p className="text-muted-foreground mt-1">
            Define trading directives and guidelines for your AI agent
          </p>
        </div>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please select a sector to view and manage policies.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-8 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Policies</h1>
          <p className="text-muted-foreground mt-1">
            Define trading directives and guidelines for your AI agent
          </p>
        </div>
        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
          Sector {activeSectorId}
        </Badge>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Policy Editor Section - Primary */}
        <PolicyEditor
          policy={isEditing ? editingPolicy || undefined : policy}
          policyHistory={policyHistory}
          onSave={handleSavePolicy}
          onSelectVersion={handleSelectVersion}
          isLoading={createPolicyMutation.isPending}
        />

        {/* Policy Templates Gallery - Secondary */}
        <PolicyTemplatesGallery onSelectTemplate={handleSelectTemplate} />

        {/* Active Policy Display - Secondary */}
        <ActivePolicyDisplay
          policy={policy}
          onEdit={handleEdit}
          onDuplicate={handleDuplicate}
          isLoading={isPolicyLoading}
        />

        {/* Policy Testing Area - Secondary */}
        <PolicyTestingArea policy={policy} onRunTest={handleRunTest} />
      </div>
    </div>
  );
}

// Default policy document for new policies
function getDefaultPolicyDocument(): UserPolicy['policy_document'] {
  return {
    risk_management: {
      max_position_size_percent: 20,
      stop_loss_percent: 5,
      take_profit_percent: 15,
      max_drawdown_percent: 15,
      daily_loss_limit: 3,
    },
    trading_preferences: {
      frequency_minutes: 60,
      enabled_markets: ['ethereum', 'polygon'],
      preferred_exchanges: ['uniswap', 'sushiswap'],
      max_slippage_percent: 1,
      base_currency: {
        ethereum: 'USDC',
        solana: 'USDC',
      },
    },
    investment_strategy: {
      strategy_type: 'balanced_mix',
      dca_percentage: 50,
      momentum_percentage: 50,
      yield_farming_enabled: false,
      target_annual_return: 15,
    },
  };
}
