"use client";

import { useState, useEffect, useRef, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TRADESPACE_DEMO_DATA, type DemoThread } from "@/library/constants/tradespace-demo";
import { useArrowPositions } from "@/library/hooks/use-arrow-positions";
import { Popover, PopoverTrigger, PopoverContent } from "@/library/components/atoms/popover";

const ROTATION_INTERVAL = 10000; // 10 seconds

const THREAD_TYPE_COLORS = {
  DEX: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Bridge: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Lending: "bg-green-500/20 text-green-400 border-green-500/30",
  Yield: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Network: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

interface DiagramBoxProps {
  content: string;
  options?: string[];
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onImmediateLeave?: () => void;
  onSelect?: (index: number) => void;
  pill?: {
    label: string;
    color: string;
  };
  className?: string;
  currentIndex?: number;
  behavior?: "bloom" | "scroll" | "static";
}

const DiagramBox = forwardRef<HTMLDivElement, DiagramBoxProps>(
  function DiagramBox(
    {
      content,
      options,
      isHovered,
      onHover,
      onLeave,
      onImmediateLeave,
      onSelect,
      pill,
      className = "",
      currentIndex = 0,
      behavior = "bloom",
    },
    ref
  ) {
    // Find the current selection index
    const selectedIndex = options?.indexOf(content) ?? 0;

    // Get ALL other options (excluding current selection)
    const otherOptions = options?.filter((_, idx) => idx !== selectedIndex) ?? [];

    // Map to fixed containers: top gets first other, bottom gets second other (if exists)
    const topOption = otherOptions.length > 0 ? otherOptions[0] : null;
    const topOptionIndex = topOption && options ? options.indexOf(topOption) : -1;
    const bottomOption = otherOptions.length > 1 ? otherOptions[1] : null;
    const bottomOptionIndex = bottomOption && options ? options.indexOf(bottomOption) : -1;

    // Static behavior - no interaction
    if (behavior === "static") {
      return (
        <div
          ref={ref}
          className={`bg-muted/70 border border-border rounded px-4 py-6 text-center ${className}`}
        >
          <p className="font-semibold text-sm">{content}</p>
        </div>
      );
    }

    // Scroll behavior - continuous auto-scrolling
    if (behavior === "scroll") {
      return (
        <div
          ref={ref}
          className={`bg-muted/70 border border-border rounded px-4 py-6 text-center overflow-hidden relative ${className}`}
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={content}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="font-semibold text-sm"
            >
              {content}
            </motion.p>
          </AnimatePresence>
        </div>
      );
    }

    // Bloom behavior - show popover with fixed containers
    return (
      <Popover open={isHovered && options && options.length > 1}>
        <PopoverTrigger asChild>
          <div
            ref={ref}
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
            className={`relative bg-muted/70 border border-border rounded px-4 py-6 text-center transition-all duration-300 cursor-pointer ${
              isHovered && options ? "ring-2 ring-primary/50" : ""
            } ${className}`}
          >
            {pill && (
              <div className="absolute top-1.5 right-1.5 scale-90 origin-top-right">
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full border ${pill.color}`}
                >
                  {pill.label}
                </span>
              </div>
            )}
            <p className="font-semibold text-sm">
              {content}
            </p>
          </div>
        </PopoverTrigger>

        {/* Fixed TOP container */}
        <PopoverContent
          side="top"
          sideOffset={8}
          className="w-auto p-0 bg-transparent border-0 shadow-none"
          onMouseEnter={onHover}
          onMouseLeave={onLeave}
        >
          <AnimatePresence mode="wait">
            {topOption && topOptionIndex >= 0 && (
              <motion.button
                key={topOption}
                initial={{ scale: 0.85, opacity: 0, y: 10 }}
                animate={{ scale: 0.9, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0, y: 10 }}
                transition={{
                  duration: 0.2,
                  ease: "easeInOut"
                }}
                onClick={() => {
                  onImmediateLeave?.();
                  setTimeout(() => onSelect?.(topOptionIndex), 150);
                }}
                className={`relative bg-muted/70 border border-border rounded px-4 py-6 text-center hover:bg-muted opacity-80 ${className}`}
              >
                <p className="font-semibold text-sm whitespace-nowrap">
                  {topOption}
                </p>
              </motion.button>
            )}
          </AnimatePresence>
        </PopoverContent>

        {/* Fixed BOTTOM container */}
        <PopoverContent
          side="bottom"
          sideOffset={8}
          className="w-auto p-0 bg-transparent border-0 shadow-none"
          onMouseEnter={onHover}
          onMouseLeave={onLeave}
        >
          <AnimatePresence mode="wait">
            {bottomOption && bottomOptionIndex >= 0 && (
              <motion.button
                key={bottomOption}
                initial={{ scale: 0.85, opacity: 0, y: -10 }}
                animate={{ scale: 0.9, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0, y: -10 }}
                transition={{
                  duration: 0.2,
                  ease: "easeInOut"
                }}
                onClick={() => {
                  onImmediateLeave?.();
                  setTimeout(() => onSelect?.(bottomOptionIndex), 150);
                }}
                className={`relative bg-muted/70 border border-border rounded px-4 py-6 text-center hover:bg-muted opacity-80 ${className}`}
              >
                <p className="font-semibold text-sm whitespace-nowrap">
                  {bottomOption}
                </p>
              </motion.button>
            )}
          </AnimatePresence>
        </PopoverContent>
      </Popover>
    );
  }
);

function useDelayedHover(delay = 200) {
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const onHover = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const onLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, delay);
  };

  const immediateLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsHovered(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { isHovered, onHover, onLeave, immediateLeave };
}

export function TradespaceDiagram() {
  const [currentSectorIndex, setCurrentSectorIndex] = useState(0);
  const [currentOrbIndex, setCurrentOrbIndex] = useState(0);
  const [currentAssetIndex, setCurrentAssetIndex] = useState(0);
  const [currentThreadIndex, setCurrentThreadIndex] = useState(0);

  const { isHovered: hoverSector, onHover: onSectorHover, onLeave: onSectorLeave, immediateLeave: onSectorImmediateLeave } = useDelayedHover();
  const { isHovered: hoverOrb, onHover: onOrbHover, onLeave: onOrbLeave, immediateLeave: onOrbImmediateLeave } = useDelayedHover();
  const { isHovered: hoverAssets, onHover: onAssetsHover, onLeave: onAssetsLeave, immediateLeave: onAssetsImmediateLeave } = useDelayedHover();
  const { isHovered: hoverThread, onHover: onThreadHover, onLeave: onThreadLeave, immediateLeave: onThreadImmediateLeave } = useDelayedHover();

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isHovered = hoverSector || hoverOrb || hoverAssets || hoverThread;

  // Refs for arrow positioning
  const containerRef = useRef<HTMLDivElement>(null);
  const tradespaceRef = useRef<HTMLDivElement>(null);
  const sectorRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const assetsRef = useRef<HTMLDivElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  // Get dynamic arrow positions
  const { paths, isReady } = useArrowPositions({
    container: containerRef,
    tradespace: tradespaceRef,
    sector: sectorRef,
    orb: orbRef,
    assets: assetsRef,
    thread: threadRef,
  });

  // Auto-rotation logic
  useEffect(() => {
    if (isHovered) {
      // Pause rotation when hovering
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Start/resume rotation
    timerRef.current = setInterval(() => {
      setCurrentSectorIndex((prev) => {
        const next = (prev + 1) % TRADESPACE_DEMO_DATA.length;
        // Reset child indices when sector changes
        setCurrentOrbIndex(0);
        setCurrentAssetIndex(0);
        setCurrentThreadIndex(0);
        return next;
      });
    }, ROTATION_INTERVAL);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isHovered]);

  // Rotate assets within the current orb
  useEffect(() => {
    if (isHovered) return;

    const assetTimer = setInterval(() => {
      const currentSector = TRADESPACE_DEMO_DATA[currentSectorIndex];
      const currentOrb = currentSector.orbs[currentOrbIndex];
      setCurrentAssetIndex((prev) => (prev + 1) % currentOrb.assets.length);
    }, 2000); // Rotate assets every 2 seconds

    return () => clearInterval(assetTimer);
  }, [currentSectorIndex, currentOrbIndex, isHovered]);

  // Rotate threads within the current orb
  useEffect(() => {
    if (isHovered) return;

    const threadTimer = setInterval(() => {
      const currentSector = TRADESPACE_DEMO_DATA[currentSectorIndex];
      const currentOrb = currentSector.orbs[currentOrbIndex];
      setCurrentThreadIndex((prev) => (prev + 1) % currentOrb.threads.length);
    }, 3000); // Rotate threads every 3 seconds

    return () => clearInterval(threadTimer);
  }, [currentSectorIndex, currentOrbIndex, isHovered]);

  const handleSectorSelect = (index: number) => {
    setCurrentSectorIndex(index);
    setCurrentOrbIndex(0);
    setCurrentAssetIndex(0);
    setCurrentThreadIndex(0);
  };

  const handleOrbSelect = (index: number) => {
    setCurrentOrbIndex(index);
    setCurrentAssetIndex(0);
    setCurrentThreadIndex(0);
  };

  const handleAssetSelect = (index: number) => {
    setCurrentAssetIndex(index);
  };

  const handleThreadSelect = (index: number) => {
    setCurrentThreadIndex(index);
  };



  const currentSector = TRADESPACE_DEMO_DATA[currentSectorIndex];
  const currentOrb = currentSector.orbs[currentOrbIndex];
  const currentAsset = currentOrb.assets[currentAssetIndex];
  const currentThread = currentOrb.threads[currentThreadIndex];

  // Get all options for dropdowns
  const sectorOptions = TRADESPACE_DEMO_DATA.map((s) => s.name);
  const orbOptions = currentSector.orbs.map((o) => o.name);
  const assetOptions = currentOrb.assets.map((a) => a.symbol);
  const threadOptions = currentOrb.threads.map((t) => t.name);

  return (
    <div className="mt-8 max-w-3xl mx-auto">
      <div ref={containerRef} className="relative">
        {/* SVG Arrow Layer */}
        {isReady && paths && (
          <svg
            className="absolute inset-0 pointer-events-none"
            width="100%"
            height="100%"
            style={{ overflow: "visible" }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
                className="fill-border"
              >
                <polygon points="0 0, 10 3.5, 0 7" className="fill-current text-border" />
              </marker>
              <marker
                id="arrowhead-start"
                markerWidth="10"
                markerHeight="7"
                refX="1"
                refY="3.5"
                orient="auto"
                className="fill-border"
              >
                <polygon points="10 0, 0 3.5, 10 7" className="fill-current text-border" />
              </marker>
            </defs>

            {/* Arrow 1: Tradespace to Sector */}
            <path
              d={paths.tradespaceToSector}
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              markerEnd="url(#arrowhead)"
              className="text-border transition-all duration-300"
            />

            {/* Arrow 2: Sector down to Orb (curved) */}
            <path
              d={paths.sectorToOrb}
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              markerEnd="url(#arrowhead)"
              className="text-border transition-all duration-300"
            />

            {/* Arrow 3: Orb to Assets */}
            <path
              d={paths.orbToAssets}
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              markerEnd="url(#arrowhead)"
              className="text-border transition-all duration-300"
            />

            {/* Arrow 4: Orb down to Thread (double arrowhead) */}
            <path
              d={paths.orbToThread}
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              markerStart="url(#arrowhead-start)"
              markerEnd="url(#arrowhead)"
              className="text-border transition-all duration-300"
            />
          </svg>
        )}

        {/* Content Layer */}
        <div className="relative z-10 flex flex-col items-center space-y-3">
          {/* Row 1: Tradespace → Sector */}
          <div className="flex items-center gap-6 justify-center">
            <DiagramBox
              ref={tradespaceRef}
              content="Your Tradespace"
              behavior="static"
              isHovered={false}
              onHover={() => {}}
              onLeave={() => {}}
              onImmediateLeave={() => {}}
              className="w-[230px]"
            />
            <div className="w-16" /> {/* Spacer for arrow */}
            <DiagramBox
              ref={sectorRef}
              content={currentSector.name}
              options={sectorOptions}
              behavior="bloom"
              isHovered={hoverSector}
              onHover={onSectorHover}
              onLeave={onSectorLeave}
              onImmediateLeave={onSectorImmediateLeave}
              onSelect={handleSectorSelect}
              className="w-[230px]"
            />
          </div>

          {/* Spacer for vertical arrow */}
          <div className="h-8" />

          {/* Row 2: Orb → Assets */}
          <div className="flex items-center gap-6 justify-center">
            <DiagramBox
              ref={orbRef}
              content={currentOrb.name}
              options={orbOptions}
              behavior="bloom"
              isHovered={hoverOrb}
              onHover={onOrbHover}
              onLeave={onOrbLeave}
              onImmediateLeave={onOrbImmediateLeave}
              onSelect={handleOrbSelect}
              className="w-[230px]"
            />
            <div className="w-16" /> {/* Spacer for arrow */}
            <DiagramBox
              ref={assetsRef}
              content={currentAsset.symbol}
              options={assetOptions}
              behavior="scroll"
              isHovered={hoverAssets}
              onHover={onAssetsHover}
              onLeave={onAssetsLeave}
              onImmediateLeave={onAssetsImmediateLeave}
              onSelect={handleAssetSelect}
              className="w-[230px]"
            />
          </div>

          {/* Spacer for vertical arrow */}
          <div className="h-8" />

          {/* Row 3: Thread */}
          <div className="flex justify-center">
            <DiagramBox
              ref={threadRef}
              content={currentThread.name}
              options={threadOptions}
              behavior="bloom"
              isHovered={hoverThread}
              onHover={onThreadHover}
              onLeave={onThreadLeave}
              onImmediateLeave={onThreadImmediateLeave}
              onSelect={handleThreadSelect}
              pill={{
                label: currentThread.type,
                color: THREAD_TYPE_COLORS[currentThread.type],
              }}
              className="w-[230px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
