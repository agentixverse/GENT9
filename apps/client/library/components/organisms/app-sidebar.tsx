"use client";

import {
  BookOpen,
  History,
  LayoutDashboard,
  Map,
  Settings2,
  Telescope,
} from "lucide-react";
import * as React from "react";

import { useAuth } from "@/library/api/hooks/use-auth";
import { useSectors } from "@/library/api/hooks/use-sectors";
import { useTrades } from "@/library/api/hooks/use-trades";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/library/components/atoms/sidebar";
import { NavBotActions } from "@/library/components/molecules/nav-bot-action";
import { NavMain } from "@/library/components/molecules/nav-main";
import { NavUser } from "@/library/components/molecules/nav-user";
import { SectorSwitcher } from "@/library/components/molecules/sector-switcher";
import { useSectorStore } from "@/library/store/sector-store";
import { Sector } from "@/library/types/sector";

const navData = {
  platform: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: false,
      items: [],
    },
    {
      title: "Observatory",
      url: "#",
      icon: Telescope,
      items: [
        {
          title: "Orbs",
          url: "/observatory/orbs",
        },
        {
          title: "Strategies",
          url: "/observatory/strategies",
        },
        {
          title: "Policies",
          url: "/observatory/policies",
        },
      ],
    },
    {
      title: "History",
      url: "/history",
      icon: History,
      items: [],
    },
    {
      title: "Documentation",
      url: "/documentation",
      icon: BookOpen,
      items: [],
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
      items: [],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  const { data: sectors, isLoading } = useSectors();
  const { activeSectorId, setActiveSector } = useSectorStore();
  const { data: trades } = useTrades(activeSectorId as number);

  const activeSector = React.useMemo(
    () => sectors?.find((s) => s.id === activeSectorId),
    [sectors, activeSectorId],
  );

  // Fallback user data while loading or if user data is incomplete
  const userData = {
    name: user?.email?.split("@")[0] || "User",
    email: user?.email || "loading@example.com",
    avatar: "/avatars/shadcn.jpg",
  };

  // Generate actions from trades dynamically
  const actions = React.useMemo(() => {
    if (!trades) return [];
    return trades
      .filter((trade) => ["PROPOSED", "APPROVED", "EXECUTING"].includes(trade.status))
      .map((trade) => ({
        name: trade.id,
        url: `/actions/${trade.id}`,
        icon: Map,
      }));
  }, [trades]);

  const handleSectorChange = (sector: Sector) => {
    setActiveSector(sector.id);
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SectorSwitcher
          sectors={sectors || []}
          activeSector={activeSector}
          onSectorChange={handleSectorChange}
          isLoading={isLoading}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navData.platform} />
        <NavBotActions actions={actions} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
