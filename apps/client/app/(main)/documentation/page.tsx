"use client";

import { Card, CardContent } from "@/library/components/atoms/card";
import { Separator } from "@/library/components/atoms/separator";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle,
  ChevronRight,
  Globe,
  Info,
  Lock,
  Shield,
  Target,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";

export default function DocumentationPage() {
  return (
    <div className="flex flex-1 flex-col gap-12 p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-6 py-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Complete Guide</span>
        </div>
        <h1 className="text-5xl font-bold text-foreground">Welcome to Agentix</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          AI-powered autonomous crypto trading across multiple sectors and chains. Set it up
          once, and let AI handle the rest.
        </p>
      </div>

      {/* What is Agentix Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold">What is Agentix?</h2>
        </div>

        <p className="text-lg text-muted-foreground leading-relaxed">
          Agentix is an autonomous crypto trading platform that uses AI agents to trade on
          your behalf. Think of it as your personal trading team working 24/7, making
          decisions based on your goals and risk tolerance. No manual trading, no constant
          monitoring—just smart, automated strategies designed to grow your portfolio.
        </p>
      </section>

      <Separator />

      {/* Core Concepts Section */}
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold">Understanding the Basics</h2>
        </div>

        <p className="text-lg text-muted-foreground leading-relaxed">
          Agentix organizes your trading into a simple hierarchy. Think of it as your
          trading universe:
        </p>

        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-lg border">
          <div className="font-mono text-sm space-y-2">
            <div className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">Tradespace</span>
              <span className="text-muted-foreground">- Your entire trading ecosystem</span>
            </div>
            <div className="flex items-center gap-2 ml-6">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">Sectors</span>
              <span className="text-muted-foreground">
                - Different trading environments
              </span>
            </div>
            <div className="flex items-center gap-2 ml-12">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">Orbs</span>
              <span className="text-muted-foreground">
                - Asset collections per blockchain
              </span>
            </div>
            <div className="flex items-center gap-2 ml-[72px]">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">Pairs</span>
              <span className="text-muted-foreground">
                - Tradeable markets (e.g., ETH/USDC)
              </span>
            </div>
            <div className="flex items-center gap-2 ml-24">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">Assets</span>
              <span className="text-muted-foreground">
                - Individual tokens (ETH, USDC, etc.)
              </span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="h-6 w-6 text-muted-foreground" />
                <h3 className="text-xl font-semibold">Sectors</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Isolated trading environments with their own rules and goals. Think of them
                as different trading strategies or risk levels.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Live Trading</strong> - Real money, conservative approach
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Paper Trading</strong> - Test strategies risk-free
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Experimental</strong> - Higher risk, higher reward
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Wallet className="h-6 w-6 text-muted-foreground" />
                <h3 className="text-xl font-semibold">Orbs</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Asset collections on specific blockchains. Each orb has its own wallet,
                infrastructure settings, and trading pairs.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Ethereum DeFi</strong> - Major DeFi tokens and protocols
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Solana Jupiter</strong> - Fast, low-cost trading
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Polygon Gaming</strong> - Gaming and NFT tokens
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Target className="h-6 w-6 text-muted-foreground" />
                <h3 className="text-xl font-semibold">Threads</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Connectors that link your orbs to trading venues like DEXs, bridges, and
                exchanges. They enable the actual trades.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Network Threads</strong> - Live trading or paper trading
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>DEX Threads</strong> - Uniswap, SushiSwap, Jupiter
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Bridge Threads</strong> - Cross-chain value transfer
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Brain className="h-6 w-6 text-muted-foreground" />
                <h3 className="text-xl font-semibold">Strategies</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Trading rules and algorithms that AI agents follow. You create or select
                strategies that match your risk tolerance.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>SMA Crossover</strong> - Trend-following strategy
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>RSI</strong> - Overbought/oversold detection
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Custom</strong> - Build your own strategies
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* How It Works Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold">How AI Trading Works</h2>
        </div>

        <p className="text-lg text-muted-foreground leading-relaxed">
          Agentix uses AI agents that continuously analyze markets, identify opportunities,
          and execute trades according to your strategies and risk rules. Here's the
          workflow:
        </p>

        <div className="grid gap-4">
          <div className="flex items-start gap-4 p-6 border-2 rounded-lg hover:border-primary transition-colors">
            <div className="bg-foreground text-background rounded-full w-8 h-8 flex items-center justify-center text-base font-bold flex-shrink-0">
              1
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-lg mb-2">Market Analysis</h4>
              <p className="text-muted-foreground">
                AI agents continuously monitor price movements, technical indicators, and
                market conditions across all your configured pairs.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-6 border-2 rounded-lg hover:border-primary transition-colors">
            <div className="bg-foreground text-background rounded-full w-8 h-8 flex items-center justify-center text-base font-bold flex-shrink-0">
              2
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-lg mb-2">Opportunity Detection</h4>
              <p className="text-muted-foreground">
                When market conditions match your strategy criteria, the AI identifies
                potential trading opportunities and evaluates risk vs. reward.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-6 border-2 rounded-lg hover:border-primary transition-colors">
            <div className="bg-foreground text-background rounded-full w-8 h-8 flex items-center justify-center text-base font-bold flex-shrink-0">
              3
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-lg mb-2">Risk Evaluation</h4>
              <p className="text-muted-foreground">
                Before executing, every trade is checked against your policies: position
                limits, stop losses, sector constraints, and capital preservation rules.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-6 border-2 rounded-lg hover:border-primary transition-colors">
            <div className="bg-foreground text-background rounded-full w-8 h-8 flex items-center justify-center text-base font-bold flex-shrink-0">
              4
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-lg mb-2">Trade Execution</h4>
              <p className="text-muted-foreground">
                If all checks pass, the AI executes the trade through the appropriate thread
                (DEX, bridge, etc.) with optimal routing and slippage protection.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-6 border-2 rounded-lg hover:border-primary transition-colors">
            <div className="bg-foreground text-background rounded-full w-8 h-8 flex items-center justify-center text-base font-bold flex-shrink-0">
              5
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-lg mb-2">Continuous Monitoring</h4>
              <p className="text-muted-foreground">
                Every 20 seconds, the AI checks all open positions for exit conditions: stop
                losses, take profits, or changing market conditions.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Getting Started Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold">Getting Started</h2>
        </div>

        <p className="text-lg text-muted-foreground leading-relaxed">
          Start trading with AI in just a few steps. We recommend beginning with paper
          trading to familiarize yourself with the platform before using real funds.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4 p-6 border-2 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold">Create Your Account</h3>
            </div>
            <p className="text-muted-foreground">
              Sign up with your email. No KYC required, no personal information beyond
              verification.
            </p>
          </div>

          <div className="space-y-4 p-6 border-2 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold">Choose Your Sector</h3>
            </div>
            <p className="text-muted-foreground">
              Start with a paper trading sector to test strategies without risk, or go live
              with a conservative sector.
            </p>
          </div>

          <div className="space-y-4 p-6 border-2 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold">Create an Orb</h3>
            </div>
            <p className="text-muted-foreground">
              Set up your first orb on Ethereum or Solana. A secure wallet is automatically
              generated for you.
            </p>
          </div>

          <div className="space-y-4 p-6 border-2 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center font-bold">
                4
              </div>
              <h3 className="text-lg font-semibold">Select Assets & Pairs</h3>
            </div>
            <p className="text-muted-foreground">
              Choose which tokens you want to trade and create trading pairs (e.g.,
              ETH/USDC, SOL/USDT).
            </p>
          </div>

          <div className="space-y-4 p-6 border-2 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center font-bold">
                5
              </div>
              <h3 className="text-lg font-semibold">Configure Strategy</h3>
            </div>
            <p className="text-muted-foreground">
              Select or create a trading strategy. Set your risk parameters, stop losses,
              and position sizing rules.
            </p>
          </div>

          <div className="space-y-4 p-6 border-2 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center font-bold">
                6
              </div>
              <h3 className="text-lg font-semibold">Fund & Launch</h3>
            </div>
            <p className="text-muted-foreground">
              Deposit funds to your orb wallet (for live trading) and enable AI trading.
              Monitor everything from the dashboard.
            </p>
          </div>
        </div>
      </section>

      <Separator />

      {/* Risk & Security Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold">Risk Management & Security</h2>
        </div>

        <Card className="border-muted bg-muted/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Lock className="h-6 w-6 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-3 text-lg">Capital Protection First</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Every trade is evaluated for risk before profit potential. Agentix is
                  designed to protect your capital first, seek opportunities second. We'd
                  rather miss a trade than risk significant losses.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <h4 className="font-semibold">Policy-Based Controls</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                You set the rules: maximum position size, stop loss percentages, daily loss
                limits, and trading hours. AI agents strictly follow these policies.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <h4 className="font-semibold">Isolated Wallets</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Each orb has its own wallet managed by Privy. No private keys stored on our
                servers. You maintain full custody through your account.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                <h4 className="font-semibold">Real-Time Risk Monitoring</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Every 20 seconds, all positions are checked for stop loss triggers, drawdown
                limits, and unusual market conditions.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <h4 className="font-semibold">Adaptive Strategies</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                AI adjusts strategy parameters based on market conditions: tighter stops in
                volatility, larger positions in stable trends.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* Key Features Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold">Platform Features</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="h-6 w-6 text-muted-foreground" />
                <h4 className="font-semibold">Multi-Chain Support</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Trade across Ethereum, Solana, Polygon, and Avalanche. More chains coming
                soon.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="h-6 w-6 text-muted-foreground" />
                <h4 className="font-semibold">AI Decision Logs</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Complete transparency: see why AI made each trade with detailed reasoning
                and analysis.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-6 w-6 text-muted-foreground" />
                <h4 className="font-semibold">Performance Analytics</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Track Sharpe ratio, drawdown, win rate, and compare against inflation
                targets.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-6 w-6 text-muted-foreground" />
                <h4 className="font-semibold">Strategy Builder</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Create custom strategies or use proven templates. Backtest before deploying.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="h-6 w-6 text-muted-foreground" />
                <h4 className="font-semibold">Automatic Wallets</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Secure wallets generated automatically for each orb. No manual setup
                required.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-6 w-6 text-muted-foreground" />
                <h4 className="font-semibold">Real-Time Execution</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Sub-second trade notifications and execution through optimal DEX routing.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer CTA */}
      <div className="text-center py-12 border-t mt-12">
        <h3 className="text-2xl font-bold mb-4">Ready to Start Trading?</h3>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          Begin with paper trading to familiarize yourself with the platform, then scale up
          to live trading when you're ready.
        </p>
        <Card className="border-muted bg-muted/50 max-w-2xl mx-auto">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <h4 className="font-medium mb-2">Important Disclaimer</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Crypto trading carries significant risk. Only invest what you can afford
                  to lose. Past performance does not guarantee future results. Agentix aims
                  to be agentic Tradespace through risk-managed strategies, but losses are
                  possible.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
