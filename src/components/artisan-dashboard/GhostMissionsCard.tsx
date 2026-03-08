import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, MapPin, Euro, Clock, ArrowRight, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const FALLBACK_MISSIONS = [
  { title: "Rénovation complète salle de bain", city: "Lyon 6ème", budget: "12 000€", urgency: false, time: "il y a 2h", applicants: 0 },
  { title: "Installation PAC air-eau", city: "Villeurbanne", budget: "25 000€", urgency: true, time: "il y a 45min", applicants: 1 },
  { title: "Réfection toiture 120m²", city: "Écully", budget: "18 500€", urgency: false, time: "il y a 4h", applicants: 0 },
  { title: "Pose panneaux solaires 6kWc", city: "Caluire-et-Cuire", budget: "15 000€", urgency: true, time: "il y a 1h", applicants: 2 },
];

const formatTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  return `il y a ${Math.floor(hours / 24)}j`;
};

export const GhostMissionsCard = () => {
  // Fetch real demo_missions from DB
  const { data: realMissions } = useQuery({
    queryKey: ["ghost-missions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("demo_missions")
        .select("title, city, budget, created_at, applicants_count, status")
        .order("created_at", { ascending: false })
        .limit(6);
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const missions = realMissions && realMissions.length >= 3
    ? realMissions.map(m => ({
        title: m.title,
        city: m.city,
        budget: m.budget ? `${m.budget.toLocaleString("fr-FR")}€` : "Sur devis",
        urgency: m.status === "urgent",
        time: formatTimeAgo(m.created_at),
        applicants: m.applicants_count || 0,
      }))
    : FALLBACK_MISSIONS;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border-2 border-accent/30 shadow-lg overflow-hidden mb-6"
    >
      {/* Header */}
      <div className="bg-accent/10 border-b border-accent/20 px-4 md:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
            <Eye className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Missions disponibles dans votre zone</h3>
            <p className="text-xs text-muted-foreground">{missions.length} projets en attente d'un artisan qualifié</p>
          </div>
        </div>
        <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs font-bold animate-pulse w-fit">
          🔴 LIVE — Temps réel
        </Badge>
      </div>

      {/* Blurred missions */}
      <div className="relative">
        <div className="divide-y divide-border">
          {missions.slice(0, 4).map((mission, i) => (
            <div key={i} className="px-4 md:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {mission.urgency && (
                    <Badge className="bg-destructive text-white border-0 text-[10px] px-1.5 py-0">URGENT</Badge>
                  )}
                  <span className="font-semibold text-sm text-foreground truncate">{mission.title}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {mission.city}</span>
                  <span className="flex items-center gap-1"><Euro className="w-3 h-3" /> {mission.budget}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {mission.time}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{mission.applicants} candidat{mission.applicants !== 1 ? "s" : ""}</span>
                <div className="blur-[6px] pointer-events-none select-none">
                  <Button size="sm" variant="gold" className="text-xs">
                    Voir le projet
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Overlay lock */}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent flex flex-col items-center justify-end pb-6">
          <div className="text-center px-4">
            <div className="w-14 h-14 rounded-full bg-accent/10 border-2 border-accent/30 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6 text-accent" />
            </div>
            <h4 className="font-bold text-foreground text-lg mb-1">
              Ces missions vous attendent
            </h4>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              Activez votre licence pour débloquer l'accès aux projets qualifiés de votre zone.
            </p>
            <Link to="/artisan/abonnement">
              <Button variant="gold" size="lg" className="font-black uppercase tracking-wider">
                🔒 Débloquer mes missions <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <p className="text-[10px] text-muted-foreground mt-2">99€ HT/mois · Sans engagement · Satisfait ou remboursé 30j</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
