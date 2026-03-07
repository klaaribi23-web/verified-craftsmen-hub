import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { SEOHead } from "@/components/seo/SEOHead";
import { 
  Mail, 
  Loader2,
  ArrowLeft,
  CheckCircle,
  Shield
} from "lucide-react";

const emailSchema = z.string().trim().email("Email invalide").max(255, "Email trop long");

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validationResult = emailSchema.safeParse(email);

      if (!validationResult.success) {
        toast({
          title: "Erreur de validation",
          description: validationResult.error.errors[0].message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setEmailSent(true);
      toast({
        title: "Email envoyé",
        description: "Consultez votre boîte mail pour réinitialiser votre mot de passe.",
      });
    } catch (error: any) {
      console.error("Reset password error:", error);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md mx-auto px-4">
            <Card className="border shadow-sm">
            <CardHeader className="text-center">
              <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4 border border-primary/30">
                <CheckCircle className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-2xl text-foreground uppercase font-black">Email envoyé</CardTitle>
              <CardDescription>
                Un lien de réinitialisation a été envoyé à <span className="font-semibold text-primary">{email}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border border-primary/30 rounded-lg p-4 bg-primary/5">
                <p className="text-sm text-muted-foreground">
                  Cliquez sur le lien dans l'email pour créer un nouveau mot de passe. Le lien expire dans 1 heure.
                </p>
              </div>

              <div className="border border-primary/20 rounded-lg p-4 bg-primary/5">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-primary">Pensez à vérifier vos spams</strong> si vous ne trouvez pas l'email.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Button 
                  variant="gold" 
                  onClick={() => {
                    setEmailSent(false);
                    setEmail("");
                  }}
                  className="w-full font-bold"
                >
                  Renvoyer l'email
                </Button>
                
                <Button variant="outline" onClick={() => navigate("/auth")} className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour à la connexion
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 bg-background">
      <SEOHead 
        title="Mot de passe oublié" 
        description="Réinitialisez votre mot de passe Artisans Validés"
        noIndex={true}
      />
      
      <div className="max-w-md mx-auto w-full px-4">
        <button 
          onClick={() => navigate("/auth")}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la connexion
        </button>

        <Card className="border shadow-sm">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4 border border-primary/30">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl text-foreground uppercase font-black tracking-wide">
              Mot de passe oublié
            </CardTitle>
            <CardDescription>
              Entrez votre email pour recevoir un lien de réinitialisation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  />
                </div>
              </div>

              <Button type="submit" className="w-full font-bold" variant="gold" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                ENVOYER LE LIEN DE RÉINITIALISATION
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;