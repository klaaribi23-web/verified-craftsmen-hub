import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowDown } from "lucide-react";

interface FirstLoginWelcomeOverlayProps {
  artisanName: string;
  city: string;
  onDismiss: () => void;
}

export const FirstLoginWelcomeOverlay = ({
  artisanName,
  city,
  onDismiss,
}: FirstLoginWelcomeOverlayProps) => {
  const [visible, setVisible] = useState(true);

  const handleDiscover = () => {
    setVisible(false);
    onDismiss();
    // Scroll to pricing section after overlay closes
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={handleSkip}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ delay: 0.1, duration: 0.4, type: "spring" }}
            className="bg-card border border-border rounded-2xl shadow-2xl max-w-lg w-full p-8 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Andrea Avatar */}
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-6 shadow-lg">
              <Sparkles className="w-10 h-10 text-primary-foreground" />
            </div>

            {/* Andrea label */}
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
              Andrea — Votre assistante IA
            </p>

            {/* Welcome message */}
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Bienvenue dans l'élite, {artisanName} 🎉
            </h2>

            <p className="text-muted-foreground leading-relaxed mb-6">
              Ton profil est prêt, mais pour recevoir tes premiers leads
              {city ? ` à ${city}` : ""}, tu dois activer ton{" "}
              <span className="font-semibold text-foreground">pack Sérénité</span>.
              <br />
              On commence par là ?
            </p>

            {/* CTA */}
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg text-base font-bold mb-3"
              onClick={handleDiscover}
            >
              <ArrowDown className="w-5 h-5 mr-2" />
              DÉCOUVRIR MES AVANTAGES
            </Button>

            <button
              onClick={handleSkip}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Peut-être plus tard
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
