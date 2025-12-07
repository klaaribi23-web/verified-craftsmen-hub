import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  BarChart3, 
  MessageSquare, 
  UserPlus,
  Bell,
  Mail,
  LogOut,
  Shield
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const menuItems = [
  { icon: LayoutDashboard, label: "Tableau de bord", path: "/admin/dashboard" },
  { icon: Users, label: "Artisans", path: "/admin/artisans" },
  { icon: UserCheck, label: "Clients", path: "/admin/clients" },
  { icon: BarChart3, label: "Statistiques", path: "/admin/statistiques" },
  { icon: MessageSquare, label: "Messagerie", path: "/admin/messagerie" },
  { icon: Mail, label: "Emails", path: "/admin/emails" },
  { icon: UserPlus, label: "Ajouter artisan", path: "/admin/ajouter-artisan" },
];

export const AdminSidebar = () => {
  const location = useLocation();
  const notificationCount = 5; // Dummy notification count

  return (
    <aside className="w-64 bg-card border-r border-border min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
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
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm text-foreground">Administrateur</p>
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
          {notificationCount > 0 && (
            <Badge className="bg-destructive text-destructive-foreground">
              {notificationCount}
            </Badge>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-border">
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
};
