import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Shield, Lock, Mail, Eye, EyeOff, Loader2, Scan, Crown } from "lucide-react";

const BienvenueElite = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sector = searchParams.get("sector") || "NORD";
  const target = searchParams.get("target") || "/artisan/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");

  const [countdown, setCountdown] = useState({ h: 23, m: 59, s: 59 });

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        let { h, m, s } = prev;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 23; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // If already logged in, redirect
  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/artisan/dashboard", { replace: true });
      }
    };
    check();
  }, [navigate]);

  const pad = (n: number) => n.toString().padStart(2, "0");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes("Invalid login")) {
            toast.error("Email ou mot de passe incorrect.");
          } else {
            toast.error(error.message);
          }
          setIsLoading(false);
          return;
        }
        toast.success("Connexion réussie ! Bienvenue dans l'élite.");
        navigate("/artisan/dashboard", { replace: true });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { user_type: "artisan" },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) {
          toast.error(error.message);
          setIsLoading(false);
          return;
        }
        toast.success("Vérifiez votre boîte mail pour confirmer votre compte.");
      }
    } catch {
      toast.error("Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Accès Élite — Artisans Validés"
        description="Finalisez votre profil pour recevoir vos chantiers exclusifs."
        noIndex={true}
      />
      <div
        className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4"
        style={{ background: "#0A192F" }}
      >
        {/* Scanner sweep */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(180deg, transparent 0%, rgba(212,175,55,0.06) 50%, transparent 100%)",
          }}
          animate={{ y: ["-100%", "100%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />

        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 w-full max-w-md"
        >
          {/* Crown icon */}
          <motion.div
            className="w-16 h-16 mx-auto mb-5 rounded-2xl border-2 border-primary/40 flex items-center justify-center bg-primary/10"
            animate={{
              borderColor: ["rgba(212,175,55,0.4)", "rgba(212,175,55,0.8)", "rgba(212,175,55,0.4)"],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Crown className="w-8 h-8 text-primary" />
          </motion.div>

          {/* Status text */}
          <motion.p
            className="text-xs font-semibold text-primary uppercase tracking-[0.25em] text-center mb-3"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            SECTEUR {sector.toUpperCase()} — ACCÈS RÉSERVÉ
          </motion.p>

          <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wide text-center mb-2">
            VOTRE ACCÈS ÉLITE EST PRÊT
          </h1>
          <p className="text-white/80 text-center mb-6">
            Finalisez votre profil pour commencer à recevoir vos chantiers.
          </p>

          {/* Countdown */}
          <div className="flex items-center justify-center gap-1 mb-6">
            <Lock className="w-3.5 h-3.5 text-primary mr-2" />
            <span className="text-xs text-white/70 uppercase tracking-wider mr-2">Priorité expire dans</span>
            {[pad(countdown.h), pad(countdown.m), pad(countdown.s)].map((unit, i) => (
              <span key={i} className="flex items-center">
                <span
                  className="border border-primary/30 rounded px-2 py-1 text-sm font-mono font-bold text-primary tabular-nums"
                  style={{ background: "#020617" }}
                >
                  {unit}
                </span>
                {i < 2 && <span className="text-primary font-bold mx-0.5 text-xs">:</span>}
              </span>
            ))}
          </div>

          {/* Login card */}
          <Card className="border-primary/20 shadow-gold" style={{ background: "#020617" }}>
            <CardContent className="pt-6 pb-6 px-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white text-sm font-medium">Email professionnel</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                    <Input
                      type="email"
                      placeholder="votre@email.fr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 border-primary/30 text-white placeholder:text-white/30 focus:border-primary"
                      style={{ background: "#0A192F" }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white text-sm font-medium">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={mode === "signup" ? 8 : 1}
                      className="pl-10 pr-10 border-primary/30 text-white placeholder:text-white/30 focus:border-primary"
                      style={{ background: "#0A192F" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-gold text-primary-foreground font-bold uppercase tracking-wider btn-shine h-12"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : mode === "login" ? (
                    "ACCÉDER À MON ESPACE ÉLITE"
                  ) : (
                    "CRÉER MON ACCÈS ÉLITE"
                  )}
                </Button>
              </form>

              {/* Toggle login/signup */}
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  className="text-sm text-primary/80 hover:text-primary transition-colors"
                >
                  {mode === "login"
                    ? "Première visite ? Créer mon compte"
                    : "Déjà un compte ? Se connecter"}
                </button>
              </div>

              {/* Forgot password */}
              {mode === "login" && (
                <div className="mt-2 text-center">
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="text-xs text-white/40 hover:text-white/60 transition-colors"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trust badge */}
          <div className="flex items-center justify-center gap-2 mt-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-white font-medium">✅ CERTIFIÉ IA ANDREA</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-5 w-full h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(212,175,55,0.15)" }}>
            <motion.div
              className="h-full bg-gradient-gold rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "60%" }}
              transition={{ duration: 4, ease: "easeOut" }}
            />
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default BienvenueElite;
