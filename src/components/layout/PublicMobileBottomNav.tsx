import { Link, useLocation } from "react-router-dom";
import { Radar, PlusCircle, User, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const PublicMobileBottomNav = () => {
  const location = useLocation();
  const { user, isLoading, role } = useAuth();

  // Don't show for authenticated client/artisan (they have GlobalMobileNavbar)
  if (!isLoading && user && (role === "client" || role === "artisan")) {
    return null;
  }

  // Don't show for admin
  if (role === "admin") return null;

  const items = [
    {
      id: "missions",
      label: "Missions",
      icon: Radar,
      href: "/nos-missions",
    },
    {
      id: "publier",
      label: "Publier",
      icon: PlusCircle,
      href: "/demande-devis",
    },
    {
      id: "mon-acces",
      label: "Mon Accès",
      icon: ShieldCheck,
      href: "/devenir-artisan",
      gold: true,
    },
    {
      id: "compte",
      label: "Compte",
      icon: User,
      href: "/auth",
    },
  ];

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[70] bg-background border-t shadow-lg">
        <div className="flex items-center justify-around py-2 px-2 safe-area-pb">
          {items.map((item) => {
            const active = location.pathname === item.href;
            const isGold = (item as any).gold;
            return (
              <Link
                key={item.id}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-all active:scale-95",
                  "hover:bg-muted",
                  isGold
                    ? "text-gold font-bold"
                    : active ? "text-primary bg-primary/10" : "text-muted-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isGold && "text-gold")} />
                <span className={cn("text-xs font-medium", isGold && "text-gold font-bold")}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      {/* Bottom spacer */}
      <div className="lg:hidden h-16" />
    </>
  );
};

export default PublicMobileBottomNav;
