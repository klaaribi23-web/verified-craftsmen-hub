import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [targetDashboard, setTargetDashboard] = useState<string>("/client/dashboard");

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

          // Check if this is a claim flow (artisan claiming an existing profile)
          const claimSlug = localStorage.getItem('artisan_claim_slug');
          
          if (claimSlug) {
            // Link user to existing artisan profile
            const { data: profile } = await supabase
              .from("profiles")
              .select("id")
              .eq("user_id", session.user.id)
              .single();

            if (profile) {
              // Get artisan info before update for notification
              const { data: artisanData } = await supabase
                .from("artisans")
                .select("id, business_name")
                .eq("slug", claimSlug)
                .eq("status", "prospect")
                .single();

              const { error: updateError } = await supabase
                .from("artisans")
                .update({ 
                  user_id: session.user.id, 
                  profile_id: profile.id,
                  status: "pending" 
                })
                .eq("slug", claimSlug)
                .eq("status", "prospect");

              if (updateError) {
                console.error("Error linking artisan profile:", updateError);
              } else if (artisanData) {
                // Send notification to admin about the claim
                const { data: adminRoles } = await supabase
                  .from("user_roles")
                  .select("user_id")
                  .eq("role", "admin");

                if (adminRoles && adminRoles.length > 0) {
                  const notifications = adminRoles.map(admin => ({
                    user_id: admin.user_id,
                    type: "artisan_claim",
                    title: "Fiche artisan revendiquée",
                    message: `L'artisan "${artisanData.business_name}" a revendiqué sa fiche vitrine et attend la validation de ses documents.`,
                    related_id: artisanData.id
                  }));

                  await supabase.from("notifications").insert(notifications);
                }
              }
            }
            
            // Clear the claim slug from localStorage
            localStorage.removeItem('artisan_claim_slug');
            
            setTargetDashboard("/artisan/dashboard");
            setShowSuccess(true);
            
            setTimeout(() => {
              navigate("/artisan/dashboard");
            }, 2500);
            return;
          }

          // If artisan role, ensure artisan profile exists
          if (roles?.role === "artisan") {
            const { data: existingArtisan } = await supabase
              .from("artisans")
              .select("id")
              .eq("user_id", session.user.id)
              .maybeSingle();

            // Create artisan profile if missing
            if (!existingArtisan) {
              const { data: profile } = await supabase
                .from("profiles")
                .select("id, city")
                .eq("user_id", session.user.id)
                .single();

              if (profile) {
                await supabase.from("artisans").insert([{
                  user_id: session.user.id,
                  profile_id: profile.id,
                  business_name: "Non renseigné",
                  city: profile.city || "Non renseigné",
                  status: "pending",
                }]);
              }
            }
          }

          // Determine target dashboard
          let dashboard = "/client/dashboard";
          if (roles?.role === "admin") {
            dashboard = "/admin/dashboard";
          } else if (roles?.role === "artisan") {
            dashboard = "/artisan/dashboard";
          }
          
          setTargetDashboard(dashboard);
          setShowSuccess(true);
          
          // Redirect after 2.5 seconds
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

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6 p-8">
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-green-600">Bravo !</h1>
          <p className="text-lg text-foreground">Votre inscription est confirmée</p>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Redirection en cours...</span>
          </div>
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