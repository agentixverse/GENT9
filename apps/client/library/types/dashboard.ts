/**
 * Dashboard Module Types
 *
 * These types define the structure for customizable dashboard modules.
 * Each module can display data from different scopes (sector-specific or aggregate).
 */

/**
 * Scope configuration for dashboard modules
 * - "active-sector": Show data for the currently selected sector
 * - "global": Show aggregated data across all user's sectors
 * - number: Show data for a specific sector ID
 */
export type ModuleScope = "active-sector" | "global" | number;

/**
 * Available module types that can be added to the dashboard
 */
export type ModuleType =
  | "portfolio-card"
  | "trades-table"
  | "performance-chart"
  | "ai-activity-feed"
  | "sector-comparison"
  | "metrics-summary"
  | "trading-controls";

/**
 * Base configuration for all dashboard modules
 */
export interface DashboardModuleConfig {
  id: string;
  type: ModuleType;
  scope: ModuleScope;
  position?: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  settings?: Record<string, any>;
}

/**
 * Dashboard layout configuration
 */
export interface DashboardLayout {
  modules: DashboardModuleConfig[];
  layout: "grid" | "flex" | "custom";
  lastModified: string;
}

/**
 * Props passed to module wrapper components
 */
export interface ModuleWrapperProps {
  config: DashboardModuleConfig;
  activeSectorId: number | null;
  onRemove?: (moduleId: string) => void;
  onConfigChange?: (moduleId: string, newConfig: Partial<DashboardModuleConfig>) => void;
}

/**
 * Props for scope-aware data components
 */
export interface ScopeAwareComponentProps {
  scope: ModuleScope;
  activeSectorId: number | null;
}
