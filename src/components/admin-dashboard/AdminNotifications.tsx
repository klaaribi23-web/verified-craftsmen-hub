import { useState, useEffect } from "react";
import { Bell, User, Briefcase, UserPlus, Trash2, Check, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  related_id: string | null;
}

const getIcon = (type: string) => {
  switch (type) {
    case "artisan":
      return UserPlus;
    case "client":
      return User;
    case "mission":
      return Briefcase;
    case "document":
      return FileText;
    default:
      return Bell;
  }
};

const getColor = (type: string) => {
  switch (type) {
    case "artisan":
      return "bg-primary/10 text-primary";
    case "client":
      return "bg-green-500/10 text-green-500";
    case "mission":
      return "bg-yellow-500/10 text-yellow-500";
    case "document":
      return "bg-orange-500/10 text-orange-500";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export const AdminNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Generate demo notifications based on recent data
  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      
      try {
        // Fetch recent artisans for notifications
        const { data: recentArtisans } = await supabase
          .from("artisans")
          .select("id, business_name, city, created_at, category:categories(name)")
          .order("created_at", { ascending: false })
          .limit(3);

        // Fetch recent missions
        const { data: recentMissions } = await supabase
          .from("missions")
          .select("id, title, city, created_at")
          .order("created_at", { ascending: false })
          .limit(2);

        // Create notifications from recent data
        const artisanNotifs: Notification[] = (recentArtisans || []).map((a: any) => ({
          id: `artisan-${a.id}`,
          type: "artisan",
          title: "Nouvel artisan",
          message: `Nouvel artisan inscrit : ${a.business_name} (${a.category?.name || "Non catégorisé"})`,
          is_read: false,
          created_at: a.created_at,
          related_id: a.id,
        }));

        const missionNotifs: Notification[] = (recentMissions || []).map((m: any) => ({
          id: `mission-${m.id}`,
          type: "mission",
          title: "Nouvelle mission",
          message: `Nouvelle mission postée : ${m.title}`,
          is_read: false,
          created_at: m.created_at,
          related_id: m.id,
        }));

        // Combine and sort by date
        const allNotifs = [...artisanNotifs, ...missionNotifs]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 8);

        setNotifications(allNotifs);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();

    // Subscribe to realtime updates
    const artisansChannel = supabase
      .channel("artisans-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "artisans" },
        (payload) => {
          const newArtisan = payload.new as any;
          setNotifications((prev) => [
            {
              id: `artisan-${newArtisan.id}`,
              type: "artisan",
              title: "Nouvel artisan",
              message: `Nouvel artisan inscrit : ${newArtisan.business_name}`,
              is_read: false,
              created_at: newArtisan.created_at,
              related_id: newArtisan.id,
            },
            ...prev,
          ].slice(0, 8));
        }
      )
      .subscribe();

    const missionsChannel = supabase
      .channel("missions-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "missions" },
        (payload) => {
          const newMission = payload.new as any;
          setNotifications((prev) => [
            {
              id: `mission-${newMission.id}`,
              type: "mission",
              title: "Nouvelle mission",
              message: `Nouvelle mission postée : ${newMission.title}`,
              is_read: false,
              created_at: newMission.created_at,
              related_id: newMission.id,
            },
            ...prev,
          ].slice(0, 8));
        }
      )
      .subscribe();

    // Subscribe to new documents
    const documentsChannel = supabase
      .channel("documents-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "artisan_documents" },
        async (payload) => {
          const newDoc = payload.new as any;
          // Fetch artisan info
          const { data: artisan } = await supabase
            .from("artisans")
            .select("business_name")
            .eq("id", newDoc.artisan_id)
            .single();
          
          setNotifications((prev) => [
            {
              id: `document-${newDoc.id}`,
              type: "document",
              title: "Nouveau document",
              message: `${artisan?.business_name || "Un artisan"} a soumis : ${newDoc.name}`,
              is_read: false,
              created_at: newDoc.created_at,
              related_id: newDoc.id,
            },
            ...prev,
          ].slice(0, 8));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(artisansChannel);
      supabase.removeChannel(missionsChannel);
      supabase.removeChannel(documentsChannel);
    };
  }, []);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    toast.success("Toutes les notifications ont été marquées comme lues");
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast.success("Notification supprimée");
  };

  const deleteReadNotifications = () => {
    const readCount = notifications.filter((n) => n.is_read).length;
    if (readCount === 0) {
      toast.info("Aucune notification lue à supprimer");
      return;
    }
    setNotifications((prev) => prev.filter((n) => !n.is_read));
    toast.success(`${readCount} notification${readCount > 1 ? "s" : ""} supprimée${readCount > 1 ? "s" : ""}`);
  };

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-3 p-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const newCount = notifications.filter((n) => !n.is_read).length;
  const readCount = notifications.filter((n) => n.is_read).length;

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2">
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <Bell className="h-4 w-4 md:h-5 md:w-5" />
          Notifications
        </CardTitle>
        <Badge variant="secondary" className="w-fit text-xs">{newCount} nouvelles</Badge>
      </CardHeader>
      
      {/* Action buttons */}
      {notifications.length > 0 && (
        <div className="px-4 md:px-6 pb-2 flex flex-wrap gap-2">
          {newCount > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs h-7 px-2"
            >
              <Check className="h-3 w-3 mr-1" />
              <span className="hidden xs:inline">Tout</span> lu
            </Button>
          )}
          {readCount > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={deleteReadNotifications}
              className="text-xs text-destructive hover:text-destructive h-7 px-2"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              <span className="hidden xs:inline">Suppr.</span> ({readCount})
            </Button>
          )}
        </div>
      )}

      <CardContent className="space-y-2 md:space-y-3 max-h-80 md:max-h-96 overflow-y-auto pt-2 px-3 md:px-6">
        {notifications.length > 0 ? (
          notifications.map((notification) => {
            const Icon = getIcon(notification.type);
            const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
              addSuffix: true,
              locale: fr,
            });

            return (
              <div
                key={notification.id}
                className={`flex items-start gap-2 md:gap-3 p-2 md:p-3 rounded-lg transition-colors group ${
                  !notification.is_read ? "bg-primary/5" : "hover:bg-muted"
                }`}
              >
                <div className={`p-1.5 md:p-2 rounded-full shrink-0 ${getColor(notification.type)}`}>
                  <Icon className="h-3 w-3 md:h-4 md:w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm text-foreground line-clamp-2">{notification.message}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-1">{timeAgo}</p>
                </div>
                <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                  {!notification.is_read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 md:h-7 md:w-7"
                      onClick={() => markAsRead(notification.id)}
                      title="Marquer comme lu"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 md:h-7 md:w-7 text-destructive hover:text-destructive"
                    onClick={() => deleteNotification(notification.id)}
                    title="Supprimer"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                {!notification.is_read && (
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-primary mt-2 shrink-0" />
                )}
              </div>
            );
          })
        ) : (
          <p className="text-center text-muted-foreground py-6 text-sm">
            Aucune notification
          </p>
        )}
        {notifications.length > 0 && (
          <Button variant="outline" className="w-full mt-3 text-sm">
            Voir toutes les notifications
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
