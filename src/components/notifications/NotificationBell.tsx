import { useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAllNotifications } from "@/hooks/useAllNotifications";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle, XCircle, FileText, UserPlus, Briefcase, Info, MessageCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  variant?: "default" | "light";
}

const NotificationBell = ({ variant = "default" }: NotificationBellProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { role } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useAllNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "quote_accepted":
      case "document_verified":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "quote_refused":
      case "document_rejected":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "quote_received":
        return <FileText className="w-4 h-4 text-primary" />;
      case "approval":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "rejection":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "new_application":
        return <UserPlus className="w-4 h-4 text-blue-500" />;
      case "mission_assigned":
        return <Briefcase className="w-4 h-4 text-gold" />;
      case "new_message":
        return <MessageCircle className="w-4 h-4 text-primary" />;
      case "new_document":
        return <FileText className="w-4 h-4 text-orange-500" />;
      default:
        return <Info className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getNotificationRoute = (type: string): string | null => {
    switch (type) {
      case "new_message":
        if (role === "admin") return "/admin/messagerie";
        if (role === "artisan") return "/artisan/messagerie";
        return "/client/messagerie";
      case "quote_received":
      case "quote_accepted":
      case "quote_refused":
        if (role === "artisan") return "/artisan/devis";
        return "/client/devis";
      case "mission_assigned":
      case "new_application":
        if (role === "artisan") return "/artisan/demandes";
        return "/client/missions";
      case "document_verified":
      case "document_rejected":
        return "/artisan/documents";
      case "approval":
      case "rejection":
        return "/artisan/dashboard";
      case "new_document":
        // Les documents sont modérés dans l'onglet Approbations
        return "/admin/approbations";
      default:
        return null;
    }
  };

  const handleNotificationClick = (notificationId: string, isRead: boolean, type: string) => {
    if (!isRead) {
      markAsRead.mutate(notificationId);
    }
    
    const route = getNotificationRoute(type);
    if (route) {
      setOpen(false);
      navigate(route);
    }
  };

  const isLight = variant === "light";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn(
            "relative",
            isLight && "text-white hover:bg-white/10"
          )}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-auto py-1 px-2"
              onClick={() => markAllAsRead.mutate()}
            >
              Tout marquer comme lu
            </Button>
          )}
        </div>
        
        <ScrollArea className="max-h-[300px]">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Chargement...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                Aucune notification pour l'instant
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Vous serez notifié des nouvelles activités ici
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification.id, notification.is_read, notification.type)}
                  className={cn(
                    "p-3 cursor-pointer transition-colors hover:bg-muted/50",
                    !notification.is_read && "bg-primary/5"
                  )}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm",
                        !notification.is_read && "font-medium"
                      )}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
