export type SectorType = "live_trading" | "paper_trading" | "experimental";

export interface Sector {
  id: number;
  user_id: number;
  name: string;
  type: SectorType;
  description?: string | null;
  settings?: Record<string, any> | null;
  active_policy_version?: number | null;
  created_at: string;
  updated_at?: string | null;
}

export interface CreateSectorDto {
  name: string;
  type: SectorType;
  description?: string;
}

export interface UpdateSectorDto {
  name?: string;
  description?: string;
  settings?: Record<string, any>;
}
