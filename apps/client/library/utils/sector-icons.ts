/**
 * Sector Icon Utilities
 * Uses boring-avatars for abstract, deterministic sector icons
 */

// Available boring-avatars variants
export type AvatarVariant = "beam" | "marble" | "pixel" | "sunset" | "ring" | "bauhaus";

// Color palettes for different sector types
export const SECTOR_TYPE_COLORS: Record<string, string[]> = {
  live_trading: ["#10b981", "#059669", "#047857", "#065f46", "#064e3b"], // Green shades
  paper_trading: ["#3b82f6", "#2563eb", "#1d4ed8", "#1e40af", "#1e3a8a"], // Blue shades
  experimental: ["#f97316", "#ea580c", "#c2410c", "#9a3412", "#7c2d12"], // Orange shades
};

/**
 * Generate boring-avatar props for a sector
 * Returns deterministic icon based on sector name
 */
export function getSectorAvatarProps(sectorName: string, sectorType: string) {
  const colors = SECTOR_TYPE_COLORS[sectorType] || SECTOR_TYPE_COLORS.live_trading;

  return {
    size: 32,
    name: sectorName, // Deterministic based on name
    variant: "beam" as AvatarVariant, // Clean, geometric style
    // colors,
  };
}

/**
 * Generate sector code (local-only ID)
 * Format: First 3 letters of name + 3 random numbers
 */
export function generateSectorCode(name: string): string {
  const letters = name.substring(0, 3).toUpperCase().padEnd(3, 'X');
  const numbers = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${letters}${numbers}`;
}
