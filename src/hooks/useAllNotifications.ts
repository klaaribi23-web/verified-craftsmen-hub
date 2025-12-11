import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { FileText, CheckCircle, XCircle, UserPlus, Briefcase, Info } from "lucide-react";

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

export const useAllNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [lastNotificationId, setLastNotificationId] = useState<string | null>(null);

  // Fetch all notifications for the user
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["all-notifications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

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
      queryClient.invalidateQueries({ queryKey: ["all-notifications"] });
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
        .eq("is_read", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-notifications"] });
    },
  });

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("all-notifications-realtime")
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
          
          // Avoid duplicate toasts
          if (notification.id !== lastNotificationId) {
            setLastNotificationId(notification.id);
            
            // Show toast based on notification type
            const toastType = getToastType(notification.type);
            if (toastType === "success") {
              toast.success(notification.title, {
                description: notification.message,
                duration: 5000,
              });
            } else if (toastType === "error") {
              toast.error(notification.title, {
                description: notification.message,
                duration: 5000,
              });
            } else {
              toast.info(notification.title, {
                description: notification.message,
                duration: 5000,
              });
            }
          }

          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ["all-notifications"] });
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

// Helper to determine toast type
function getToastType(type: string): "success" | "error" | "info" {
  switch (type) {
    case "quote_accepted":
    case "approval":
    case "mission_assigned":
    case "document_verified":
      return "success";
    case "quote_refused":
    case "rejection":
    case "document_rejected":
      return "error";
    case "new_message":
    default:
      return "info";
  }
}

// Helper function to create notifications (can be used anywhere)
export const createNotification = async (
  userId: string,
  type: string,
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
