import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface AdminStatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "primary" | "success" | "warning" | "destructive";
}

export const AdminStatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  color = "primary" 
}: AdminStatsCardProps) => {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    success: "bg-green-500/10 text-green-500",
    warning: "bg-yellow-500/10 text-yellow-500",
    destructive: "bg-destructive/10 text-destructive",
  };

  return (
    <Card className="border-border">
      <CardContent className="p-3 md:p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs md:text-sm text-muted-foreground mb-1 truncate">{title}</p>
            <p className="text-xl md:text-3xl font-bold text-foreground">{value}</p>
            {trend && (
              <p className={`text-[10px] md:text-sm mt-1 md:mt-2 ${trend.isPositive ? 'text-green-500' : 'text-destructive'}`}>
                {trend.isPositive ? '+' : '-'}{trend.value}% <span className="hidden sm:inline">vs mois dernier</span>
              </p>
            )}
          </div>
          <div className={`p-2 md:p-3 rounded-lg shrink-0 ${colorClasses[color]}`}>
            <Icon className="h-4 w-4 md:h-6 md:w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
