"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/library/components/atoms/card";
import { Button } from "@/library/components/atoms/button";
import { Badge } from "@/library/components/atoms/badge";
import { Separator } from "@/library/components/atoms/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/library/components/atoms/tabs";
import { Alert, AlertDescription } from "@/library/components/atoms/alert";
import { Beaker, Play, CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import type { UserPolicy } from "@/library/api/types";

interface PolicyTestingAreaProps {
  policy?: UserPolicy;
  onRunTest: (scenario: string) => Promise<any>;
}

interface TestScenario {
  id: string;
  name: string;
  description: string;
  marketCondition: string;
}

const TEST_SCENARIOS: TestScenario[] = [
  {
    id: 'bull-market',
    name: 'Bull Market',
    description: 'ETH up 5%, high volume, positive sentiment',
    marketCondition: 'Strong uptrend with increasing volume',
  },
  {
    id: 'bear-market',
    name: 'Bear Market',
    description: 'ETH down 8%, panic selling, negative sentiment',
    marketCondition: 'Sharp downtrend with high volatility',
  },
  {
    id: 'sideways',
    name: 'Sideways Market',
    description: 'ETH flat, low volume, neutral sentiment',
    marketCondition: 'Range-bound with low volatility',
  },
  {
    id: 'high-volatility',
    name: 'High Volatility',
    description: 'ETH swings +/-3% every hour',
    marketCondition: 'Extreme price swings in both directions',
  },
  {
    id: 'flash-crash',
    name: 'Flash Crash',
    description: 'ETH drops 15% in 5 minutes then recovers',
    marketCondition: 'Sudden liquidity crisis followed by recovery',
  },
];

export function PolicyTestingArea({ policy, onRunTest }: PolicyTestingAreaProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

  const handleRunTest = async (scenarioId: string) => {
    if (!policy) return;

    setIsRunning(true);
    setSelectedScenario(scenarioId);
    setTestResults(null);

    try {
      // Simulate AI interpretation (in real app, this would call backend)
      await new Promise(resolve => setTimeout(resolve, 2000));

      const scenario = TEST_SCENARIOS.find(s => s.id === scenarioId);
      const mockResults = generateMockResults(policy, scenario!);
      setTestResults(mockResults);
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Beaker className="h-5 w-5 text-orange-500" />
          <CardTitle>Policy Testing</CardTitle>
          <Badge variant="outline" className="text-xs">Secondary</Badge>
        </div>
        <CardDescription>
          Test how your AI agent interprets and acts on your policy in different market conditions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!policy ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No active policy to test. Create or activate a policy first.
            </AlertDescription>
          </Alert>
        ) : (
          <Tabs defaultValue="scenarios" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="scenarios">Test Scenarios</TabsTrigger>
              <TabsTrigger value="results">Test Results</TabsTrigger>
            </TabsList>

            <TabsContent value="scenarios" className="space-y-4 mt-4">
              <div className="space-y-3">
                {TEST_SCENARIOS.map((scenario) => (
                  <Card key={scenario.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <h4 className="font-semibold text-sm">{scenario.name}</h4>
                          <p className="text-xs text-muted-foreground">{scenario.description}</p>
                          <p className="text-xs text-muted-foreground italic">
                            Condition: {scenario.marketCondition}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleRunTest(scenario.id)}
                          disabled={isRunning}
                        >
                          {isRunning && selectedScenario === scenario.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Testing...
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Run Test
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="results" className="space-y-4 mt-4">
              {!testResults ? (
                <Alert>
                  <AlertDescription>
                    No test results yet. Run a scenario test to see how your policy performs.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">
                      Test: {TEST_SCENARIOS.find(s => s.id === selectedScenario)?.name}
                    </h4>
                    <Badge
                      variant={testResults.decision === 'APPROVED' ? 'default' : 'secondary'}
                      className={testResults.decision === 'APPROVED' ? 'bg-green-500' : ''}
                    >
                      {testResults.decision}
                    </Badge>
                  </div>

                  <Separator />

                  {/* AI Interpretation */}
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">AI Interpretation</h5>
                    <div className="p-3 bg-muted rounded-lg text-sm">
                      {testResults.interpretation}
                    </div>
                  </div>

                  {/* Example Decisions */}
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Example Decisions</h5>
                    <div className="space-y-2">
                      {testResults.decisions.map((decision: any, index: number) => (
                        <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                          {decision.approved ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">{decision.action}</p>
                            <p className="text-xs text-muted-foreground">{decision.reasoning}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Risk Assessment */}
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Risk Assessment</h5>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="p-3 border rounded-lg">
                        <dt className="text-muted-foreground">Risk Level</dt>
                        <dd className="font-medium">{testResults.riskLevel}</dd>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <dt className="text-muted-foreground">Confidence</dt>
                        <dd className="font-medium">{testResults.confidence}%</dd>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

// Generate mock test results based on policy and scenario
function generateMockResults(policy: UserPolicy, scenario: TestScenario) {
  const isConservative = policy.policy_document.investment_strategy?.strategy_type === 'conservative';
  const isAggressive = policy.policy_document.investment_strategy?.strategy_type === 'aggressive';

  let decision = 'APPROVED';
  let interpretation = '';
  let decisions: any[] = [];
  let riskLevel = 'Medium';
  let confidence = 75;

  switch (scenario.id) {
    case 'bull-market':
      interpretation = `In a strong uptrend, your ${policy.policy_document.investment_strategy?.strategy_type} strategy suggests ${isConservative ? 'cautious accumulation' : 'aggressive position building'}. The ${policy.policy_document.risk_management?.max_position_size_percent}% max position size and ${policy.policy_document.trading_preferences?.frequency_minutes}min trading frequency will be applied.`;
      decisions = [
        {
          approved: true,
          action: 'Buy ETH with 15% of available capital',
          reasoning: `Within max position size limit (${policy.policy_document.risk_management?.max_position_size_percent}%), market momentum aligns with strategy`,
        },
        {
          approved: !isConservative,
          action: 'Enable yield farming on position',
          reasoning: `Yield farming is ${policy.policy_document.investment_strategy?.yield_farming_enabled ? 'enabled' : 'disabled'} in policy`,
        },
      ];
      riskLevel = isAggressive ? 'Medium-High' : 'Low-Medium';
      confidence = isAggressive ? 85 : 70;
      break;

    case 'bear-market':
      decision = isConservative ? 'REJECTED' : 'APPROVED';
      interpretation = `During market downturn, your policy's ${policy.policy_document.risk_management?.stop_loss_percent}% stop loss and ${policy.policy_document.risk_management?.daily_loss_limit}% daily loss limit are triggered. ${isConservative ? 'Conservative approach suggests waiting' : 'Looking for oversold opportunities'}.`;
      decisions = [
        {
          approved: false,
          action: 'Buy the dip',
          reasoning: 'Daily loss limit reached, preventing new positions',
        },
        {
          approved: true,
          action: 'Trigger stop loss on existing position',
          reasoning: `Position down ${policy.policy_document.risk_management?.stop_loss_percent}%, automatic exit per policy`,
        },
      ];
      riskLevel = 'High';
      confidence = 90;
      break;

    case 'sideways':
      interpretation = `Low volatility conditions favor ${(policy.policy_document.trading_preferences?.frequency_minutes || 0) > 60 ? 'patience and reduced trading' : 'range trading strategies'}. Your DCA allocation of ${policy.policy_document.investment_strategy?.dca_percentage}% continues as planned.`;
      decisions = [
        {
          approved: true,
          action: 'Execute scheduled DCA buy',
          reasoning: `Part of ${policy.policy_document.investment_strategy?.dca_percentage}% DCA allocation, market conditions irrelevant`,
        },
        {
          approved: false,
          action: 'Open momentum-based position',
          reasoning: 'Insufficient momentum for momentum strategy criteria',
        },
      ];
      riskLevel = 'Low';
      confidence = 60;
      break;

    case 'high-volatility':
      decision = isConservative ? 'REJECTED' : 'APPROVED';
      interpretation = `Extreme volatility exceeds your ${policy.policy_document.trading_preferences?.max_slippage_percent}% max slippage tolerance. ${isConservative ? 'Pausing trading' : 'Adjusting position sizes down'}.`;
      decisions = [
        {
          approved: !isConservative,
          action: 'Trade with reduced position size',
          reasoning: 'Volatility requires smaller positions for risk management',
        },
        {
          approved: true,
          action: 'Widen slippage tolerance temporarily',
          reasoning: 'Market conditions require flexibility within risk parameters',
        },
      ];
      riskLevel = 'Very High';
      confidence = 55;
      break;

    case 'flash-crash':
      interpretation = `Sudden price movement triggers your ${policy.policy_document.risk_management?.max_drawdown_percent}% max drawdown protection. Emergency protocols activated.`;
      decisions = [
        {
          approved: true,
          action: 'Emergency position reduction',
          reasoning: 'Max drawdown reached, automatic risk reduction',
        },
        {
          approved: false,
          action: 'Buy the flash crash',
          reasoning: 'Daily loss limit and drawdown protection prevent new positions',
        },
      ];
      riskLevel = 'Extreme';
      confidence = 95;
      break;
  }

  return {
    decision,
    interpretation,
    decisions,
    riskLevel,
    confidence,
  };
}
