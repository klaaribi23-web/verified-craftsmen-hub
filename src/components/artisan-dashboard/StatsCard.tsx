import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "gold" | "success";
}

export const StatsCard = ({ title, value, icon: Icon, trend, variant = "default" }: StatsCardProps) => {
  return (
    <div className={cn(
      "bg-card rounded-xl p-3 sm:p-4 lg:p-6 border border-border shadow-soft transition-all duration-300 hover:shadow-elevated",
      variant === "gold" && "border-accent/30 bg-accent/5",
      variant === "success" && "border-success/30 bg-success/5"
    )}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-xs sm:text-sm font-medium truncate">{title}</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold mt-1 sm:mt-2 text-foreground">{value}</p>
          {trend && (
            <p className={cn(
              "text-xs sm:text-sm mt-1 sm:mt-2 flex items-center gap-1",
              trend.isPositive ? "text-success" : "text-destructive"
            )}>
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              <span className="text-muted-foreground hidden sm:inline">vs mois dernier</span>
            </p>
          )}
        </div>
        <div className={cn(
          "w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center shrink-0",
          variant === "default" && "bg-primary/10 text-primary",
          variant === "gold" && "bg-accent/20 text-accent",
          variant === "success" && "bg-success/20 text-success"
        )}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
        </div>
      </div>
    </div>
  );
};
