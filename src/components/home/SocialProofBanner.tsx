import { useState, useEffect, useMemo } from "react";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ProofMessage {
  text: string;
}

const FALLBACK_MESSAGES: ProofMessage[] = [
  { text: "Menuisier à Lyon vient d'activer son secteur exclusif" },
  { text: "Plombier à Nice a reçu 5 leads qualifiés ce matin" },
  { text: "Électricien à Paris — zone réservée il y a 12 min" },
  { text: "Maçon à Bordeaux vient de décrocher un chantier à 28 000€" },
  { text: "Peintre à Lille a activé son exclusivité secteur" },
  { text: "Carreleur à Marseille — 3 demandes reçues aujourd'hui" },
  { text: "Plaquiste à Nantes vient de sécuriser sa zone" },
  { text: "Couvreur à Strasbourg a encaissé 2 devis cette semaine" },
];

const SocialProofBanner = () => {
  const [messages, setMessages] = useState<ProofMessage[]>(FALLBACK_MESSAGES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        const { data: auditedArtisans } = await supabase
          .from("public_artisans")
          .select("business_name, city, created_at")
          .eq("is_audited", true)
          .order("created_at", { ascending: false })
          .limit(3);

        const { data: recentRequests } = await supabase
          .from("project_requests")
          .select("client_city, created_at")
          .order("created_at", { ascending: false })
          .limit(3);

        const dynamicMessages: ProofMessage[] = [];
        const actions = [
          "vient d'activer son secteur exclusif",
          "a sécurisé sa zone",
          "a reçu 3 leads qualifiés",
        ];

        auditedArtisans?.forEach((a, i) => {
          if (a.city && a.city !== "À compléter") {
            dynamicMessages.push({
              text: `Artisan à ${a.city} ${actions[i % actions.length]}`,
            });
          }
        });

        recentRequests?.forEach((r) => {
          if (r.client_city) {
            const ago = getTimeAgo(r.created_at);
            dynamicMessages.push({
              text: `Nouveau projet premium déposé à ${r.client_city} ${ago}`,
            });
          }
        });

        if (dynamicMessages.length >= 3) {
          setMessages(dynamicMessages);
        }
      } catch (err) {
        console.error("Social proof fetch error:", err);
      }
    };

    fetchRecentActivity();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % messages.length);
        setIsVisible(true);
      }, 400);
    }, 4000);
    return () => clearInterval(interval);
  }, [messages.length]);

  const current = messages[currentIndex];

  return (
    <div className="bg-navy-dark border-b border-[#D4AF37]/10 py-2.5 overflow-hidden">
      <div className="container mx-auto px-4">
        <div
          className={cn(
            "flex items-center justify-center gap-2 text-sm text-white/80 transition-all duration-400",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
          )}
        >
          <span className="relative flex h-2 w-2 mr-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]"></span>
          </span>
          <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider mr-1.5">Live</span>
          <span className="font-medium">{current.text}</span>
          <ShieldCheck className="h-3.5 w-3.5 text-[#D4AF37]/60 flex-shrink-0 ml-1" />
        </div>
      </div>
    </div>
  );
};

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 60) return `il y a ${Math.max(1, minutes)} min`;
  if (hours < 24) return `il y a ${hours}h`;
  if (days < 7) return `il y a ${days}j`;
  return "récemment";
}

export default SocialProofBanner;
