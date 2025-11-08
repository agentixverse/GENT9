import { ColumnType, Generated, JSONColumnType } from "kysely";

import { JournalEntryContent, JournalEntryType } from "@/types/journal";
import { ChainType } from "@/types/orb";
import { PolicyDocument } from "@/types/policy";
import { ThreadRegistryConfig } from "@/types/thread-configs";

export interface UsersTable {
  id: Generated<number>;
  email: string;
  password_hash: string;
  settings: JSONColumnType<Record<string, any> | null>;
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, string | undefined, string | undefined>;
}

export interface SectorsTable {
  id: Generated<number>;
  user_id: number;
  name: string;
  type: "live_trading" | "paper_trading";
  settings: JSONColumnType<Record<string, any> | null>;
  active_policy_version: number | null;
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, string | undefined, string | undefined>;
}

export interface SectorPoliciesTable {
  id: Generated<number>;
  sector_id: number;
  policy_document: JSONColumnType<PolicyDocument>;
  version: number;
  is_active: boolean;
  ai_critique: string | null;
  created_at: ColumnType<Date, string | undefined, never>;
}

export interface OrbsTable {
  id: Generated<number>;
  sector_id: number;
  name: string;
  network_thread_id: number | null;
  wallet_address: string;
  privy_wallet_id: string;
  asset_pairs: JSONColumnType<Record<string, number>>;
  config_json: JSONColumnType<Record<string, any> | null>;
  context: string | null;
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, string | undefined, string | undefined>;
}

export interface ThreadRegistryTable {
  id: string; // Content hash
  name: string;
  version: string;
  provider_id: string;
  author: string;
  thread_type: "dex" | "bridge" | "lending" | "yield_farming" | "network_infra" | "other";
  supported_networks: JSONColumnType<string[]>;
  logic_path: string;
  ui_entry: string | null;
  agx_manifest: JSONColumnType<{
    description: string;
    ui?: {
      supports_iframe: boolean;
      responsive: boolean;
      dimensions: string;
    };
    storage_schema: Record<string, any>;
    api_endpoints: Record<string, string>;
    features: string[];
    permissions?: string[];
    created_at: string;
  }>;
  source_url: string;
  discovered_at: ColumnType<Date, string | undefined, never>;
  last_validated_at: ColumnType<Date, string | undefined, string | undefined>;
  config_json: JSONColumnType<ThreadRegistryConfig | null>;
}

export interface ThreadsTable {
  id: Generated<number>;
  orb_id: number;
  registry_id: string;
  enabled: boolean;
  config_json: JSONColumnType<Record<string, any>>;
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, string | undefined, string | undefined>;
}

export interface TradeActionsTable {
  id: Generated<number>;
  sector_id: number;
  orb_id: number | null;
  trading_pair: string | null;
  status:
    | "ANALYZING" // AI is actively processing, user can interrupt.
    | "REJECTED" // User has rejected the AI's proposal (terminal state).
    | "EXECUTING" // The approved trade is being sent to the blockchain.
    | "SUCCEEDED" // The trade was successfully confirmed on-chain (terminal state).
    | "FAILED"; // The trade failed on-chain or during execution (terminal state).
  is_active: boolean;
  summary: string | null;
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, string | undefined, string | undefined>;
}

export interface TradeStrategiesTable {
  id: Generated<number>;
  trade_action_id: number;
  strategy_type: string;
  strategy_params_json: JSONColumnType<Record<string, any>>;
  is_active: boolean;
  created_at: ColumnType<Date, string | undefined, never>;
}

export interface JournalEntriesTable {
  id: Generated<number>;
  sector_id: number;
  trade_action_id: number | null;
  type: JournalEntryType;
  content: JSONColumnType<JournalEntryContent>;
  confidence_score: number | null;
  is_internal: boolean;
  created_at: ColumnType<Date, string | undefined, never>;
}

export interface PortfolioSnapshotsTable {
  id: Generated<number>;
  sector_id: number;
  total_value: number;
  total_pnl: number;
  pnl_percentage: number;
  vs_inflation_performance: number | null;
  snapshot_date: ColumnType<Date, string, string>;
  created_at: ColumnType<Date, string | undefined, never>;
}

export interface ThreadNetworkStorageTable {
  id: Generated<number>;
  sector_id: number;
  chain: string;
  provider_id: string;
  storage_json: JSONColumnType<Record<string, any>>;
  updated_at: ColumnType<Date, string | undefined, string | undefined>;
}

export interface ThreadIsolatedStorageTable {
  id: Generated<number>;
  orb_id: number;
  provider_id: string;
  storage_json: JSONColumnType<Record<string, any>>;
  updated_at: ColumnType<Date, string | undefined, string | undefined>;
}

export interface StrategiesTable {
  id: Generated<number>;
  user_id: number;
  name: string;
  status: "idle" | "queued" | "running" | "completed" | "failed";
  active_revision_index: number;
  is_active: boolean;
  revisions: JSONColumnType<Array<{
    code: string;
    created_at: string;
    results: {
      metrics: {
        total_return: number;
        sharpe_ratio: number;
        max_drawdown: number;
        win_rate: number;
        total_trades: number;
      } | null;
      html_report: string | null;
      error_message: string | null;
      started_at: string | null;
      completed_at: string | null;
    } | null;
  }>>;
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, string | undefined, string | undefined>;
}

export interface DB {
  users: UsersTable;
  sectors: SectorsTable;
  sector_policies: SectorPoliciesTable;
  orbs: OrbsTable;
  thread_registry: ThreadRegistryTable;
  threads: ThreadsTable;
  trade_actions: TradeActionsTable;
  trade_strategies: TradeStrategiesTable;
  journal_entries: JournalEntriesTable;
  portfolio_snapshots: PortfolioSnapshotsTable;
  thread_network_storage: ThreadNetworkStorageTable;
  thread_isolated_storage: ThreadIsolatedStorageTable;
  strategies: StrategiesTable;
}
