import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

type StatItem = 
  | { type?: "animated"; value: number; suffix: string; label: string; decimals?: number; subLabel?: string }
  | { type: "static"; display: string; label: string; subLabel?: string };

const stats: StatItem[] = [
  { value: 1200, suffix: "+", label: "chantiers accompagnés" },
  { value: 87, suffix: "%", label: "taux de refus artisans" },
  { type: "static", display: "N°1", label: "Sélection rigoureuse", subLabel: "Qualité avant la quantité" },
  { value: 24, suffix: "h", label: "délai moyen de réponse" },
];

const AnimatedNumber = ({ target, suffix, decimals = 0 }: { target: number; suffix: string; decimals?: number }) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) setStarted(true);
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const duration = 1500;
    const steps = 40;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [started, target]);

  return (
    <div ref={ref} className="text-[clamp(32px,8vw,48px)] md:text-5xl font-extrabold text-primary">
      {decimals > 0 ? count.toFixed(decimals) : Math.floor(count)}
      {suffix}
    </div>
  );
};

const ImpactStats = () => (
  <section className="py-11 md:py-16 bg-secondary/30">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 max-w-4xl mx-auto">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="text-center"
          >
            {stat.type === "static" ? (
              <>
                <div className="text-[clamp(32px,8vw,48px)] md:text-5xl font-extrabold text-primary">
                  {stat.display}
                </div>
                <p className="text-sm text-muted-foreground mt-2 font-medium">{stat.label}</p>
                {stat.subLabel && <p className="text-xs text-muted-foreground/70 mt-0.5">{stat.subLabel}</p>}
              </>
            ) : (
              <>
                <AnimatedNumber target={stat.value} suffix={stat.suffix} decimals={stat.decimals} />
                <p className="text-sm text-muted-foreground mt-2 font-medium">{stat.label}</p>
              </>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default ImpactStats;
