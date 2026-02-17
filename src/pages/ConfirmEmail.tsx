import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, ArrowRight, Shield } from "lucide-react";
import { motion } from "framer-motion";

const ConfirmEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const confirmEmail = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setErrorMessage("Lien de confirmation invalide. Aucun token trouvé.");
        return;
      }

      try {
        console.log("[ConfirmEmail] Calling confirm-email Edge Function");
        
        const { data, error } = await supabase.functions.invoke("confirm-email", {
          body: { token },
        });

        if (error) {
          console.error("[ConfirmEmail] Edge Function error:", error);
          throw new Error("Erreur lors de la confirmation de l'email.");
        }

        if (!data?.success) {
          console.log("[ConfirmEmail] Confirmation failed:", data?.message);
          setStatus("error");
          setErrorMessage(data?.message || "Ce lien de confirmation est invalide ou a déjà été utilisé.");
          return;
        }

        console.log("[ConfirmEmail] Email confirmed successfully");
        setStatus("success");
        toast({
          title: "Email confirmé !",
          description: "Votre compte est maintenant activé. Vous pouvez vous connecter.",
        });

      } catch (error: any) {
        console.error("[ConfirmEmail] Confirmation error:", error);
        setStatus("error");
        setErrorMessage(error.message || "Une erreur est survenue lors de la confirmation.");
      }
    };

    confirmEmail();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A192F' }}>
      <SEOHead 
        title="Confirmation d'email" 
        description="Confirmez votre adresse email pour activer votre compte"
        noIndex={true}
      />

      <div className="max-w-md mx-auto text-center px-4">
        {status === "loading" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 p-8"
          >
            <div className="w-20 h-20 mx-auto rounded-2xl border-2 border-primary/40 flex items-center justify-center bg-primary/10">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-wide">
              VÉRIFICATION EN COURS...
            </h1>
            <p className="text-white">
              Veuillez patienter pendant que nous vérifions votre email.
            </p>
            <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(212,175,55,0.15)' }}>
              <motion.div
                className="h-full bg-gradient-gold rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "80%" }}
                transition={{ duration: 4, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        )}

        {status === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-6 p-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-24 h-24 mx-auto bg-primary/20 rounded-full flex items-center justify-center border-2 border-primary/50 shadow-gold"
            >
              <CheckCircle className="h-12 w-12 text-primary" />
            </motion.div>
            <h1 className="text-2xl font-black text-primary uppercase tracking-wide">
              EMAIL CONFIRMÉ AVEC SUCCÈS !
            </h1>
            <p className="text-white">
              Votre compte est maintenant activé.<br />
              Vous pouvez vous connecter avec vos identifiants.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm text-white font-medium">✅ CERTIFIÉ IA ANDREA</span>
            </div>
            <Button variant="gold" onClick={() => navigate("/auth")} className="w-full gap-2 text-base font-black">
              ACCÉDER À MON ESPACE
              <ArrowRight className="h-5 w-5" />
            </Button>
          </motion.div>
        )}

        {status === "error" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 p-8"
          >
            <div className="w-20 h-20 mx-auto bg-destructive/20 rounded-full flex items-center justify-center border border-destructive/30">
              <XCircle className="h-10 w-10 text-destructive" />
            </div>
            <h1 className="text-2xl font-black text-white">
              Erreur de confirmation
            </h1>
            <p className="text-white">
              {errorMessage}
            </p>
            <div className="flex flex-col gap-3">
              <Button variant="gold" onClick={() => navigate("/auth")} className="w-full font-bold">
                Retour à la connexion
              </Button>
              <Button variant="outline-gold" onClick={() => navigate("/")} className="w-full">
                Retour à l'accueil
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ConfirmEmail;
