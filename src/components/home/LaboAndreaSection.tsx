import { useState, useRef } from "react";
import { Sparkles, Send, Loader2, ArrowRight, AlertTriangle, Banknote, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const QUICK_QUESTIONS = [
  {
    icon: AlertTriangle,
    emoji: "🚩",
    label: "Comment savoir si une décennale est fausse ?",
  },
  {
    icon: Banknote,
    emoji: "💰",
    label: "Pourquoi ce devis est 2x moins cher que les autres ?",
  },
  {
    icon: Handshake,
    emoji: "🤝",
    label: "C'est quoi un artisan vraiment \"Validé\" ?",
  },
];

const LaboAndreaSection = () => {
  const [answer, setAnswer] = useState("");
  const [activeQuestion, setActiveQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const cacheRef = useRef<Record<string, string>>({});

  const handleAsk = async (q: string) => {
    if (isLoading) return;
    setActiveQuestion(q);

    if (cacheRef.current[q]) {
      setAnswer(cacheRef.current[q]);
      return;
    }

    setIsLoading(true);
    setAnswer("");

    try {
      const { data, error } = await supabase.functions.invoke("ask-expert-andrea", {
        body: { question: q },
      });
      if (error) throw error;
      const response = data?.answer || "Reformulez votre question.";
      cacheRef.current[q] = response;
      setAnswer(response);
    } catch {
      toast.error("Impossible de contacter Andrea.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-16 md:py-24 bg-navy relative overflow-hidden">
      {/* Subtle glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 max-w-4xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 mb-4">
            <Sparkles className="h-4 w-4 text-gold" />
            <span className="text-sm font-medium text-gold">Le Labo d'Andrea</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-semibold text-white mb-3">
            L'IA qui parle <span className="text-gold">franc.</span>
          </h2>
          <p className="text-[#E2E8F0] text-base md:text-lg max-w-2xl mx-auto">
            Pas de langue de bois. Andrea vous donne des réponses cash, forgées par 20 ans de chantier.
          </p>
        </motion.div>

        {/* Quick Question Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {QUICK_QUESTIONS.map((q, i) => (
            <motion.button
              key={q.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              onClick={() => handleAsk(q.label)}
              disabled={isLoading}
              className={`group relative p-5 rounded-xl border text-left transition-all duration-300 ${
                activeQuestion === q.label
                  ? "border-gold/60 bg-gold/10 shadow-[0_0_20px_rgba(var(--gold-rgb,212,175,55),0.15)]"
                  : "border-white/10 bg-white/5 hover:border-gold/30 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(var(--gold-rgb,212,175,55),0.1)]"
              }`}
            >
              <span className="text-2xl mb-3 block">{q.emoji}</span>
              <p className="text-white text-sm font-medium leading-snug group-hover:text-gold transition-colors">
                {q.label}
              </p>
              {/* Glow border effect */}
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-gold/20" />
            </motion.button>
          ))}
        </div>

        {/* Answer */}
        <AnimatePresence mode="wait">
          {(isLoading || answer) && (
            <motion.div
              key={answer || "loading"}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white/5 backdrop-blur-sm border border-gold/20 rounded-xl p-6 shadow-[0_0_30px_rgba(var(--gold-rgb,212,175,55),0.08)]"
            >
              {isLoading ? (
                <div className="flex items-center gap-3 text-white/70">
                  <Loader2 className="h-5 w-5 animate-spin text-gold" />
                  <span>Andrea analyse votre question…</span>
                </div>
              ) : (
                <>
                  <p className="text-white leading-relaxed whitespace-pre-line mb-4 text-sm md:text-base">
                    {answer}
                  </p>
                  <p className="text-xs text-gold/70 italic mb-4">
                    — Andrea, IA d'audit Artisans Validés
                  </p>
                  <Button asChild variant="gold" size="lg" className="w-full sm:w-auto group">
                    <Link to="/demande-devis">
                      Lancer mon projet
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default LaboAndreaSection;
