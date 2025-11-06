export interface DemoAsset {
  symbol: string;
}

export interface DemoThread {
  name: string;
  type: "DEX" | "Bridge" | "Lending" | "Yield" | "Network";
}

export interface DemoOrb {
  name: string;
  chain: string;
  assets: DemoAsset[];
  threads: DemoThread[];
}

export interface DemoSector {
  name: string;
  type: "Live Trading" | "Paper Trading" | "Experimental";
  description: string;
  orbs: DemoOrb[];
}

export const TRADESPACE_DEMO_DATA: DemoSector[] = [
  {
    name: "Live Trading Sector",
    type: "Live Trading",
    description: "Real money, conservative strategies",
    orbs: [
      {
        name: "Ethereum DeFi Orb",
        chain: "Ethereum",
        assets: [
          { symbol: "ETH" },
          { symbol: "USDC" },
          { symbol: "DAI" },
          { symbol: "WBTC" },
          { symbol: "UNI" },
          { symbol: "AAVE" },
        ],
        threads: [
          { name: "Uniswap V3", type: "DEX" },
          { name: "1inch", type: "DEX" },
          { name: "Across Bridge", type: "Bridge" },
          { name: "Aave Lending", type: "Lending" },
        ],
      },
      {
        name: "Solana Jupiter Orb",
        chain: "Solana",
        assets: [
          { symbol: "SOL" },
          { symbol: "USDC" },
          { symbol: "JUP" },
          { symbol: "BONK" },
          { symbol: "WIF" },
          { symbol: "JTO" },
        ],
        threads: [
          { name: "Jupiter Aggregator", type: "DEX" },
          { name: "Raydium", type: "DEX" },
          { name: "Wormhole", type: "Bridge" },
          { name: "Marinade", type: "Yield" },
        ],
      },
    ],
  },
  {
    name: "Paper Trading Sector",
    type: "Paper Trading",
    description: "Test strategies risk-free",
    orbs: [
      {
        name: "Polygon Gaming Orb",
        chain: "Polygon",
        assets: [
          { symbol: "MATIC" },
          { symbol: "USDC" },
          { symbol: "SAND" },
          { symbol: "MANA" },
          { symbol: "IMX" },
          { symbol: "GALA" },
        ],
        threads: [
          { name: "QuickSwap", type: "DEX" },
          { name: "SushiSwap", type: "DEX" },
          { name: "Polygon Bridge", type: "Bridge" },
        ],
      },
      {
        name: "Arbitrum L2 Orb",
        chain: "Arbitrum",
        assets: [
          { symbol: "ETH" },
          { symbol: "ARB" },
          { symbol: "USDC" },
          { symbol: "GMX" },
          { symbol: "MAGIC" },
          { symbol: "GNS" },
        ],
        threads: [
          { name: "GMX", type: "DEX" },
          { name: "Camelot", type: "DEX" },
          { name: "Arbitrum Bridge", type: "Bridge" },
          { name: "GMX Yield", type: "Yield" },
        ],
      },
    ],
  },
  {
    name: "Experimental Sector",
    type: "Experimental",
    description: "High-risk, high-reward strategies",
    orbs: [
      {
        name: "Avalanche Yield Orb",
        chain: "Avalanche",
        assets: [
          { symbol: "AVAX" },
          { symbol: "USDC" },
          { symbol: "JOE" },
          { symbol: "PNG" },
          { symbol: "QI" },
          { symbol: "XAVA" },
        ],
        threads: [
          { name: "Trader Joe", type: "DEX" },
          { name: "Pangolin", type: "DEX" },
          { name: "Synapse Bridge", type: "Bridge" },
          { name: "Benqi Lending", type: "Lending" },
        ],
      },
    ],
  },
];
