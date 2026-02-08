import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";

interface MicWaveformProps {
  level: number; // 0-1
  isActive: boolean;
  onReset: () => void;
  className?: string;
}

const MicWaveform = ({ level, isActive, onReset, className = "" }: MicWaveformProps) => {
  const bars = 5;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-end gap-0.5 h-5">
        {Array.from({ length: bars }).map((_, i) => {
          // Stagger bar heights based on level
          const barLevel = isActive ? Math.min(1, level * (1 + Math.sin(i * 1.2) * 0.5)) : 0.08;
          return (
            <motion.div
              key={i}
              className="w-1 rounded-full bg-gold"
              animate={{ height: `${Math.max(3, barLevel * 20)}px` }}
              transition={{ duration: 0.1 }}
            />
          );
        })}
      </div>
      {!isActive && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReset();
          }}
          className="flex items-center gap-1 text-xs text-gold/80 hover:text-gold underline transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Réinitialiser
        </button>
      )}
    </div>
  );
};

export default MicWaveform;
