import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, Eye, EyeOff, Lock } from "lucide-react";
import { z } from "zod";

const passwordSchema = z.string()
  .min(12, "Le mot de passe doit contenir au moins 12 caractères")
  .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
  .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
  .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre")
  .regex(/[^A-Za-z0-9]/, "Le mot de passe doit contenir au moins un caractère spécial");

const ActivateAccount = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [artisanData, setArtisanData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError("Token d'activation manquant");
        setIsLoading(false);
        return;
      }

      try {
        // Fetch artisan with this activation token
        const { data: artisan, error: fetchError } = await supabase
          .from("artisans")
          .select("id, business_name, city, status, activation_token, activation_sent_at")
          .eq("activation_token", token)
          .eq("status", "prospect")
          .maybeSingle();

        if (fetchError) {
          console.error("Error fetching artisan:", fetchError);
          setError("Une erreur est survenue lors de la validation");
          setIsLoading(false);
          return;
        }

        if (!artisan) {
          setError("Ce lien d'activation n'est pas valide ou a déjà été utilisé");
          setIsLoading(false);
          return;
        }

        // Check if token is not too old (7 days)
        if (artisan.activation_sent_at) {
          const sentAt = new Date(artisan.activation_sent_at);
          const now = new Date();
          const daysDiff = (now.getTime() - sentAt.getTime()) / (1000 * 60 * 60 * 24);
          
          if (daysDiff > 7) {
            setError("Ce lien d'activation a expiré. Veuillez contacter l'administrateur.");
            setIsLoading(false);
            return;
          }
        }

        setArtisanData(artisan);
        setIsValid(true);
        setIsLoading(false);
      } catch (err) {
        console.error("Validation error:", err);
        setError("Une erreur inattendue est survenue");
        setIsLoading(false);
      }
    };

    validateToken();
  }, [token]);

  // Validate password as user types
  useEffect(() => {
    if (!password) {
      setPasswordErrors([]);
      return;
    }

    const result = passwordSchema.safeParse(password);
    if (!result.success) {
      setPasswordErrors(result.error.errors.map(e => e.message));
    } else {
      setPasswordErrors([]);
    }
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password
    const result = passwordSchema.safeParse(password);
    if (!result.success) {
      toast.error("Le mot de passe ne respecte pas les critères de sécurité");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    if (!artisanData) {
      toast.error("Données artisan non disponibles");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get artisan's email from profile
      const { data: artisanWithProfile, error: profileError } = await supabase
        .from("artisans")
        .select("profile:profiles!artisans_profile_id_fkey(email)")
        .eq("id", artisanData.id)
        .single();

      if (profileError || !artisanWithProfile?.profile?.email) {
        // Try to get email directly if profile link doesn't work
        console.error("Could not get email from profile link:", profileError);
        toast.error("Impossible de récupérer l'email. Contactez l'administrateur.");
        setIsSubmitting(false);
        return;
      }

      const email = artisanWithProfile.profile.email;

      // Create auth user with the email and password
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/artisan/dashboard`,
          data: {
            user_type: "artisan",
          }
        }
      });

      if (signUpError) {
        console.error("Signup error:", signUpError);
        
        // Handle case where user already exists
        if (signUpError.message.includes("already registered")) {
          toast.error("Un compte existe déjà avec cette adresse email. Veuillez vous connecter.");
          navigate("/auth");
          return;
        }
        
        toast.error(signUpError.message);
        setIsSubmitting(false);
        return;
      }

      if (authData.user) {
        // Update artisan record: link to user, change status, clear token
        const { error: updateError } = await supabase
          .from("artisans")
          .update({
            user_id: authData.user.id,
            status: "pending", // Changed from prospect to pending (awaiting document verification)
            activation_token: null,
            activation_sent_at: null,
          })
          .eq("id", artisanData.id);

        if (updateError) {
          console.error("Error updating artisan:", updateError);
          // Don't fail completely, user is created
        }

        // Create notification for admin about new activated artisan
        const { data: adminRoles } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "admin");

        if (adminRoles) {
          for (const admin of adminRoles) {
            await supabase.from("notifications").insert({
              user_id: admin.user_id,
              title: "Artisan activé",
              message: `${artisanData.business_name} a activé son compte et doit maintenant compléter son profil.`,
              type: "artisan_activated",
              related_id: artisanData.id
            });
          }
        }

        toast.success("Compte activé avec succès ! Bienvenue sur Artisans Validés.");
        
        // Redirect to artisan dashboard
        navigate("/artisan/dashboard");
      }
    } catch (err) {
      console.error("Activation error:", err);
      toast.error("Une erreur est survenue lors de l'activation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background pt-20 pb-12 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              {isLoading ? "Vérification..." : isValid ? "Activez votre compte" : "Erreur d'activation"}
            </CardTitle>
            <CardDescription>
              {isLoading 
                ? "Nous vérifions votre lien d'activation" 
                : isValid 
                  ? "Créez votre mot de passe pour finaliser votre inscription"
                  : error
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Vérification en cours...</p>
              </div>
            ) : isValid && artisanData ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Artisan Info */}
                <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-semibold text-foreground">{artisanData.business_name}</p>
                      <p className="text-sm text-muted-foreground">{artisanData.city}</p>
                    </div>
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Créez votre mot de passe"
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  
                  {/* Password Requirements */}
                  <div className="text-xs space-y-1 mt-2">
                    <p className={password.length >= 12 ? "text-emerald-600" : "text-muted-foreground"}>
                      ✓ Au moins 12 caractères
                    </p>
                    <p className={/[A-Z]/.test(password) ? "text-emerald-600" : "text-muted-foreground"}>
                      ✓ Une majuscule
                    </p>
                    <p className={/[a-z]/.test(password) ? "text-emerald-600" : "text-muted-foreground"}>
                      ✓ Une minuscule
                    </p>
                    <p className={/[0-9]/.test(password) ? "text-emerald-600" : "text-muted-foreground"}>
                      ✓ Un chiffre
                    </p>
                    <p className={/[^A-Za-z0-9]/.test(password) ? "text-emerald-600" : "text-muted-foreground"}>
                      ✓ Un caractère spécial
                    </p>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirmez votre mot de passe"
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-destructive">Les mots de passe ne correspondent pas</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={isSubmitting || passwordErrors.length > 0 || password !== confirmPassword}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Activation en cours...
                    </>
                  ) : (
                    "Activer mon compte"
                  )}
                </Button>
              </form>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <XCircle className="h-16 w-16 text-destructive mb-4" />
                <p className="text-muted-foreground text-center mb-6">{error}</p>
                <Button variant="outline" onClick={() => navigate("/")}>
                  Retour à l'accueil
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </>
  );
};

export default ActivateAccount;
