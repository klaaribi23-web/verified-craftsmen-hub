import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const stats = [
  { value: 1200, suffix: "+", label: "chantiers accompagnés" },
  { value: 87, suffix: "%", label: "taux de refus artisans" },
  { value: 4.9, suffix: "/5", label: "satisfaction clients", decimals: 1 },
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
            <AnimatedNumber target={stat.value} suffix={stat.suffix} decimals={stat.decimals} />
            <p className="text-sm text-muted-foreground mt-2 font-medium">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default ImpactStats;
