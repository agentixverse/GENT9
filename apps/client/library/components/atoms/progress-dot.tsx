interface ProgressDotProps {
  isActive: boolean;
  isPast: boolean;
}

export function ProgressDot({ isActive, isPast }: ProgressDotProps) {
  return (
    <div
      className={`h-1.5 rounded-full transition-all ${
        isActive
          ? "w-8 bg-foreground"
          : isPast
          ? "w-6 bg-foreground/60"
          : "w-6 bg-muted"
      }`}
    />
  );
}
