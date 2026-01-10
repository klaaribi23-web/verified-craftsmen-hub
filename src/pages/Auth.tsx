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
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { notifyNewDeviceLogin } from "@/hooks/useSecurityNotifications";
import { 
  Mail, 
  Lock, 
  User, 
  Loader2,
  ArrowLeft,
  CheckCircle
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
      });

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

      // Create user WITHOUT email confirmation (we handle it with OTP)
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
        // Check if user already exists
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

        // If artisan, create empty artisan profile
        if (userType === "artisan") {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", data.user.id)
            .single();

          if (profile) {
            const { error: artisanError } = await supabase
              .from("artisans")
              .insert([{
                user_id: data.user.id,
                profile_id: profile.id,
                business_name: "Non renseigné",
                city: "Non renseigné",
                status: "pending",
                description: null,
                photo_url: null,
                portfolio_images: null,
                portfolio_videos: null,
                experience_years: 0,
                rating: 0,
                review_count: 0,
                missions_completed: 0,
                availability: {},
              }]);

            if (artisanError) {
              console.error("Error creating artisan:", artisanError);
            }
          }
        }

        // Send custom branded confirmation email
        try {
          await supabase.functions.invoke("send-confirmation-email", {
            body: {
              email: validatedData.email,
              firstName: validatedData.firstName,
              lastName: validatedData.lastName,
              userType,
              confirmationUrl: `${window.location.origin}/auth/callback`,
            },
          });
        } catch (emailError) {
          console.error("Error sending custom email:", emailError);
          // Continue anyway, Supabase will send default email
        }

        // Show full-page confirmation instead of toast
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (error) throw error;

      // Send new device notification (runs in background)
      if (data.user) {
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
      // Resend via Supabase Auth (for the confirmation link)
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: sentEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) throw error;

      // Also send our branded email
      try {
        await supabase.functions.invoke("send-confirmation-email", {
          body: {
            email: sentEmail,
            firstName: sentFirstName || "Utilisateur",
            userType,
            confirmationUrl: `${window.location.origin}/auth/callback`,
          },
        });
      } catch (emailError) {
        console.error("Error sending custom email:", emailError);
      }

      toast({
        title: "Email renvoyé !",
        description: "Un nouvel email de confirmation a été envoyé.",
      });
      setResendCooldown(60); // 60 seconds cooldown
    } catch (error: any) {
      console.error("Resend error:", error);
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
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
          <div className="text-center space-y-6 p-8 max-w-md">
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Email de confirmation envoyé !</h1>
            <p className="text-muted-foreground">
              Un email a été envoyé à <strong className="text-foreground">{sentEmail}</strong>.<br />
              Cliquez sur le lien dans l'email pour activer votre compte.
            </p>
            <p className="text-sm text-muted-foreground">
              Vous n'avez pas reçu l'email ? Vérifiez vos spams.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                variant="default" 
                onClick={handleResendEmail}
                disabled={isResending || resendCooldown > 0}
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
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Connexion" 
        description="Connectez-vous à votre compte Artisans Validés"
        noIndex={true}
      />
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Link>

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {authMode === "login" ? "Connexion" : "Inscription"}
              </CardTitle>
              <CardDescription>
                {authMode === "login" 
                  ? "Connectez-vous à votre compte" 
                  : "Créez votre compte pour commencer"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* User Type Selection */}
              <Tabs value={userType} onValueChange={(v) => setUserType(v as "client" | "artisan")} className="mb-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="client">Je suis un client</TabsTrigger>
                  <TabsTrigger value="artisan">Je suis un artisan</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Artisan notice */}
              {userType === "artisan" && (
                <div className="bg-muted/50 p-3 rounded-lg mb-6 text-sm text-muted-foreground">
                  <p>Les artisans doivent s'inscrire avec leur email professionnel pour être vérifiés.</p>
                </div>
              )}

              {/* Auth Mode Toggle */}
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
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Se connecter
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
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Créer mon compte
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Auth;
