import { RefObject, useState, useCallback } from "react";
import { useIsomorphicLayoutEffect } from "usehooks-ts";

interface ArrowRefs {
  container: RefObject<HTMLDivElement>;
  tradespace: RefObject<HTMLDivElement>;
  sector: RefObject<HTMLDivElement>;
  orb: RefObject<HTMLDivElement>;
  assets: RefObject<HTMLDivElement>;
  thread: RefObject<HTMLDivElement>;
}

interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AnchorPoint {
  x: number;
  y: number;
}

interface ArrowPaths {
  tradespaceToSector: string;
  sectorToOrb: string;
  orbToAssets: string;
  orbToThread: string;
}

export function useArrowPositions(refs: ArrowRefs) {
  const [paths, setPaths] = useState<ArrowPaths | null>(null);
  const [isReady, setIsReady] = useState(false);

  const calculatePaths = () => {
    // Check if all refs are available
    if (
      !refs.container.current ||
      !refs.tradespace.current ||
      !refs.sector.current ||
      !refs.orb.current ||
      !refs.assets.current ||
      !refs.thread.current
    ) {
      return;
    }

    // Get container position for relative calculations
    const containerRect = refs.container.current.getBoundingClientRect();

    // Helper to get relative position
    const getRelativePosition = (element: HTMLElement): Position => {
      const rect = element.getBoundingClientRect();
      return {
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top,
        width: rect.width,
        height: rect.height,
      };
    };

    // Get all positions
    const tradespacePos = getRelativePosition(refs.tradespace.current);
    const sectorPos = getRelativePosition(refs.sector.current);
    const orbPos = getRelativePosition(refs.orb.current);
    const assetsPos = getRelativePosition(refs.assets.current);
    const threadPos = getRelativePosition(refs.thread.current);

    // Calculate anchor points
    const getAnchor = {
      rightCenter: (pos: Position): AnchorPoint => ({
        x: pos.x + pos.width,
        y: pos.y + pos.height / 2,
      }),
      leftCenter: (pos: Position): AnchorPoint => ({
        x: pos.x,
        y: pos.y + pos.height / 2,
      }),
      topCenter: (pos: Position): AnchorPoint => ({
        x: pos.x + pos.width / 2,
        y: pos.y,
      }),
      bottomCenter: (pos: Position): AnchorPoint => ({
        x: pos.x + pos.width / 2,
        y: pos.y + pos.height,
      }),
    };

    // Arrow 1: Tradespace → Sector (horizontal straight)
    const ts1 = getAnchor.rightCenter(tradespacePos);
    const ts2 = getAnchor.leftCenter(sectorPos);
    const tradespaceToSector = `M ${ts1.x} ${ts1.y} L ${ts2.x} ${ts2.y}`;

    // Arrow 2: Sector → Orb (curved down-left with quadratic Bezier)
    const so1 = getAnchor.bottomCenter(sectorPos);
    const so2 = getAnchor.topCenter(orbPos);
    // Control point: weighted toward the start for a nice curve
    const soControlX = so1.x;
    const soControlY = so2.y - 40; // Offset for curve depth
    const sectorToOrb = `M ${so1.x} ${so1.y} Q ${soControlX} ${soControlY} ${so2.x} ${so2.y}`;

    // Arrow 3: Orb → Assets (horizontal straight)
    const oa1 = getAnchor.rightCenter(orbPos);
    const oa2 = getAnchor.leftCenter(assetsPos);
    const orbToAssets = `M ${oa1.x} ${oa1.y} L ${oa2.x} ${oa2.y}`;

    // Arrow 4: Orb → Thread (vertical straight)
    const ot1 = getAnchor.bottomCenter(orbPos);
    const ot2 = getAnchor.topCenter(threadPos);
    const orbToThread = `M ${ot1.x} ${ot1.y} L ${ot2.x} ${ot2.y}`;

    setPaths({
      tradespaceToSector,
      sectorToOrb,
      orbToAssets,
      orbToThread,
    });
    setIsReady(true);
  };

  // Calculate on mount and layout changes
  useIsomorphicLayoutEffect(() => {
    calculatePaths();

    // Recalculate on window resize
    const handleResize = () => {
      calculatePaths();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - refs are stable and calculatePaths is defined inline

  return { paths, isReady };
}
