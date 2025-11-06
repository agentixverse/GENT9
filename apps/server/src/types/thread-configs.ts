export interface VerifiedAsset {
  symbol: string;
  name: string;
  address: string;
  chain: string;
  logo_uri?: string;
  verification_status: 'verified' | 'unverified' | 'caution';
}

export interface DexThreadConfig {
  cached_assets: VerifiedAsset[];
  // Future DEX-specific config can be added here
}

// A union type for all possible thread configs stored in thread_registry.config_json
export type ThreadRegistryConfig = DexThreadConfig | {};
