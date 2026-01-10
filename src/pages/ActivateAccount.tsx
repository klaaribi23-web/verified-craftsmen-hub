import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CheckCircle, Shield, Eye, EyeOff, AlertCircle } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const ActivateAccount = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [artisanData, setArtisanData] = useState<{
    id: string;
    email: string;
    business_name: string;
  } | null>(null);
  
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  // Validate token and fetch artisan data
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError("Lien d'activation invalide. Veuillez contacter le support.");
        setIsLoading(false);
        return;
      }

      try {
        // Find artisan with this activation token
        const { data: artisan, error: artisanError } = await supabase
          .from("artisans")
          .select("id, email, business_name, status, user_id")
          .eq("activation_token", token)
          .maybeSingle();

        if (artisanError) throw artisanError;

        if (!artisan) {
          setError("Ce lien d'activation est invalide ou a déjà été utilisé.");
          setIsLoading(false);
          return;
        }

        // Check if already activated
        if (artisan.user_id) {
          setError("Ce compte a déjà été activé. Veuillez vous connecter.");
          setIsLoading(false);
          return;
        }

        if (!artisan.email) {
          setError("Aucun email n'est associé à cette fiche. Veuillez contacter le support.");
          setIsLoading(false);
          return;
        }

        setArtisanData({
          id: artisan.id,
          email: artisan.email,
          business_name: artisan.business_name,
        });
        setIsLoading(false);
      } catch (err) {
        console.error("Token validation error:", err);
        setError("Une erreur est survenue. Veuillez réessayer.");
        setIsLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!artisanData) return;
    
    // Validate password
    if (formData.password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create user account with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: artisanData.email,
        password: formData.password,
        options: {
          data: {
            user_type: "artisan",
          }
        }
      });

      if (authError) {
        // Handle case where user already exists
        if (authError.message.includes("already registered")) {
          // Try to sign in instead
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: artisanData.email,
            password: formData.password,
          });

          if (signInError) {
            if (signInError.message.includes("Invalid login credentials")) {
              toast.error("Un compte existe déjà avec cet email. Veuillez vous connecter ou réinitialiser votre mot de passe.");
              navigate("/auth");
              return;
            }
            throw signInError;
          }

          if (signInData.user) {
            // Link artisan profile to existing user
            await linkArtisanToUser(signInData.user.id, artisanData.id);
            setShowSuccess(true);
            setTimeout(() => navigate("/artisan/dashboard"), 2500);
            return;
          }
        }
        throw authError;
      }

      if (authData.user) {
        // Wait for profile to be created by trigger
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Link artisan profile to new user
        await linkArtisanToUser(authData.user.id, artisanData.id);

        // Sign in immediately (auto-confirm is enabled)
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: artisanData.email,
          password: formData.password,
        });

        if (signInError) {
          console.error("Sign in error after signup:", signInError);
          // Still show success, user can sign in manually
        }

        setShowSuccess(true);
        setTimeout(() => navigate("/artisan/dashboard"), 2500);
      }
    } catch (err: any) {
      console.error("Account activation error:", err);
      toast.error(err.message || "Une erreur est survenue lors de l'activation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const linkArtisanToUser = async (userId: string, artisanId: string) => {
    // Get or create profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    let profileId = profile?.id;

    if (!profile) {
      // Wait a bit more for trigger
      await new Promise(resolve => setTimeout(resolve, 1000));
      const { data: newProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      profileId = newProfile?.id;
    }

    // Update artisan with user_id and profile_id
    const { error: updateError } = await supabase
      .from("artisans")
      .update({
        user_id: userId,
        profile_id: profileId,
        status: "pending",
        activation_token: null, // Clear the token
      })
      .eq("id", artisanId);

    if (updateError) throw updateError;

    // Ensure artisan role exists
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "artisan")
      .maybeSingle();

    if (!existingRole) {
      // Delete any existing role and insert artisan role
      await supabase.from("user_roles").delete().eq("user_id", userId);
      await supabase.from("user_roles").insert([{ user_id: userId, role: "artisan" }]);
    }
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead 
          title="Activation de compte" 
          description="Activez votre compte artisan"
          noIndex={true}
        />
        <Navbar />
        <div className="container mx-auto px-4 pt-32 pb-20">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto bg-destructive/10 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Lien invalide</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate("/auth")}>
                Se connecter
              </Button>
              <Button variant="outline" onClick={() => navigate("/contact")}>
                Contacter le support
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead 
          title="Activation de compte" 
          description="Activez votre compte artisan"
          noIndex={true}
        />
        <Navbar />
        <div className="container mx-auto px-4 pt-32 pb-20">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Vérification du lien...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Success state
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead 
          title="Compte activé !" 
          description="Votre compte artisan a été activé"
          noIndex={true}
        />
        <Navbar />
        <div className="container mx-auto px-4 pt-32 pb-20">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-green-600 mb-2">Bravo !</h1>
            <p className="text-lg mb-4">Votre compte a été activé avec succès</p>
            <p className="text-muted-foreground mb-6">
              Vous allez être redirigé vers votre tableau de bord...
            </p>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Redirection en cours...</span>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Form state
  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Activation de compte" 
        description="Créez votre mot de passe pour activer votre compte artisan"
        noIndex={true}
      />
      <Navbar />
      
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Activez votre compte</CardTitle>
              <CardDescription>
                Bienvenue <span className="font-semibold text-foreground">{artisanData?.business_name}</span> !<br />
                Créez votre mot de passe pour accéder à votre espace artisan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={artisanData?.email || ""}
                    disabled
                    className="mt-1.5 bg-muted"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Mot de passe *</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      required
                      minLength={8}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Minimum 8 caractères</p>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                      minLength={8}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Activation en cours...
                    </>
                  ) : (
                    "Activer mon compte"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Vous avez déjà un compte ?{" "}
                  <button 
                    onClick={() => navigate("/auth")}
                    className="text-primary hover:underline font-medium"
                  >
                    Connectez-vous
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default ActivateAccount;
