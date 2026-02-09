import { motion } from "framer-motion";

const ThinkingDots = () => (
  <div className="flex items-center gap-1.5 px-3 py-1">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="w-2 h-2 rounded-full bg-gold"
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
      />
    ))}
  </div>
);

export default ThinkingDots;
