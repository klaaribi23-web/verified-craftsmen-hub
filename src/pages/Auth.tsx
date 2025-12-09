import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { 
  Mail, 
  Lock, 
  User, 
  Loader2,
  ArrowLeft
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
// Google Icon component
const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

// Facebook Icon component
const FacebookIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState<"client" | "artisan">("client");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  
  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

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
    // Check user role and redirect accordingly
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
      // Validate input with Zod
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
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: validatedData.firstName,
            last_name: validatedData.lastName,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Add user role
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert([{ user_id: data.user.id, role: userType }]);

        if (roleError) {
          console.error("Error adding role:", roleError);
        }

        // If artisan, create artisan profile
        if (userType === "artisan") {
          // Get profile ID
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
                business_name: `${firstName} ${lastName}`,
                city: "Non renseigné",
                status: "pending"
              }]);

            if (artisanError) {
              console.error("Error creating artisan:", artisanError);
            }
          }
        }

        toast({
          title: "Inscription réussie !",
          description: "Votre compte a été créé avec succès.",
        });

        redirectUser();
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
      // Validate input with Zod
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
          : error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "facebook",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
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

              {/* OAuth buttons - Only for clients */}
              {userType === "client" && (
                <>
                  <div className="space-y-3 mb-6">
                    <Button 
                      variant="outline" 
                      className="w-full gap-2" 
                      onClick={handleGoogleSignIn}
                      disabled={isLoading}
                    >
                      <GoogleIcon />
                      Continuer avec Google
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full gap-2" 
                      onClick={handleFacebookSignIn}
                      disabled={isLoading}
                    >
                      <FacebookIcon />
                      Continuer avec Facebook
                    </Button>
                  </div>

                  <div className="relative mb-6">
                    <Separator />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                      ou
                    </span>
                  </div>
                </>
              )}

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
