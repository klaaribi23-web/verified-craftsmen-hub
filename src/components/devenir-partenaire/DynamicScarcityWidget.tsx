import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Users, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

const TOP_CITIES = [
  "Paris", "Lyon", "Marseille", "Toulouse", "Bordeaux", 
  "Lille", "Nice", "Nantes", "Strasbourg", "Montpellier"
];
const MAX_PER_CITY = 2;

interface CitySlot {
  city: string;
  taken: number;
  remaining: number;
}

export const DynamicScarcityWidget = () => {
  const { data: citySlots = [] } = useQuery({
    queryKey: ["scarcity-slots"],
    queryFn: async () => {
      // Count active artisans per city for top cities
      const results: CitySlot[] = [];
      
      for (const city of TOP_CITIES) {
        const { count } = await supabase
          .from("artisans")
          .select("id", { count: "exact", head: true })
          .eq("status", "active")
          .ilike("city", `%${city}%`);
        
        const taken = Math.min(count || 0, MAX_PER_CITY);
        results.push({
          city,
          taken,
          remaining: MAX_PER_CITY - taken,
        });
      }
      
      return results.sort((a, b) => a.remaining - b.remaining);
    },
    staleTime: 2 * 60 * 1000,
  });

  const fullCities = citySlots.filter(c => c.remaining === 0).length;
  const almostFull = citySlots.filter(c => c.remaining === 1).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="max-w-md mx-auto mt-8"
    >
      {/* Summary banner */}
      <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 mb-3">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-accent" />
          <span className="text-sm font-bold text-foreground">Disponibilité en temps réel</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {fullCities > 0 && (
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-destructive" />
              <span className="font-bold text-destructive">{fullCities} ville{fullCities > 1 ? "s" : ""} complète{fullCities > 1 ? "s" : ""}</span>
            </span>
          )}
          {almostFull > 0 && (
            <span className="flex items-center gap-1 text-accent font-bold">
              {almostFull} ville{almostFull > 1 ? "s" : ""} — 1 place restante
            </span>
          )}
        </div>
      </div>

      {/* City grid */}
      <div className="grid grid-cols-2 gap-2">
        {citySlots.slice(0, 6).map((slot) => (
          <div
            key={slot.city}
            className={`rounded-lg border px-3 py-2 flex items-center justify-between text-xs ${
              slot.remaining === 0
                ? "border-destructive/30 bg-destructive/5"
                : slot.remaining === 1
                ? "border-accent/30 bg-accent/5"
                : "border-border bg-card"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-muted-foreground" />
              <span className="font-medium text-foreground">{slot.city}</span>
            </span>
            <span
              className={`font-bold ${
                slot.remaining === 0
                  ? "text-destructive"
                  : slot.remaining === 1
                  ? "text-accent"
                  : "text-muted-foreground"
              }`}
            >
              {slot.remaining === 0 ? "Complet" : `${slot.remaining}/${MAX_PER_CITY}`}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
