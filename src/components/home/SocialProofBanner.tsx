import { useState, useEffect, useMemo } from "react";
import { CheckCircle2, FileText, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ProofMessage {
  text: string;
  icon: "audit" | "devis" | "artisan";
}

const FALLBACK_MESSAGES: ProofMessage[] = [
  { text: "✅ Nouvel artisan validé à Lille", icon: "artisan" },
  { text: "📩 Demande de devis reçue à Lyon", icon: "devis" },
  { text: "✅ Audit terrain réalisé à Marseille", icon: "audit" },
  { text: "📩 Nouvelle demande de devis à Paris", icon: "devis" },
  { text: "✅ Artisan certifié à Toulouse", icon: "artisan" },
  { text: "📩 Demande de devis reçue à Bordeaux", icon: "devis" },
];

const SocialProofBanner = () => {
  const [messages, setMessages] = useState<ProofMessage[]>(FALLBACK_MESSAGES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Fetch real data for dynamic messages
  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        // Fetch recent audited artisans
        const { data: auditedArtisans } = await supabase
          .from("public_artisans")
          .select("business_name, city, created_at")
          .eq("is_audited", true)
          .order("created_at", { ascending: false })
          .limit(3);

        // Fetch recent project requests
        const { data: recentRequests } = await supabase
          .from("project_requests")
          .select("client_city, created_at")
          .order("created_at", { ascending: false })
          .limit(3);

        const dynamicMessages: ProofMessage[] = [];

        auditedArtisans?.forEach((a) => {
          if (a.city && a.city !== "À compléter") {
            const ago = getTimeAgo(a.created_at);
            dynamicMessages.push({
              text: `✅ Dernier audit réalisé à ${a.city} ${ago}`,
              icon: "audit",
            });
          }
        });

        recentRequests?.forEach((r) => {
          if (r.client_city) {
            const ago = getTimeAgo(r.created_at);
            dynamicMessages.push({
              text: `📩 Nouvelle demande de devis à ${r.client_city} ${ago}`,
              icon: "devis",
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

  // Rotate messages
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
    <div className="bg-navy/95 border-b border-white/10 py-2.5 overflow-hidden">
      <div className="container mx-auto px-4">
        <div
          className={cn(
            "flex items-center justify-center gap-2 text-sm text-white/90 transition-all duration-400",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
          )}
        >
          <span className="text-base leading-none">{current.text.substring(0, 2)}</span>
          <span className="font-medium">{current.text.substring(2)}</span>
        </div>
      </div>
    </div>
  );
};

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (hours < 1) return "il y a quelques minutes";
  if (hours < 24) return `il y a ${hours}h`;
  if (days < 7) return `il y a ${days}j`;
  return "récemment";
}

export default SocialProofBanner;
