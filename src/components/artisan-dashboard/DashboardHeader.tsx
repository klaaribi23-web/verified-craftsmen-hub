interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
}

export const DashboardHeader = ({ title, subtitle }: DashboardHeaderProps) => {
  return (
    <header className="bg-card border-b border-border px-4 py-3 md:px-6 md:py-4">
      <div>
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-muted-foreground text-xs sm:text-sm leading-snug line-clamp-2">{subtitle}</p>
        )}
      </div>
    </header>
  );
};
