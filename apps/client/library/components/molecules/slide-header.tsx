import { ProgressDot } from "@/library/components/atoms/progress-dot";

interface SlideHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  currentSlide: number;
  totalSlides: number;
}

export function SlideHeader({
  title,
  subtitle,
  currentSlide,
  totalSlides,
}: SlideHeaderProps) {
  return (
    <div className="space-y-8">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: totalSlides }).map((_, idx) => (
          <ProgressDot
            key={idx}
            isActive={idx === currentSlide}
            isPast={idx < currentSlide}
          />
        ))}
      </div>

      {/* Title and Subtitle */}
      <div className="text-center max-w-[35rem] mx-auto">
        {title}
        {subtitle && subtitle}
      </div>
    </div>
  );
}
