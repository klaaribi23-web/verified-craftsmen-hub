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
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {trend && (
              <p className={`text-sm mt-2 ${trend.isPositive ? 'text-green-500' : 'text-destructive'}`}>
                {trend.isPositive ? '+' : ''}{trend.value}% ce mois
              </p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
