import { Link } from "react-router-dom";
import { Lock, Eye, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export const SubscriptionWarningBanner = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden mb-6 border-2 border-accent/40"
      style={{
        background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.9) 100%)",
      }}
    >
      <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="font-black text-primary-foreground text-sm">
              🔒 Votre profil est invisible pour les clients
            </p>
            <p className="text-xs text-primary-foreground/60 mt-0.5">
              Activez votre abonnement pour apparaître en tête des recherches et recevoir des demandes de devis.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-4 text-primary-foreground/50 text-xs">
            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> 0 vues</span>
            <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> 0 leads</span>
          </div>
          <Link to="/artisan/abonnement">
            <Button
              className="bg-accent text-accent-foreground font-black text-xs uppercase tracking-wider hover:bg-accent/90 whitespace-nowrap gap-1"
              size="sm"
            >
              Activer — 99€/mois <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};
