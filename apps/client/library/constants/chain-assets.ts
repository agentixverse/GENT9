export interface Asset {
  symbol: string;
  name: string;
  icon?: string;
}

export const CHAIN_ASSETS: Record<string, Asset[]> = {
  ethereum: [
    { symbol: "ETH", name: "Ethereum" },
    { symbol: "USDC", name: "USD Coin" },
    { symbol: "USDT", name: "Tether" },
    { symbol: "WBTC", name: "Wrapped Bitcoin" },
    { symbol: "DAI", name: "Dai Stablecoin" },
    { symbol: "LINK", name: "Chainlink" },
    { symbol: "UNI", name: "Uniswap" },
    { symbol: "AAVE", name: "Aave" },
  ],
  solana: [
    { symbol: "SOL", name: "Solana" },
    { symbol: "USDC", name: "USD Coin" },
    { symbol: "USDT", name: "Tether" },
    { symbol: "RAY", name: "Raydium" },
    { symbol: "SRM", name: "Serum" },
    { symbol: "ORCA", name: "Orca" },
  ],
  polygon: [
    { symbol: "MATIC", name: "Polygon" },
    { symbol: "USDC", name: "USD Coin" },
    { symbol: "USDT", name: "Tether" },
    { symbol: "WETH", name: "Wrapped Ether" },
    { symbol: "WBTC", name: "Wrapped Bitcoin" },
  ],
  avalanche: [
    { symbol: "AVAX", name: "Avalanche" },
    { symbol: "USDC", name: "USD Coin" },
    { symbol: "USDT", name: "Tether" },
    { symbol: "WETH", name: "Wrapped Ether" },
  ],
  arbitrum: [
    { symbol: "ETH", name: "Ethereum" },
    { symbol: "USDC", name: "USD Coin" },
    { symbol: "USDT", name: "Tether" },
    { symbol: "ARB", name: "Arbitrum" },
  ],
  optimism: [
    { symbol: "ETH", name: "Ethereum" },
    { symbol: "USDC", name: "USD Coin" },
    { symbol: "USDT", name: "Tether" },
    { symbol: "OP", name: "Optimism" },
  ],
};

export const MAX_ASSETS_PER_ORB = 5;
