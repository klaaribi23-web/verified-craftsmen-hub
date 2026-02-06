import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubscriptionBadgeProps {
  tier: string;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

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
  if (tier === "free" || !tier) return null;

  const sizeStyles = sizeConfig[size];

  return (
    <Badge
      className={cn(
        "flex items-center gap-1 font-semibold border bg-success/20 text-success border-success/30",
        sizeStyles.badge,
        className
      )}
    >
      <ShieldCheck className={cn(sizeStyles.icon)} />
      {showLabel && <span>Artisan Validé</span>}
    </Badge>
  );
};
