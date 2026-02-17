import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/seo/SEOHead";
import { motion } from "framer-motion";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [targetDashboard, setTargetDashboard] = useState<string>("/client/dashboard");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get("code");

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error("Exchange error:", exchangeError);
            setError("Le lien de confirmation a expiré ou est invalide. Veuillez réessayer.");
            return;
          }
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (session?.user) {
          const { data: existingRole } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (!existingRole) {
            await supabase.from("user_roles").insert([{ user_id: session.user.id, role: "client" }]);
          }

          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .single();

          const { data: artisanRecord } = await supabase
            .from("artisans")
            .select("id")
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (artisanRecord && roles?.role !== "artisan" && roles?.role !== "admin") {
            await supabase.from("user_roles").update({ role: "artisan" as any }).eq("user_id", session.user.id);
          }

          if (roles?.role === "artisan" && !artisanRecord) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("id, city")
              .eq("user_id", session.user.id)
              .single();

            if (profile) {
              await supabase.from("artisans").insert([
                {
                  user_id: session.user.id,
                  profile_id: profile.id,
                  business_name: "Non renseigné",
                  city: profile.city || "Non renseigné",
                  status: "pending",
                },
              ]);
            }
          }

          let dashboard = "/client/dashboard";
          if (roles?.role === "admin") {
            dashboard = "/admin/dashboard";
          } else if (artisanRecord || roles?.role === "artisan") {
            dashboard = "/artisan/dashboard";
          }

          setTargetDashboard(dashboard);
          setShowSuccess(true);

          setTimeout(() => {
            navigate(dashboard);
          }, 2500);
        } else {
          navigate("/auth");
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        setError("Une erreur est survenue lors de la confirmation. Veuillez réessayer.");
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#020617' }}>
        <div className="text-center space-y-4 p-8">
          <div className="w-16 h-16 mx-auto bg-destructive/20 rounded-full flex items-center justify-center border border-destructive/30">
            <Shield className="h-8 w-8 text-destructive" />
          </div>
          <p className="text-white text-lg">{error}</p>
          <Button variant="gold" onClick={() => navigate("/auth")}>Retour à la connexion</Button>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#020617' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-6 p-8 max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 mx-auto bg-primary/20 rounded-full flex items-center justify-center border-2 border-primary/50 shadow-gold"
          >
            <CheckCircle className="h-12 w-12 text-primary" />
          </motion.div>
          <h1 className="text-3xl font-black text-primary uppercase tracking-wide">Bienvenu dans le réseau Élite</h1>
          <p className="text-lg text-white">Votre inscription est confirmée</p>
          <motion.div
            className="w-full h-1 bg-secondary rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div
              className="h-full bg-gradient-gold rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
          </motion.div>
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Redirection en cours...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <SEOHead title="Confirmation" description="Confirmation de votre inscription" noIndex={true} />
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#020617' }}>
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-slate-400">Confirmation en cours...</p>
        </div>
      </div>
    </>
  );
};

export default AuthCallback;
