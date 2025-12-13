import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Vérifier s'il y a un code dans l'URL (flow PKCE)
        const code = searchParams.get('code');
        
        if (code) {
          // Échanger le code contre une session
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error("Exchange error:", exchangeError);
            setError("Le lien de confirmation a expiré ou est invalide. Veuillez réessayer.");
            return;
          }
        }

        // Récupérer la session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (session?.user) {
          // Check if user has a role
          const { data: existingRole } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .maybeSingle();

          // If no role, assign client role (OAuth users are clients)
          if (!existingRole) {
            await supabase
              .from("user_roles")
              .insert([{ user_id: session.user.id, role: "client" }]);
          }

          // Redirect based on role
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .single();

          // Show welcome toast
          toast({
            title: "Inscription réussie !",
            description: "Bienvenue sur Artisans Validés.",
          });

          if (roles?.role === "admin") {
            navigate("/admin/dashboard");
          } else if (roles?.role === "artisan") {
            navigate("/artisan/dashboard");
          } else {
            navigate("/client/dashboard");
          }
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <Button onClick={() => navigate("/auth")}>
            Retour à la connexion
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Confirmation en cours...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
