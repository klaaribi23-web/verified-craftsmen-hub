import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { notifyNewDeviceLogin } from "@/hooks/useSecurityNotifications";
import { trackLoginAttempt, checkIfBlocked } from "@/hooks/useLoginTracking";
import { 
  Mail, 
  Lock, 
  User, 
  Loader2,
  ArrowLeft,
  CheckCircle,
  Phone
} from "lucide-react";

// Validation schemas
const loginSchema = z.object({
  email: z.string().trim().email("Email invalide").max(255, "Email trop long"),
  password: z.string().min(1, "Mot de passe requis"),
});

const signupSchema = z.object({
  email: z.string().trim().email("Email invalide").max(255, "Email trop long"),
  password: z.string()
    .min(8, "Minimum 8 caractères")
    .regex(/[A-Z]/, "Au moins une majuscule requise")
    .regex(/[0-9]/, "Au moins un chiffre requis"),
  firstName: z.string().trim().min(2, "Prénom requis (min 2 caractères)").max(50, "Prénom trop long"),
  lastName: z.string().trim().min(2, "Nom requis (min 2 caractères)").max(50, "Nom trop long"),
  businessName: z.string().trim().min(2, "Nom d'entreprise requis (min 2 caractères)").max(100, "Nom d'entreprise trop long").optional(),
});

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState<"client" | "artisan">("client");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const [sentFirstName, setSentFirstName] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [businessName, setBusinessName] = useState("");

  // Cooldown timer for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);


  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        redirectUser();
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        redirectUser();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const redirectUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roles?.role === "admin") {
      navigate("/admin/dashboard");
    } else if (roles?.role === "artisan") {
      navigate("/artisan/dashboard");
    } else {
      navigate("/client/dashboard");
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validationResult = signupSchema.safeParse({
        email,
        password,
        firstName,
        lastName,
        businessName: userType === "artisan" ? businessName : undefined,
      });

      if (userType === "artisan" && (!businessName || businessName.trim().length < 2)) {
        toast({
          title: "Erreur de validation",
          description: "Le nom de votre entreprise est requis (min 2 caractères)",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast({
          title: "Erreur de validation",
          description: firstError.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const validatedData = validationResult.data;

      const { data, error } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            first_name: validatedData.firstName,
            last_name: validatedData.lastName,
            user_type: userType,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        if (data.user.identities && data.user.identities.length === 0) {
          toast({
            title: "Email déjà utilisé",
            description: "Cet email est déjà enregistré. Veuillez vous connecter.",
            variant: "destructive",
          });
          setAuthMode("login");
          setIsLoading(false);
          return;
        }

        let profile = null;
        let retries = 0;
        const maxRetries = 5;

        while (!profile && retries < maxRetries) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", data.user.id)
            .maybeSingle();

          if (profileData) {
            profile = profileData;
          } else {
            retries++;
            console.log(`[AUTH] Waiting for profile creation, retry ${retries}/${maxRetries}`);
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        if (!profile) {
          await supabase.auth.signOut();
          throw new Error("Erreur lors de la création du profil. Veuillez réessayer.");
        }

        const confirmationToken = crypto.randomUUID();

        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            email_confirmed: false,
            confirmation_token: confirmationToken,
            confirmation_sent_at: new Date().toISOString(),
          })
          .eq("id", profile.id);

        if (updateError) {
          console.error("[AUTH] Error setting confirmation token:", updateError);
          await supabase.auth.signOut();
          throw new Error("Erreur lors de l'enregistrement du token de confirmation. Veuillez réessayer.");
        }

        console.log("[AUTH] Confirmation token saved successfully:", confirmationToken);

        if (userType === "artisan") {
          const { error: artisanError } = await supabase
            .from("artisans")
            .insert([{
              user_id: data.user.id,
              profile_id: profile.id,
              business_name: businessName.trim(),
              email: validatedData.email,
              city: "Non renseigné",
              status: "pending",
              source: "self_signup",
              description: null,
              photo_url: null,
              portfolio_images: null,
              portfolio_videos: null,
              experience_years: 0,
              rating: 0,
              review_count: 0,
              missions_completed: 0,
            }]);

          if (artisanError) {
            console.error("[AUTH] Error creating artisan:", artisanError);
          }
        }

        const confirmationUrl = `${window.location.origin}/confirmer-email?token=${confirmationToken}`;

        const { error: emailError } = await supabase.functions.invoke("send-confirmation-email", {
          body: {
            email: validatedData.email,
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            userType,
            confirmationUrl,
          },
        });

        if (emailError) {
          console.error("[AUTH] Error sending confirmation email:", emailError);
        }

        await supabase.auth.signOut();

        setSentEmail(validatedData.email);
        setSentFirstName(validatedData.firstName);
        setEmailSent(true);
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        title: "Erreur d'inscription",
        description: error.message === "User already registered" 
          ? "Cet email est déjà utilisé. Veuillez vous connecter."
          : error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validationResult = loginSchema.safeParse({ email, password });

      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast({
          title: "Erreur de validation",
          description: firstError.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const validatedData = validationResult.data;

      const isBlocked = await checkIfBlocked();
      if (isBlocked) {
        toast({
          title: "Trop de tentatives",
          description: "Votre adresse IP est temporairement bloquée. Réessayez dans 15 minutes.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (error) {
        const trackResult = await trackLoginAttempt({
          email: validatedData.email,
          success: false,
        });

        if (trackResult.blocked) {
          toast({
            title: "Compte temporairement bloqué",
            description: "Trop de tentatives de connexion échouées. Réessayez dans 15 minutes.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        throw error;
      }

      trackLoginAttempt({
        email: validatedData.email,
        success: true,
      });

      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email_confirmed")
          .eq("user_id", data.user.id)
          .single();

        if (profile && profile.email_confirmed === false) {
          await supabase.auth.signOut();
          toast({
            title: "Email non confirmé",
            description: "Veuillez confirmer votre email avant de vous connecter. Vérifiez votre boîte mail.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        notifyNewDeviceLogin(data.user.id);
      }

      toast({
        title: "Connexion réussie !",
        description: "Bienvenue sur Artisans Validés.",
      });

      redirectUser();
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Erreur de connexion",
        description: error.message === "Invalid login credentials"
          ? "Email ou mot de passe incorrect."
          : error.message === "Email not confirmed"
          ? "Veuillez confirmer votre email avant de vous connecter."
          : error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0 || isResending) return;
    
    setIsResending(true);
    try {
      console.log("[Auth] Calling resend-confirmation-email Edge Function");
      
      const { data, error } = await supabase.functions.invoke("resend-confirmation-email", {
        body: {
          email: sentEmail,
          firstName: sentFirstName || "Utilisateur",
          userType,
        },
      });

      if (error) {
        console.error("[Auth] Resend Edge Function error:", error);
        throw new Error("Impossible de renvoyer l'email.");
      }

      if (!data?.success) {
        console.log("[Auth] Resend failed:", data?.message);
        if (data?.cooldownRemaining) {
          setResendCooldown(data.cooldownRemaining);
        }
        throw new Error(data?.message || "Impossible de renvoyer l'email.");
      }

      console.log("[Auth] Email resent successfully");
      toast({
        title: "Email renvoyé !",
        description: "Un nouvel email de confirmation a été envoyé.",
      });
      setResendCooldown(60);
    } catch (error: any) {
      console.error("[Auth] Resend error:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de renvoyer l'email.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  // Full-page email sent confirmation
  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6 p-8 max-w-md">
          <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center border border-primary/30">
            <Mail className="h-10 w-10 text-primary" />
          </div>
          
          <div className="border border-primary/30 rounded-lg p-4 text-left bg-primary/5">
            <div className="flex items-center gap-2 text-primary">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <p className="font-bold text-foreground">
                Votre inscription a bien été prise en compte !
              </p>
            </div>
            <p className="text-sm text-muted-foreground mt-2 ml-7">
              Pour continuer, veuillez confirmer votre adresse email en cliquant sur le lien que vous venez de recevoir.
            </p>
          </div>
          
          <h1 className="text-2xl font-black text-foreground uppercase">Vérifiez votre boîte mail</h1>
          <p className="text-muted-foreground">
            Un email a été envoyé à <strong className="text-primary">{sentEmail}</strong>.
          </p>
          <div className="border border-primary/30 rounded-lg p-4 bg-primary/5">
            <p className="text-sm text-muted-foreground">
              <strong className="text-primary">Pensez à vérifier vos spams</strong> si vous ne trouvez pas l'email dans votre boîte de réception.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              variant="gold" 
              onClick={handleResendEmail}
              disabled={isResending || resendCooldown > 0}
              className="font-bold"
            >
              {isResending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {resendCooldown > 0 
                ? `Renvoyer (${resendCooldown}s)` 
                : "Renvoyer l'email"}
            </Button>
            <Button variant="outline" onClick={() => setEmailSent(false)}>
              Retour
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 bg-background">
      <SEOHead 
        title="Connexion" 
        description="Connectez-vous à votre compte Artisans Validés"
        noIndex={true}
      />
      
      <div className="max-w-md mx-auto w-full px-4">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Retour à l'accueil
        </Link>

        <Card className="border shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-foreground uppercase font-black tracking-wide">
              {authMode === "login" ? "Connexion" : "Inscription"}
            </CardTitle>
            <CardDescription>
              {authMode === "login" 
                ? "Connectez-vous à votre espace" 
                : "Créez votre compte pour commencer"}
            </CardDescription>
          </CardHeader>
          <CardContent>
              {/* User Type Selection */}
              <Tabs value={userType} onValueChange={(v) => setUserType(v as "client" | "artisan")} className="mb-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="client">Particulier</TabsTrigger>
                  <TabsTrigger value="artisan">Professionnel</TabsTrigger>
                </TabsList>
              </Tabs>

              {userType === "client" ? (
                <>
                  {/* Client: login + signup */}
                  <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as "login" | "signup")} className="mb-6">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="login">Connexion</TabsTrigger>
                      <TabsTrigger value="signup">Inscription</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login">
                      <form onSubmit={handleEmailSignIn} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                            <Input
                              id="email"
                              type="email"
                              placeholder="votre@email.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="password">Mot de passe</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                            <Input
                              id="password"
                              type="password"
                              placeholder="••••••••"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="pl-10"
                              required
                              minLength={6}
                            />
                          </div>
                        </div>

                        <Button type="submit" className="w-full font-bold" variant="gold" disabled={isLoading}>
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          SE CONNECTER
                        </Button>

                        <div className="text-center">
                          <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                            Mot de passe oublié ?
                          </Link>
                        </div>
                      </form>
                    </TabsContent>

                    <TabsContent value="signup">
                      <form onSubmit={handleEmailSignUp} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">Prénom</Label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                              <Input
                                id="firstName"
                                placeholder="Jean"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="pl-10"
                                required
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Nom</Label>
                            <Input
                              id="lastName"
                              placeholder="Dupont"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="signupEmail">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                            <Input
                              id="signupEmail"
                              type="email"
                              placeholder="votre@email.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="signupPassword">Mot de passe</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                            <Input
                              id="signupPassword"
                              type="password"
                              placeholder="••••••••"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="pl-10"
                              required
                              minLength={8}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Minimum 8 caractères, une majuscule et un chiffre
                          </p>
                        </div>

                        <Button type="submit" className="w-full font-bold" variant="gold" disabled={isLoading}>
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          CRÉER MON COMPTE
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </>
              ) : (
                <>
                  {/* Artisan: login only + candidacy CTA */}
                  <form onSubmit={handleEmailSignIn} className="space-y-4 mb-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email professionnel</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="votre@email-pro.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Mot de passe</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full font-bold" variant="gold" disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      SE CONNECTER
                    </Button>

                    <div className="text-center">
                      <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                        Mot de passe oublié ?
                      </Link>
                    </div>
                  </form>

                  <div className="border-t pt-6 space-y-4">
                    <p className="text-sm text-center text-muted-foreground">
                      Vous n'avez pas encore d'accès ? Seuls les artisans validés par notre équipe peuvent se connecter.
                    </p>
                    <Link to="/devenir-artisan" className="block">
                      <Button variant="gold" className="w-full !font-bold" size="lg">
                        Devenir Artisan Partenaire
                      </Button>
                    </Link>

                    <div className="rounded-lg p-4 text-center border border-primary/20 bg-primary/5">
                      <p className="text-sm text-muted-foreground mb-1">Besoin d'en parler de vive voix ?</p>
                      <a href="tel:+33612345678" className="inline-flex items-center gap-2 font-semibold text-foreground hover:text-primary transition-colors">
                        <Phone className="h-4 w-4" />
                        06 12 34 56 78
                      </a>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
