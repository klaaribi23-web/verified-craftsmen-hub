import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, User, Users, UserCheck, UserPlus, Upload, LogOut, LayoutDashboard, BarChart3, FileText, Settings, MessageCircle, ThumbsUp, ChevronDown, Heart, Briefcase, Camera, ClipboardList, Crown, Gift } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import NotificationBell from "@/components/notifications/NotificationBell";
import { DEFAULT_AVATAR, cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDashboardSidebarOpen, setIsDashboardSidebarOpen] = useState(false);
  const [artisanPhotoUrl, setArtisanPhotoUrl] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, role, user, signOut, isLoading } = useAuth();
  const { unreadCount: unreadMessagesCount } = useUnreadMessages();

  // Fetch artisan photo dynamically
  useEffect(() => {
    const fetchArtisanPhoto = async () => {
      if (isAuthenticated && role === "artisan" && user) {
        const { data } = await supabase
          .from("artisans")
          .select("photo_url")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (data?.photo_url) {
          setArtisanPhotoUrl(data.photo_url);
        }
      }
    };
    
    fetchArtisanPhoto();
  }, [isAuthenticated, role, user]);

  // Subscribe to realtime updates for artisan photo
  useEffect(() => {
    if (!isAuthenticated || role !== "artisan" || !user) return;

    const channel = supabase
      .channel('artisan-photo-navbar')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'artisans',
          filter: `user_id=eq.${user.id}`
        },
        (payload: any) => {
          if (payload.new?.photo_url) {
            setArtisanPhotoUrl(payload.new.photo_url);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, role, user]);

  // Bloquer le scroll du body quand la sidebar dashboard est ouverte
  useEffect(() => {
    if (isDashboardSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isDashboardSidebarOpen]);

  // Get messaging link based on role
  const getMessagingLink = () => {
    if (role === "admin") return "/admin/messagerie";
    if (role === "artisan") return "/artisan/messagerie";
    return "/client/messagerie";
  };

  const navLinks = [
    { href: "/trouver-artisan", label: "Trouver un artisan" },
    { href: "/nos-missions", label: "Nos missions" },
    { href: "/comment-ca-marche", label: "Comment ça marche" },
    { href: "/blog", label: "Blog" },
    { href: "/devenir-artisan", label: "Devenir artisan" },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Show mobile top bar for all authenticated users (admin, artisan, client)
  const showMobileDashboardNav = isAuthenticated && !isLoading;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name[0]}${user.user_metadata.last_name[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  // Get dashboard link based on role
  const getDashboardLink = () => {
    if (role === "admin") return "/admin/dashboard";
    if (role === "artisan") return "/artisan/dashboard";
    return "/client/dashboard";
  };

  // Get quotes link based on role
  const getQuotesLink = () => {
    if (role === "artisan") return "/artisan/devis";
    return "/client/devis";
  };

  // Get settings link based on role
  const getSettingsLink = () => {
    if (role === "admin") return "/admin/parametres";
    if (role === "artisan") return "/artisan/parametres";
    return "/client/parametres";
  };

  // Get role label for display
  const getRoleLabel = () => {
    if (role === "admin") return "Admin";
    if (role === "artisan") return "Mon espace artisan";
    return "Mon espace client";
  };

  // Get dashboard menu items based on role - COMPLETE MENU for mobile sidebar
  const getDashboardMenuItems = () => {
    if (role === "admin") {
      return {
        main: [
          { icon: LayoutDashboard, label: "Tableau de bord", href: "/admin/dashboard" },
          { icon: Settings, label: "Approbations", href: "/admin/approbations" },
          { icon: ThumbsUp, label: "Recommandations", href: "/admin/recommandations" },
          { icon: Users, label: "Artisans", href: "/admin/artisans" },
          { icon: UserCheck, label: "Clients", href: "/admin/clients" },
          { icon: BarChart3, label: "Statistiques", href: "/admin/statistiques" },
        ],
        secondary: [
          { icon: MessageCircle, label: "Messagerie", href: "/admin/messagerie" },
          { icon: UserPlus, label: "Ajouter artisan", href: "/admin/ajouter-artisan" },
          { icon: Upload, label: "Import massif", href: "/admin/import-massif" },
          { icon: Settings, label: "Paramètres", href: "/admin/parametres" },
        ],
      };
    }
    if (role === "artisan") {
      return {
        main: [
          { icon: LayoutDashboard, label: "Tableau de bord", href: "/artisan/dashboard" },
          { icon: User, label: "Mon profil", href: "/artisan/profil" },
          { icon: Camera, label: "Mes Stories", href: "/artisan/stories" },
          { icon: FileText, label: "Documents", href: "/artisan/documents" },
          { icon: Briefcase, label: "Mes prestations", href: "/artisan/prestations" },
          { icon: ClipboardList, label: "Missions postulées", href: "/artisan/demandes" },
        ],
        secondary: [
          { icon: MessageCircle, label: "Messagerie", href: "/artisan/messagerie" },
          { icon: FileText, label: "Mes devis", href: "/artisan/devis" },
          { icon: Crown, label: "Mon abonnement", href: "/artisan/abonnement" },
          { icon: Gift, label: "Offres partenaires", href: "/artisan/offres-partenaires" },
          { icon: Settings, label: "Paramètres", href: "/artisan/parametres" },
        ],
      };
    }
    // Client
    return {
      main: [
        { icon: LayoutDashboard, label: "Tableau de bord", href: "/client/dashboard" },
        { icon: ClipboardList, label: "Mes missions", href: "/client/missions" },
        { icon: FileText, label: "Mes devis", href: "/client/devis" },
        { icon: Heart, label: "Mes favoris", href: "/client/favoris" },
      ],
      secondary: [
        { icon: MessageCircle, label: "Messagerie", href: "/client/messagerie" },
        { icon: Settings, label: "Paramètres", href: "/client/parametres" },
      ],
    };
  };

  // Render a single menu item
  const renderMenuItem = (item: { icon: any; label: string; href: string }) => (
    <Link
      key={item.href}
      to={item.href}
      onClick={() => setIsDashboardSidebarOpen(false)}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors",
        location.pathname === item.href
          ? "bg-gold/10 text-navy font-medium"
          : "hover:bg-muted"
      )}
    >
      <item.icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm">{item.label}</span>
    </Link>
  );

  // Render dashboard menu items for mobile sidebar
  const renderDashboardMenuItems = () => {
    const { main, secondary } = getDashboardMenuItems();

    return (
      <>
        {/* Groupe principal */}
        <div className="space-y-0.5">
          {main.map(renderMenuItem)}
        </div>
        
        {/* Séparateur + groupe secondaire */}
        {secondary.length > 0 && (
          <>
            <div className="border-t border-border my-3" />
            <div className="space-y-0.5">
              {secondary.map(renderMenuItem)}
            </div>
          </>
        )}
        
        {/* Bouton déconnexion */}
        <div className="border-t border-border mt-4 pt-4">
          <button
            onClick={() => {
              handleSignOut();
              setIsDashboardSidebarOpen(false);
            }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-destructive/10 transition-colors w-full text-left text-destructive"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-medium">Déconnexion</span>
          </button>
        </div>
      </>
    );
  };

  // Render user menu for authenticated users (Desktop)
  const renderUserMenu = () => {
    if (isLoading) {
      return (
        <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
      );
    }

    if (!isAuthenticated) {
      return (
        <Button variant="ghost" size="sm" asChild>
          <Link to="/auth">Connexion</Link>
        </Button>
      );
    }

    // Admin menu
    if (role === "admin") {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10 border-2 border-primary">
                <AvatarImage src={DEFAULT_AVATAR} alt="Avatar" />
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  <img src={DEFAULT_AVATAR} alt="Avatar" className="w-full h-full object-cover" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <div className="flex flex-col space-y-1 p-2">
              <p className="text-sm font-medium leading-none">Administrateur</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/admin/dashboard" className="cursor-pointer">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Admin Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/admin/artisans" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Gestion utilisateurs
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/admin/approbations" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Approbations
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    // Client/Artisan menu
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10 border-2 border-gold">
              <AvatarImage src={role === "artisan" && artisanPhotoUrl ? artisanPhotoUrl : DEFAULT_AVATAR} alt="Avatar" />
              <AvatarFallback className="bg-gold/20 text-navy font-semibold">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <div className="flex flex-col space-y-1 p-2">
            <p className="text-sm font-medium leading-none">
              {role === "artisan" ? "Artisan" : "Client"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to={getDashboardLink()} className="cursor-pointer">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Mon tableau de bord
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to={getQuotesLink()} className="cursor-pointer">
              <FileText className="mr-2 h-4 w-4" />
              Mes devis
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to={getSettingsLink()} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Mon compte
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <>
      {/* Mobile/Tablet Top Bar for authenticated users */}
      {showMobileDashboardNav && (
        <div className="fixed top-0 left-0 right-0 z-[55] bg-navy lg:hidden">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-end h-12">
              {/* Avatar only - on the right */}
              <button
                onClick={() => setIsDashboardSidebarOpen(true)}
                className="p-1"
              >
                <Avatar className="h-8 w-8 border-2 border-gold">
                  <AvatarImage
                    src={role === "artisan" && artisanPhotoUrl ? artisanPhotoUrl : DEFAULT_AVATAR}
                    alt="Avatar"
                  />
                  <AvatarFallback className="bg-gold/20 text-white text-sm">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Dashboard Sidebar - Full Width */}
      <AnimatePresence>
        {showMobileDashboardNav && isDashboardSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[60] lg:hidden"
              onClick={() => setIsDashboardSidebarOpen(false)}
            />

            {/* Sidebar Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 right-0 w-full max-w-sm bg-white z-[65] lg:hidden shadow-2xl overflow-y-auto"
            >
              {/* Header */}
              <div className="bg-navy p-4 flex items-center justify-between sticky top-0">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-gold">
                    <AvatarImage
                      src={role === "artisan" && artisanPhotoUrl ? artisanPhotoUrl : DEFAULT_AVATAR}
                      alt="Avatar"
                    />
                    <AvatarFallback className="bg-gold/20 text-white">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white font-semibold">
                      {role === "admin" ? "Administrateur" : role === "artisan" ? "Artisan" : "Client"}
                    </p>
                    <p className="text-white/70 text-sm truncate max-w-[180px]">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDashboardSidebarOpen(false)}
                  className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Menu Items */}
              <div className="p-4 space-y-1">
                {renderDashboardMenuItems()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Header */}
      <header
        className={cn(
          "fixed left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-border",
          // Shift down when top bar is visible (mobile + authenticated)
          showMobileDashboardNav ? "top-12 lg:top-0" : "top-0",
        )}
      >
        <nav className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo - left, fixed width */}
            <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
              <img src={logo} alt="Logo Artisans Validés" width={40} height={40} className="w-10 h-10 rounded-lg group-hover:scale-105 transition-transform flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-lg font-bold text-navy leading-tight">ARTISANS</span>
                <span className="text-xs font-semibold text-gold -mt-1">VALIDÉS</span>
              </div>
            </Link>

            {/* Desktop: 3 buttons right-aligned */}
            <div className="hidden lg:flex items-center gap-4">
              {/* Devenir partenaire - text link, hidden when authenticated */}
              {!isAuthenticated && !isLoading && (
                <Link
                  to="/devenir-partenaire"
                  className="text-sm font-medium text-navy hover:text-navy/70 underline-offset-4 hover:underline transition-colors whitespace-nowrap"
                >
                  Devenir partenaire
                </Link>
              )}
              <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground font-semibold" asChild>
                <Link to="/client/dashboard">
                  <ClipboardList className="w-4 h-4 mr-1.5" />
                  Mon Espace
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="border-navy text-navy hover:bg-navy hover:text-white font-semibold" asChild>
                <Link to="/artisan/dashboard">
                  <User className="w-4 h-4 mr-1.5" />
                  Espace Pro
                </Link>
              </Button>
              <Button variant="gold" size="sm" className="font-semibold" asChild>
                <Link to="/demande-devis">
                  Demander un devis
                </Link>
              </Button>
              {isAuthenticated && (
                <>
                  <Link to={getMessagingLink()} className="relative">
                    <Button variant="ghost" size="icon" className="relative">
                      <MessageCircle className="w-5 h-5" />
                      {unreadMessagesCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-medium">
                          {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
                        </span>
                      )}
                    </Button>
                  </Link>
                  <NotificationBell />
                </>
              )}
              {renderUserMenu()}
            </div>

            {/* Mobile: burger only */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 text-navy"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu - Site navigation only */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden overflow-hidden"
              >
                <div className="py-4 space-y-3">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive(link.href)
                          ? "bg-gold/10 text-navy"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                  
                  {/* Show login buttons only if not authenticated */}
                  {!isAuthenticated && !isLoading && (
                    <div className="pt-3 space-y-2 border-t border-border">
                      <Button variant="outline" className="w-full" asChild>
                        <Link to="/devenir-artisan" onClick={() => setIsOpen(false)}>
                          Espace Pro — 99€ HT/mois
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full" asChild>
                        <Link to="/auth" onClick={() => setIsOpen(false)}>
                          Connexion
                        </Link>
                      </Button>
                      <Button variant="gold" className="w-full" asChild>
                        <Link to="/demande-devis" onClick={() => setIsOpen(false)}>
                          Demander un devis
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </header>
    </>
  );
};

export default Navbar;
