import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
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
  
  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  // OTP verification state
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [pendingSignupData, setPendingSignupData] = useState<{
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    userType: "client" | "artisan";
  } | null>(null);

  // Timer countdown effect
  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

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

      // Send OTP to email
      const { error } = await supabase.auth.signInWithOtp({
        email: validatedData.email,
        options: {
          shouldCreateUser: false, // Don't create user yet, just send OTP
        }
      });

      if (error && error.message !== "Signups not allowed for otp") {
        // For new users, we need to use a different approach
        // Store the signup data and send verification email
        const { error: signupError } = await supabase.auth.signUp({
          email: validatedData.email,
          password: validatedData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              first_name: validatedData.firstName,
              last_name: validatedData.lastName,
            }
          }
        });

        if (signupError) throw signupError;
      }

      // Store pending signup data
      setPendingSignupData({
        email: validatedData.email,
        password: validatedData.password,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        userType,
      });

      setShowOtpVerification(true);
      setResendTimer(60);
      toast({
        title: "Code envoyé !",
        description: "Un code de confirmation a été envoyé à votre adresse email.",
      });

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

  const handleVerifyOtp = async () => {
    if (!pendingSignupData || otpCode.length !== 6) return;
    
    setIsLoading(true);

    try {
      // Verify OTP
      const { data, error } = await supabase.auth.verifyOtp({
        email: pendingSignupData.email,
        token: otpCode,
        type: 'email',
      });

      if (error) throw error;

      if (data.user) {
        // Add user role
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert([{ user_id: data.user.id, role: pendingSignupData.userType }]);

        if (roleError) {
          console.error("Error adding role:", roleError);
        }

        // If artisan, create artisan profile
        if (pendingSignupData.userType === "artisan") {
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
                business_name: `${pendingSignupData.firstName} ${pendingSignupData.lastName}`,
                city: "Non renseigné",
                status: "pending"
              }]);

            if (artisanError) {
              console.error("Error creating artisan:", artisanError);
            }
          }
        }

        toast({
          title: "Email confirmé !",
          description: "Votre compte a été créé avec succès.",
        });

        redirectUser();
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);
      toast({
        title: "Code invalide",
        description: "Le code de confirmation est incorrect ou a expiré.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!pendingSignupData) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: pendingSignupData.email,
      });

      if (error) throw error;

      setResendTimer(60);
      toast({
        title: "Code renvoyé !",
        description: "Un nouveau code a été envoyé à votre adresse email.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
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

  // OTP Verification Screen
  if (showOtpVerification && pendingSignupData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto">
            <Button 
              variant="ghost" 
              onClick={() => {
                setShowOtpVerification(false);
                setOtpCode("");
              }}
              className="mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>

            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Vérifiez votre email</CardTitle>
                <CardDescription>
                  Un code de confirmation a été envoyé à <span className="font-medium text-foreground">{pendingSignupData.email}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otpCode}
                    onChange={(value) => setOtpCode(value)}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button 
                  onClick={handleVerifyOtp} 
                  className="w-full" 
                  disabled={isLoading || otpCode.length !== 6}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Confirmer mon email
                </Button>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Vous n'avez pas reçu le code ?
                  </p>
                  <Button 
                    variant="link" 
                    onClick={handleResendOtp}
                    disabled={isLoading || resendTimer > 0}
                    className="text-primary"
                  >
                    {resendTimer > 0 ? `Renvoyer dans ${resendTimer}s` : "Renvoyer le code"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

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
                      Recevoir le code de confirmation
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
