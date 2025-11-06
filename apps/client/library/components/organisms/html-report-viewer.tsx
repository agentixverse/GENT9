"use client";

import * as React from "react";
import { Button } from "@/library/components/atoms/button";
import { Download, ExternalLink } from "lucide-react";

interface HtmlReportViewerProps {
  htmlContent: string | null;
  isLoading?: boolean;
}

function HtmlReportViewer({ htmlContent, isLoading }: HtmlReportViewerProps) {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  const handleDownload = () => {
    if (!htmlContent) return;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backtest-report-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenInNewTab = () => {
    if (!htmlContent) return;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading report...</p>
        </div>
      </div>
    );
  }

  if (!htmlContent) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-muted-foreground">No HTML report available</p>
          <p className="text-sm text-muted-foreground mt-2">
            Run a backtest to generate a report
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b bg-white flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
          <ExternalLink className="mr-2 size-4" />
          Open in New Tab
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="mr-2 size-4" />
          Download HTML
        </Button>
      </div>
      <div className="flex-1 overflow-hidden">
        <iframe
          ref={iframeRef}
          srcDoc={htmlContent}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
          title="Backtest Report"
        />
      </div>
    </div>
  );
}

export { HtmlReportViewer };
