import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  BarChart3, 
  MessageSquare, 
  UserPlus,
  Bell,
  LogOut,
  Shield,
  Settings,
  FileText,
  Menu,
  Upload
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAllNotifications } from "@/hooks/useAllNotifications";
import { useApprovalCounts } from "@/hooks/useApprovalCounts";

const menuItems = [
  { icon: LayoutDashboard, label: "Tableau de bord", path: "/admin/dashboard" },
  { icon: UserCheck, label: "Approbations", path: "/admin/approbations", badge: "approvals" },
  { icon: FileText, label: "Documents", path: "/admin/documents", badge: "documents" },
  { icon: Users, label: "Artisans", path: "/admin/artisans" },
  { icon: UserCheck, label: "Clients", path: "/admin/clients" },
  { icon: BarChart3, label: "Statistiques", path: "/admin/statistiques" },
  { icon: MessageSquare, label: "Messagerie", path: "/admin/messagerie" },
  { icon: UserPlus, label: "Ajouter artisan", path: "/admin/ajouter-artisan" },
  { icon: Upload, label: "Import massif", path: "/admin/import-massif" },
  { icon: Settings, label: "Paramètres", path: "/admin/parametres" },
];

const SidebarContent = ({ onItemClick }: { onItemClick?: () => void }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { profile, isLoading } = useUserProfile();
  const { notifications } = useAllNotifications();
  const { data: approvalCounts } = useApprovalCounts();
  
  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;
  const pendingApprovalsCount = approvalCounts?.totalApprovals || 0;
  const pendingDocumentsCount = approvalCounts?.pendingDocuments || 0;
  const displayName = profile?.first_name || "Administrateur";

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <>
      {/* Logo */}
      <div className="p-4 lg:p-6 border-b border-border">
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="font-bold text-lg text-foreground">Admin</h1>
            <p className="text-xs text-muted-foreground">Artisans Validés</p>
          </div>
        </div>
      </div>

      {/* Admin Info */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-foreground truncate">
              {isLoading ? "Chargement..." : displayName}
            </p>
            <p className="text-xs text-muted-foreground">Accès complet</p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Notifications</span>
          </div>
          {unreadCount > 0 && (
            <Badge className="bg-destructive text-destructive-foreground">
              {unreadCount}
            </Badge>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onItemClick}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors min-h-[44px] ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium truncate">{item.label}</span>
              {item.badge === "approvals" && pendingApprovalsCount > 0 && (
                <Badge className="ml-auto bg-destructive text-destructive-foreground text-xs px-2">
                  {pendingApprovalsCount}
                </Badge>
              )}
              {item.badge === "documents" && pendingDocumentsCount > 0 && (
                <Badge className="ml-auto bg-destructive text-destructive-foreground text-xs px-2">
                  {pendingDocumentsCount}
                </Badge>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-border">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors min-h-[44px]"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>
    </>
  );
};

export const AdminSidebar = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed bottom-4 left-4 z-50">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button 
              size="icon" 
              className="h-14 w-14 rounded-full shadow-lg bg-primary text-primary-foreground"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0 bg-card">
            <div className="flex flex-col h-full">
              <SidebarContent onItemClick={() => setOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-card border-r border-border min-h-screen flex-col">
        <SidebarContent />
      </aside>
    </>
  );
};
