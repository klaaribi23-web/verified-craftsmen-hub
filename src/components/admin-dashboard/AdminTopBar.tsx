import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  BarChart3,
  MessageSquare,
  UserPlus,
  LogOut,
  Shield,
  Settings,
  Menu,
  Upload,
  ThumbsUp,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useApprovalCounts } from "@/hooks/useApprovalCounts";
import { usePendingRecommendationsCount } from "@/hooks/useRecommendations";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "Tableau de bord", path: "/admin/dashboard" },
  { icon: UserCheck, label: "Approbations", path: "/admin/approbations", badge: "approvals" },
  { icon: ThumbsUp, label: "Recommandations", path: "/admin/recommandations", badge: "recommendations" },
  { icon: Users, label: "Artisans", path: "/admin/artisans" },
  { icon: UserCheck, label: "Clients", path: "/admin/clients" },
  { icon: BarChart3, label: "Statistiques", path: "/admin/statistiques" },
  { icon: MessageSquare, label: "Messagerie", path: "/admin/messagerie" },
  { icon: UserPlus, label: "Ajouter artisan", path: "/admin/ajouter-artisan" },
  { icon: Upload, label: "Import massif", path: "/admin/import-massif" },
  { icon: Settings, label: "Paramètres", path: "/admin/parametres" },
];

export const AdminTopBar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { profile, isLoading } = useUserProfile();
  const { data: approvalCounts } = useApprovalCounts();
  const { data: pendingRecommendationsCount = 0 } = usePendingRecommendationsCount();
  
  const pendingApprovalsCount = approvalCounts?.totalApprovals || 0;
  const displayName = profile?.first_name || "Administrateur";

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="lg:hidden fixed top-16 left-0 right-0 z-40 bg-primary text-primary-foreground h-12 flex items-center justify-between px-4 shadow-md">
      {/* Logo / Title */}
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5" />
        <span className="font-semibold text-sm">Admin</span>
      </div>

      {/* Avatar with Drawer Trigger */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
            <Shield className="h-5 w-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[280px] p-0 bg-primary text-primary-foreground border-l-primary/50">
          <SheetTitle className="sr-only">Menu administration</SheetTitle>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {isLoading ? "Chargement..." : displayName}
                  </p>
                  <p className="text-sm text-white/70">Administrateur</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors min-h-[44px]",
                      isActive
                        ? "bg-white/20 text-white"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium truncate">{item.label}</span>
                    {item.badge === "approvals" && pendingApprovalsCount > 0 && (
                      <Badge className="ml-auto bg-destructive text-destructive-foreground text-xs px-2">
                        {pendingApprovalsCount}
                      </Badge>
                    )}
                    {item.badge === "recommendations" && pendingRecommendationsCount > 0 && (
                      <Badge className="ml-auto bg-destructive text-destructive-foreground text-xs px-2">
                        {pendingRecommendationsCount}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-white/10">
              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-white/80 hover:bg-destructive/20 hover:text-destructive transition-colors min-h-[44px]"
              >
                <LogOut className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium">Déconnexion</span>
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
