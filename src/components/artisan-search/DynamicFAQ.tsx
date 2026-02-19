import { useState, useEffect, useRef } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQData {
  title: string;
  questions: FAQItem[];
}

interface DynamicFAQProps {
  city?: string;
  category?: string;
}

const DynamicFAQ = ({ city, category }: DynamicFAQProps) => {
  const [faqData, setFaqData] = useState<FAQData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const cacheRef = useRef<Map<string, FAQData>>(new Map());
  const lastKeyRef = useRef<string>("");

  // Only trigger when there's meaningful context
  const cacheKey = `${city || ""}_${category || ""}`;
  const shouldFetch = !!(city || category);

  useEffect(() => {
    if (!shouldFetch || cacheKey === lastKeyRef.current) return;
    lastKeyRef.current = cacheKey;

    // Check cache first
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setFaqData(cached);
      return;
    }

    const fetchFAQ = async () => {
      setIsLoading(true);
      setError(false);
      try {
        let data: any = null;
        try {
          const result = await supabase.functions.invoke("generate-faq", {
            body: { city, category },
          });
          if (result.error) return;
          if (result.data?.error) return;
          data = result.data;
        } catch {
          // Silently swallow all FAQ generation errors (402 credits, network, etc.)
          return;
        }

        if (data?.title && data?.questions) {
          setFaqData(data);
          cacheRef.current.set(cacheKey, data);
        }
      } catch {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFAQ();
  }, [cacheKey, shouldFetch, city, category]);

  if (!shouldFetch) return null;
  if (error) return null;

  return (
    <section className="py-10 md:py-16 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        {isLoading ? (
          <div className="max-w-3xl mx-auto space-y-4">
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : faqData ? (
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-8 justify-center">
              <HelpCircle className="h-6 w-6 text-primary" />
              <h2 className="text-xl md:text-2xl font-bold text-foreground text-center">
                {faqData.title}
              </h2>
            </div>

            <Accordion type="single" collapsible className="space-y-3">
              {faqData.questions.map((item, index) => (
                <AccordionItem
                  key={index}
                  value={`faq-${index}`}
                  className="border border-border rounded-xl px-5 data-[state=open]:bg-muted/50"
                >
                  <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default DynamicFAQ;
