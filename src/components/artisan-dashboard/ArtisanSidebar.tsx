import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  User,
  FileText,
  Briefcase,
  MessageSquare,
  LayoutDashboard,
  Settings,
  LogOut,
  BadgeCheck,
  Gift,
  ClipboardList,
  Camera,
  Menu,
  Crown,
  Lock,
} from "lucide-react";
import { cn, DEFAULT_AVATAR } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useArtisanProfile } from "@/hooks/useArtisanProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const SidebarContent = ({ onItemClick }: { onItemClick?: () => void }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { artisan, profile, isLoading } = useArtisanProfile();
  const { tier } = useSubscription();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const displayName = profile?.first_name || artisan?.business_name || "Artisan";
  const isVerified = artisan?.status === "active";
  const hasProAccess = tier !== "free";

  const menuItems = [
    { icon: LayoutDashboard, label: "Tableau de bord", path: "/artisan/dashboard" },
    { icon: User, label: "Mon profil", path: "/artisan/profil" },
    { icon: Camera, label: "Mes Stories", path: "/artisan/stories", requiresPro: !hasProAccess },
    { icon: FileText, label: "Documents", path: "/artisan/documents" },
    { icon: Briefcase, label: "Mes prestations", path: "/artisan/prestations" },
    { icon: ClipboardList, label: "Missions postulées", path: "/artisan/demandes" },
    { icon: MessageSquare, label: "Messagerie", path: "/artisan/messagerie" },
    { icon: ClipboardList, label: "Mes devis", path: "/artisan/devis" },
    { icon: Crown, label: "Mon abonnement", path: "/artisan/abonnement" },
    { icon: Gift, label: "Offres partenaires", path: "/artisan/offres-partenaires", requiresPro: !hasProAccess },
    { icon: Settings, label: "Paramètres", path: "/artisan/parametres" },
  ];

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
            <img 
              src={artisan?.photo_url || DEFAULT_AVATAR} 
              alt="Photo de profil" 
              className="w-full h-full object-cover" 
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {isLoading ? "Chargement..." : displayName}
            </p>
            <p className="text-sm text-sidebar-foreground/70">Artisan</p>
          </div>
          {isVerified && (
            <div className="flex items-center gap-1 px-2 py-1 bg-success/20 rounded-full flex-shrink-0">
              <BadgeCheck className="w-4 h-4 text-success" />
              <span className="text-xs text-success hidden sm:inline">Validé</span>
            </div>
          )}
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
                  <span className="truncate flex-1">{item.label}</span>
                  {item.requiresPro && (
                    <Badge variant="secondary" className="bg-amber-500/20 text-amber-300 text-xs px-1.5 py-0.5 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      PRO
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

export const ArtisanSidebar = () => {
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
          <SheetContent side="left" className="w-[280px] p-0 bg-primary text-primary-foreground">
            <div className="flex flex-col h-full">
              <SidebarContent onItemClick={() => setOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 min-h-screen bg-primary text-primary-foreground flex-col">
        <SidebarContent />
      </aside>
    </>
  );
};
