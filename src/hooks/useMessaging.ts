import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useLocation } from "react-router-dom";

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

// Demo conversations data
const DEMO_CONVERSATIONS: Conversation[] = [
  {
    id: "demo-conv-1",
    participant_id: "demo-artisan-1",
    participant_name: "Marc Lefebvre Plomberie",
    participant_photo: null,
    participant_role: "Plomberie",
    last_message: "Je vous envoie un devis pour la réparation de votre fuite.",
    last_message_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    unread_count: 1,
  },
  {
    id: "demo-conv-2",
    participant_id: "demo-artisan-2",
    participant_name: "Sophie Durant Électricité",
    participant_photo: null,
    participant_role: "Électricité",
    last_message: "Les prises ont été installées. N'hésitez pas si vous avez des questions.",
    last_message_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    unread_count: 0,
  },
  {
    id: "demo-conv-3",
    participant_id: "demo-artisan-3",
    participant_name: "Claire Dubois Peinture",
    participant_photo: null,
    participant_role: "Peinture",
    last_message: "Je comprends, merci pour votre retour.",
    last_message_time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    unread_count: 0,
  },
  {
    id: "demo-conv-4",
    participant_id: "demo-client-1",
    participant_name: "Jean Martin",
    participant_photo: null,
    participant_role: "client",
    last_message: "Super, j'attends votre devis avec impatience !",
    last_message_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    unread_count: 2,
  },
  {
    id: "demo-conv-5",
    participant_id: "demo-client-2",
    participant_name: "Marie Dupont",
    participant_photo: null,
    participant_role: "client",
    last_message: "✅ DEVIS ACCEPTÉ - Le devis a été accepté.",
    last_message_time: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    unread_count: 0,
  },
];

