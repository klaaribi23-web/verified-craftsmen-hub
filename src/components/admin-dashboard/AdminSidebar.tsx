import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Settings,
  Users,
  UserCheck,
  BarChart3,
  MessageCircle,
  UserPlus,
  Upload,
  LogOut,
  BadgeCheck,
  ThumbsUp,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useApprovalCounts } from "@/hooks/useApprovalCounts";
import { usePendingRecommendationsCount } from "@/hooks/useRecommendations";
import { Badge } from "@/components/ui/badge";

const menuItems = [
  { icon: LayoutDashboard, label: "Tableau de bord", path: "/admin/dashboard" },
  { icon: Settings, label: "Approbations", path: "/admin/approbations", badge: "approvals" },
  { icon: ThumbsUp, label: "Recommandations", path: "/admin/recommandations", badge: "recommendations" },
  { icon: Users, label: "Artisans", path: "/admin/artisans" },
  { icon: UserCheck, label: "Clients", path: "/admin/clients" },
  { icon: BarChart3, label: "Statistiques", path: "/admin/statistiques" },
  { icon: MessageCircle, label: "Messagerie", path: "/admin/messagerie" },
  { icon: UserPlus, label: "Ajouter artisan", path: "/admin/ajouter-artisan" },
  { icon: Upload, label: "Import massif", path: "/admin/import-massif" },
  { icon: Settings, label: "Paramètres", path: "/admin/parametres" },
];

const SidebarContent = ({ onItemClick }: { onItemClick?: () => void }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { profile, isLoading } = useUserProfile();
  const { data: approvalCounts } = useApprovalCounts();
  const { data: pendingRecommendations = 0 } = usePendingRecommendationsCount();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const displayName = profile?.first_name || "Admin";

  const getBadgeCount = (badgeType?: string) => {
    if (badgeType === "approvals") {
      return (approvalCounts?.pendingArtisans || 0) + (approvalCounts?.pendingMissions || 0);
    }
    if (badgeType === "recommendations") {
      return pendingRecommendations;
    }
    return 0;
  };

  return (
    <>
      {/* Logo - Same as ClientSidebar/ArtisanSidebar */}
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

      {/* Profile Summary - Same structure as ClientSidebar */}
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
            <p className="text-sm text-sidebar-foreground/70">Administrateur</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const badgeCount = getBadgeCount(item.badge);
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
                  <span className="truncate flex-1">{item.label}</span>
                  {badgeCount > 0 && (
                    <Badge variant="destructive" className="ml-auto text-xs px-2">
                      {badgeCount}
                    </Badge>
                  )}
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

export const AdminSidebar = () => {
  // Mobile navigation is now handled by Navbar + avatar sidebar (same as client/artisan)
  // Desktop sidebar is the only one rendered here
  return (
    <aside className="hidden lg:flex w-64 min-h-screen bg-primary text-primary-foreground flex-col">
      <SidebarContent />
    </aside>
  );
};
