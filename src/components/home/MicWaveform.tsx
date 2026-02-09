import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";

interface MicWaveformProps {
  level: number; // 0-1
  isActive: boolean;
  isThinking?: boolean; // Agent is processing, not yet speaking
  onReset: () => void;
  className?: string;
}

const MicWaveform = ({ level, isActive, isThinking = false, onReset, className = "" }: MicWaveformProps) => {
  const bars = 5;

  // Determine bar color: gold=listening, blue=thinking, dim=silent
  const barColor = isThinking ? "bg-blue-400" : "bg-gold";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-end gap-0.5 h-5">
        {Array.from({ length: bars }).map((_, i) => {
          const barLevel = isThinking
            ? 0.3 + 0.3 * Math.sin((Date.now() / 200) + i * 1.2) // gentle wave while thinking
            : isActive
            ? Math.min(1, level * (1 + Math.sin(i * 1.2) * 0.5))
            : 0.08;
          return (
            <motion.div
              key={i}
              className={`w-1 rounded-full ${barColor} ${isThinking ? "animate-pulse" : ""}`}
              animate={{ height: `${Math.max(3, barLevel * 20)}px` }}
              transition={{ duration: isThinking ? 0.3 : 0.1 }}
            />
          );
        })}
      </div>
      {isThinking && (
        <span className="text-xs text-blue-300 animate-pulse">Andrea réfléchit…</span>
      )}
      {!isActive && !isThinking && (
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
