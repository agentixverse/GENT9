"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SidebarInset } from "@/library/components/atoms/sidebar";
import Header from "@/library/components/molecules/header";
import { AppSidebar } from "@/library/components/organisms/app-sidebar";
import { useAuth } from "@/library/api/hooks/use-auth";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <AppSidebar />
      <SidebarInset className="relative">
        <Header />
        {children}
      </SidebarInset>
    </>
  );
}