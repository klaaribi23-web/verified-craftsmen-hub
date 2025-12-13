import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Loader2, Mail, RefreshCw, CheckCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get data from navigation state
  const { email, userId, userType, firstName } = location.state || {};
  
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Redirect if no email in state
  useEffect(() => {
    if (!email || !userId) {
      navigate("/auth");
    }
  }, [email, userId, navigate]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast({
        title: "Code incomplet",
        description: "Veuillez saisir les 6 chiffres du code.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("verify-code", {
        body: { email, code, userId },
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Erreur",
          description: data.error,
          variant: "destructive",
        });
        setCode("");
        return;
      }

      setIsVerified(true);
      toast({
        title: "Email vérifié !",
        description: "Votre compte a été activé avec succès.",
      });

      // Sign in the user after verification
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: location.state?.password || "",
      });

      if (signInError) {
        // If sign in fails, redirect to login
        setTimeout(() => {
          navigate("/auth");
        }, 2000);
      } else {
        // Redirect based on user type
        setTimeout(() => {
          if (data.userType === "artisan") {
            navigate("/artisan/dashboard");
          } else {
            navigate("/client/dashboard");
          }
        }, 2000);
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-verification-code", {
        body: { email, userId, userType, firstName },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Code renvoyé !",
        description: "Un nouveau code a été envoyé à votre adresse email.",
      });

      // Reset timer
      setCountdown(60);
      setCanResend(false);
      setCode("");
    } catch (error: any) {
      console.error("Resend error:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de renvoyer le code",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  // Auto-submit when code is complete
  useEffect(() => {
    if (code.length === 6 && !isLoading && !isVerified) {
      handleVerify();
    }
  }, [code]);

  if (!email || !userId) {
    return null;
  }

  if (isVerified) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl">Email vérifié !</CardTitle>
                <CardDescription>
                  Votre compte a été activé. Redirection en cours...
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
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
          <Link to="/auth" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Vérifiez votre email</CardTitle>
              <CardDescription>
                Nous avons envoyé un code à 6 chiffres à{" "}
                <span className="font-medium text-foreground">{email}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* OTP Input */}
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={code}
                  onChange={(value) => setCode(value)}
                  disabled={isLoading}
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

              {/* Timer */}
              <div className="text-center">
                {!canResend ? (
                  <p className="text-sm text-muted-foreground">
                    Code expire dans{" "}
                    <span className="font-semibold text-destructive">{countdown}s</span>
                  </p>
                ) : (
                  <p className="text-sm text-destructive font-medium">
                    Code expiré
                  </p>
                )}
              </div>

              {/* Verify Button */}
              <Button
                onClick={handleVerify}
                className="w-full"
                disabled={code.length !== 6 || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Vérifier le code
              </Button>

              {/* Resend Button */}
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Vous n'avez pas reçu le code ?
                </p>
                <Button
                  variant="outline"
                  onClick={handleResend}
                  disabled={!canResend || isResending}
                  className="w-full"
                >
                  {isResending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  {canResend ? "Renvoyer le code" : `Renvoyer dans ${countdown}s`}
                </Button>
              </div>

              {/* Info */}
              <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground text-center">
                <p>Vérifiez vos spams si vous ne trouvez pas l'email.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default VerifyEmail;
