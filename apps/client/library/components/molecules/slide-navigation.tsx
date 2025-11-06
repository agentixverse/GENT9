import { Button } from "@/library/components/atoms/button";
import { ArrowLeft } from "lucide-react";

interface SlideNavigationProps {
  onBack: () => void;
  onNext: () => void;
  backLabel?: string;
  nextLabel?: string;
  disabled?: boolean;
}

export function SlideNavigation({
  onBack,
  onNext,
  backLabel = "Back",
  nextLabel = "Continue",
  disabled = false,
}: SlideNavigationProps) {
  return (
    <div className="w-full flex items-center justify-between">
      <Button variant="ghost" onClick={onBack} className="gap-2 w-32">
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Button>

      <Button onClick={onNext} className="w-48" disabled={disabled}>
        {nextLabel}
      </Button>
    </div>
  );
}
