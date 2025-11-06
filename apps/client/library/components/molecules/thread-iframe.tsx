"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/library/components/atoms/alert";

interface ThreadIframeProps {
  /**
   * Thread registry entry ID
   */
  registryId: string;

  /**
   * Source URL for the thread UI
   */
  src: string;

  /**
   * Orb ID for context
   */
  orbId?: number;

  /**
   * Configuration to pass to the thread
   */
  config?: Record<string, any>;

  /**
   * CSS class name
   */
  className?: string;

  /**
   * Iframe title for accessibility
   */
  title?: string;
}

/**
 * Thread Iframe Loader Component
 *
 * Loads thread UIs in a sandboxed iframe for security isolation.
 * Supports communication via postMessage for future interactivity.
 */
export function ThreadIframe({
  registryId,
  src,
  orbId,
  config,
  className = "",
  title = "Thread UI",
}: ThreadIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      setIsLoading(false);

      // Send initial configuration to the iframe
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          {
            type: "AGENTIX_INIT",
            payload: {
              registryId,
              orbId,
              config,
            },
          },
          "*" // In production, specify the exact origin
        );
      }
    };

    const handleError = () => {
      setIsLoading(false);
      setError("Failed to load thread UI");
    };

    iframe.addEventListener("load", handleLoad);
    iframe.addEventListener("error", handleError);

    // Listen for messages from the iframe
    const handleMessage = (event: MessageEvent) => {
      // Validate origin in production
      if (event.data?.type?.startsWith("AGENTIX_")) {
        console.log("Thread message:", event.data);
        // Handle thread communication here
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      iframe.removeEventListener("load", handleLoad);
      iframe.removeEventListener("error", handleError);
      window.removeEventListener("message", handleMessage);
    };
  }, [registryId, orbId, config]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="size-6 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Loading thread UI...</span>
          </div>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={src}
        title={title}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin allow-forms"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}
