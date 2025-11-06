export interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  category: 'conservative' | 'balanced_mix' | 'aggressive';
  preview: string;
  policyDocument: {
    risk_management: {
      max_position_size_percent: number;
      stop_loss_percent: number;
      take_profit_percent: number;
      max_drawdown_percent: number;
      daily_loss_limit: number;
    };
    trading_preferences: {
      frequency_minutes: number;
      enabled_markets: string[];
      preferred_exchanges: string[];
      max_slippage_percent: number;
      base_currency: {
        ethereum: string;
        solana: string;
      };
    };
    investment_strategy: {
      strategy_type: 'conservative' | 'balanced_mix' | 'aggressive';
      dca_percentage: number;
      momentum_percentage: number;
      yield_farming_enabled: boolean;
      target_annual_return: number;
    };
  };
}

export const POLICY_TEMPLATES: PolicyTemplate[] = [
  {
    id: 'conservative-preservation',
    name: 'Conservative Capital Preservation',
    description: 'Focus on protecting capital with minimal risk exposure and steady growth',
    category: 'conservative',
    preview: 'Prioritize capital safety with strict risk limits, low position sizes, and stable market exposure. Ideal for long-term wealth preservation.',
    policyDocument: {
      risk_management: {
        max_position_size_percent: 10,
        stop_loss_percent: 2,
        take_profit_percent: 5,
        max_drawdown_percent: 5,
        daily_loss_limit: 1,
      },
      trading_preferences: {
        frequency_minutes: 240,
        enabled_markets: ['ethereum', 'polygon'],
        preferred_exchanges: ['uniswap', 'sushiswap'],
        max_slippage_percent: 0.5,
        base_currency: {
          ethereum: 'USDC',
          solana: 'USDC',
        },
      },
      investment_strategy: {
        strategy_type: 'conservative',
        dca_percentage: 80,
        momentum_percentage: 20,
        yield_farming_enabled: false,
        target_annual_return: 8,
      },
    },
  },
  {
    id: 'aggressive-growth',
    name: 'Aggressive Growth Seeker',
    description: 'Maximum growth potential with higher risk tolerance and active trading',
    category: 'aggressive',
    preview: 'Maximize returns through active trading, larger positions, and multi-chain opportunities. Higher risk, higher reward approach.',
    policyDocument: {
      risk_management: {
        max_position_size_percent: 30,
        stop_loss_percent: 10,
        take_profit_percent: 25,
        max_drawdown_percent: 20,
        daily_loss_limit: 5,
      },
      trading_preferences: {
        frequency_minutes: 15,
        enabled_markets: ['ethereum', 'solana', 'polygon', 'avalanche'],
        preferred_exchanges: ['uniswap', 'sushiswap', 'raydium', 'jupiter'],
        max_slippage_percent: 2,
        base_currency: {
          ethereum: 'ETH',
          solana: 'SOL',
        },
      },
      investment_strategy: {
        strategy_type: 'aggressive',
        dca_percentage: 20,
        momentum_percentage: 80,
        yield_farming_enabled: true,
        target_annual_return: 40,
      },
    },
  },
  {
    id: 'market-maker',
    name: 'Market Maker',
    description: 'Provide liquidity and earn from spreads with balanced exposure',
    category: 'balanced_mix',
    preview: 'Focus on liquidity provision and spread capture across multiple DEXes. Moderate risk with steady income stream.',
    policyDocument: {
      risk_management: {
        max_position_size_percent: 20,
        stop_loss_percent: 5,
        take_profit_percent: 3,
        max_drawdown_percent: 10,
        daily_loss_limit: 2,
      },
      trading_preferences: {
        frequency_minutes: 30,
        enabled_markets: ['ethereum', 'polygon', 'avalanche'],
        preferred_exchanges: ['uniswap', 'sushiswap', 'quickswap', 'traderjoe'],
        max_slippage_percent: 0.3,
        base_currency: {
          ethereum: 'USDC',
          solana: 'USDC',
        },
      },
      investment_strategy: {
        strategy_type: 'balanced_mix',
        dca_percentage: 40,
        momentum_percentage: 60,
        yield_farming_enabled: true,
        target_annual_return: 20,
      },
    },
  },
  {
    id: 'arbitrage-hunter',
    name: 'Arbitrage Hunter',
    description: 'Exploit price differences across chains and exchanges for low-risk profits',
    category: 'balanced_mix',
    preview: 'Identify and capture arbitrage opportunities across multiple chains and DEXes. Fast execution with controlled risk.',
    policyDocument: {
      risk_management: {
        max_position_size_percent: 25,
        stop_loss_percent: 1,
        take_profit_percent: 2,
        max_drawdown_percent: 8,
        daily_loss_limit: 2,
      },
      trading_preferences: {
        frequency_minutes: 5,
        enabled_markets: ['ethereum', 'solana', 'polygon', 'avalanche', 'arbitrum', 'optimism'],
        preferred_exchanges: ['uniswap', 'sushiswap', 'raydium', 'jupiter', 'quickswap', 'traderjoe'],
        max_slippage_percent: 0.5,
        base_currency: {
          ethereum: 'USDC',
          solana: 'USDC',
        },
      },
      investment_strategy: {
        strategy_type: 'balanced_mix',
        dca_percentage: 10,
        momentum_percentage: 90,
        yield_farming_enabled: false,
        target_annual_return: 25,
      },
    },
  },
  {
    id: 'dca-accumulator',
    name: 'DCA Accumulator',
    description: 'Systematic accumulation through dollar-cost averaging with minimal trading',
    category: 'conservative',
    preview: 'Steady, automated accumulation of assets over time. Minimize timing risk with consistent, small purchases.',
    policyDocument: {
      risk_management: {
        max_position_size_percent: 15,
        stop_loss_percent: 15,
        take_profit_percent: 50,
        max_drawdown_percent: 25,
        daily_loss_limit: 0.5,
      },
      trading_preferences: {
        frequency_minutes: 1440, // Daily
        enabled_markets: ['ethereum', 'polygon'],
        preferred_exchanges: ['uniswap', 'sushiswap'],
        max_slippage_percent: 1,
        base_currency: {
          ethereum: 'USDC',
          solana: 'USDC',
        },
      },
      investment_strategy: {
        strategy_type: 'conservative',
        dca_percentage: 95,
        momentum_percentage: 5,
        yield_farming_enabled: false,
        target_annual_return: 12,
      },
    },
  },
];
