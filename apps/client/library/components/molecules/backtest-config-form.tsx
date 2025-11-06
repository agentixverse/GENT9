"use client";

import * as React from "react";
import { HelpCircle } from "lucide-react";
import { Label } from "@/library/components/atoms/label";
import { Input } from "@/library/components/atoms/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/library/components/atoms/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/library/components/atoms/tooltip";
import { SUPPORTED_COINS } from "@/library/templates/strategy-templates";
import type { BacktestConfig } from "@/library/types/backtest";

interface BacktestConfigFormProps {
  config: BacktestConfig;
  onChange: (config: Partial<BacktestConfig>) => void;
}

function BacktestConfigForm({ config, onChange }: BacktestConfigFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="startDate">Start Date</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="size-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                The beginning of the historical period to test your strategy against
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="startDate"
            type="date"
            value={config.startDate.split("T")[0]}
            onChange={(e) =>
              onChange({ startDate: new Date(e.target.value).toISOString() })
            }
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="endDate">End Date</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="size-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                The end of the historical period for testing
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="endDate"
            type="date"
            value={config.endDate.split("T")[0]}
            onChange={(e) =>
              onChange({ endDate: new Date(e.target.value).toISOString() })
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Label htmlFor="coinId">Cryptocurrency</Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="size-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              Choose which cryptocurrency to test your strategy on. Historical price data will be fetched for this asset.
            </TooltipContent>
          </Tooltip>
        </div>
        <Select
          value={config.coinId || "bitcoin"}
          onValueChange={(value) => onChange({ coinId: value })}
        >
          <SelectTrigger id="coinId">
            <SelectValue placeholder="Select cryptocurrency" />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_COINS.map((coin) => (
              <SelectItem key={coin.id} value={coin.id}>
                {coin.name} ({coin.symbol})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="initialCapital">Initial Capital ($)</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="size-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                The starting amount of money for your backtest. This simulates how much you would have invested.
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="initialCapital"
            type="number"
            min="1"
            max="1000000000"
            value={config.initialCapital}
            onChange={(e) =>
              onChange({ initialCapital: parseFloat(e.target.value) })
            }
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="commission">Commission (%)</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="size-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                Trading fees charged per transaction. Typical exchange fees range from 0.1% to 0.5%. Default is 0.2%.
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="commission"
            type="number"
            min="0"
            max="1"
            step="0.001"
            value={config.commission * 100}
            onChange={(e) =>
              onChange({ commission: parseFloat(e.target.value) / 100 })
            }
          />
        </div>
      </div>
    </div>
  );
}

export { BacktestConfigForm };
