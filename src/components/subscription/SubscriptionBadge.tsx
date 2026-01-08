import { Badge } from "@/components/ui/badge";
import { Crown, Award, Medal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SubscriptionTier } from "@/config/subscriptionPlans";

interface SubscriptionBadgeProps {
  tier: SubscriptionTier;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

const badgeConfig = {
  elite: {
    icon: Crown,
    label: "Elite",
    className: "bg-gradient-to-r from-yellow-400 to-amber-500 text-white border-yellow-500",
    iconClassName: "text-white",
  },
  pro: {
    icon: Award,
    label: "Premium",
    className: "bg-gradient-to-r from-slate-300 to-slate-400 text-slate-800 border-slate-400",
    iconClassName: "text-slate-800",
  },
  essential: {
    icon: Medal,
    label: "Pro",
    className: "bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-600",
    iconClassName: "text-white",
  },
  free: null,
};

const sizeConfig = {
  sm: {
    badge: "px-1.5 py-0.5 text-xs",
    icon: "w-3 h-3",
  },
  md: {
    badge: "px-2 py-1 text-sm",
    icon: "w-4 h-4",
  },
  lg: {
    badge: "px-3 py-1.5 text-base",
    icon: "w-5 h-5",
  },
};

export const SubscriptionBadge = ({
  tier,
  className,
  showLabel = true,
  size = "md",
}: SubscriptionBadgeProps) => {
  const config = badgeConfig[tier];
  
  if (!config) return null;

  const Icon = config.icon;
  const sizeStyles = sizeConfig[size];

  return (
    <Badge
      className={cn(
        "flex items-center gap-1 font-semibold border",
        config.className,
        sizeStyles.badge,
        className
      )}
    >
      <Icon className={cn(sizeStyles.icon, config.iconClassName)} />
      {showLabel && <span>{config.label}</span>}
    </Badge>
  );
};
