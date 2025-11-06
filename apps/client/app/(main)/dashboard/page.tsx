"use client"

import { ChartAreaInteractive } from "@/library/components/organisms/chart-area-interactive"
import { DataTable } from "@/library/components/organisms/data-table"
import { SectionCards } from "@/library/components/organisms/section-cards"
import { AIActivityFeed } from "@/library/components/organisms/ai-activity-feed"
import { TradingControls } from "@/library/components/organisms/trading-controls"
import { useSectorStore } from "@/library/store/sector-store"

export default function Page() {
  const activeSectorId = useSectorStore((state) => state.activeSectorId)

  return (
    <div className="flex flex-1 flex-col">
      <div className=" @container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div id="cards">
            <SectionCards sectorId={activeSectorId} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 px-4 lg:px-6 items-start">
            <div className="lg:col-span-2 space-y-4">
              <ChartAreaInteractive sectorId={activeSectorId} />
              <div id="trades">
                <DataTable sectorId={activeSectorId} />
              </div>
            </div>
            <div className="flex flex-col space-y-4 lg:sticky lg:top-4">
              <TradingControls sectorId={activeSectorId} />
              <AIActivityFeed sectorId={activeSectorId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
