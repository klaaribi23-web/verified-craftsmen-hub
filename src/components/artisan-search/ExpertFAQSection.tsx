import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Shield, MessageCircle, ChevronDown, Sparkles, Loader2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Helmet } from "react-helmet-async";

interface ExpertFAQSectionProps {
  category: string;
  city?: string;
  department?: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQData {
  questions: FAQItem[];
  nearby_cities?: string[];
}

const normalizeSlug = (str: string) =>
  str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const ExpertFAQSection = ({ category, city, department }: ExpertFAQSectionProps) => {
  const [questions, setQuestions] = useState<FAQItem[]>([]);
  const [nearbyCities, setNearbyCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const cacheRef = useRef<Map<string, FAQData>>(new Map());

  useEffect(() => {
    if (!category) return;

    const cacheKey = `${category}-${city || ""}-${department || ""}`;
    
    if (cacheRef.current.has(cacheKey)) {
      const cached = cacheRef.current.get(cacheKey)!;
      setQuestions(cached.questions);
      setNearbyCities(cached.nearby_cities || []);
      return;
    }

    const fetchExpertFAQ = async () => {
      setLoading(true);
      setQuestions([]);
      setNearbyCities([]);
      try {
        const { data, error } = await supabase.functions.invoke("generate-expert-faq", {
          body: { category, city, department },
        });

        if (error) {
          // Silently handle 402 (insufficient credits) and other non-critical errors
          return;
        }

        if (data?.questions) {
          setQuestions(data.questions);
          setNearbyCities(data.nearby_cities || []);
          cacheRef.current.set(cacheKey, { questions: data.questions, nearby_cities: data.nearby_cities });
        }
      } catch (err) {
        console.error("Expert FAQ fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchExpertFAQ();
  }, [category, city, department]);

  if (!category) return null;
  if (!loading && questions.length === 0) return null;

  // JSON-LD FAQ structured data
  const faqJsonLd = questions.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": questions.map((q) => ({
      "@type": "Question",
      "name": q.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": q.answer,
      },
    })),
  } : null;

  return (
    <section className="py-12 md:py-20 bg-background">
      {faqJsonLd && (
        <Helmet>
          <script type="application/ld+json">
            {JSON.stringify(faqJsonLd)}
          </script>
        </Helmet>
      )}

      <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center shadow-lg">
            <Shield className="h-5 w-5 text-white fill-current" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">
              L'avis de l'Expert
            </h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-500" />
              Généré par IA · Vérifié par notre équipe terrain
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-8 ml-[52px]">
          20 ans d'expérience terrain — les réponses directes aux questions que vous vous posez sur les <strong>{category}</strong>{city ? ` à ${city}` : ""}.
        </p>

        {/* Loading state */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-muted flex-shrink-0 mt-1" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-muted rounded-lg w-3/4" />
                  <div className="h-16 bg-muted/60 rounded-xl w-full" />
                </div>
              </div>
            ))}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Andrea prépare ses réponses…
            </div>
          </div>
        )}

        {/* Chat-bubble style FAQ */}
        {!loading && questions.length > 0 && (
          <div className="space-y-4" role="list" aria-label="Questions fréquentes d'expert">
            {questions.map((item, index) => (
              <div key={index} role="listitem" className="group">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full text-left"
                  aria-expanded={openIndex === index}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MessageCircle className="h-4 w-4 text-primary" />
                    </div>
                    <div className={cn(
                      "flex-1 bg-primary/5 border border-primary/10 rounded-2xl rounded-tl-sm px-4 py-3 transition-colors",
                      openIndex === index && "bg-primary/10 border-primary/20"
                    )}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-sm md:text-base text-foreground leading-snug">
                          {item.question}
                        </p>
                        <ChevronDown className={cn(
                          "h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-200",
                          openIndex === index && "rotate-180"
                        )} />
                      </div>
                    </div>
                  </div>
                </button>

                <div className={cn(
                  "overflow-hidden transition-all duration-300 ease-out",
                  openIndex === index ? "max-h-[500px] opacity-100 mt-2" : "max-h-0 opacity-0"
                )}>
                  <div className="flex items-start gap-3 ml-0">
                    <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md">
                      <Shield className="h-4 w-4 text-white fill-current" />
                    </div>
                    <div className="flex-1 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl rounded-tl-sm px-4 py-3">
                      <p className="text-sm md:text-base text-foreground/90 leading-relaxed">
                        {item.answer}
                      </p>
                      <p className="text-[11px] text-amber-600/60 dark:text-amber-400/50 mt-2 italic">
                        — Andrea, Fondateur & Expert Terrain
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Geo-linking: nearby cities */}
        {!loading && nearbyCities.length > 0 && city && (
          <div className="mt-8 p-4 bg-muted/50 rounded-xl border border-border">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">
                Nous intervenons aussi sur les secteurs voisins
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {nearbyCities.map((nearbyCity) => (
                <Link
                  key={nearbyCity}
                  to={`/artisans-ville/${normalizeSlug(nearbyCity)}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-background border border-border rounded-full text-sm text-primary hover:bg-primary/5 hover:border-primary/30 transition-colors"
                >
                  <MapPin className="h-3 w-3" />
                  {nearbyCity}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ExpertFAQSection;
