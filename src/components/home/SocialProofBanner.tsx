import { useState, useEffect } from "react";
import { CheckCircle2, FileText, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ProofMessage {
  text: string;
  icon: "audit" | "devis";
}

const FALLBACK_MESSAGES: ProofMessage[] = [
  { text: "Nouvel audit de conformité validé par Andrea à Lille", icon: "audit" },
  { text: "Nouveau projet de rénovation déposé à Lyon il y a 12 min", icon: "devis" },
  { text: "Nouvel audit de conformité validé par Andrea à Marseille", icon: "audit" },
  { text: "Nouveau projet de rénovation déposé à Paris il y a 8 min", icon: "devis" },
  { text: "Nouvel audit de conformité validé par Andrea à Toulouse", icon: "audit" },
  { text: "Nouveau projet de rénovation déposé à Bordeaux il y a 25 min", icon: "devis" },
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

        auditedArtisans?.forEach((a) => {
          if (a.city && a.city !== "À compléter") {
            dynamicMessages.push({
              text: `Nouvel audit de conformité validé par Andrea à ${a.city}`,
              icon: "audit",
            });
          }
        });

        recentRequests?.forEach((r) => {
          if (r.client_city) {
            const ago = getTimeAgo(r.created_at);
            dynamicMessages.push({
              text: `Nouveau projet de rénovation déposé à ${r.client_city} ${ago}`,
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
  const IconComp = current.icon === "audit" ? CheckCircle2 : FileText;
  const emoji = current.icon === "audit" ? "✅" : "📩";

  return (
    <div className="bg-navy/95 border-b border-white/10 py-2.5 overflow-hidden">
      <div className="container mx-auto px-4">
        <div
          className={cn(
            "flex items-center justify-center gap-2 text-sm text-white/90 transition-all duration-400",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
          )}
        >
          <span className="text-base leading-none">{emoji}</span>
          <span className="font-medium">{current.text}</span>
          <ShieldCheck className="h-4 w-4 text-gold flex-shrink-0 ml-1" />
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
