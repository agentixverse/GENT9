"use client";

import { Plus, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useDebounceValue, useOnClickOutside } from "usehooks-ts";

import { useAuth } from "@/library/api/hooks/use-auth";
import { useCreateOrb } from "@/library/api/hooks/use-orbs";
import { useCreateSectorPolicy } from "@/library/api/hooks/use-policy";
import { useCreateSector } from "@/library/api/hooks/use-sectors";
import { useNetworkThreads } from "@/library/api/hooks/use-thread-registry";
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
import { Textarea } from "@/library/components/atoms/textarea";
import { ConfettiCelebration } from "@/library/components/molecules/confetti-celebration";
import { CTACards } from "@/library/components/molecules/cta-cards";
import { ProcessAnimation } from "@/library/components/molecules/process-animation";
import { SlideHeader } from "@/library/components/molecules/slide-header";
import { SlideNavigation } from "@/library/components/molecules/slide-navigation";
import { TradespaceDiagram } from "@/library/components/molecules/tradespace-diagram";
import { CHAIN_ASSETS } from "@/library/constants/chain-assets";
import { STRATEGY_TYPES } from "@/library/constants/strategies";
import type { StrategyType } from "@/library/store/onboarding-store";
import { useOnboardingStore } from "@/library/store/onboarding-store";

interface Slide {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  content: React.ReactNode;
  showProgress?: boolean;
  hideNavigation?: boolean;
}

// Define total slides for progress calculation
const TOTAL_PROGRESS_SLIDES = 8; // Only slides with progress bars

// Slide 6: Sector Name + Policy Component
function SectorPolicySlide({
  onValidationChange,
}: {
  onValidationChange: (isValid: boolean) => void;
}) {
  const setSectorName = useOnboardingStore((state) => state.setSectorName);
  const setPolicyText = useOnboardingStore((state) => state.setPolicyText);
  const storedSectorName = useOnboardingStore((state) => state.sectorName);
  const storedPolicyText = useOnboardingStore((state) => state.policyText);

  const [localSectorName, setLocalSectorName] = useState(storedSectorName);
  const [localPolicyText, setLocalPolicyText] = useState(storedPolicyText);

  const [debouncedSectorName] = useDebounceValue(localSectorName, 300);
  const [debouncedPolicyText] = useDebounceValue(localPolicyText, 300);

  // Save to store when debounced values change
  useEffect(() => {
    setSectorName(debouncedSectorName);
  }, [debouncedSectorName, setSectorName]);

  useEffect(() => {
    setPolicyText(debouncedPolicyText);
  }, [debouncedPolicyText, setPolicyText]);

  // Validation
  const isSectorNameValid =
    typeof localSectorName === "string" && localSectorName.trim().length >= 3;
  const isPolicyValid =
    typeof localPolicyText === "string" &&
    localPolicyText.trim().length >= 50 &&
    localPolicyText.trim().length <= 2000;
  const isValid = isSectorNameValid && isPolicyValid;

  useEffect(() => {
    onValidationChange(isValid);
  }, [isValid, onValidationChange]);

  const charCount = typeof localPolicyText === "string" ? localPolicyText.length : 0;
  const maxChars = 2000;
  const minChars = 50;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 px-4">
      {/* Sector Name */}
      <div className="space-y-3">
        <Label htmlFor="sector-name" className="text-base md:text-lg font-medium">
          Sector Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="sector-name"
          type="text"
          placeholder='e.g., "Main Portfolio" or "Experimental Fund"'
          value={localSectorName || ""}
          onChange={(e) => setLocalSectorName(e.target.value)}
          className="h-11 text-base"
          aria-invalid={
            typeof localSectorName === "string" &&
            localSectorName.length > 0 &&
            !isSectorNameValid
          }
        />
        {typeof localSectorName === "string" &&
          localSectorName.length > 0 &&
          !isSectorNameValid && (
            <p className="text-sm text-destructive">
              Sector name must be at least 3 characters
            </p>
          )}
      </div>

      {/* Policy Text */}
      <div className="space-y-3">
        <div>
          <Label htmlFor="policy-text" className="text-base md:text-lg font-medium">
            Sector Policy <span className="text-destructive">*</span>
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            Define the ideals and goals for your trading agents in this sector
          </p>
        </div>
        <Textarea
          id="policy-text"
          placeholder="Example: Focus on conservative long-term growth with DeFi blue chips. Prioritize capital preservation over aggressive gains. Never exceed 5% position size. Take profits at 20% gains..."
          value={localPolicyText || ""}
          onChange={(e) => setLocalPolicyText(e.target.value)}
          className="min-h-[200px] text-base resize-none"
          aria-invalid={
            typeof localPolicyText === "string" &&
            localPolicyText.length > 0 &&
            !isPolicyValid
          }
        />
        <div className="flex justify-between text-sm">
          <span
            className={charCount < minChars ? "text-destructive" : "text-muted-foreground"}
          >
            {charCount < minChars
              ? `${minChars - charCount} more characters needed`
              : "✓ Minimum met"}
          </span>
          <span
            className={charCount > maxChars ? "text-destructive" : "text-muted-foreground"}
          >
            {charCount}/{maxChars}
          </span>
        </div>
      </div>
    </div>
  );
}

