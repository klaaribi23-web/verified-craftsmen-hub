import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  User,
  Briefcase,
  MessageSquare,
  Settings,
  LogOut,
  BadgeCheck,
  Heart,
  LayoutDashboard,
  ClipboardList,
  ThumbsUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";

const menuItems = [
  { icon: LayoutDashboard, label: "Tableau de bord", path: "/client/dashboard" },
  { icon: Briefcase, label: "Mes missions", path: "/client/missions" },
  { icon: ClipboardList, label: "Mes devis", path: "/client/devis" },
  { icon: Heart, label: "Artisans favoris", path: "/client/favoris" },
  { icon: ThumbsUp, label: "Recommandations", path: "/client/recommandations" },
  { icon: MessageSquare, label: "Messagerie", path: "/client/messagerie" },
  { icon: Settings, label: "Paramètres", path: "/client/parametres" },
];

const SidebarContent = ({ onItemClick }: { onItemClick?: () => void }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { profile, isLoading } = useUserProfile();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const displayName = profile?.first_name || "Client";

  return (
    <>
      {/* Logo */}
      <div className="p-4 lg:p-6 border-b border-sidebar-border">
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
          <div className="w-12 h-12 rounded-full bg-sidebar-accent flex items-center justify-center overflow-hidden flex-shrink-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Photo de profil" className="w-full h-full object-cover" />
            ) : (
              <User className="w-6 h-6" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {isLoading ? "Chargement..." : displayName}
            </p>
            <p className="text-sm text-sidebar-foreground/70">Client</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={onItemClick}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 min-h-[44px]",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground/80 hover:bg-destructive/20 hover:text-destructive transition-all duration-200 w-full min-h-[44px]"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span>Déconnexion</span>
        </button>
      </div>
    </>
  );
};

export const ClientSidebar = () => {
  // Mobile navigation is now handled by GlobalMobileNavbar + avatar sidebar
  // Desktop sidebar is the only one rendered here
  return (
    <aside className="hidden lg:flex w-64 min-h-screen bg-primary text-primary-foreground flex-col">
      <SidebarContent />
    </aside>
  );
};
