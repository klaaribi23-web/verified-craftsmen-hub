import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Shield, User, LogOut, LayoutDashboard, FileText, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import NotificationBell from "@/components/notifications/NotificationBell";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, role, user, signOut, isLoading } = useAuth();

  const navLinks = [
    { href: "/trouver-artisan", label: "Trouver un artisan" },
    { href: "/nos-missions", label: "Nos missions" },
    { href: "/comment-ca-marche", label: "Comment ça marche" },
    { href: "/devenir-artisan", label: "Devenir artisan" },
  ];

  const isActive = (path: string) => location.pathname === path;

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
    if (role === "admin") return "/admin/dashboard";
    if (role === "artisan") return "/artisan/parametres";
    return "/client/parametres";
  };

  // Render user menu for authenticated users
  const renderUserMenu = () => {
    if (isLoading) {
      return (
        <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
      );
    }

    if (!isAuthenticated) {
      return (
        <>
          <Button variant="ghost" asChild>
            <Link to="/auth">Connexion</Link>
          </Button>
          <Button variant="gold" asChild>
            <Link to="/demande-devis">Demander un devis</Link>
          </Button>
        </>
      );
    }

    // Admin menu
    if (role === "admin") {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10 border-2 border-primary">
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {getUserInitials()}
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

  // Render mobile menu items for authenticated users
  const renderMobileAuthMenu = () => {
    if (isLoading) {
      return <div className="h-12 bg-muted animate-pulse rounded-lg" />;
    }

    if (!isAuthenticated) {
      return (
        <>
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
        </>
      );
    }

    return (
      <div className="space-y-2">
        <div className="px-4 py-2 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium">{role === "admin" ? "Admin" : role === "artisan" ? "Artisan" : "Client"}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <Link
          to={getDashboardLink()}
          onClick={() => setIsOpen(false)}
          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
        >
          <LayoutDashboard className="h-4 w-4" />
          Mon tableau de bord
        </Link>
        <Link
          to={getQuotesLink()}
          onClick={() => setIsOpen(false)}
          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
        >
          <FileText className="h-4 w-4" />
          Mes devis
        </Link>
        <Link
          to={getSettingsLink()}
          onClick={() => setIsOpen(false)}
          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
        >
          <Settings className="h-4 w-4" />
          Mon compte
        </Link>
        <button
          onClick={() => {
            handleSignOut();
            setIsOpen(false);
          }}
          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors w-full text-left text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </div>
    );
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-border">
      <nav className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-gold rounded-lg flex items-center justify-center shadow-gold group-hover:scale-105 transition-transform">
              <Shield className="w-6 h-6 text-navy-dark" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-navy leading-tight">ARTISANS</span>
              <span className="text-xs font-semibold text-gold -mt-1">VALIDÉS</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm font-medium transition-colors relative py-2 ${
                  isActive(link.href)
                    ? "text-navy"
                    : "text-muted-foreground hover:text-navy"
                }`}
              >
                {link.label}
                {isActive(link.href) && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold rounded-full"
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Desktop CTA / User Menu */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated && <NotificationBell />}
            {renderUserMenu()}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 text-navy"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
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
                <div className="pt-3 space-y-2 border-t border-border">
                  {renderMobileAuthMenu()}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
};

export default Navbar;