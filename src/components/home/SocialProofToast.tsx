import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PROOF_MESSAGES = [
  "✅ Artisan certifié à Bordeaux — il y a quelques minutes",
  "✅ Nouveau projet déposé à Lyon — il y a 2 minutes",
  "✅ Audit validé à Lille — il y a 5 minutes",
  "✅ Artisan certifié à Paris — il y a 8 minutes",
  "✅ Nouveau projet déposé à Marseille — il y a 3 minutes",
];

const SocialProofToast = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % PROOF_MESSAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-navy/95 border-t border-navy-dark py-2.5 text-center fixed bottom-0 left-0 right-0 z-50 px-4">
      <div className="container mx-auto">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
            className="text-xs md:text-sm text-white/80 font-medium break-words"
          >
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse" />
            {PROOF_MESSAGES[currentIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SocialProofToast;
