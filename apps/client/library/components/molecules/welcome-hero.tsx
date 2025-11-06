export function WelcomeHero() {
  return (
    <div className="w-full max-w-2xl text-center">
      {/* Welcome Text */}
      <div className="space-y-4">
        <h1 className="text-5xl md:text-6xl font-medium whitespace-nowrap">
          Welcome to <span className="font-bold">Agentix</span>
        </h1>
        <p className="text-xl text-muted-foreground">
          Your Autonomous Tradespace
        </p>
      </div>
    </div>
  );
}
