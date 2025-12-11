import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  id: string;
  participant_id: string;
  participant_name: string;
  participant_photo: string | null;
  participant_role: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export const useMessaging = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);

  // Get current user's profile ID
  useEffect(() => {
    const fetchProfileId = async () => {
      if (!user?.id) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();
      
      if (data) {
        setCurrentProfileId(data.id);
      }
    };

    fetchProfileId();
  }, [user?.id]);

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ["conversations", currentProfileId],
    queryFn: async () => {
      if (!currentProfileId) return [];

      // Get all messages involving current user
      const { data: messages, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${currentProfileId},receiver_id.eq.${currentProfileId}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group by conversation partner
      const conversationMap = new Map<string, {
        participant_id: string;
        last_message: Message;
        unread_count: number;
      }>();

      messages?.forEach((msg) => {
        const partnerId = msg.sender_id === currentProfileId ? msg.receiver_id : msg.sender_id;
        
        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, {
            participant_id: partnerId,
            last_message: msg,
            unread_count: 0,
          });
        }

        if (msg.receiver_id === currentProfileId && !msg.is_read) {
          const conv = conversationMap.get(partnerId)!;
          conv.unread_count++;
        }
      });

      // Fetch profile details for each participant
      const participantIds = Array.from(conversationMap.keys());
      if (participantIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url")
        .in("id", participantIds);

      // Fetch artisan details if applicable
      const { data: artisans } = await supabase
        .from("artisans")
        .select("profile_id, business_name, photo_url, category:categories(name)")
        .in("profile_id", participantIds);

      const artisanMap = new Map(artisans?.map(a => [a.profile_id, a]) || []);
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const result: Conversation[] = [];
      
      conversationMap.forEach((conv, participantId) => {
        const profile = profileMap.get(participantId);
        const artisan = artisanMap.get(participantId);
        
        let name = "Utilisateur";
        let photo = null;
        let role = "client";

        if (artisan) {
          name = artisan.business_name;
          photo = artisan.photo_url;
          role = artisan.category?.name || "Artisan";
        } else if (profile) {
          name = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Utilisateur";
          photo = profile.avatar_url;
        }

        result.push({
          id: participantId,
          participant_id: participantId,
          participant_name: name,
          participant_photo: photo,
          participant_role: role,
          last_message: conv.last_message.content,
          last_message_time: conv.last_message.created_at,
          unread_count: conv.unread_count,
        });
      });

      return result.sort((a, b) => 
        new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
      );
    },
    enabled: !!currentProfileId,
  });

  // Fetch messages for a specific conversation
  const useConversationMessages = (participantId: string | null) => {
    return useQuery({
      queryKey: ["messages", currentProfileId, participantId],
      queryFn: async () => {
        if (!currentProfileId || !participantId) return [];

        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .or(
            `and(sender_id.eq.${currentProfileId},receiver_id.eq.${participantId}),and(sender_id.eq.${participantId},receiver_id.eq.${currentProfileId})`
          )
          .order("created_at", { ascending: true });

        if (error) throw error;
        return data as Message[];
      },
      enabled: !!currentProfileId && !!participantId,
    });
  };

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async ({ receiverId, content }: { receiverId: string; content: string }) => {
      if (!currentProfileId) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("messages")
        .insert({
          sender_id: currentProfileId,
          receiver_id: receiverId,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  // Mark messages as read
  const markAsRead = useMutation({
    mutationFn: async (senderId: string) => {
      if (!currentProfileId) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("sender_id", senderId)
        .eq("receiver_id", currentProfileId)
        .eq("is_read", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  // Real-time subscription
  useEffect(() => {
    if (!currentProfileId) return;

    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${currentProfileId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages"] });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${currentProfileId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages"] });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentProfileId, queryClient]);

  return {
    currentProfileId,
    conversations,
    conversationsLoading,
    useConversationMessages,
    sendMessage,
    markAsRead,
  };
};

// Helper function to format message time
export const formatMessageTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `${diffMins} min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}j`;
  
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
};