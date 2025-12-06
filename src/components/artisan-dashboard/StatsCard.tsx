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
      "bg-card rounded-xl p-6 border border-border shadow-soft transition-all duration-300 hover:shadow-elevated",
      variant === "gold" && "border-accent/30 bg-accent/5",
      variant === "success" && "border-success/30 bg-success/5"
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2 text-foreground">{value}</p>
          {trend && (
            <p className={cn(
              "text-sm mt-2 flex items-center gap-1",
              trend.isPositive ? "text-success" : "text-destructive"
            )}>
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              <span className="text-muted-foreground">vs mois dernier</span>
            </p>
          )}
        </div>
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          variant === "default" && "bg-primary/10 text-primary",
          variant === "gold" && "bg-accent/20 text-accent",
          variant === "success" && "bg-success/20 text-success"
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
