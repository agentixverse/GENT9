"use client";

import { ChevronsUpDown, Plus } from "lucide-react";
import * as React from "react";
import Avatar from "boring-avatars";
import { useRouter } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/library/components/atoms/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/library/components/atoms/sidebar";
import { Skeleton } from "@/library/components/atoms/skeleton";
import { getSectorAvatarProps } from "@/library/utils/sector-icons";
import type { Sector } from "@/library/types/sector";

interface SectorSwitcherProps {
  sectors: Sector[];
  activeSector?: Sector;
  onSectorChange?: (sector: Sector) => void;
  isLoading?: boolean;
}

export function SectorSwitcher({ sectors, activeSector, onSectorChange, isLoading }: SectorSwitcherProps) {
  const { isMobile, state } = useSidebar();
  const router = useRouter();
  const [selectedSector, setSelectedSector] = React.useState<Sector | undefined>(activeSector);

  // Update selectedSector when activeSector or sectors change
  React.useEffect(() => {
    if (activeSector) {
      setSelectedSector(activeSector);
    } else if (sectors && sectors.length > 0 && !selectedSector) {
      // Auto-select first sector if none is selected
      const firstSector = sectors[0];
      setSelectedSector(firstSector);
      onSectorChange?.(firstSector);
    }
  }, [activeSector, sectors, selectedSector, onSectorChange]);

  const handleSectorChange = (sector: Sector) => {
    setSelectedSector(sector);
    onSectorChange?.(sector);
  };

  const handleNewSector = () => {
    router.push("/onboarding/sector");
  };

  // Show loading skeleton while fetching sectors
  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <Skeleton className="size-8 rounded-lg" />
            <div className="grid flex-1 gap-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // Show empty state if no sectors or selectedSector is undefined
  if (!sectors || sectors.length === 0 || !selectedSector) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            onClick={handleNewSector}
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Plus className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">No Sectors</span>
              <span className="truncate text-xs">Create your first sector</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const avatarProps = getSectorAvatarProps(selectedSector.name, selectedSector.type);
  const sectorCode = selectedSector.settings?.code as string;
  const isCollapsed = state === "collapsed";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              tooltip={isCollapsed ? `${selectedSector.name} Sector` : undefined}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
                <Avatar {...avatarProps} />
              </div>
              {!isCollapsed && (
                <>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{selectedSector.name} Sector</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {sectorCode || "---"}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto" />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Sectors
            </DropdownMenuLabel>
            {sectors.map((sector, index) => {
              const props = getSectorAvatarProps(sector.name, sector.type);
              const code = sector.settings?.code as string;
              return (
                <DropdownMenuItem
                  key={sector.id}
                  onClick={() => handleSectorChange(sector)}
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-sm overflow-hidden border">
                    <Avatar {...props} size={24} />
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-sm font-medium">{sector.name} Sector</span>
                    <span className="text-xs text-muted-foreground">{code || "---"}</span>
                  </div>
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2" onClick={handleNewSector}>
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">New Sector</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
