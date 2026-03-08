import { useState, useEffect, useRef, useCallback } from "react";
import { ShieldCheck, FileSearch, Star, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

const sequences = [
  {
    user: "J'ai peur de tomber sur un artisan pas fiable...",
    andrea: "Je vérifie tout avant vous : décennale, RC Pro, avis clients, SIRET. Si un dossier ne passe pas mes 47 critères, l'artisan n'apparaît pas sur la plateforme.",
  },
  {
    user: "Comment je sais que ses assurances sont à jour ?",
    andrea: "Je contrôle chaque document en temps réel. Votre artisan a une décennale valide jusqu'en 2034 et une RC Pro vérifiée. Vous êtes protégé.",
  },
  {
    user: "Mes coordonnées seront partagées ?",
    andrea: "Jamais sans votre accord. Vous échangez via messagerie sécurisée. Vous décidez quand — et si — vous partagez votre numéro.",
  },
];

const features = [
  { icon: FileSearch, text: "Assurances et décennale vérifiées pour vous" },
  { icon: Star, text: "Avis clients contrôlés — pas de faux 5 étoiles" },
  { icon: BarChart3, text: "Score de fiabilité calculé sur 47 critères" },
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
    <section className="py-14 md:py-20 bg-muted">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Votre assistante personnelle</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
            Andrea vérifie tout
            <br className="hidden sm:block" />
            pour que vous n'ayez rien à vérifier.
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
              Avant que vous ne voyiez un artisan, Andrea a déjà vérifié ses assurances, son SIRET et ses avis clients. Si quelque chose cloche, il n'apparaît pas.
            </p>
            <div className="space-y-5 mb-8">
              {features.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-foreground text-sm font-medium">{text}</span>
                </div>
              ))}
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary/10 border border-primary/20">
              <span className="text-sm font-bold text-primary">
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
                    <div className="bg-secondary border border-border rounded-xl rounded-tr-sm px-4 py-2.5 max-w-[85%]">
                      <p className="text-sm text-foreground">{displayedUser}</p>
                    </div>
                  </div>
                )}

                {/* Andrea response */}
                {displayedAndrea && (
                  <div className="flex justify-start">
                    <div className="bg-muted border border-border rounded-xl rounded-tl-sm px-4 py-2.5 max-w-[85%]">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Andrea IA</p>
                      <p className="text-sm text-foreground">
                        {displayedAndrea}
                        {phase === "andrea" && (
                          <span className="inline-block w-0.5 h-4 bg-foreground/60 ml-0.5 animate-pulse" />
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Empty state cursor */}
                {!displayedUser && !displayedAndrea && (
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <span className="inline-block w-0.5 h-4 bg-foreground/60 animate-pulse" />
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
