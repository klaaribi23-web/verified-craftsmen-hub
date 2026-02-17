import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { SEOHead } from "@/components/seo/SEOHead";
import { notifyPasswordChanged } from "@/hooks/useSecurityNotifications";
import { motion } from "framer-motion";
import { 
  Lock, 
  Loader2,
  CheckCircle,
  Shield,
  ArrowLeft
} from "lucide-react";

const passwordSchema = z.string()
  .min(8, "Minimum 8 caractères")
  .regex(/[A-Z]/, "Au moins une majuscule requise")
  .regex(/[0-9]/, "Au moins un chiffre requis");

const ResetPassword = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsValidSession(!!session);
      setCheckingSession(false);
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validationResult = passwordSchema.safeParse(password);

      if (!validationResult.success) {
        toast({
          title: "Erreur de validation",
          description: validationResult.error.errors[0].message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        toast({
          title: "Erreur",
          description: "Les mots de passe ne correspondent pas.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      // Send security notification for password change
      if (data.user) {
        notifyPasswordChanged(data.user.id);
      }

      toast({
        title: "Mot de passe mis à jour",
        description: "Votre mot de passe a été réinitialisé avec succès.",
      });

      navigate("/auth");
    } catch (error: any) {
      console.error("Update password error:", error);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A192F' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-2xl border-2 border-primary/40 flex items-center justify-center bg-primary/10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
          <p className="text-sm font-semibold text-primary uppercase tracking-[0.2em]">
            VÉRIFICATION DE VOTRE ACCÈS...
          </p>
        </div>
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A192F' }}>
        <div className="max-w-md mx-auto px-4">
          <Card className="border-primary/30 shadow-gold" style={{ background: '#020617' }}>
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto bg-destructive/20 rounded-full flex items-center justify-center mb-4 border border-destructive/30">
                <Shield className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl text-white uppercase font-black">Lien expiré</CardTitle>
              <CardDescription className="text-white/80">
                Ce lien de réinitialisation n'est plus valide ou a expiré.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="gold"
                onClick={() => navigate("/forgot-password")}
                className="w-full font-bold"
              >
                Demander un nouveau lien
              </Button>
              <Button 
                variant="outline-gold"
                onClick={() => navigate("/auth")}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à la connexion
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12" style={{ background: '#0A192F' }}>
      <SEOHead 
        title="Réinitialiser le mot de passe" 
        description="Créez un nouveau mot de passe pour votre compte"
        noIndex={true}
      />
      
      <div className="max-w-md mx-auto w-full px-4">
        <Card className="border-primary/30 shadow-gold" style={{ background: '#020617' }}>
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4 border border-primary/30">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl text-white uppercase font-black tracking-wide">
              Nouveau mot de passe
            </CardTitle>
            <CardDescription className="text-white/80">
              Créez un nouveau mot de passe pour votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Nouveau mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 border-primary/30 text-white"
                    style={{ background: '#0A192F' }}
                    required
                    minLength={8}
                  />
                </div>
                <p className="text-xs text-white/60">
                  Minimum 8 caractères, une majuscule et un chiffre
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 border-primary/30 text-white"
                    style={{ background: '#0A192F' }}
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full font-bold" variant="gold" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                RÉINITIALISER MON MOT DE PASSE
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button 
                onClick={() => navigate("/auth")}
                className="text-sm text-primary hover:underline"
              >
                <ArrowLeft className="h-3 w-3 inline mr-1" />
                Retour à la connexion
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;