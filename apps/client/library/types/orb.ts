export type Chain = "ethereum" | "solana" | "sei" | "hyperliquid" | "icp" | "paper";

export interface Orb {
  id: number;
  sector_id: number;
  name: string;
  network_thread_id: number | null;
  wallet_address: string;
  /**
   * Computed chain field derived from network thread's supported_networks
   * This is not stored in the database but computed by the backend
   */
  chain?: Chain;
  /**
   * Trading pairs with allocation weights (0-100)
   * Example: {"ETH/USDC": 50, "ETH/DAI": 30, "USDC/DAI": 20}
   * - Higher values = higher priority for AI trading decisions
   * - Can represent portfolio allocation percentage
   * - Can influence trading frequency (AI trades higher-weighted pairs more often)
   */
  asset_pairs: Record<string, number>;
  config_json?: Record<string, any> | null;
  created_at: string;
  updated_at?: string | null;
}

export interface CreateOrbDto {
  sectorId?: number; // For frontend use
  sector_id: number;
  name: string;
  network_thread_registry_id: string;
  /**
   * Trading pairs with allocation weights (0-100)
   * Example: {"ETH/USDC": 50, "ETH/DAI": 30, "USDC/DAI": 20}
   * Default to equal weight (1) for all pairs if not specified
   */
  asset_pairs: Record<string, number>;
  config_json?: Record<string, any>;
  context?: string;
}
