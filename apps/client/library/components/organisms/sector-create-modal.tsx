"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/library/components/atoms/dialog";
import { Button } from "@/library/components/atoms/button";
import { Input } from "@/library/components/atoms/input";
import { Label } from "@/library/components/atoms/label";
import { Textarea } from "@/library/components/atoms/text-area";
import { useCreateSector } from "@/library/api/hooks/use-sectors";
import { createSectorSchema, type CreateSectorFormData } from "@/library/schemas/sector";
import type { SectorType } from "@/library/types/sector";
import { TrendingUp, TestTube2, FlaskConical, CheckCircle2 } from "lucide-react";
import { cn } from "@/library/utils";

interface SectorCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const sectorTypes = [
  {
    type: "paper_trading" as SectorType,
    label: "Paper Trading",
    description: "Practice trading with virtual funds. Zero risk, perfect for testing strategies.",
    icon: TestTube2,
    color: "text-blue-500 dark:text-blue-400",
    bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
    borderColor: "border-blue-500/20 hover:border-blue-500/40 dark:border-blue-500/30 dark:hover:border-blue-500/60",
    ringColor: "ring-blue-500/50",
  },
  {
    type: "live_trading" as SectorType,
    label: "Live Trading",
    description: "Real money trading with your crypto assets. Requires careful risk management.",
    icon: TrendingUp,
    color: "text-green-500 dark:text-green-400",
    bgColor: "bg-green-500/10 dark:bg-green-500/20",
    borderColor: "border-green-500/20 hover:border-green-500/40 dark:border-green-500/30 dark:hover:border-green-500/60",
    ringColor: "ring-green-500/50",
  },
  {
    type: "experimental" as SectorType,
    label: "Experimental",
    description: "High-risk, high-reward strategies. Only use funds you can afford to lose.",
    icon: FlaskConical,
    color: "text-orange-500 dark:text-orange-400",
    bgColor: "bg-orange-500/10 dark:bg-orange-500/20",
    borderColor: "border-orange-500/20 hover:border-orange-500/40 dark:border-orange-500/30 dark:hover:border-orange-500/60",
    ringColor: "ring-orange-500/50",
  },
];

function SectorCreateModal({ open, onOpenChange }: SectorCreateModalProps) {
  const [formData, setFormData] = React.useState<CreateSectorFormData>({
    name: "",
    type: "paper_trading",
    description: "",
  });
  const [errors, setErrors] = React.useState<Partial<Record<keyof CreateSectorFormData, string>>>(
    {}
  );

  const createSectorMutation = useCreateSector();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validatedData = createSectorSchema.parse(formData);
      await createSectorMutation.mutateAsync(validatedData);

      // Reset form and close modal
      setFormData({ name: "", type: "paper_trading", description: "" });
      onOpenChange(false);
    } catch (error: any) {
      if (error.errors) {
        const formErrors: Partial<Record<keyof CreateSectorFormData, string>> = {};
        error.errors.forEach((err: any) => {
          if (err.path?.[0]) {
            formErrors[err.path[0] as keyof CreateSectorFormData] = err.message;
          }
        });
        setErrors(formErrors);
      }
    }
  };

  const handleInputChange = (field: keyof CreateSectorFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleCancel = () => {
    setFormData({ name: "", type: "paper_trading", description: "" });
    setErrors({});
    onOpenChange(false);
  };

  const handleTypeSelect = (type: SectorType) => {
    handleInputChange("type", type);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] overflow-hidden">
        {/* Decorative background gradient */}
        <div className="absolute inset-0 -z-10 opacity-50">
          <div className="absolute top-0 right-0 size-[300px] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 size-[300px] rounded-full bg-accent/20 blur-3xl" />
        </div>

        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl">Create New Sector</DialogTitle>
          <DialogDescription className="text-base">
            Configure a new trading environment for your AI agent. Choose a sector type based on
            your risk tolerance and trading goals.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-5">
            {/* Sector Name Input */}
            <div className="space-y-2.5">
              <Label htmlFor="name" className="text-sm font-medium">
                Sector Name
              </Label>
              <Input
                id="name"
                placeholder="e.g., Conservative DeFi Portfolio"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                aria-invalid={!!errors.name}
                className={cn(
                  "h-11 transition-all duration-200",
                  errors.name && "border-destructive focus-visible:ring-destructive/20"
                )}
              />
              {errors.name && (
                <p className="text-sm text-destructive flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Sector Type Selection */}
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Sector Type</Label>
                <p className="text-xs text-muted-foreground">
                  Select the risk level and trading mode for this sector
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {sectorTypes.map((sector) => {
                  const Icon = sector.icon;
                  const isSelected = formData.type === sector.type;

                  return (
                    <button
                      key={sector.type}
                      type="button"
                      onClick={() => handleTypeSelect(sector.type)}
                      className={cn(
                        "group relative flex items-start gap-4 rounded-lg border-2 p-4 text-left transition-all duration-200",
                        sector.borderColor,
                        isSelected
                          ? cn(
                              "bg-card shadow-lg ring-2",
                              sector.ringColor,
                              "border-transparent"
                            )
                          : "bg-card/50 hover:bg-card hover:shadow-md"
                      )}
                    >
                      {/* Icon Container */}
                      <div
                        className={cn(
                          "flex size-12 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
                          sector.bgColor,
                          isSelected && "shadow-sm"
                        )}
                      >
                        <Icon className={cn("size-6", sector.color)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-1.5 pt-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-base">{sector.label}</h4>
                          {isSelected && (
                            <CheckCircle2
                              className={cn("size-4 animate-in zoom-in", sector.color)}
                            />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {sector.description}
                        </p>
                      </div>

                      {/* Selection indicator */}
                      <div
                        className={cn(
                          "absolute inset-0 rounded-lg transition-opacity duration-200",
                          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-50",
                          sector.bgColor
                        )}
                        style={{ zIndex: -1 }}
                      />
                    </button>
                  );
                })}
              </div>
              {errors.type && (
                <p className="text-sm text-destructive flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                  {errors.type}
                </p>
              )}
            </div>

            {/* Description Input */}
            <div className="space-y-2.5">
              <div className="space-y-1">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                  <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                    (Optional)
                  </span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Add notes about this sector&apos;s purpose or strategy
                </p>
              </div>
              <Textarea
                id="description"
                placeholder="e.g., Focus on stable DeFi protocols with low volatility..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={3}
                aria-invalid={!!errors.description}
                className={cn(
                  "resize-none transition-all duration-200",
                  errors.description && "border-destructive focus-visible:ring-destructive/20"
                )}
              />
              {errors.description && (
                <p className="text-sm text-destructive flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                  {errors.description}
                </p>
              )}
            </div>
          </div>

          {/* Footer with Actions */}
          <DialogFooter className="gap-2 sm:gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={createSectorMutation.isPending}
              className="sm:flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createSectorMutation.isPending || !formData.name.trim()}
              className="sm:flex-1 transition-all duration-200"
            >
              {createSectorMutation.isPending ? (
                <>
                  <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Sector"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { SectorCreateModal };
