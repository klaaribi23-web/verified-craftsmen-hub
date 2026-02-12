import { motion } from "framer-motion";

/**
 * A diagonal shimmer light sweep that travels across its parent every `interval` seconds.
 */
export function ShimmerOverlay({ interval = 3 }: { interval?: number }) {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit] z-10"
      initial={{ opacity: 1 }}
    >
      <motion.div
        className="absolute inset-y-0 w-1/3"
        style={{
          background:
            "linear-gradient(105deg, transparent 0%, hsl(45 93% 47% / 0.07) 30%, hsl(45 93% 47% / 0.15) 50%, hsl(45 93% 47% / 0.07) 70%, transparent 100%)",
        }}
        animate={{ x: ["-100%", "400%"] }}
        transition={{
          duration: 1.6,
          ease: "easeInOut",
          repeat: Infinity,
          repeatDelay: interval - 1.6,
        }}
      />
    </motion.div>
  );
}
