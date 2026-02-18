import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, LayoutDashboard, MessageSquare, Bell, CheckCircle, XCircle, FileText, UserPlus, Briefcase, Info as InfoIcon, Mail, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useAllNotifications } from "@/hooks/useAllNotifications";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { useMessaging } from "@/hooks/useMessaging";

const GlobalMobileNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  
  const { user, role, isLoading: authLoading } = useAuth();
  
  // IMPORTANT: All hooks must be called unconditionally before any return statements
  // to comply with React's Rules of Hooks
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useAllNotifications();
  const { conversations } = useMessaging();
  
  // Calculate total unread messages
  const unreadMessagesCount = conversations?.reduce((sum, c) => sum + c.unread_count, 0) || 0;
  
  // Don't show while loading auth, if not authenticated, or on standalone pages
  if (authLoading || !user || location.pathname.startsWith("/activation-elite")) {
    return null;
  }
  
  // Only show for clients and artisans (not admins)
  if (role !== 'client' && role !== 'artisan') {
    return null;
  }

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

  const getNotificationRoute = (type: string, relatedId: string | null) => {
    const isArtisan = role === 'artisan';
    
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
          ? "/artisan/demandes" 
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

  // Check if current path matches
  const isActive = (path: string) => location.pathname === path;

  // Handle message icon click - toggle chat
  const handleMessageClick = () => {
    if (chatOpen) {
      setChatOpen(false);
    } else {
      // Close notifs if open
      setNotifOpen(false);
      setChatOpen(true);
    }
  };

  // Handle notification icon click - toggle notifs
  const handleNotifClick = () => {
    if (notifOpen) {
      setNotifOpen(false);
    } else {
      // Close chat if open
      setChatOpen(false);
      setNotifOpen(true);
    }
  };

  // Different nav items based on role
  const getNavItems = () => {
    if (role === 'artisan') {
      return [
        {
          id: "home",
          label: "Accueil",
          icon: <Home className="h-5 w-5" />,
          onClick: () => navigate("/"),
          path: "/",
        },
        {
          id: "dashboard",
          label: "Dashboard",
          icon: <LayoutDashboard className="h-5 w-5" />,
          onClick: () => navigate("/artisan/dashboard"),
          path: "/artisan/dashboard",
        },
        {
          id: "messagerie",
          label: "Messages",
          icon: <Mail className="h-5 w-5" />,
          onClick: handleMessageClick,
          path: null,
          isActive: chatOpen,
        },
        {
          id: "notifications",
          label: "Notifs",
          icon: <Bell className="h-5 w-5" />,
          onClick: handleNotifClick,
          path: null,
          isActive: notifOpen,
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
        path: "/",
      },
      {
        id: "dashboard",
        label: "Dashboard",
        icon: <LayoutDashboard className="h-5 w-5" />,
        onClick: () => navigate("/client/dashboard"),
        path: "/client/dashboard",
      },
      {
        id: "messagerie",
        label: "Messages",
        icon: <MessageSquare className="h-5 w-5" />,
        onClick: handleMessageClick,
        path: null,
        isActive: chatOpen,
      },
      {
        id: "notifications",
        label: "Notifs",
        icon: <Bell className="h-5 w-5" />,
        onClick: handleNotifClick,
        path: null,
        isActive: notifOpen,
      },
    ];
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Full-width Notifications Panel */}
      {notifOpen && (
        <div className="lg:hidden fixed inset-0 z-[65] bg-background flex flex-col animate-fade-in">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between bg-primary text-primary-foreground">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5" />
              <h2 className="font-semibold text-lg">Notifications</h2>
            </div>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => markAllAsRead.mutate()}
                className="text-xs text-primary-foreground hover:bg-white/10"
              >
                Tout marquer comme lu
              </Button>
            )}
          </div>
          
          {/* Content */}
          <ScrollArea className="flex-1">
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
              <div className="p-4 space-y-2">
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
          
          {/* Bottom spacer for navbar */}
          <div className="h-20" />
        </div>
      )}

      {/* Full-width Chat Panel */}
      {chatOpen && (
        <div className="lg:hidden fixed inset-0 z-[65] bg-background animate-fade-in">
          <ChatWidget 
            isOpen={true} 
            onClose={() => setChatOpen(false)}
            hideFloatingButton={true}
          />
          {/* Bottom spacer for navbar */}
          <div className="h-20" />
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[70] bg-background border-t shadow-lg">
        <div className="flex items-center justify-around py-2 px-2 safe-area-pb">
          {navItems.map((item) => {
            const active = item.path ? isActive(item.path) : item.isActive;
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-all active:scale-95",
                  "hover:bg-muted",
                  active ? "text-primary bg-primary/10" : "text-muted-foreground"
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
                {/* Badge for messages */}
                {item.id === "messagerie" && unreadMessagesCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 min-w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                    {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Bottom spacer for mobile screens - prevents content from being hidden behind navbar */}
      <div className="lg:hidden h-20" />
    </>
  );
};

export default GlobalMobileNavbar;
