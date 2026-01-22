import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Bell,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export const ApprovalNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications } = useQuery({
    queryKey: ["artisan-notifications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .in("type", ["approval", "rejection", "document_verified", "document_rejected"])
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user?.id
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artisan-notifications"] });
    }
  });

  if (!notifications || notifications.length === 0) {
    return null;
  }

  const unreadNotifications = notifications.filter(n => !n.is_read);

  if (unreadNotifications.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notifications
          </CardTitle>
          <Badge variant="secondary">{unreadNotifications.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {unreadNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg border relative ${
              notification.type === "approval"
                ? "bg-emerald-500/10 border-emerald-500/20"
                : "bg-red-500/10 border-red-500/20"
            }`}
          >
            <button
              onClick={() => markAsReadMutation.mutate(notification.id)}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            
            <div className="flex items-start gap-3">
              {notification.type === "approval" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 pr-4">
                <p className={`font-medium text-sm ${
                  notification.type === "approval" ? "text-emerald-700" : "text-red-700"
                }`}>
                  {notification.title}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {format(new Date(notification.created_at), "d MMMM yyyy à HH:mm", { locale: fr })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
