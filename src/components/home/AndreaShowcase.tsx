import { useState, useEffect, useRef, useCallback } from "react";
import { ShieldCheck, FileSearch, Star, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

const sequences = [
  {
    user: "Comment fonctionne l'audit ?",
    andrea: "J'analyse 47 critères pour chaque artisan : SIRET, assurances, avis clients, historique chantiers. Seuls les meilleurs passent.",
  },
  {
    user: "Mon artisan est-il vraiment vérifié ?",
    andrea: "Oui. Décennale vérifiée, RC Pro contrôlée, audit terrain réalisé. Votre artisan a obtenu un score de 94/100.",
  },
  {
    user: "Puis-je faire confiance à Artisans Validés ?",
    andrea: "87% des artisans candidats sont refusés. Vous n'accédez qu'à l'élite vérifiée.",
  },
];

const features = [
  { icon: FileSearch, text: "Vérification SIRET et documents légaux" },
  { icon: Star, text: "Analyse des avis et réputation en ligne" },
  { icon: BarChart3, text: "Score de fiabilité sur 100 points" },
];

const AndreaShowcase = () => {
  const [seqIndex, setSeqIndex] = useState(0);
  const [displayedUser, setDisplayedUser] = useState("");
  const [displayedAndrea, setDisplayedAndrea] = useState("");
  const [phase, setPhase] = useState<"user" | "andrea" | "pause">("user");
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const seq = sequences[seqIndex];

  const typeText = useCallback(
    (text: string, setter: (v: string) => void, onDone: () => void) => {
      let i = 0;
      const tick = () => {
        if (isHovered) {
          timerRef.current = setTimeout(tick, 100);
          return;
        }
        i++;
        setter(text.slice(0, i));
        if (i < text.length) {
          timerRef.current = setTimeout(tick, 25);
        } else {
          onDone();
        }
      };
      tick();
    },
    [isHovered]
  );

  useEffect(() => {
    if (phase === "user") {
      setDisplayedUser("");
      setDisplayedAndrea("");
      typeText(seq.user, setDisplayedUser, () => {
        timerRef.current = setTimeout(() => setPhase("andrea"), 400);
      });
    } else if (phase === "andrea") {
      typeText(seq.andrea, setDisplayedAndrea, () => {
        timerRef.current = setTimeout(() => setPhase("pause"), 2500);
      });
    } else if (phase === "pause") {
      setSeqIndex((prev) => (prev + 1) % sequences.length);
      setPhase("user");
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase, seqIndex, seq, typeText]);

  return (
    <section className="py-14 md:py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-4">
            <ShieldCheck className="h-4 w-4 text-white" />
            <span className="text-sm font-medium text-white">Intelligence artificielle</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
            Andrea, notre IA d'audit,
            <br className="hidden sm:block" />
            veille sur chaque dossier
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto items-start">
          {/* Left column — Explanation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Andrea analyse chaque candidature artisan avant qu'il ne rejoigne la plateforme.
            </p>
            <div className="space-y-5 mb-8">
              {features.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-foreground text-sm font-medium">{text}</span>
                </div>
              ))}
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-destructive/10 border border-destructive/20">
              <span className="text-sm font-bold text-destructive">
                87% des candidats refusés par Andrea en 2024
              </span>
            </div>
          </motion.div>

          {/* Right column — Chat demo */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Terminal header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-primary/60" />
                  <div className="w-3 h-3 rounded-full bg-success/60" />
                </div>
                <span className="text-xs text-muted-foreground ml-2 font-mono">andrea-audit.ia</span>
              </div>

              {/* Chat body */}
              <div className="p-5 space-y-4 min-h-[220px]">
                {/* User message */}
                {displayedUser && (
                  <div className="flex justify-end">
                    <div className="bg-white/5 border border-white/10 rounded-xl rounded-tr-sm px-4 py-2.5 max-w-[85%]">
                      <p className="text-sm text-foreground">{displayedUser}</p>
                    </div>
                  </div>
                )}

                {/* Andrea response */}
                {displayedAndrea && (
                  <div className="flex justify-start">
                    <div className="bg-secondary border border-border rounded-xl rounded-tl-sm px-4 py-2.5 max-w-[85%]">
                      <p className="text-xs font-semibold text-white/70 mb-1">Andrea IA</p>
                      <p className="text-sm text-foreground">
                        {displayedAndrea}
                        {phase === "andrea" && (
                          <span className="inline-block w-0.5 h-4 bg-white/60 ml-0.5 animate-pulse" />
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Empty state cursor */}
                {!displayedUser && !displayedAndrea && (
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <span className="inline-block w-0.5 h-4 bg-white/60 animate-pulse" />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AndreaShowcase;
