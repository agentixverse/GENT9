"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/library/components/atoms/dialog";
import { Button } from "@/library/components/atoms/button";
import { Input } from "@/library/components/atoms/input";
import { Label } from "@/library/components/atoms/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/library/components/atoms/select";
import { CHAIN_ASSETS } from "@/library/constants/chain-assets";
import type { CreateOrbDto } from "@/library/types/orb";
import { X, Plus, Loader2 } from "lucide-react";
import { Badge } from "@/library/components/atoms/badge";
import { useNetworkThreads } from "@/library/api/hooks/use-thread-registry";

interface OrbCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateOrbDto) => void;
  sectorId: number;
  isCreating?: boolean;
}

function OrbCreateModal({
  open,
  onOpenChange,
  onSubmit,
  sectorId,
  isCreating = false,
}: OrbCreateModalProps) {
  const [name, setName] = useState("");
  const [networkThreadRegistryId, setNetworkThreadRegistryId] = useState<string>("");
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [assetWeights, setAssetWeights] = useState<Record<string, number>>({});

  // Fetch available network threads dynamically
  const { data: networkThreads, isLoading: isLoadingThreads } = useNetworkThreads();

  // Derive the chain from the selected thread for asset selection
  const selectedChain = useMemo(() => {
    if (!networkThreadRegistryId || !networkThreads) return null;
    const selectedThread = networkThreads.find((t) => t.id === networkThreadRegistryId);
    return selectedThread?.supported_networks[0] || null;
  }, [networkThreadRegistryId, networkThreads]);

  const availableAssets = selectedChain ? (CHAIN_ASSETS[selectedChain as keyof typeof CHAIN_ASSETS] || []) : [];

  const handleAddAsset = (symbol: string) => {
    if (!selectedAssets.includes(symbol)) {
      setSelectedAssets([...selectedAssets, symbol]);
      setAssetWeights({ ...assetWeights, [symbol]: 50 });
    }
  };

  const handleRemoveAsset = (symbol: string) => {
    setSelectedAssets(selectedAssets.filter((s) => s !== symbol));
    const newWeights = { ...assetWeights };
    delete newWeights[symbol];
    setAssetWeights(newWeights);
  };

  const handleWeightChange = (symbol: string, weight: number) => {
    setAssetWeights({ ...assetWeights, [symbol]: weight });
  };

  const generateTradingPairs = (): Record<string, number> => {
    const pairs: Record<string, number> = {};

    // Create pairs from selected assets
    for (let i = 0; i < selectedAssets.length; i++) {
      for (let j = i + 1; j < selectedAssets.length; j++) {
        const pair = `${selectedAssets[i]}/${selectedAssets[j]}`;
        // Average the weights of the two assets
        const weight = Math.round(
          (assetWeights[selectedAssets[i]] + assetWeights[selectedAssets[j]]) / 2
        );
        pairs[pair] = weight;
      }
    }

    return pairs;
  };

  const handleSubmit = () => {
    const tradingPairs = generateTradingPairs();

    const data: CreateOrbDto = {
      sectorId,
      sector_id: sectorId,
      name,
      network_thread_registry_id: networkThreadRegistryId,
      asset_pairs: tradingPairs,
      config_json: {
        selected_assets: selectedAssets,
        asset_weights: assetWeights,
      },
    };

    onSubmit(data);

    // Reset form
    setName("");
    setNetworkThreadRegistryId("");
    setSelectedAssets([]);
    setAssetWeights({});
  };

  const isValid = name.trim() !== "" && networkThreadRegistryId !== "" && selectedAssets.length >= 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Orb</DialogTitle>
          <DialogDescription>
            Set up a new trading orb with multi-chain asset collections and specific
            infrastructure.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="name">Orb Name</Label>
            <Input
              id="name"
              placeholder="e.g., Ethereum L1 DeFi, Solana Jupiter"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Network Thread Selection */}
          <div className="space-y-2">
            <Label htmlFor="network-thread">Network Infrastructure</Label>
            {isLoadingThreads ? (
              <div className="flex items-center justify-center p-3 border rounded-md">
                <Loader2 className="size-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">
                  Loading available networks...
                </span>
              </div>
            ) : (
              <Select
                value={networkThreadRegistryId}
                onValueChange={setNetworkThreadRegistryId}
              >
                <SelectTrigger id="network-thread">
                  <SelectValue placeholder="Select network infrastructure" />
                </SelectTrigger>
                <SelectContent>
                  {networkThreads?.map((thread) => (
                    <SelectItem key={thread.id} value={thread.id}>
                      <div className="flex flex-col">
                        <span>{thread.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {thread.supported_networks.join(", ")} • {thread.author}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Asset Selection */}
          <div className="space-y-2">
            <Label>Assets (minimum 2)</Label>
            <div className="border rounded-md p-3 space-y-3 max-h-64 overflow-y-auto">
              {availableAssets.map((asset) => {
                const isSelected = selectedAssets.includes(asset.symbol);
                return (
                  <div
                    key={asset.symbol}
                    className="flex items-center justify-between p-2 hover:bg-accent rounded-md transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{asset.symbol}</span>
                      <span className="text-sm text-muted-foreground">
                        {asset.name}
                      </span>
                    </div>
                    {isSelected ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          value={assetWeights[asset.symbol] || 50}
                          onChange={(e) =>
                            handleWeightChange(
                              asset.symbol,
                              parseInt(e.target.value) || 50
                            )
                          }
                          className="w-20 h-8 text-sm"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAsset(asset.symbol)}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddAsset(asset.symbol)}
                      >
                        <Plus className="size-4 mr-1" />
                        Add
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Assets Preview */}
          {selectedAssets.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Assets ({selectedAssets.length})</Label>
              <div className="flex flex-wrap gap-2">
                {selectedAssets.map((symbol) => (
                  <Badge key={symbol} variant="secondary">
                    {symbol} (weight: {assetWeights[symbol]})
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Trading Pairs Preview */}
          {selectedAssets.length >= 2 && (
            <div className="space-y-2">
              <Label>
                Trading Pairs ({Object.keys(generateTradingPairs()).length})
              </Label>
              <div className="text-xs text-muted-foreground space-y-1">
                {Object.entries(generateTradingPairs())
                  .slice(0, 5)
                  .map(([pair, weight]) => (
                    <div key={pair} className="flex justify-between">
                      <span>{pair}</span>
                      <span>Weight: {weight}</span>
                    </div>
                  ))}
                {Object.keys(generateTradingPairs()).length > 5 && (
                  <div className="text-muted-foreground italic">
                    +{Object.keys(generateTradingPairs()).length - 5} more pairs
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isCreating}>
            {isCreating ? "Creating..." : "Create Orb"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { OrbCreateModal };
