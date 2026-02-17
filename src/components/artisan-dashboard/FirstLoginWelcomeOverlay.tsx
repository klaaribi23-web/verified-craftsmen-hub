import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowDown, Lock, MapPin, Calendar, Euro } from "lucide-react";

interface FirstLoginWelcomeOverlayProps {
  artisanName: string;
  city: string;
  isLegacy?: boolean;
  onDismiss: () => void;
}

// Fake blurred chantiers for FOMO
const fakeChantiers = [
  { title: "Rénovation salle de bain complète", city: "Lille", budget: "8 500€", date: "Il y a 2h" },
  { title: "Installation panneaux solaires", city: "Roubaix", budget: "12 000€", date: "Il y a 45 min" },
  { title: "Ravalement façade maison", city: "Tourcoing", budget: "15 200€", date: "Hier soir" },
];

export const FirstLoginWelcomeOverlay = ({
  artisanName,
  city,
  isLegacy = false,
  onDismiss,
}: FirstLoginWelcomeOverlayProps) => {
  const [visible, setVisible] = useState(true);

  const handleDiscover = () => {
    setVisible(false);
    onDismiss();
    setTimeout(() => {
      const el = document.getElementById("subscription-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 400);
  };

  const handleSkip = () => {
    setVisible(false);
    onDismiss();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(10,25,47,0.92)', backdropFilter: 'blur(12px)' }}
          onClick={handleSkip}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ delay: 0.1, duration: 0.4, type: "spring" }}
            className="bg-[#020617] border border-primary/30 rounded-2xl shadow-2xl shadow-primary/10 max-w-lg w-full p-6 md:p-8 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Andrea Avatar */}
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary to-[#B8941F] flex items-center justify-center mb-5 shadow-lg shadow-primary/30">
              <Sparkles className="w-10 h-10 text-[#0A192F]" />
            </div>

            {/* Andrea label */}
            <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-2">
              Andrea — Votre assistante IA
            </p>

            {/* Welcome message */}
            <h2 className="text-xl md:text-2xl font-black text-white mb-3">
              {isLegacy
                ? `Ravi de vous revoir, ${artisanName} 🤝`
                : `${artisanName}, votre secteur est prêt 🏆`}
            </h2>

            <p className="text-white/80 leading-relaxed mb-5 text-sm md:text-base">
              {isLegacy
                ? "Votre abonnement historique est maintenu. Profitez de vos nouveaux outils !"
                : <>1 seul artisan par secteur. Andrea a sélectionné votre profil pour sa qualité.
                  {city && <> Secteur <span className="font-bold text-primary">{city}</span>.</>}
                  <br />
                  <span className="text-white font-semibold">Ne laissez pas un concurrent prendre votre place.</span>
                </>}
            </p>

            {/* Blurred chantiers preview (artisan only) */}
            {!isLegacy && (
              <div className="relative mb-5 rounded-xl overflow-hidden border border-primary/20">
                <div className="divide-y divide-white/5">
                  {fakeChantiers.map((c, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 text-left" style={{ filter: 'blur(4px)' }}>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{c.title}</p>
                        <p className="text-white/50 text-xs flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {c.city}
                          <span className="mx-1">·</span>
                          <Calendar className="w-3 h-3" /> {c.date}
                        </p>
                      </div>
                      <span className="text-primary font-bold text-sm flex items-center gap-1">
                        <Euro className="w-3 h-3" /> {c.budget}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Golden overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-primary/20 flex items-center justify-center">
                  <div className="flex items-center gap-2 bg-[#020617]/90 border border-primary/40 rounded-full px-5 py-2.5 shadow-gold">
                    <Lock className="w-4 h-4 text-primary" />
                    <span className="text-white font-bold text-sm">3 chantiers en attente</span>
                  </div>
                </div>
              </div>
            )}

            {/* CTA */}
            {isLegacy ? (
              <Button
                size="lg"
                variant="gold"
                className="w-full text-base font-black mb-3"
                onClick={handleSkip}
              >
                C'EST PARTI !
              </Button>
            ) : (
              <Button
                size="lg"
                variant="gold"
                className="w-full text-base font-black mb-3"
                onClick={handleDiscover}
              >
                <ArrowDown className="w-5 h-5 mr-2" />
                S'ABONNER ET ENCAISSER MAINTENANT
              </Button>
            )}

            <button
              onClick={handleSkip}
              className="text-xs text-white/40 hover:text-white/60 transition-colors"
            >
              Peut-être plus tard
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
