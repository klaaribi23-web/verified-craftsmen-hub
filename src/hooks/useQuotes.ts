import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { createQuoteNotification } from "./useQuoteNotifications";

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

// Demo quotes data
const DEMO_QUOTES: Quote[] = [
  {
    id: "demo-quote-1",
    conversation_id: "demo-conv-1",
    artisan_id: "11111111-1111-1111-1111-111111111111",
    client_id: "demo-client-1",
    description: "Réparation fuite salle de bain - Remplacement du siphon et vérification des joints",
    price_ht: 150,
    tva_rate: 20,
    price_ttc: 180,
    status: "pending",
    message_id: null,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    artisan: {
      business_name: "Marc Lefebvre Plomberie",
      photo_url: null,
    },
    client: {
      first_name: "Jean",
      last_name: "Martin",
      avatar_url: null,
    },
  },
  {
    id: "demo-quote-2",
    conversation_id: "demo-conv-2",
    artisan_id: "22222222-2222-2222-2222-222222222222",
    client_id: "demo-client-2",
    description: "Installation de 3 prises électriques dans la cuisine - Fourniture et main d'oeuvre incluses",
    price_ht: 280,
    tva_rate: 20,
    price_ttc: 336,
    status: "accepted",
    message_id: null,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    artisan: {
      business_name: "Sophie Durant Électricité",
      photo_url: null,
    },
    client: {
      first_name: "Marie",
      last_name: "Dupont",
      avatar_url: null,
    },
  },
  {
    id: "demo-quote-3",
    conversation_id: "demo-conv-3",
    artisan_id: "44444444-4444-4444-4444-444444444444",
    client_id: "demo-client-1",
    description: "Peinture salon et chambre (40m²) - 2 couches, préparation des murs incluse",
    price_ht: 850,
    tva_rate: 10,
    price_ttc: 935,
    status: "refused",
    message_id: null,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    artisan: {
      business_name: "Claire Dubois Peinture",
      photo_url: null,
    },
    client: {
      first_name: "Jean",
      last_name: "Martin",
      avatar_url: null,
    },
  },
  {
    id: "demo-quote-4",
    conversation_id: "demo-conv-4",
    artisan_id: "55555555-5555-5555-5555-555555555555",
    client_id: "demo-client-3",
    description: "Construction mur de clôture en parpaings - 10m linéaire, hauteur 1.8m",
    price_ht: 2500,
    tva_rate: 20,
    price_ttc: 3000,
    status: "pending",
    message_id: null,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    artisan: {
      business_name: "Antoine Roux Maçonnerie",
      photo_url: null,
    },
    client: {
      first_name: "Pierre",
      last_name: "Bernard",
      avatar_url: null,
    },
  },
  {
    id: "demo-quote-5",
    conversation_id: "demo-conv-5",
    artisan_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    client_id: "demo-client-2",
    description: "Mise aux normes tableau électrique - Remplacement disjoncteurs et vérification installation",
    price_ht: 450,
    tva_rate: 20,
    price_ttc: 540,
    status: "accepted",
    message_id: null,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    artisan: {
      business_name: "Marie Lambert Électricité",
      photo_url: null,
    },
    client: {
      first_name: "Marie",
      last_name: "Dupont",
      avatar_url: null,
    },
  },
];

export const useQuotes = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [artisanId, setArtisanId] = useState<string | null>(null);

  // Check if we're in demo mode
  const isDemo = location.search.includes("demo") || location.pathname.includes("/artisan/") || location.pathname.includes("/client/");
  const isDemoMode = !user && isDemo;

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
    queryKey: ["quotes", "artisan", artisanId, isDemoMode],
    queryFn: async () => {
      // Return demo data if in demo mode
      if (isDemoMode) {
        return DEMO_QUOTES;
      }

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
    enabled: isDemoMode || !!artisanId,
  });

  // Fetch quotes for client
  const { data: clientQuotes = [], isLoading: clientQuotesLoading } = useQuery({
    queryKey: ["quotes", "client", currentProfileId, isDemoMode],
    queryFn: async () => {
      // Return demo data if in demo mode
      if (isDemoMode) {
        return DEMO_QUOTES;
      }

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
    enabled: isDemoMode || !!currentProfileId,
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

      // Get artisan info for notification
      const { data: artisanData } = await supabase
        .from("artisans")
        .select("business_name")
        .eq("id", artisanId)
        .single();

      // Get client user_id for notification
      const { data: clientProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("id", clientId)
        .single();

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

      // Create notification for client
      if (clientProfile?.user_id) {
        await createQuoteNotification(
          clientProfile.user_id,
          "quote_received",
          "Nouveau devis reçu",
          `${artisanData?.business_name || "Un artisan"} vous a envoyé un devis de ${priceTtc.toFixed(2)}€`,
          quote.id
        );
      }

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

      // Get quote details
      const { data: quoteData } = await supabase
        .from("quotes")
        .select("price_ttc, artisan_id")
        .eq("id", quoteId)
        .single();

      // Get client name for notification
      const { data: clientProfile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", currentProfileId)
        .single();

      // Get artisan user_id for notification
      const { data: artisanData } = await supabase
        .from("artisans")
        .select("user_id")
        .eq("id", quoteData?.artisan_id)
        .single();

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

      // Create notification for artisan
      if (artisanData?.user_id) {
        const clientName = clientProfile 
          ? `${clientProfile.first_name || ""} ${clientProfile.last_name || ""}`.trim() || "Un client"
          : "Un client";

        await createQuoteNotification(
          artisanData.user_id,
          status === "accepted" ? "quote_accepted" : "quote_refused",
          status === "accepted" ? "Devis accepté !" : "Devis refusé",
          status === "accepted"
            ? `${clientName} a accepté votre devis de ${quoteData?.price_ttc?.toFixed(2) || ""}€`
            : `${clientName} a refusé votre devis`,
          quoteId
        );
      }

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
    isDemoMode,
  };
};
