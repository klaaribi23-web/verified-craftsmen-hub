import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PROOF_MESSAGES = [
  "Audit validé à Paris",
  "Nouvel artisan certifié à Lyon",
  "Audit validé à Marseille",
  "Artisan certifié à Bordeaux",
  "Audit validé à Lille",
  "Artisan certifié à Nantes",
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
    <div className="bg-navy/95 border-t border-navy-dark py-2.5 text-center">
      <div className="container mx-auto px-4">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="text-xs md:text-sm text-white/80 font-medium"
          >
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse" />
            ✅ {PROOF_MESSAGES[currentIndex]} — il y a quelques minutes
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SocialProofToast;
