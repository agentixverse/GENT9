import { RotateCcw, Zap } from "lucide-react";

interface CTACardsProps {
  onGoBack: () => void;
  onCreateSector: () => void;
}

export function CTACards({ onGoBack, onCreateSector }: CTACardsProps) {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <h2 className="text-2xl md:text-3xl font-semibold text-center">
        Ready to Build Your Tradespace?
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Review Concepts Card */}
        <button
          onClick={onGoBack}
          className="group flex flex-col items-center text-center p-8 border rounded-lg bg-card transition-colors hover:bg-accent"
        >
          <RotateCcw className="w-12 h-12 mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Review Concepts</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Take another look at how sectors, orbs, and threads work before continuing
          </p>
        </button>

        {/* Create Sector Card */}
        <button
          onClick={onCreateSector}
          className="group flex flex-col items-center text-center p-8 border rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Zap className="w-12 h-12 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Create Your Sector</h3>
          <p className="text-sm opacity-90 leading-relaxed">
            Set up your first simulated trading sector with paper trading - no real funds at risk
          </p>
        </button>
      </div>
    </div>
  );
}
