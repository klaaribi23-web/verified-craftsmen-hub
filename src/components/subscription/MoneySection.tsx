import { motion } from "framer-motion";
import { TrendingUp, Euro, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STRIPE_PRICES } from "@/config/subscriptionPlans";

interface MoneySectionProps {
  city?: string;
  categoryName?: string;
  onCheckout: (priceId: string) => void;
  isLoading?: boolean;
}

const SECTOR_DATA: Record<string, { avgTicket: number; missionsPerMonth: number }> = {
  "Panneaux solaires": { avgTicket: 9000, missionsPerMonth: 4 },
  "PAC / Chauffage": { avgTicket: 12000, missionsPerMonth: 3 },
  "Plomberie": { avgTicket: 3500, missionsPerMonth: 6 },
  "Électricité": { avgTicket: 4000, missionsPerMonth: 5 },
  "Rénovation globale": { avgTicket: 25000, missionsPerMonth: 2 },
  "Menuiserie / Fenêtres": { avgTicket: 6000, missionsPerMonth: 4 },
  "Toiture / Charpente": { avgTicket: 15000, missionsPerMonth: 2 },
  "Peinture / Décoration": { avgTicket: 4500, missionsPerMonth: 5 },
  "Carrelage / Sol": { avgTicket: 5000, missionsPerMonth: 4 },
};

const DEFAULT_DATA = { avgTicket: 5000, missionsPerMonth: 4 };

const MoneySection = ({ city, categoryName, onCheckout, isLoading }: MoneySectionProps) => {
  const sectorData = categoryName
    ? Object.entries(SECTOR_DATA).find(([k]) => categoryName.toLowerCase().includes(k.toLowerCase()))?.[1] || DEFAULT_DATA
    : DEFAULT_DATA;

  const conversionRate = 0.30;
  const signedPerMonth = Math.round(sectorData.missionsPerMonth * conversionRate * 10) / 10;
  const monthlyRevenue = Math.round(signedPerMonth * sectorData.avgTicket);
  const yearlyRevenue = monthlyRevenue * 12;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden mb-8 border-2 border-accent/30"
      style={{
        background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.85) 100%)",
      }}
    >
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-black text-primary-foreground">
              Projection de revenus — {city || "votre zone"}
            </h3>
            <p className="text-xs text-primary-foreground/60">
              Basé sur les données moyennes du secteur {categoryName || "BTP"}
            </p>
          </div>
        </div>

        {/* Revenue cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-primary-foreground/10 backdrop-blur rounded-xl p-4 text-center">
            <p className="text-2xl font-black text-primary-foreground">{sectorData.missionsPerMonth}</p>
            <p className="text-[10px] text-primary-foreground/50 mt-1">Projets/mois estimés</p>
          </div>
          <div className="bg-primary-foreground/10 backdrop-blur rounded-xl p-4 text-center">
            <p className="text-2xl font-black text-primary-foreground">{signedPerMonth}</p>
            <p className="text-[10px] text-primary-foreground/50 mt-1">Chantiers signés/mois</p>
          </div>
          <div className="bg-accent/20 backdrop-blur rounded-xl p-4 text-center border border-accent/30">
            <p className="text-2xl font-black text-accent">{monthlyRevenue.toLocaleString("fr-FR")}€</p>
            <p className="text-[10px] text-primary-foreground/50 mt-1">CA mensuel estimé</p>
          </div>
          <div className="bg-accent/20 backdrop-blur rounded-xl p-4 text-center border border-accent/30">
            <p className="text-2xl font-black text-accent">{yearlyRevenue.toLocaleString("fr-FR")}€</p>
            <p className="text-[10px] text-primary-foreground/50 mt-1">CA annuel estimé</p>
          </div>
        </div>

        {/* ROI highlight */}
        <div className="bg-primary-foreground/5 rounded-xl p-5 text-center mb-6 border border-primary-foreground/10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Euro className="w-5 h-5 text-accent" />
            <span className="text-sm font-bold text-accent">Retour sur investissement</span>
          </div>
          <p className="text-4xl font-black text-primary-foreground mb-1">
            x{Math.round((monthlyRevenue / 99) * 100) / 100}
          </p>
          <p className="text-xs text-primary-foreground/60">
            Pour 99€/mois investis, vous générez en moyenne <strong className="text-accent">{monthlyRevenue.toLocaleString("fr-FR")}€</strong> de chiffre d'affaires
          </p>
        </div>

        {/* CTA */}
        <Button
          onClick={() => onCheckout(STRIPE_PRICES.artisan_valide.monthly)}
          disabled={isLoading}
          className="w-full bg-accent text-accent-foreground font-black text-sm uppercase tracking-wider hover:bg-accent/90 h-12"
        >
          <Zap className="w-5 h-5 mr-2" />
          ACTIVER MON EXCLUSIVITÉ — 99€/mois
        </Button>
        <p className="text-[10px] text-center text-primary-foreground/40 mt-3">
          * Estimations basées sur les données moyennes du réseau. Satisfait ou remboursé 30 jours.
        </p>
      </div>
    </motion.div>
  );
};

export default MoneySection;
