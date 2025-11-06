"use client";

import { useAuth } from "@/library/api/hooks/use-auth";
import { OnboardingSlides } from "@/library/components/organisms/onboarding-slides";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function OnboardingPage() {
  const { isAuthenticated, isLoading, register, isRegisterLoading } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleSlidesComplete = () => {};

  const handleBackToWelcome = () => {
    router.push("/");
  };

  return (
    <OnboardingSlides onComplete={handleSlidesComplete} onBack={handleBackToWelcome} />
  );
}
