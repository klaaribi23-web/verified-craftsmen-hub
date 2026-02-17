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
  CreditCard,
  FileText,
  Gift,
  Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useApprovalCounts } from "@/hooks/useApprovalCounts";
import { usePendingRecommendationsCount } from "@/hooks/useRecommendations";
import { Badge } from "@/components/ui/badge";

const menuItems = [
  { icon: LayoutDashboard, label: "Tableau de bord", path: "/admin/dashboard" },
  { icon: Rocket, label: "Commandant", path: "/admin/commandant" },
  { icon: Settings, label: "Validations", path: "/admin/approbations", badge: "approvals" },
  { icon: ThumbsUp, label: "Avis clients", path: "/admin/recommandations", badge: "recommendations" },
  { icon: CreditCard, label: "Abonnements", path: "/admin/abonnements" },
  { icon: Users, label: "Artisans", path: "/admin/artisans" },
  { icon: UserCheck, label: "Clients", path: "/admin/clients" },
  { icon: BarChart3, label: "Statistiques", path: "/admin/statistiques" },
  { icon: FileText, label: "Demandes de projets", path: "/admin/demandes-projets" },
  { icon: MessageCircle, label: "Leads Andrea", path: "/admin/leads-andrea" },
  { icon: MessageCircle, label: "Messagerie", path: "/admin/messagerie" },
  { icon: UserPlus, label: "Ajouter un artisan", path: "/admin/ajouter-artisan" },
  { icon: Upload, label: "Import en masse", path: "/admin/import-massif" },
  { icon: Gift, label: "Partenaires", path: "/admin/partenaires" },
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
      <div className="p-4 lg:p-6 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <BadgeCheck className="w-6 h-6 text-primary" />
          </div>
          <div>
            <span className="font-bold text-lg text-white">ARTISANS</span>
            <span className="text-primary font-bold text-lg"> VALIDÉS</span>
          </div>
        </Link>
      </div>

      {/* Profile Summary - Same structure as ClientSidebar */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Photo de profil" className="w-full h-full object-cover" />
            ) : (
              <User className="w-6 h-6" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate text-white">
              {isLoading ? "Chargement..." : displayName}
            </p>
            <p className="text-sm text-slate-400">Administrateur</p>
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
                      ? "bg-primary/10 text-primary"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
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
      <div className="p-4 border-t border-white/10">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-destructive/20 hover:text-destructive transition-all duration-200 w-full min-h-[44px]"
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
    <aside className="hidden lg:flex w-64 min-h-screen flex-col border-r border-primary/20" style={{ background: '#020617' }}>
      <SidebarContent />
    </aside>
  );
};