// Demo messages data
const DEMO_MESSAGES: Record<string, Message[]> = {
  "demo-artisan-1": [
    {
      id: "msg-1",
      sender_id: "demo-client",
      receiver_id: "demo-artisan-1",
      content: "Bonjour, j'ai un problème de fuite dans ma salle de bain. Pouvez-vous intervenir ?",
      is_read: true,
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "msg-2",
      sender_id: "demo-artisan-1",
      receiver_id: "demo-client",
      content: "Bonjour ! Oui bien sûr, pouvez-vous me décrire la fuite plus en détail ?",
      is_read: true,
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 3600000).toISOString(),
    },
    {
      id: "msg-3",
      sender_id: "demo-client",
      receiver_id: "demo-artisan-1",
      content: "C'est sous le lavabo, il y a une petite fuite au niveau du siphon.",
      is_read: true,
      created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "msg-4",
      sender_id: "demo-artisan-1",
      receiver_id: "demo-client",
      content: "Je vous envoie un devis pour la réparation de votre fuite.",
      is_read: false,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "msg-5",
      sender_id: "demo-artisan-1",
      receiver_id: "demo-client",
      content: "📋 DEVIS ENVOYÉ\n\nRéparation fuite salle de bain - Remplacement du siphon et vérification des joints\n\nPrix HT: 150.00€\nTVA (20%): 30.00€\nTotal TTC: 180.00€\n\n[QUOTE_ID:demo-quote-1]",
      is_read: false,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000 + 60000).toISOString(),
    },
  ],
  "demo-artisan-2": [
    {
      id: "msg-6",
      sender_id: "demo-client",
      receiver_id: "demo-artisan-2",
      content: "Bonjour, je souhaite faire installer des prises supplémentaires dans ma cuisine.",
      is_read: true,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "msg-7",
      sender_id: "demo-artisan-2",
      receiver_id: "demo-client",
      content: "Bonjour ! Combien de prises souhaitez-vous ajouter et où exactement ?",
      is_read: true,
      created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "msg-8",
      sender_id: "demo-client",
      receiver_id: "demo-artisan-2",
      content: "J'aurais besoin de 3 prises près du plan de travail.",
      is_read: true,
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "msg-9",
      sender_id: "demo-artisan-2",
      receiver_id: "demo-client",
      content: "📋 DEVIS ENVOYÉ\n\nInstallation de 3 prises électriques dans la cuisine - Fourniture et main d'œuvre incluses\n\nPrix HT: 280.00€\nTVA (20%): 56.00€\nTotal TTC: 336.00€\n\n[QUOTE_ID:demo-quote-2]",
      is_read: true,
      created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "msg-10",
      sender_id: "demo-client",
      receiver_id: "demo-artisan-2",
      content: "✅ DEVIS ACCEPTÉ\n\nLe devis a été accepté.",
      is_read: true,
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "msg-11",
      sender_id: "demo-artisan-2",
      receiver_id: "demo-client",
      content: "Les prises ont été installées. N'hésitez pas si vous avez des questions.",
      is_read: true,
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  "demo-artisan-3": [
    {
      id: "msg-12",
      sender_id: "demo-client",
      receiver_id: "demo-artisan-3",
      content: "Bonjour, je voudrais faire repeindre mon salon et ma chambre.",
      is_read: true,
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "msg-13",
      sender_id: "demo-artisan-3",
      receiver_id: "demo-client",
      content: "📋 DEVIS ENVOYÉ\n\nPeinture salon et chambre (40m²) - 2 couches, préparation des murs incluse\n\nPrix HT: 850.00€\nTVA (10%): 85.00€\nTotal TTC: 935.00€\n\n[QUOTE_ID:demo-quote-3]",
      is_read: true,
      created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "msg-14",
      sender_id: "demo-client",
      receiver_id: "demo-artisan-3",
      content: "❌ DEVIS REFUSÉ\n\nLe devis a été refusé.",
      is_read: true,
      created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "msg-15",
      sender_id: "demo-artisan-3",
      receiver_id: "demo-client",
      content: "Je comprends, merci pour votre retour.",
      is_read: true,
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  "demo-client-1": [
    {
      id: "msg-16",
      sender_id: "demo-client-1",
      receiver_id: "demo-artisan",
      content: "Bonjour, j'ai besoin d'un plombier pour une fuite.",
      is_read: true,
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "msg-17",
      sender_id: "demo-artisan",
      receiver_id: "demo-client-1",
      content: "Bonjour ! Bien sûr, pouvez-vous m'envoyer des photos de la fuite ?",
      is_read: true,
      created_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "msg-18",
      sender_id: "demo-client-1",
      receiver_id: "demo-artisan",
      content: "Voilà, c'est sous l'évier de la cuisine.",
      is_read: true,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "msg-19",
      sender_id: "demo-client-1",
      receiver_id: "demo-artisan",
      content: "Super, j'attends votre devis avec impatience !",
      is_read: false,
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
  ],
  "demo-client-2": [
    {
      id: "msg-20",
      sender_id: "demo-artisan",
      receiver_id: "demo-client-2",
      content: "📋 DEVIS ENVOYÉ\n\nMise aux normes tableau électrique\n\nPrix HT: 450.00€\nTVA (20%): 90.00€\nTotal TTC: 540.00€\n\n[QUOTE_ID:demo-quote-5]",
      is_read: true,
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "msg-21",
      sender_id: "demo-client-2",
      receiver_id: "demo-artisan",
      content: "✅ DEVIS ACCEPTÉ\n\nLe devis a été accepté.",
      is_read: true,
      created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

export const useMessaging = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);

  // Demo mode disabled for production
  const isDemoMode = false;

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
    queryKey: ["conversations", currentProfileId, isDemoMode],
    queryFn: async () => {
      // Return demo data if in demo mode
      if (isDemoMode) {
        return DEMO_CONVERSATIONS;
      }

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
    enabled: isDemoMode || !!currentProfileId,
  });

  // Fetch messages for a specific conversation
  const useConversationMessages = (participantId: string | null) => {
    return useQuery({
      queryKey: ["messages", currentProfileId, participantId, isDemoMode],
      queryFn: async () => {
        // Return demo data if in demo mode
        if (isDemoMode && participantId) {
          return DEMO_MESSAGES[participantId] || [];
        }

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
      enabled: isDemoMode || (!!currentProfileId && !!participantId),
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
        (payload) => {
          console.log("New message received:", payload);
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
        (payload) => {
          console.log("Message sent:", payload);
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
    isDemoMode,
  };
};

// Format time for display
export const formatMessageTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  } else if (days === 1) {
    return "Hier";
  } else if (days < 7) {
    return date.toLocaleDateString("fr-FR", { weekday: "short" });
  } else {
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }
};