// Helper to check if orb is completely empty (untouched)
const isOrbEmpty = (orb: any) =>
  (!orb.name || orb.name.trim() === "") &&
  orb.network_thread_registry_id === null &&
  orb.assets.length === 0 &&
  orb.strategyType === null;

// Helper to check if orb is complete (all required fields filled)
const isOrbComplete = (orb: any) =>
  typeof orb.name === "string" &&
  orb.name.trim().length >= 3 &&
  orb.network_thread_registry_id !== null &&
  Array.isArray(orb.assets) &&
  orb.assets.length > 0 &&
  orb.strategyType !== null;

// Individual Orb Card Component
function OrbCard({
  orb,
  index,
  onUpdate,
  onRemove,
  onMarkTouched,
  onClearTouched,
  isTouched,
}: {
  orb: any;
  index: number;
  onUpdate: (orbId: string, updates: any) => void;
  onRemove: (orbId: string) => void;
  onMarkTouched: (orbId: string) => void;
  onClearTouched: (orbId: string) => void;
  isTouched: boolean;
}) {
  const orbCardRef = useRef<HTMLDivElement>(null);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const isFirstOrb = index === 0;
  const { data: networkThreads } = useNetworkThreads();
  const availableAssets = orb.selectedChain ? CHAIN_ASSETS[orb.selectedChain as keyof typeof CHAIN_ASSETS] || [] : [];
  const orbIsEmpty = isOrbEmpty(orb);
  const orbIsComplete = isOrbComplete(orb);
  const orbIsPartial = !orbIsEmpty && !orbIsComplete;

  // Mark orb as touched when user clicks/taps outside (but not when Select is open)
  useOnClickOutside(orbCardRef, () => {
    if (orbIsPartial && !isSelectOpen) {
      onMarkTouched(orb.id);
    }
  });

  // Auto-clear touched state when orb becomes complete
  useEffect(() => {
    if (orbIsComplete && isTouched) {
      onClearTouched(orb.id);
    }
  }, [orbIsComplete, isTouched, orb.id, onClearTouched]);

  // Determine which fields are missing for partially filled orbs
  const missingFields: string[] = [];
  if (orbIsPartial) {
    if (!orb.name || orb.name.trim().length === 0) {
      missingFields.push("Name");
    } else if (orb.name.trim().length < 3) {
      missingFields.push("Name (minimum 3 characters)");
    }
    if (!orb.network_thread_registry_id) missingFields.push("Network");
    if (!orb.assets || orb.assets.length === 0) missingFields.push("Assets");
    if (!orb.strategyType) missingFields.push("Strategy");
  }

  const handleAssetToggle = (asset: string) => {
    const newAssets = orb.assets.includes(asset)
      ? orb.assets.filter((a: string) => a !== asset)
      : [...orb.assets, asset];
    onUpdate(orb.id, { assets: newAssets });
  };

  return (
    <div
      ref={orbCardRef}
      className={`border rounded-lg p-4 md:p-6 space-y-4 bg-card relative ${
        orbIsPartial && isTouched ? "border-destructive" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Orb {index + 1}
          {isFirstOrb && <span className="text-destructive ml-1">*</span>}
          {!isFirstOrb && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              Optional
            </span>
          )}
        </h3>
        {!isFirstOrb && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(orb.id)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Validation Warning for Partially Filled Orbs - Only show if touched */}
      {orbIsPartial && isTouched && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 text-sm">
          <p className="text-destructive font-medium">
            Incomplete orb - Please complete all fields or remove this orb
          </p>
          <p className="text-muted-foreground mt-1">
            Missing: {missingFields.join(", ")}
          </p>
        </div>
      )}

      {/* Orb Name */}
      <div className="space-y-2">
        <Label htmlFor={`orb-name-${orb.id}`}>
          Name {isFirstOrb && <span className="text-destructive">*</span>}
        </Label>
        <Input
          id={`orb-name-${orb.id}`}
          type="text"
          placeholder="e.g., Ethereum DeFi"
          value={orb.name || ""}
          onChange={(e) => onUpdate(orb.id, { name: e.target.value })}
          className="h-10"
        />
      </div>

      {/* Network Selection */}
      <div className="space-y-2">
        <Label htmlFor={`orb-network-${orb.id}`}>
          Network {isFirstOrb && <span className="text-destructive">*</span>}
        </Label>
        <Select
          value={orb.network_thread_registry_id || ""}
          onOpenChange={setIsSelectOpen}
          onValueChange={(value) => {
            const selectedThread = networkThreads?.find((t) => t.id === value);
            const chain = selectedThread?.supported_networks[0] || null;
            onUpdate(orb.id, {
              network_thread_registry_id: value,
              selectedChain: chain,
              assets: [], // Reset assets when network changes
            });
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select network" />
          </SelectTrigger>
          <SelectContent>
            {networkThreads?.map((thread) => (
              <SelectItem key={thread.id} value={thread.id}>
                {thread.name} ({thread.supported_networks.join(", ")})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Asset Selection */}
      {orb.selectedChain && (
        <div className="space-y-2">
          <Label>
            Assets {isFirstOrb && <span className="text-destructive">*</span>}
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {availableAssets.map((asset) => (
              <button
                key={asset.symbol}
                type="button"
                onClick={() => handleAssetToggle(asset.symbol)}
                className={`
                  px-3 py-2 rounded-md border text-sm font-medium transition-colors
                  ${
                    orb.assets.includes(asset.symbol)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-accent border-input"
                  }
                `}
              >
                {asset.symbol}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Strategy Selection */}
      <div className="space-y-2">
        <Label htmlFor={`orb-strategy-${orb.id}`}>
          Strategy Type {isFirstOrb && <span className="text-destructive">*</span>}
        </Label>
        <Select
          value={orb.strategyType || ""}
          onOpenChange={setIsSelectOpen}
          onValueChange={(value) =>
            onUpdate(orb.id, { strategyType: value as StrategyType })
          }
        >
          <SelectTrigger size="fit" className="w-full h-fit">
            <SelectValue placeholder="Select strategy" />
          </SelectTrigger>
          <SelectContent>
            {STRATEGY_TYPES.map((strategy) => (
              <SelectItem key={strategy.value} value={strategy.value}>
                <div className="flex flex-col items-start space-x-2">
                  <div className="font-medium">{strategy.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {strategy.description}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// Slide 7: Multiple Orbs Component
function MultiOrbsSlide({
  onValidationChange,
}: {
  onValidationChange: (isValid: boolean) => void;
}) {
  const { orbs, addOrb, updateOrb, removeOrb } = useOnboardingStore();
  const [touchedOrbs, setTouchedOrbs] = useState<Set<string>>(new Set());

  // Validation - at least one complete orb, and no partially-filled orbs
  const isValid =
    orbs.length > 0 &&
    orbs.some(isOrbComplete) &&
    orbs.every((orb) => isOrbComplete(orb) || isOrbEmpty(orb));

  useEffect(() => {
    onValidationChange(isValid);
  }, [isValid, onValidationChange]);

  const handleMarkTouched = (orbId: string) => {
    setTouchedOrbs((prev) => new Set(prev).add(orbId));
  };

  const handleClearTouched = (orbId: string) => {
    setTouchedOrbs((prev) => {
      const newSet = new Set(prev);
      newSet.delete(orbId);
      return newSet;
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 px-4">
      {orbs.map((orb, index) => (
        <OrbCard
          key={orb.id}
          orb={orb}
          index={index}
          onUpdate={updateOrb}
          onRemove={removeOrb}
          onMarkTouched={handleMarkTouched}
          onClearTouched={handleClearTouched}
          isTouched={touchedOrbs.has(orb.id)}
        />
      ))}

      {/* Add Orb Button */}
      <Button variant="outline" onClick={addOrb} className="w-full h-12 border-dashed">
        <Plus className="h-4 w-4 mr-2" />
        Add Another Orb
      </Button>
    </div>
  );
}

// Success Celebration Slide Component
function SuccessSlide() {
  const { sectorName, orbs } = useOnboardingStore();

  // Only count complete orbs (not empty ones)
  const completeOrbCount = useMemo(() => {
    return orbs.filter(isOrbComplete).length;
  }, [orbs]);

  return (
    <div className="flex flex-col items-center gap-8">
      <ConfettiCelebration />

      <p className="text-3xl md:text-4xl max-w-[35rem] font-semibold text-center">
        Congratulations You've Built Your First Tradespace!
      </p>

      {/* Summary */}
      <div className="max-w-md mx-auto space-y-4">
        <div className="space-y-2 text-left bg-card border rounded-lg p-6">
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>
              Your <span className="font-semibold">{sectorName || "trading sector"}</span>{" "}
              with policy
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>
              <span className="font-semibold">{completeOrbCount}</span> orb
              {completeOrbCount !== 1 ? "s" : ""} with strategies
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Your simulated trading environment</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Profile Creation Slide Component
function ProfileCreationSlide({ onSuccess }: { onSuccess: () => void }) {
  const { registerAsync, isRegisterLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password || formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await registerAsync({
        email: formData.email,
        password: formData.password,
      });

      // Call the success handler to create tradespace
      onSuccess();
    } catch (error) {
      // Error is handled by the useAuth hook with toast
      console.error("Registration failed:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-6">
      {/* Email input */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={(e) => {
            setFormData({ ...formData, email: e.target.value });
            if (errors.email) setErrors({ ...errors, email: "" });
          }}
          className="h-11"
          aria-invalid={!!errors.email}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
      </div>

      {/* Password input */}
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Create a password"
          value={formData.password}
          onChange={(e) => {
            setFormData({ ...formData, password: e.target.value });
            if (errors.password) setErrors({ ...errors, password: "" });
          }}
          className="h-11"
          aria-invalid={!!errors.password}
        />
        {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
      </div>

      {/* Confirm Password input */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={(e) => {
            setFormData({ ...formData, confirmPassword: e.target.value });
            if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" });
          }}
          className="h-11"
          aria-invalid={!!errors.confirmPassword}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword}</p>
        )}
      </div>

      {/* Submit button */}
      <Button type="submit" className="w-full h-12" disabled={isRegisterLoading}>
        {isRegisterLoading ? "Setting up your tradespace..." : "Launch My Tradespace"}
      </Button>

      {/* Sign in link */}
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

const buildSlides = (handlers: {
  onGoBack: () => void;
  onCreateSector: () => void;
  onSectorValidationChange: (isValid: boolean) => void;
  onOrbValidationChange: (isValid: boolean) => void;
  onRegistrationSuccess: () => void;
}): Slide[] => [
  {
    title: (
      <p className="text-3xl md:text-4xl">
        Trading Failures Are Fundamentally{" "}
        <span className="font-semibold">Process Problems</span>
      </p>
    ),
    content: <ProcessAnimation />,
    showProgress: true,
  },
  {
    title: (
      <p className="text-3xl md:text-4xl">
        Winning Trades <span className="italic font-medium">need</span> Strategies within
        Structured Tradespace.{" "}
        <span className="font-semibold">Agentix Makes it Possible</span>
      </p>
    ),
    content: <TradespaceDiagram />,
    showProgress: true,
  },
  {
    title: (
      <p className="text-3xl md:text-4xl">
        <span className="italic font-semibold">Sectors</span> are mission control centers
        with prime directives.
      </p>
    ),
    content: (
      <div className="mt-12 max-w-2xl mx-auto text-left">
        <p className="text-lg leading-relaxed">
          Each sector has a Policy that guides all agents operating within it. Think of it
          like a trading desk with a specific mandate - conservative growth, aggressive
          alpha, etc.
        </p>
      </div>
    ),
    showProgress: true,
  },
  {
    title: (
      <p className="text-3xl md:text-4xl">
        <span className="italic font-semibold">Orbs</span> are agentic separate trading
        accounts or portfolios.
      </p>
    ),
    content: (
      <div className="mt-12 max-w-2xl mx-auto text-left">
        <p className="text-lg leading-relaxed">
          Each orb holds assets and runs strategies independently. You might have one orb
          for safe DeFi farming and another for risky meme coins. Agents manage each orb
          24/7 according to the strategies you assign.
        </p>
      </div>
    ),
    showProgress: true,
  },
  {
    title: (
      <p className="text-3xl md:text-4xl">
        <span className="italic font-semibold">Threads</span> are connectors to where your
        trades happen
      </p>
    ),
    content: (
      <div className="mt-12 max-w-2xl mx-auto text-left">
        <p className="text-lg leading-relaxed">
          Threads are plugins that orbs use for trading. Install Network threads for
          live/paper modes, DEX threads for exchanges, Bridge threads for cross-chain, plus
          countless others from the Thread Store or build your own.
        </p>
      </div>
    ),
    showProgress: true,
  },
  {
    content: (
      <CTACards onGoBack={handlers.onGoBack} onCreateSector={handlers.onCreateSector} />
    ),
    showProgress: false,
    hideNavigation: true,
  },
  {
    title: (
      <p className="text-3xl md:text-4xl">
        Create Your <span className="italic font-semibold">Trading Sector</span>
      </p>
    ),
    content: <SectorPolicySlide onValidationChange={handlers.onSectorValidationChange} />,
    showProgress: true,
  },
  {
    title: (
      <p className="text-3xl md:text-4xl">
        Set Up Your <span className="italic font-semibold">Orbs</span>
      </p>
    ),
    content: <MultiOrbsSlide onValidationChange={handlers.onOrbValidationChange} />,
    showProgress: true,
  },
  {
    content: <SuccessSlide />,
    showProgress: false,
  },
  {
    title: (
      <p className="text-3xl md:text-4xl">
        Don't Lose Your Tradespace! <span className="font-semibold">Create a Profile</span>
      </p>
    ),
    content: <ProfileCreationSlide onSuccess={handlers.onRegistrationSuccess} />,
    showProgress: true,
    hideNavigation: true,
  },
];

interface OnboardingSlidesProps {
  onComplete: () => void;
  onBack: () => void;
}

export function OnboardingSlides({ onComplete, onBack }: OnboardingSlidesProps) {
  const router = useRouter();
  const {
    currentSlide: storedSlide,
    setCurrentSlide: setStoredSlide,
    resetOnboarding,
  } = useOnboardingStore();

  const [currentSlide, setCurrentSlide] = useState(storedSlide);
  const [isSectorValid, setIsSectorValid] = useState(false);
  const [isOrbValid, setIsOrbValid] = useState(false);

  // API mutation hooks
  const createSectorMutation = useCreateSector();
  const createPolicyMutation = useCreateSectorPolicy();
  const createOrbMutation = useCreateOrb();

  // Save current slide to store whenever it changes
  useEffect(() => {
    setStoredSlide(currentSlide);
  }, [currentSlide, setStoredSlide]);

  const handleNext = () => {
    // Validate before allowing navigation for slides 6 and 7
    if (currentSlide === 6 && !isSectorValid) {
      return; // Block navigation if sector form is invalid
    }
    if (currentSlide === 7 && !isOrbValid) {
      return; // Block navigation if orb form is invalid
    }

    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleBackClick = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    } else {
      // Restart slides from beginning
      setCurrentSlide(0);
    }
  };

  const handleRestartSlides = () => {
    setCurrentSlide(0);
  };

  const handleCreateSector = () => {
    setCurrentSlide(6); // Jump to sector form slide
  };

  const handleRegistrationSuccess = async () => {
    const { sectorName, policyText, orbs } = useOnboardingStore.getState();

    try {
      // 1. Create sector
      const sector = await createSectorMutation.mutateAsync({
        name: sectorName,
        type: "paper_trading",
        settings: {},
      });

      // 2. Create policy for sector (if policy text exists)
      if (policyText && policyText.trim()) {
        await createPolicyMutation.mutateAsync({
          sectorId: sector.id,
          policyDocument: {
            text: policyText,
          },
        });
      }

      // 3. Create all complete orbs (skip empty orbs)
      for (const orb of orbs) {
        // Only create orbs with all required fields (filters out empty and partial orbs)
        if (
          orb.name &&
          orb.name.trim().length >= 3 &&
          orb.network_thread_registry_id &&
          orb.assets.length > 0 &&
          orb.strategyType
        ) {
          // Convert assets array to asset_pairs object
          const assetPairs: Record<string, number> = {};
          orb.assets.forEach((asset) => {
            const pairKey = `${asset}/USDC`;
            assetPairs[pairKey] = 100 / orb.assets.length; // Equal weight distribution
          });

          await createOrbMutation.mutateAsync({
            sectorId: sector.id,
            name: orb.name,
            network_thread_registry_id: orb.network_thread_registry_id!,
            asset_pairs: assetPairs,
            config_json: {
              strategy: orb.strategyType,
            },
          });
        }
      }

      // 4. Clear onboarding store
      resetOnboarding();

      // 5. Navigate to dashboard
      router.push("/dashboard");
      toast.success("Welcome to Agentix! Your tradespace is ready.");
    } catch (error) {
      console.error("Failed to create tradespace:", error);
      toast.error("Failed to create tradespace. Please try again.");
    }
  };

  const slides = buildSlides({
    onGoBack: handleRestartSlides,
    onCreateSector: handleCreateSector,
    onSectorValidationChange: setIsSectorValid,
    onOrbValidationChange: setIsOrbValid,
    onRegistrationSuccess: handleRegistrationSuccess,
  });

  // Reset to beginning if user previously completed onboarding
  useEffect(() => {
    if (storedSlide >= slides.length - 1) {
      setStoredSlide(0);
      setCurrentSlide(0);
    }
  }, []); // Only on mount

  const slide = slides[currentSlide];

  // Calculate progress slide index (only count slides with showProgress: true)
  const progressSlideIndex =
    slides.slice(0, currentSlide + 1).filter((s) => s.showProgress).length - 1;

  return (
    <div className="h-full flex flex-col">
      {/* Header section - fixed at top */}
      {slide.showProgress !== false && slide.title && (
        <div className="flex-shrink-0 px-4 pt-6">
          <div className="w-full max-w-5xl mx-auto">
            <SlideHeader
              title={slide.title}
              subtitle={slide.subtitle}
              currentSlide={progressSlideIndex}
              totalSlides={TOTAL_PROGRESS_SLIDES}
            />
          </div>
        </div>
      )}

      {/* Content area */}
      <div className={`flex-1 px-4 min-h-0 ${currentSlide === 6 || currentSlide === 7 ? 'overflow-y-auto' : 'overflow-hidden'}`}>
        <div className={`w-full max-w-5xl mx-auto ${currentSlide === 0 || currentSlide === 1 ? 'h-full' : 'py-8'}`}>
          {slide.content}
        </div>
      </div>

      {/* Sticky navigation at bottom */}
      {!slide.hideNavigation && (
        <div className="sticky bottom-0 border-t bg-background px-4 py-4">
          <div className="w-full max-w-5xl mx-auto">
            <SlideNavigation
              onBack={handleBackClick}
              onNext={handleNext}
              backLabel="Back"
              nextLabel={currentSlide === 8 ? "Finish" : "Continue"}
              disabled={
                (currentSlide === 6 && !isSectorValid) ||
                (currentSlide === 7 && !isOrbValid)
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
