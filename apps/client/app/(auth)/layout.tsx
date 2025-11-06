import { Logo } from "@/library/components/atoms/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="h-screen w-screen flex flex-col bg-background"
      data-slot="auth-layout"
    >
      {/* Logo Header */}
      <div className="w-full px-4 pt-6 pb-2">
        <div className="flex items-center justify-center gap-3">
          <Logo className="h-8 w-8" />
          <span className="text-2xl font-bold">Agentix</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-visible">
        {children}
      </div>
    </div>
  );
}