import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, LayoutDashboard, MessageSquare, Bell, X, CheckCircle, XCircle, FileText, UserPlus, Briefcase, Info as InfoIcon, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useAllNotifications } from "@/hooks/useAllNotifications";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface MobileBottomNavbarProps {
  isAuthenticated: boolean;
  userRole: string | null;
  chatOpen?: boolean;
  onChatClick: () => void;
}

const MobileBottomNavbar = ({
  isAuthenticated,
  userRole,
  chatOpen = false,
  onChatClick,
}: MobileBottomNavbarProps) => {
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  
  // Only show for authenticated clients OR artisans
  if (!isAuthenticated || (userRole !== 'client' && userRole !== 'artisan')) {
    return null;
  }

  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useAllNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "quote_accepted":
      case "approval":
      case "document_verified":
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case "quote_refused":
      case "rejection":
      case "document_rejected":
        return <XCircle className="h-5 w-5 text-destructive" />;
      case "new_quote":
        return <FileText className="h-5 w-5 text-primary" />;
      case "new_artisan":
        return <UserPlus className="h-5 w-5 text-blue-500" />;
      case "mission_assigned":
      case "mission_application":
        return <Briefcase className="h-5 w-5 text-amber-500" />;
      case "new_message":
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      default:
        return <InfoIcon className="h-5 w-5 text-muted-foreground" />;
    }
  };

  // Different routes based on user role
  const getNotificationRoute = (type: string, relatedId: string | null) => {
    const isArtisan = userRole === 'artisan';
    
    switch (type) {
      case "new_quote":
      case "quote_accepted":
      case "quote_refused":
        return isArtisan ? "/artisan/devis" : "/client/devis";
      case "new_message":
        return isArtisan ? "/artisan/messagerie" : "/client/messagerie";
      case "mission_assigned":
      case "mission_application":
        return isArtisan 
          ? "/artisan/missions-postulees" 
          : (relatedId ? `/client/missions/${relatedId}` : "/client/missions");
      case "approval":
      case "rejection":
        return isArtisan ? "/artisan/dashboard" : "/client/dashboard";
      case "document_verified":
      case "document_rejected":
        return isArtisan ? "/artisan/documents" : "/client/dashboard";
      default:
        return isArtisan ? "/artisan/dashboard" : "/client/dashboard";
    }
  };

  const handleNotificationClick = (notif: { id: string; is_read: boolean; type: string; related_id: string | null }) => {
    if (!notif.is_read) {
      markAsRead.mutate(notif.id);
    }
    const route = getNotificationRoute(notif.type, notif.related_id);
    setNotifOpen(false);
    navigate(route);
  };

  // Different nav items based on role
  const getNavItems = () => {
    if (userRole === 'artisan') {
      return [
        {
          id: "home",
          label: "Accueil",
          icon: <Home className="h-5 w-5" />,
          onClick: () => navigate("/"),
          className: "text-muted-foreground",
        },
        {
          id: "dashboard",
          label: "Dashboard",
          icon: <LayoutDashboard className="h-5 w-5" />,
          onClick: () => navigate("/artisan/dashboard"),
          className: "text-primary",
        },
        {
          id: "messagerie",
          label: "Messages",
          icon: <Mail className="h-5 w-5" />,
          onClick: () => navigate("/artisan/messagerie"),
          className: "text-blue-600",
        },
        {
          id: "notifications",
          label: "Notifs",
          icon: <Bell className="h-5 w-5" />,
          onClick: () => setNotifOpen(true),
          className: "text-amber-600",
        },
      ];
    }
    
    // Client nav items
    return [
      {
        id: "home",
        label: "Accueil",
        icon: <Home className="h-5 w-5" />,
        onClick: () => navigate("/"),
        className: "text-muted-foreground",
      },
      {
        id: "dashboard",
        label: "Dashboard",
        icon: <LayoutDashboard className="h-5 w-5" />,
        onClick: () => navigate("/client/dashboard"),
        className: "text-primary",
      },
      {
        id: "chat",
        label: chatOpen ? "Fermer" : "Tchat",
        icon: chatOpen ? <X className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />,
        onClick: onChatClick,
        className: chatOpen ? "text-red-600" : "text-blue-600",
      },
      {
        id: "notifications",
        label: "Notifs",
        icon: <Bell className="h-5 w-5" />,
        onClick: () => setNotifOpen(true),
        className: "text-amber-600",
      },
    ];
  };

  const navItems = getNavItems();

  return (
    <>
      <nav className="xl:hidden fixed bottom-0 left-0 right-0 z-[60] bg-background border-t shadow-lg">
        <div className="flex items-center justify-around py-2 px-2 safe-area-pb">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={item.onClick}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-all active:scale-95",
                "hover:bg-muted",
                item.className,
                item.id === "chat" && chatOpen && "bg-red-100 ring-2 ring-red-500"
              )}
            >
              {item.icon}
              <span className="text-xs font-medium">{item.label}</span>
              {/* Badge for notifications */}
              {item.id === "notifications" && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 min-w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Notifications Sheet */}
      <Sheet open={notifOpen} onOpenChange={setNotifOpen}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-xl">
          <SheetHeader className="pb-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle>Notifications</SheetTitle>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => markAllAsRead.mutate()}
                  className="text-xs"
                >
                  Tout marquer comme lu
                </Button>
              )}
            </div>
          </SheetHeader>
          <ScrollArea className="h-[calc(70vh-80px)] mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mb-4 opacity-20" />
                <p>Aucune notification</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={cn(
                      "w-full p-4 rounded-lg text-left transition-colors flex gap-3",
                      notif.is_read 
                        ? "bg-muted/30 hover:bg-muted/50" 
                        : "bg-primary/5 hover:bg-primary/10 border-l-2 border-primary"
                    )}
                  >
                    <div className="shrink-0 mt-0.5">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm",
                        !notif.is_read && "font-semibold"
                      )}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {notif.message}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {formatDistanceToNow(new Date(notif.created_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default MobileBottomNavbar;
