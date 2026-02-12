import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
}

const GOLD_SHADES = [
  "hsl(45 93% 47%)",
  "hsl(45 93% 58%)",
  "hsl(35 93% 55%)",
  "hsl(45 85% 40%)",
  "hsl(50 90% 60%)",
];

export function useConfetti() {
  const [particles, setParticles] = useState<Particle[]>([]);

  const burst = useCallback((originX = 50, originY = 50) => {
    const newParticles: Particle[] = Array.from({ length: 18 }, (_, i) => ({
      id: Date.now() + i,
      x: originX + (Math.random() - 0.5) * 120,
      y: originY + (Math.random() - 0.5) * 100,
      rotation: Math.random() * 720 - 360,
      scale: 0.5 + Math.random() * 0.8,
      color: GOLD_SHADES[Math.floor(Math.random() * GOLD_SHADES.length)],
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 1400);
  }, []);

  return { particles, burst };
}

export function ConfettiLayer({ particles }: { particles: Particle[] }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute w-2 h-3 rounded-sm"
            style={{ backgroundColor: p.color, left: "50%", top: "50%" }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
            animate={{
              x: p.x,
              y: p.y,
              opacity: [1, 1, 0],
              scale: p.scale,
              rotate: p.rotation,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
