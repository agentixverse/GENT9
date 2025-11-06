"use client";

import { Button } from "@/library/components/atoms/button";
import { WelcomeHero } from "@/library/components/molecules/welcome-hero";

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export function WelcomeScreen({ onGetStarted, onLogin }: WelcomeScreenProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-4 gap-20">
      <WelcomeHero />

      {/* Action Buttons */}
      <div className="w-full max-w-md mx-auto space-y-3">
        <Button
          className="w-full h-12"
          onClick={onGetStarted}
        >
          Get Started
        </Button>
        <Button
          variant="outline"
          className="w-full h-12"
          onClick={onLogin}
        >
          I Already Have An Account
        </Button>
      </div>
    </div>
  );
}
