import { useState, useRef } from "react";
import { MessageCircleQuestion, ArrowRight, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SUGGESTED_QUESTIONS = [
  "Comment vérifier une décennale ?",
  "Combien coûte une rénovation de salle de bain ?",
  "Comment choisir un bon artisan ?",
];

const AskExpertSection = () => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const cacheRef = useRef<Record<string, string>>({});

  const handleAsk = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || isLoading) return;

    if (cacheRef.current[trimmed]) {
      setAnswer(cacheRef.current[trimmed]);
      return;
    }

    setIsLoading(true);
    setAnswer("");

    try {
      const { data, error } = await supabase.functions.invoke("ask-expert-andrea", {
        body: { question: trimmed },
      });

      if (error) throw error;

      const response = data?.answer || "Je n'ai pas pu répondre à cette question. Essayez de reformuler.";
      cacheRef.current[trimmed] = response;
      setAnswer(response);
    } catch (err) {
      console.error("Ask expert error:", err);
      toast.error("Impossible de contacter l'expert. Réessayez.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-16 md:py-20 bg-muted/50">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
            <MessageCircleQuestion className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Expert IA</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Un doute sur vos travaux ?
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">
            Demandez conseil à notre <span className="font-semibold text-foreground">Expert Andrea</span> — 20 ans d'expérience terrain à votre service.
          </p>
        </motion.div>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
          className="relative mb-4"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk(question);
            }}
            className="flex gap-2"
          >
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ex : Comment vérifier une assurance décennale ?"
              className="h-12 text-base pr-4 bg-background border-2 border-primary/20 focus-visible:ring-primary/30"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className="h-12 w-12 shrink-0 bg-primary hover:bg-primary/90"
              disabled={isLoading || !question.trim()}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </form>
        </motion.div>

        {/* Suggested questions */}
        {!answer && !isLoading && (
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => {
                  setQuestion(q);
                  handleAsk(q);
                }}
                className="text-xs md:text-sm px-3 py-1.5 rounded-full bg-background border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Answer */}
        <AnimatePresence mode="wait">
          {(isLoading || answer) && (
            <motion.div
              key={answer || "loading"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-background border-2 border-primary/20 rounded-xl p-5 md:p-6"
            >
              {isLoading ? (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span>Andrea réfléchit à votre question...</span>
                </div>
              ) : (
                <>
                  <p className="text-foreground leading-relaxed whitespace-pre-line mb-4">
                    {answer}
                  </p>
                  <p className="text-sm text-muted-foreground italic mb-4">
                    — Andrea, Fondateur & Expert Terrain
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

export default AskExpertSection;
