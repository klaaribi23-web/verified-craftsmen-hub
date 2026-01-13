import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CheckCircle, Shield, Eye, EyeOff, AlertCircle, UserCheck, Key, Mail } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface ExistingAccountInfo {
  exists: boolean;
  role: string | null;
  userId: string | null;
}

type ActivationPhase = "loading" | "form" | "awaiting_confirmation" | "linking" | "success" | "error";

const ActivateAccount = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const [phase, setPhase] = useState<ActivationPhase>("loading");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // New state for existing account handling
  const [existingAccount, setExistingAccount] = useState<ExistingAccountInfo | null>(null);
  
  const [artisanData, setArtisanData] = useState<{
    id: string;
    email: string;
    business_name: string;
  } | null>(null);
  
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  // Check if user is already authenticated (came back after email confirmation)
  useEffect(() => {
    const checkAuthAndAutoActivate = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user && token && artisanData) {
        console.log("User already authenticated, auto-activating...");
        setPhase("linking");
        
        try {
          await linkArtisanToUser(session.user.id, artisanData.id);
          setPhase("success");
          setTimeout(() => navigate("/artisan/dashboard"), 2500);
        } catch (err: any) {
          console.error("Auto-activation error:", err);
          // Don't show error - let user try manually
          setPhase("form");
        }
      }
    };

    if (artisanData && token) {
      checkAuthAndAutoActivate();
    }
  }, [artisanData, token]);

  // Validate token and fetch artisan data
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError("Lien d'activation invalide. Veuillez contacter le support.");
        setPhase("error");
        return;
      }

      try {
        // Check if already logged in
        const { data: { session } } = await supabase.auth.getSession();
        
        // Find artisan with this activation token
        const { data: artisan, error: artisanError } = await supabase
          .from("artisans")
          .select("id, email, business_name, status, user_id")
          .eq("activation_token", token)
          .maybeSingle();

        if (artisanError) throw artisanError;

        if (!artisan) {
          setError("Ce lien d'activation est invalide ou a déjà été utilisé.");
          setPhase("error");
          return;
        }

        // Check if already activated
        if (artisan.user_id) {
          setError("Ce compte a déjà été activé. Veuillez vous connecter.");
          setPhase("error");
          return;
        }

        if (!artisan.email) {
          setError("Aucun email n'est associé à cette fiche. Veuillez contacter le support.");
          setPhase("error");
          return;
        }

        setArtisanData({
          id: artisan.id,
          email: artisan.email,
          business_name: artisan.business_name,
        });

        // If user is already logged in with matching email, auto-activate
        if (session?.user?.email === artisan.email) {
          console.log("User already logged in with matching email, auto-activating...");
          setPhase("linking");
          
          try {
            await linkArtisanToUser(session.user.id, artisan.id);
            setPhase("success");
            setTimeout(() => navigate("/artisan/dashboard"), 2500);
            return;
          } catch (err: any) {
            console.error("Auto-activation failed:", err);
            // Continue to form
          }
        }

        // Check if email already exists in auth.users
        try {
          const { data: checkResult, error: checkError } = await supabase.functions.invoke('check-email-exists', {
            body: { email: artisan.email }
          });

          if (!checkError && checkResult) {
            setExistingAccount(checkResult);
          }
        } catch (err) {
          console.warn("Could not check existing email:", err);
        }

        setPhase("form");
      } catch (err) {
        console.error("Token validation error:", err);
        setError("Une erreur est survenue. Veuillez réessayer.");
        setPhase("error");
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
    
    // Only check confirm password if creating new account
    if (!existingAccount?.exists && formData.password !== formData.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    setIsSubmitting(true);

    try {
      // Case 1: Existing client account - need to convert
      if (existingAccount?.exists && existingAccount.role === 'client') {
        await handleExistingClientAccount();
        return;
      }

      // Case 2: Existing artisan account - allow login and link
      if (existingAccount?.exists && existingAccount.role === 'artisan') {
        await handleExistingArtisanAccount();
        return;
      }

      // Case 3: New account - check if account was created but not confirmed
      const { data: recheckData } = await supabase.functions.invoke("check-email-exists", {
        body: { email: artisanData.email },
      });

      if (recheckData?.exists) {
        // Account exists (maybe user came back after confirming email)
        await handleAccountAfterConfirmation();
        return;
      }

      // Case 4: Brand new account - only signUp, no linking yet
      await handleNewAccountSignUp();
      
    } catch (err: any) {
      console.error("Account activation error:", err);
      toast.error(err.message || "Une erreur est survenue lors de l'activation");
      setIsSubmitting(false);
    }
  };

  const handleExistingClientAccount = async () => {
    if (!artisanData) return;
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: artisanData.email,
      password: formData.password,
    });

    if (signInError) {
      if (signInError.message.includes("Invalid login credentials")) {
        toast.error("Mot de passe incorrect. Veuillez réessayer ou réinitialiser votre mot de passe.");
        setIsSubmitting(false);
        return;
      }
      throw signInError;
    }

    if (signInData.user) {
      await new Promise(resolve => setTimeout(resolve, 500));
      await convertClientToArtisan(signInData.user.id, artisanData.id);
      setPhase("success");
      setTimeout(() => navigate("/artisan/dashboard"), 2500);
    }
  };

  const handleExistingArtisanAccount = async () => {
    if (!artisanData) return;
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: artisanData.email,
      password: formData.password,
    });

    if (signInError) {
      if (signInError.message.includes("Invalid login credentials")) {
        toast.error("Mot de passe incorrect. Veuillez réessayer ou réinitialiser votre mot de passe.");
        setIsSubmitting(false);
        return;
      }
      throw signInError;
    }

    if (signInData.user) {
      await new Promise(resolve => setTimeout(resolve, 500));
      await linkArtisanToUser(signInData.user.id, artisanData.id);
      setPhase("success");
      setTimeout(() => navigate("/artisan/dashboard"), 2500);
    }
  };

  const handleAccountAfterConfirmation = async () => {
    if (!artisanData) return;
    
    console.log("Account exists, attempting sign in...");
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: artisanData.email,
      password: formData.password,
    });

    if (signInError) {
      if (signInError.message.includes("Invalid login credentials")) {
        toast.error("Mot de passe incorrect. Veuillez réessayer.");
        setIsSubmitting(false);
        return;
      }
      // Email still not confirmed
      if (signInError.message.includes("email_not_confirmed") || 
          signInError.message.includes("Email not confirmed")) {
        toast.info(
          "Veuillez confirmer votre email en cliquant sur le lien envoyé, puis revenez sur cette page.",
          { duration: 10000 }
        );
        setPhase("awaiting_confirmation");
        setIsSubmitting(false);
        return;
      }
      throw signInError;
    }

    if (signInData.user) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data: sessionCheck } = await supabase.auth.getSession();
      if (!sessionCheck.session) {
        throw new Error("Session non établie. Veuillez rafraîchir la page et réessayer.");
      }
      
      await linkArtisanToUser(signInData.user.id, artisanData.id);
      setPhase("success");
      setTimeout(() => navigate("/artisan/dashboard"), 2500);
    }
  };

  const handleNewAccountSignUp = async () => {
    if (!artisanData) return;
    
    console.log("Creating new account...");
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: artisanData.email,
      password: formData.password,
      options: {
        data: {
          user_type: "artisan",
        },
        emailRedirectTo: `${window.location.origin}/activer-compte?token=${token}`,
      }
    });

    if (authError) {
      // Handle case where user already exists
      if (authError.message.includes("already registered")) {
        setExistingAccount({ exists: true, role: null, userId: null });
        await handleAccountAfterConfirmation();
        return;
      }
      throw authError;
    }

    if (authData.user) {
      // SignUp successful - now check if email needs confirmation
      console.log("SignUp successful, checking if login works...");
      
      // Small delay for profile creation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try to sign in immediately
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: artisanData.email,
        password: formData.password,
      });

      if (signInError) {
        // Email not confirmed - this is expected
        if (signInError.message.includes("email_not_confirmed") || 
            signInError.message.includes("Email not confirmed")) {
          console.log("Email confirmation required, showing awaiting state...");
          setPhase("awaiting_confirmation");
          setIsSubmitting(false);
          return;
        }
        throw signInError;
      }

      // If sign in succeeded (auto-confirm enabled), proceed with activation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data: sessionCheck } = await supabase.auth.getSession();
      if (sessionCheck.session) {
        await linkArtisanToUser(authData.user.id, artisanData.id);
        setPhase("success");
        setTimeout(() => navigate("/artisan/dashboard"), 2500);
      }
    }
  };

  const convertClientToArtisan = async (userId: string, artisanId: string) => {
    // 1. Update artisan with user_id
    const { error: updateError } = await supabase
      .from("artisans")
      .update({
        user_id: userId,
        activation_token: null,
      })
      .eq("id", artisanId)
      .eq("activation_token", token);

    if (updateError) {
      console.error("Failed to link artisan:", updateError);
      throw new Error("Impossible de lier le compte artisan. Veuillez réessayer.");
    }

    // 2. Delete the client role
    const { error: deleteRoleError } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    if (deleteRoleError) {
      console.error("Failed to delete client role:", deleteRoleError);
    }

    // 3. Insert artisan role
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert([{ user_id: userId, role: "artisan" }]);

    if (roleError) {
      console.error("Failed to assign artisan role:", roleError);
    }

    // 4. Get and link profile_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (profile?.id) {
      const { error: profileUpdateError } = await supabase
        .from("artisans")
        .update({ profile_id: profile.id })
        .eq("user_id", userId);

      if (profileUpdateError) {
        console.error("Failed to update profile_id:", profileUpdateError);
      }
    }
  };

  const linkArtisanToUser = async (userId: string, artisanId: string) => {
    // Verify session is active
    const { data: sessionData } = await supabase.auth.getSession();
    console.log("Session active:", !!sessionData.session, "User ID:", sessionData.session?.user?.id);

    if (!sessionData.session) {
      throw new Error("Session non établie. Veuillez vous reconnecter.");
    }

    // 1. Update artisan with user_id
    const { error: updateError, data: updateData } = await supabase
      .from("artisans")
      .update({
        user_id: userId,
        activation_token: null,
      })
      .eq("id", artisanId)
      .eq("activation_token", token)
      .select();

    if (updateError) {
      console.error("Failed to link artisan:", {
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        artisanId,
        userId,
        token
      });
      
      if (updateError.code === "42501") {
        throw new Error("Erreur de permission. Veuillez vous reconnecter et réessayer.");
      }
      if (updateError.code === "23505") {
        throw new Error("Ce compte est déjà lié à une autre vitrine artisan.");
      }
      throw new Error(`Impossible de lier le compte artisan: ${updateError.message}`);
    }

    if (!updateData || updateData.length === 0) {
      console.error("No rows updated - token mismatch or already used:", { artisanId, token });
      throw new Error("Le lien d'activation a déjà été utilisé ou est invalide.");
    }

    // 2. Delete default client role
    const { error: deleteRoleError } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    if (deleteRoleError) {
      console.error("Failed to delete default role:", deleteRoleError);
    }

    // 3. Create artisan role
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert([{ user_id: userId, role: "artisan" }]);

    if (roleError) {
      console.error("Failed to assign artisan role:", roleError);
    }

    // 4. Get profile_id
    let profileId: string | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (profile?.id) {
        profileId = profile.id;
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 5. Update profile_id
    if (profileId) {
      const { error: profileUpdateError } = await supabase
        .from("artisans")
        .update({ profile_id: profileId })
        .eq("user_id", userId);
      
      if (profileUpdateError) {
        console.error("Failed to update profile_id:", profileUpdateError);
      }
    }
  };

  // Error state
  if (phase === "error") {
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
  if (phase === "loading") {
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

  // Linking state (auto-activation in progress)
  if (phase === "linking") {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead 
          title="Activation en cours" 
          description="Activation de votre compte artisan"
          noIndex={true}
        />
        <Navbar />
        <div className="container mx-auto px-4 pt-32 pb-20">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium mb-2">Activation de votre compte...</p>
            <p className="text-muted-foreground">Veuillez patienter quelques secondes</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Awaiting email confirmation state
  if (phase === "awaiting_confirmation") {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead 
          title="Confirmez votre email" 
          description="Confirmez votre adresse email pour activer votre compte"
          noIndex={true}
        />
        <Navbar />
        <div className="container mx-auto px-4 pt-32 pb-20">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Mail className="h-10 w-10 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">Confirmez votre email</CardTitle>
                <CardDescription className="text-base mt-2">
                  Un email de confirmation a été envoyé à <span className="font-semibold text-foreground">{artisanData?.email}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-2">Étapes à suivre :</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Ouvrez votre boîte email</li>
                        <li>Cliquez sur le lien de confirmation</li>
                        <li>Vous serez automatiquement redirigé vers votre tableau de bord</li>
                      </ol>
                    </div>
                  </div>
                </div>
                
                <div className="text-center text-sm text-muted-foreground">
                  <p>Vous n'avez pas reçu l'email ?</p>
                  <p className="mt-1">Vérifiez vos spams ou attendez quelques minutes.</p>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setPhase("form")}
                >
                  Revenir au formulaire
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Success state
  if (phase === "success") {
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

  // Determine which form to show
  const isExistingClient = existingAccount?.exists && existingAccount?.role === 'client';
  const isExistingArtisan = existingAccount?.exists && existingAccount?.role === 'artisan';

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
                {isExistingClient || isExistingArtisan ? (
                  <UserCheck className="h-8 w-8 text-primary" />
                ) : (
                  <Shield className="h-8 w-8 text-primary" />
                )}
              </div>
              <CardTitle className="text-2xl">
                {isExistingClient || isExistingArtisan ? "Compte existant détecté" : "Activez votre compte"}
              </CardTitle>
              <CardDescription>
                {isExistingClient ? (
                  <>
                    Bonjour ! Vous avez déjà un compte client avec l'adresse <span className="font-semibold text-foreground">{artisanData?.email}</span>.
                    <br /><br />
                    Entrez votre mot de passe existant pour convertir votre compte en compte artisan et accéder à votre vitrine <span className="font-semibold text-foreground">{artisanData?.business_name}</span>.
                  </>
                ) : isExistingArtisan ? (
                  <>
                    Bonjour ! Vous avez déjà un compte artisan avec l'adresse <span className="font-semibold text-foreground">{artisanData?.email}</span>.
                    <br /><br />
                    Entrez votre mot de passe pour lier cette nouvelle vitrine <span className="font-semibold text-foreground">{artisanData?.business_name}</span> à votre compte.
                  </>
                ) : (
                  <>
                    Bienvenue <span className="font-semibold text-foreground">{artisanData?.business_name}</span> !<br />
                    Créez votre mot de passe pour accéder à votre espace artisan.
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isExistingClient && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Key className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Conversion de compte</p>
                      <p>Votre compte client sera converti en compte artisan. Vous conserverez votre historique de messages et devis.</p>
                    </div>
                  </div>
                </div>
              )}

              {isExistingArtisan && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Key className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium mb-1">Liaison de compte</p>
                      <p>Cette nouvelle vitrine sera ajoutée à votre compte artisan existant.</p>
                    </div>
                  </div>
                </div>
              )}

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
                  <Label htmlFor="password">
                    {isExistingClient ? "Mot de passe de votre compte client *" : isExistingArtisan ? "Mot de passe de votre compte artisan *" : "Mot de passe *"}
                  </Label>
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
                  {!isExistingClient && !isExistingArtisan && (
                    <p className="text-xs text-muted-foreground mt-1">Minimum 8 caractères</p>
                  )}
                </div>

                {!isExistingClient && !isExistingArtisan && (
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
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {isExistingClient ? "Conversion en cours..." : isExistingArtisan ? "Liaison en cours..." : "Activation en cours..."}
                    </>
                  ) : (
                    isExistingClient ? "Convertir mon compte en artisan" : isExistingArtisan ? "Lier cette vitrine à mon compte" : "Activer mon compte"
                  )}
                </Button>
              </form>

              {(isExistingClient || isExistingArtisan) && (
                <div className="mt-4 text-center">
                  <button 
                    onClick={() => navigate("/forgot-password")}
                    className="text-sm text-primary hover:underline"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
              )}

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
