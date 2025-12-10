import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { FileText, CheckCircle, XCircle } from "lucide-react";

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
}

export const useQuoteNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [lastNotificationId, setLastNotificationId] = useState<string | null>(null);

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["quote-notifications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .in("type", ["quote_accepted", "quote_refused", "quote_received"])
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user?.id,
  });

  // Mark notification as read
  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote-notifications"] });
    },
  });

  // Mark all as read
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .in("type", ["quote_accepted", "quote_refused", "quote_received"])
        .eq("is_read", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote-notifications"] });
    },
  });

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("quote-notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new as Notification;
          
          // Only show toast for quote-related notifications
          if (["quote_accepted", "quote_refused", "quote_received"].includes(notification.type)) {
            // Avoid duplicate toasts
            if (notification.id !== lastNotificationId) {
              setLastNotificationId(notification.id);
              
              // Show toast based on notification type
              if (notification.type === "quote_accepted") {
                toast.success(notification.title, {
                  description: notification.message,
                  icon: <CheckCircle className="w-5 h-5 text-green-500" />,
                  duration: 5000,
                });
              } else if (notification.type === "quote_refused") {
                toast.error(notification.title, {
                  description: notification.message,
                  icon: <XCircle className="w-5 h-5 text-red-500" />,
                  duration: 5000,
                });
              } else if (notification.type === "quote_received") {
                toast.info(notification.title, {
                  description: notification.message,
                  icon: <FileText className="w-5 h-5 text-primary" />,
                  duration: 5000,
                });
              }
            }

            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ["quote-notifications"] });
            queryClient.invalidateQueries({ queryKey: ["quotes"] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient, lastNotificationId]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
};

// Helper function to create quote notification
export const createQuoteNotification = async (
  userId: string,
  type: "quote_accepted" | "quote_refused" | "quote_received",
  title: string,
  message: string,
  relatedId?: string
) => {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    message,
    related_id: relatedId || null,
  });

  if (error) {
    console.error("Error creating notification:", error);
  }
};
