"use client";

import { useTheme } from "next-themes";
import Image from "next/image";
import { useEffect, useState } from "react";

export function Logo({ className = "h-12 w-12" }: { className?: string }) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={className} />;
  }

  const currentTheme = theme === "system" ? resolvedTheme : theme;
  const logoSrc = currentTheme === "dark" ? "/agentix-dark.svg" : "/agentix-light.svg";

  return (
    <Image
      src={logoSrc}
      alt="Agentix"
      width={48}
      height={48}
      className={className}
      priority
    />
  );
}
