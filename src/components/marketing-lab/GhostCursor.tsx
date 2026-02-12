import { motion } from "framer-motion";

interface GhostCursorProps {
  /** Keyframes for cursor position [{x, y, delay}] */
  path: { x: number; y: number; delay: number }[];
  onClick?: () => void;
  clickAtIndex?: number;
}

export function GhostCursor({ path, onClick, clickAtIndex = path.length - 1 }: GhostCursorProps) {
  const xKeyframes = path.map((p) => p.x);
  const yKeyframes = path.map((p) => p.y);
  const times = path.map((_, i) => i / (path.length - 1));

  return (
    <motion.div
      className="absolute z-50 pointer-events-none"
      initial={{ x: path[0].x, y: path[0].y, opacity: 0 }}
      animate={{
        x: xKeyframes,
        y: yKeyframes,
        opacity: [0, 1, 1, 1, 1, 0],
      }}
      transition={{
        duration: path.reduce((acc, p) => acc + p.delay, 0),
        times,
        ease: "easeInOut",
        repeat: Infinity,
        repeatDelay: 2,
      }}
      onUpdate={(latest) => {
        // Fire click callback near the click target
        if (onClick && typeof latest.x === "number") {
          const target = path[clickAtIndex];
          if (Math.abs(Number(latest.x) - target.x) < 5 && Math.abs(Number(latest.y) - target.y) < 5) {
            onClick();
          }
        }
      }}
    >
      {/* Cursor shape */}
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M5 3L19 12L12 13L9 20L5 3Z"
          fill="hsl(var(--gold))"
          stroke="hsl(var(--navy-dark))"
          strokeWidth="1.5"
        />
      </svg>
      {/* Click ripple ring */}
      <motion.div
        className="absolute top-2 left-2 w-6 h-6 rounded-full border-2 border-gold/60"
        animate={{ scale: [0, 1.8, 2.2], opacity: [0.8, 0.3, 0] }}
        transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 4 }}
      />
    </motion.div>
  );
}
