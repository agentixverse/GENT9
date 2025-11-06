import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";

import { Toaster } from "@/library/components/atoms/sonner";
import RootProvider from "@/library/providers";
import "@/library/styles/globals.css";
import { cn } from "@/library/utils";

const inter = Inter({ subsets: ["latin"], preload: true });
const outfit = Outfit({ subsets: ["latin"], preload: true, variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Agentix - AI-Powered Trading Platform",
  icons: "/favicon.ico",
  description:
    "Beat inflation with AI-powered crypto trading. Automated trading that works while you sleep.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className, outfit.variable)}>
        <RootProvider>
          {children}
          <Toaster />
        </RootProvider>
      </body>
    </html>
  );
}
