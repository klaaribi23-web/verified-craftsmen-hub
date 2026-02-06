import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  User,
  MessageSquare,
  Settings,
  LogOut,
  BadgeCheck,
  Heart,
  LayoutDashboard,
  FileText,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";

const menuItems = [
  { icon: LayoutDashboard, label: "Tableau de bord", path: "/dashboard/client" },
  { icon: FolderOpen, label: "Mes Projets", path: "/dashboard/client/projets" },
  { icon: MessageSquare, label: "Messages", path: "/dashboard/client/messages" },
  { icon: FileText, label: "Mes Devis", path: "/dashboard/client/devis" },
  { icon: Heart, label: "Artisans Favoris", path: "/dashboard/client/favoris" },
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

  const displayName = profile?.first_name || "Mon espace";

  return (
    <>
      {/* Logo */}
      <div className="p-4 lg:p-6 border-b border-teal-400/20">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center">
            <BadgeCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg text-white">ARTISANS</span>
            <span className="text-teal-200 font-bold text-lg"> VALIDÉS</span>
          </div>
        </Link>
      </div>

      {/* Profile Summary */}
      <div className="p-4 border-b border-teal-400/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center overflow-hidden flex-shrink-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Photo de profil" className="w-full h-full object-cover" />
            ) : (
              <User className="w-6 h-6 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-white truncate">
              {isLoading ? "Chargement..." : displayName}
            </p>
            <p className="text-sm text-teal-200/80">Particulier</p>
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
                      ? "bg-white/20 text-white font-semibold shadow-sm"
                      : "text-teal-100/80 hover:bg-white/10 hover:text-white"
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

      {/* Settings + Logout */}
      <div className="p-4 border-t border-teal-400/20 space-y-1">
        <Link
          to="/dashboard/client/parametres"
          onClick={onItemClick}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-teal-100/80 hover:bg-white/10 hover:text-white transition-all duration-200 min-h-[44px]"
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          <span>Paramètres</span>
        </Link>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-teal-100/80 hover:bg-red-500/20 hover:text-red-200 transition-all duration-200 w-full min-h-[44px]"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span>Déconnexion</span>
        </button>
      </div>
    </>
  );
};

export const ClientSidebar = () => {
  return (
    <aside className="hidden lg:flex w-64 min-h-screen flex-col" style={{ background: "linear-gradient(180deg, hsl(174 42% 35%) 0%, hsl(195 53% 40%) 100%)" }}>
      <SidebarContent />
    </aside>
  );
};
