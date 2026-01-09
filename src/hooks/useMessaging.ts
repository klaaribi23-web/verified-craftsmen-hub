import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
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
        .select("id, first_name, last_name, avatar_url, user_id")
        .in("id", participantIds);

      // Check which participants are admins - filter out null/undefined user_ids
      const userIds = profiles?.map(p => p.user_id).filter((id): id is string => !!id) || [];
      let adminUserIds = new Set<string>();
      
      if (userIds.length > 0) {
        const { data: adminRoles } = await supabase
          .from("user_roles")
          .select("user_id")
          .in("user_id", userIds)
          .eq("role", "admin");
        
        adminUserIds = new Set(adminRoles?.map(r => r.user_id) || []);
      }

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

        // Check if participant is admin - ensure user_id exists before checking
        if (profile?.user_id && adminUserIds.has(profile.user_id)) {
          name = "ADMIN ⭐";
          photo = null;
          role = "Administration";
        } else if (artisan) {
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
    mutationFn: async ({ 
      receiverId, 
      content,
      attachment
    }: { 
      receiverId: string; 
      content: string;
      attachment?: { url: string; name: string; type: string };
    }) => {
      if (!currentProfileId) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("messages")
        .insert({
          sender_id: currentProfileId,
          receiver_id: receiverId,
          content,
          attachment_url: attachment?.url || null,
          attachment_name: attachment?.name || null,
          attachment_type: attachment?.type || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Get receiver's user_id to send notification
      const { data: receiverProfile } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name")
        .eq("id", receiverId)
        .single();

      // Get sender's name for notification
      const { data: senderProfile } = await supabase
        .from("profiles")
        .select("first_name, last_name, user_id")
        .eq("id", currentProfileId)
        .single();

      // Check if sender is admin
      let senderName = "Quelqu'un";
      if (senderProfile) {
        const { data: senderRole } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", senderProfile.user_id)
          .eq("role", "admin")
          .maybeSingle();

        if (senderRole) {
          senderName = "ADMIN ⭐";
        } else {
          // Check if sender is artisan
          const { data: artisan } = await supabase
            .from("artisans")
            .select("business_name")
            .eq("profile_id", currentProfileId)
            .maybeSingle();

          if (artisan) {
            senderName = artisan.business_name;
          } else {
            senderName = `${senderProfile.first_name || ""} ${senderProfile.last_name || ""}`.trim() || "Utilisateur";
          }
        }
      }

      // Create notification for receiver using secure RPC
      if (receiverProfile?.user_id) {
        await supabase.rpc("create_notification", {
          p_user_id: receiverProfile.user_id,
          p_type: "new_message",
          p_title: attachment ? "Nouveau fichier reçu" : "Nouveau message",
          p_message: attachment 
            ? `${senderName} vous a envoyé un fichier: ${attachment.name}`
            : `Vous avez reçu un nouveau message de ${senderName}`,
          p_related_id: data.id,
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  // Upload file mutation
  const uploadFile = useMutation({
    mutationFn: async ({ file, receiverId }: { file: File; receiverId: string }) => {
      if (!currentProfileId) throw new Error("Not authenticated");
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentProfileId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("message-attachments")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Generate signed URL for the uploaded file
      const { data: signedData, error: signError } = await supabase.storage
        .from("message-attachments")
        .createSignedUrl(fileName, 3600);

      if (signError || !signedData?.signedUrl) {
        throw new Error("Impossible de générer l'URL signée");
      }
      
      const attachmentUrl = signedData.signedUrl;

      // Determine if it's an image or audio
      const isImage = file.type.startsWith('image/');
      const isAudio = file.type.startsWith('audio/');
      let messageContent = `📎 ${file.name}`;
      
      if (isImage) {
        messageContent = "📷 Image";
      } else if (isAudio) {
        messageContent = "🎤 Message vocal";
      }

      // Send message with attachment
      return sendMessage.mutateAsync({
        receiverId,
        content: messageContent,
        attachment: {
          url: attachmentUrl,
          name: file.name,
          type: file.type,
        },
      });
    },
  });

  // Upload voice message mutation
  const uploadVoiceMessage = useMutation({
    mutationFn: async ({ audioBlob, receiverId, duration }: { audioBlob: Blob; receiverId: string; duration: number }) => {
      if (!currentProfileId) throw new Error("Not authenticated");
      
      const fileName = `${currentProfileId}/${Date.now()}-voice.webm`;
      
      const { error: uploadError } = await supabase.storage
        .from("message-attachments")
        .upload(fileName, audioBlob, { contentType: 'audio/webm' });

      if (uploadError) throw uploadError;

      // Generate signed URL for the voice message
      const { data: signedData, error: signError } = await supabase.storage
        .from("message-attachments")
        .createSignedUrl(fileName, 3600);

      if (signError || !signedData?.signedUrl) {
        throw new Error("Impossible de générer l'URL signée pour le message vocal");
      }

      const attachmentUrl = signedData.signedUrl;

      // Send message with voice attachment
      return sendMessage.mutateAsync({
        receiverId,
        content: `🎤 Message vocal • ${duration}s`,
        attachment: {
          url: attachmentUrl,
          name: `voice-${duration}s.webm`,
          type: 'audio/webm',
        },
      });
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

  // Fetch archived conversation IDs
  const { data: archivedConversationIds = [] } = useQuery({
    queryKey: ["archived-conversations", currentProfileId],
    queryFn: async () => {
      if (!currentProfileId) return [];

      const { data, error } = await supabase
        .from("conversation_archives")
        .select("participant_id")
        .eq("user_profile_id", currentProfileId);

      if (error) throw error;
      return data.map(d => d.participant_id);
    },
    enabled: !!currentProfileId,
  });

  // Archive conversation mutation
  const archiveConversation = useMutation({
    mutationFn: async (participantId: string) => {
      if (!currentProfileId) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("conversation_archives")
        .insert({
          user_profile_id: currentProfileId,
          participant_id: participantId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["archived-conversations"] });
      toast.success("Conversation archivée");
    },
    onError: () => {
      toast.error("Erreur lors de l'archivage");
    },
  });

  // Unarchive conversation mutation
  const unarchiveConversation = useMutation({
    mutationFn: async (participantId: string) => {
      if (!currentProfileId) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("conversation_archives")
        .delete()
        .eq("user_profile_id", currentProfileId)
        .eq("participant_id", participantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["archived-conversations"] });
      toast.success("Conversation désarchivée");
    },
    onError: () => {
      toast.error("Erreur lors du désarchivage");
    },
  });

  // Delete conversation mutation
  const deleteConversation = useMutation({
    mutationFn: async (participantId: string) => {
      if (!currentProfileId) throw new Error("Not authenticated");

      // Delete all messages between current user and participant
      const { error } = await supabase
        .from("messages")
        .delete()
        .or(
          `and(sender_id.eq.${currentProfileId},receiver_id.eq.${participantId}),and(sender_id.eq.${participantId},receiver_id.eq.${currentProfileId})`
        );

      if (error) throw error;

      // Also remove from archives if exists
      await supabase
        .from("conversation_archives")
        .delete()
        .eq("user_profile_id", currentProfileId)
        .eq("participant_id", participantId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["archived-conversations"] });
      toast.success("Conversation supprimée");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
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
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          // When is_read changes to true, refresh to show "Vu" status
          if (payload.new && (payload.new as { is_read?: boolean }).is_read === true) {
            queryClient.invalidateQueries({ queryKey: ["messages"] });
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
          }
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
    uploadFile,
    uploadVoiceMessage,
    archivedConversationIds,
    archiveConversation,
    unarchiveConversation,
    deleteConversation,
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