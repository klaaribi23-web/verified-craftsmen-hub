import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Loader2 } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { supabase } from "@/integrations/supabase/client";

const ActivationElite = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const nom = searchParams.get("nom") || "";
  const ville = searchParams.get("ville") || "";
  const source = searchParams.get("source") || "direct";

  const [status, setStatus] = useState<"loading" | "error">("loading");

  // Force sign out to prevent session conflicts
  useEffect(() => {
    supabase.auth.signOut().catch(() => {});
  }, []);

  useEffect(() => {
    if (!email) {
      // No email → fallback to partner page
      redirectToFallback();
      return;
    }

    const activate = async () => {
      try {
        // 1. Log the click (fire-and-forget, non-blocking)
        supabase.from("link_clicks").insert({
          email: email.toLowerCase(),
          source,
        }).then(() => {});

        // 2. Fetch artisan data + trigger auto-tracking (pending → suspended)
        const { data } = await supabase.functions.invoke("get-artisan-public", {
          body: { email },
        });

        if (data?.artisan?.slug) {
          // 3. Direct redirect to their profile with owner mode
          window.location.replace(`/artisan/${data.artisan.slug}?view=owner`);
          return;
        }

        // No slug found → fallback
        redirectToFallback();
      } catch {
        redirectToFallback();
      }
    };

    activate();
  }, [email]);

  const redirectToFallback = () => {
    const params = new URLSearchParams();
    if (email) params.set("email", email);
    if (nom) params.set("nom", nom);
    if (ville) params.set("ville", ville);
    window.location.replace(`/devenir-partenaire?${params.toString()}`);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center"
    >
      <SEOHead
        title="Accès Élite — Artisans Validés"
        description="Accédez à votre fiche professionnelle exclusive."
        noIndex
      />

      {/* Minimal loading state — typically shown < 1 second */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-6"
      >
        <div className="w-16 h-16 rounded-2xl border-2 border-primary/40 flex items-center justify-center bg-primary/10">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <p className="text-sm font-semibold text-muted-foreground tracking-wider uppercase">
            Redirection vers votre fiche…
          </p>
        </div>
        {nom && (
          <p className="text-lg font-black text-foreground">{nom}</p>
        )}
      </motion.div>
    </div>
  );
};

export default ActivationElite;
