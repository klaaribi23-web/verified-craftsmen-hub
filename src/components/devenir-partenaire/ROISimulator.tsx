import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { TrendingUp, Euro, Calculator, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const METIERS = [
  { label: "Panneaux solaires", avgTicket: 9000, missionsPerMonth: 4 },
  { label: "PAC / Chauffage", avgTicket: 12000, missionsPerMonth: 3 },
  { label: "Plomberie", avgTicket: 3500, missionsPerMonth: 6 },
  { label: "Électricité", avgTicket: 4000, missionsPerMonth: 5 },
  { label: "Rénovation globale", avgTicket: 25000, missionsPerMonth: 2 },
  { label: "Menuiserie / Fenêtres", avgTicket: 6000, missionsPerMonth: 4 },
  { label: "Toiture / Charpente", avgTicket: 15000, missionsPerMonth: 2 },
  { label: "Peinture / Décoration", avgTicket: 4500, missionsPerMonth: 5 },
  { label: "Carrelage / Sol", avgTicket: 5000, missionsPerMonth: 4 },
];

interface ROISimulatorProps {
  onCTA: () => void;
}

const ROISimulator = ({ onCTA }: ROISimulatorProps) => {
  const [selectedMetier, setSelectedMetier] = useState(0);
  const [conversionRate, setConversionRate] = useState(30); // percent

  const metier = METIERS[selectedMetier];
  const monthlyMissions = metier.missionsPerMonth;
  const signedPerMonth = Math.round((monthlyMissions * conversionRate) / 100 * 10) / 10;
  const monthlyRevenue = Math.round(signedPerMonth * metier.avgTicket);
  const yearlyRevenue = monthlyRevenue * 12;
  const licenseCost = 99;
  const roi = Math.round((monthlyRevenue / licenseCost) * 100) / 100;

  return (
    <section className="py-16 lg:py-24 bg-primary relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-60 h-60 rounded-full bg-gold/5 blur-3xl" />
      </div>
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/20 border border-gold/30 mb-4">
            <Calculator className="w-4 h-4 text-gold" />
            <span className="text-sm font-bold text-gold">Simulateur de rentabilité</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-3">
            Combien peut vous rapporter l'Alliance ?
          </h2>
          <p className="text-primary-foreground/60 max-w-lg mx-auto">
            Sélectionnez votre métier et estimez votre retour sur investissement.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Card className="border-2 border-gold/30 bg-card/90 backdrop-blur overflow-hidden">
              <CardContent className="p-6 md:p-8">
                {/* Métier selector */}
                <div className="mb-8">
                  <label className="text-sm font-bold text-foreground mb-3 block">Votre métier</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {METIERS.map((m, i) => (
                      <button
                        key={m.label}
                        onClick={() => setSelectedMetier(i)}
                        className={`px-3 py-2.5 rounded-lg text-xs font-medium transition-all border-2 text-left ${
                          i === selectedMetier
                            ? "border-accent bg-accent/10 text-foreground"
                            : "border-border bg-muted/30 text-muted-foreground hover:border-accent/40"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conversion rate slider */}
                <div className="mb-8">
                  <label className="text-sm font-bold text-foreground mb-1 block">
                    Taux de signature estimé : <span className="text-accent">{conversionRate}%</span>
                  </label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Nos membres signent en moyenne 25-40% des projets présentés.
                  </p>
                  <input
                    type="range"
                    min={10}
                    max={60}
                    step={5}
                    value={conversionRate}
                    onChange={(e) => setConversionRate(Number(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>Prudent (10%)</span>
                    <span>Moyen (30%)</span>
                    <span>Performant (60%)</span>
                  </div>
                </div>

                {/* Results */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <div className="bg-muted/50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-black text-foreground">{monthlyMissions}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Projets/mois estimés</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-black text-foreground">{signedPerMonth}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Chantiers signés/mois</p>
                  </div>
                  <div className="bg-accent/10 rounded-xl p-4 text-center border border-accent/20">
                    <p className="text-2xl font-black text-accent">{monthlyRevenue.toLocaleString("fr-FR")}€</p>
                    <p className="text-[10px] text-muted-foreground mt-1">CA mensuel estimé</p>
                  </div>
                  <div className="bg-accent/10 rounded-xl p-4 text-center border border-accent/20">
                    <p className="text-2xl font-black text-accent">{yearlyRevenue.toLocaleString("fr-FR")}€</p>
                    <p className="text-[10px] text-muted-foreground mt-1">CA annuel estimé</p>
                  </div>
                </div>

                {/* ROI highlight */}
                <div className="bg-primary rounded-xl p-5 text-center mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-gold" />
                    <span className="text-sm font-bold text-gold">Retour sur investissement</span>
                  </div>
                  <p className="text-4xl font-black text-primary-foreground mb-1">
                    x{roi}
                  </p>
                  <p className="text-xs text-primary-foreground/60">
                    Pour 99€/mois investis, vous générez en moyenne <strong className="text-gold">{monthlyRevenue.toLocaleString("fr-FR")}€</strong> de chiffre d'affaires
                  </p>
                </div>

                <Button variant="gold" size="xl" onClick={onCTA} className="w-full !font-black uppercase tracking-wider">
                  RÉSERVER MA ZONE <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <p className="text-[10px] text-center text-muted-foreground mt-3">
                  * Estimations basées sur les données moyennes du réseau. Résultats variables selon la zone et le métier.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ROISimulator;
