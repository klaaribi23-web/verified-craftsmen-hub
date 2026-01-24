import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, ArrowRight } from "lucide-react";

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
        // Find profile with this confirmation token (anonymous access via RLS policy)
        const { data: profile, error: findError } = await supabase
          .from("profiles")
          .select("id, email, first_name, email_confirmed")
          .eq("confirmation_token", token)
          .eq("email_confirmed", false)
          .maybeSingle();

        if (findError) {
          console.error("Error finding profile:", findError);
          throw new Error("Erreur lors de la vérification du token.");
        }

        if (!profile) {
          setStatus("error");
          setErrorMessage("Ce lien de confirmation est invalide ou a déjà été utilisé.");
          return;
        }

        if (profile.email_confirmed) {
          // Already confirmed, just redirect
          setStatus("success");
          toast({
            title: "Email déjà confirmé",
            description: "Votre email a déjà été confirmé. Vous pouvez vous connecter.",
          });
          return;
        }

        // Update profile to mark email as confirmed and clear the token
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            email_confirmed: true,
            confirmation_token: null,
            confirmation_sent_at: null,
          })
          .eq("id", profile.id);

        if (updateError) {
          console.error("Error updating profile:", updateError);
          throw new Error("Erreur lors de la confirmation de l'email.");
        }

        setStatus("success");
        toast({
          title: "Email confirmé !",
          description: "Votre compte est maintenant activé. Vous pouvez vous connecter.",
        });

      } catch (error: any) {
        console.error("Confirmation error:", error);
        setStatus("error");
        setErrorMessage(error.message || "Une erreur est survenue lors de la confirmation.");
      }
    };

    confirmEmail();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Confirmation d'email" 
        description="Confirmez votre adresse email pour activer votre compte"
        noIndex={true}
      />
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto text-center">
          {status === "loading" && (
            <div className="space-y-6 p-8">
              <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
              <h1 className="text-2xl font-bold">Confirmation en cours...</h1>
              <p className="text-muted-foreground">
                Veuillez patienter pendant que nous vérifions votre email.
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-6 p-8">
              <div className="w-20 h-20 mx-auto bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                Email confirmé avec succès !
              </h1>
              <p className="text-muted-foreground">
                Votre compte est maintenant activé.<br />
                Vous pouvez vous connecter avec vos identifiants.
              </p>
              <Button onClick={() => navigate("/auth")} className="gap-2">
                Se connecter
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-6 p-8">
              <div className="w-20 h-20 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
                <XCircle className="h-10 w-10 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold text-destructive">
                Erreur de confirmation
              </h1>
              <p className="text-muted-foreground">
                {errorMessage}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate("/auth")} variant="default">
                  Retour à la connexion
                </Button>
                <Button onClick={() => navigate("/")} variant="outline">
                  Retour à l'accueil
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ConfirmEmail;
