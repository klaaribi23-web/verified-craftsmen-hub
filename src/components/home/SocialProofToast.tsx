import { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const PROOF_MESSAGES = [
  "✅ Audit de conformité validé à Paris il y a 5 min",
  "✅ Nouvel artisan certifié à Lyon il y a 8 min",
  "✅ Audit de conformité validé à Marseille il y a 12 min",
  "✅ Nouvel artisan certifié à Bordeaux il y a 18 min",
  "✅ Audit de conformité validé à Lille il y a 22 min",
  "✅ Nouvel artisan certifié à Nantes il y a 15 min",
  "✅ Audit de conformité validé à Nice il y a 31 min",
  "✅ Nouvel artisan certifié à Strasbourg il y a 27 min",
];

const SocialProofToast = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showFirst = setTimeout(() => setVisible(true), 5000);
    return () => clearTimeout(showFirst);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const hideTimeout = setTimeout(() => setVisible(false), 4000);
    const nextTimeout = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % PROOF_MESSAGES.length);
      setVisible(true);
    }, 6000);
    return () => {
      clearTimeout(hideTimeout);
      clearTimeout(nextTimeout);
    };
  }, [visible, currentIndex]);

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 z-40 max-w-xs pointer-events-none">
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="bg-card border border-border rounded-xl shadow-elevated px-4 py-3 flex items-start gap-2.5 pointer-events-auto"
          >
            <span className="relative flex h-2 w-2 mt-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <div>
              <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-0.5">Live</p>
              <p className="text-xs text-foreground leading-snug">{PROOF_MESSAGES[currentIndex]}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SocialProofToast;
