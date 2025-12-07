import { Link, useLocation } from "react-router-dom";
import {
  User,
  Briefcase,
  MessageSquare,
  Settings,
  LogOut,
  BadgeCheck,
  Heart,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "Tableau de bord", path: "/client/dashboard" },
  { icon: Briefcase, label: "Mes missions", path: "/client/missions" },
  { icon: Heart, label: "Artisans favoris", path: "/client/favoris" },
  { icon: MessageSquare, label: "Messagerie", path: "/client/messagerie" },
  { icon: Settings, label: "Paramètres", path: "/client/parametres" },
];

export const ClientSidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-64 min-h-screen bg-primary text-primary-foreground flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
            <BadgeCheck className="w-6 h-6 text-accent-foreground" />
          </div>
          <div>
            <span className="font-bold text-lg">ARTISANS</span>
            <span className="text-accent font-bold text-lg"> VALIDÉS</span>
          </div>
        </Link>
      </div>

      {/* Profile Summary */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-sidebar-accent flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">Marie Martin</p>
            <p className="text-sm text-sidebar-foreground/70">Client</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground/80 hover:bg-destructive/20 hover:text-destructive transition-all duration-200 w-full">
          <LogOut className="w-5 h-5" />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
};
