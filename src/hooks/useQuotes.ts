import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEffect, useState } from "react";

export interface Quote {
  id: string;
  conversation_id: string;
  artisan_id: string;
  client_id: string;
  description: string;
  price_ht: number;
  tva_rate: number;
  price_ttc: number;
  status: "pending" | "accepted" | "refused";
  message_id: string | null;
  created_at: string;
  updated_at: string;
  artisan?: {
    business_name: string;
    photo_url: string | null;
  };
  client?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
}

export const useQuotes = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [artisanId, setArtisanId] = useState<string | null>(null);

  // Get current user's profile ID and artisan ID
  useEffect(() => {
    const fetchIds = async () => {
      if (!user?.id) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        setCurrentProfileId(profile.id);
      }

      const { data: artisan } = await supabase
        .from("artisans")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (artisan) {
        setArtisanId(artisan.id);
      }
    };

    fetchIds();
  }, [user?.id]);

  // Fetch quotes for artisan
  const { data: artisanQuotes = [], isLoading: artisanQuotesLoading } = useQuery({
    queryKey: ["quotes", "artisan", artisanId],
    queryFn: async () => {
      if (!artisanId) return [];

      const { data, error } = await supabase
        .from("quotes")
        .select(`
          *,
          client:profiles!quotes_client_id_fkey(first_name, last_name, avatar_url)
        `)
        .eq("artisan_id", artisanId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Quote[];
    },
    enabled: !!artisanId,
  });

  // Fetch quotes for client
  const { data: clientQuotes = [], isLoading: clientQuotesLoading } = useQuery({
    queryKey: ["quotes", "client", currentProfileId],
    queryFn: async () => {
      if (!currentProfileId) return [];

      const { data, error } = await supabase
        .from("quotes")
        .select(`
          *,
          artisan:artisans!quotes_artisan_id_fkey(business_name, photo_url)
        `)
        .eq("client_id", currentProfileId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Quote[];
    },
    enabled: !!currentProfileId,
  });

  // Create quote mutation
  const createQuote = useMutation({
    mutationFn: async ({
      conversationId,
      clientId,
      description,
      priceHt,
      tvaRate,
    }: {
      conversationId: string;
      clientId: string;
      description: string;
      priceHt: number;
      tvaRate: number;
    }) => {
      if (!artisanId) throw new Error("Not an artisan");

      // Create the quote
      const { data: quote, error: quoteError } = await supabase
        .from("quotes")
        .insert({
          conversation_id: conversationId,
          artisan_id: artisanId,
          client_id: clientId,
          description,
          price_ht: priceHt,
          tva_rate: tvaRate,
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Send message with quote reference
      const priceTtc = priceHt * (1 + tvaRate / 100);
      const messageContent = `📋 DEVIS ENVOYÉ\n\n${description}\n\nPrix HT: ${priceHt.toFixed(2)}€\nTVA (${tvaRate}%): ${(priceTtc - priceHt).toFixed(2)}€\nTotal TTC: ${priceTtc.toFixed(2)}€\n\n[QUOTE_ID:${quote.id}]`;

      const { data: message, error: messageError } = await supabase
        .from("messages")
        .insert({
          sender_id: currentProfileId!,
          receiver_id: clientId,
          content: messageContent,
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Update quote with message_id
      await supabase
        .from("quotes")
        .update({ message_id: message.id })
        .eq("id", quote.id);

      return quote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  // Update quote status mutation
  const updateQuoteStatus = useMutation({
    mutationFn: async ({
      quoteId,
      status,
      artisanProfileId,
    }: {
      quoteId: string;
      status: "accepted" | "refused";
      artisanProfileId: string;
    }) => {
      if (!currentProfileId) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("quotes")
        .update({ status })
        .eq("id", quoteId)
        .select()
        .single();

      if (error) throw error;

      // Send notification message
      const statusText = status === "accepted" ? "✅ DEVIS ACCEPTÉ" : "❌ DEVIS REFUSÉ";
      await supabase.from("messages").insert({
        sender_id: currentProfileId,
        receiver_id: artisanProfileId,
        content: `${statusText}\n\nLe devis a été ${status === "accepted" ? "accepté" : "refusé"}.`,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  // Real-time subscription
  useEffect(() => {
    if (!currentProfileId && !artisanId) return;

    const channel = supabase
      .channel("quotes-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "quotes",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["quotes"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentProfileId, artisanId, queryClient]);

  return {
    currentProfileId,
    artisanId,
    artisanQuotes,
    artisanQuotesLoading,
    clientQuotes,
    clientQuotesLoading,
    createQuote,
    updateQuoteStatus,
  };
};
