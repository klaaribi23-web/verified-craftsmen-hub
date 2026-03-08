import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Lock, AlertTriangle, Phone, Mail, Loader2, Eye, EyeOff, Clock, CheckCircle2, XCircle } from "lucide-react";

interface OwnerClosingTunnelProps {
  artisanName: string;
  city: string;
  artisanEmail?: string | null;
  artisanId: string;
  delaySeconds?: number;
}

const SUPPORT_PHONE = "03 53 63 29 99";

// Deadline: tomorrow 18h
const getDeadline = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(18, 0, 0, 0);
  return d;
};

const useCountdown = () => {
  const [deadline] = useState(getDeadline);
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, deadline.getTime() - Date.now());
      setTimeLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  return timeLeft;
};

const OwnerClosingTunnel = ({
  artisanName,
  city,
  artisanEmail,
  artisanId,
  delaySeconds = 20,
}: OwnerClosingTunnelProps) => {
  const [barVisible, setBarVisible] = useState(false);
  const [showAccessDialog, setShowAccessDialog] = useState(false);
  const [showRefuseDialog, setShowRefuseDialog] = useState(false);
  const [email, setEmail] = useState(artisanEmail || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [step, setStep] = useState<"form" | "success">("form");
  const countdown = useCountdown();

  // Show sticky bar after delay OR after scrolling 40% of the page
  useEffect(() => {
    const timer = setTimeout(() => setBarVisible(true), delaySeconds * 1000);
    
    const handleScroll = () => {
      const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      if (scrollPercent > 0.4) {
        setBarVisible(true);
      }
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [delaySeconds]);

  // Update email if prop changes
  useEffect(() => {
    if (artisanEmail) setEmail(artisanEmail);
  }, [artisanEmail]);

  const handleActivate = () => {
    setShowAccessDialog(true);
  };

  const handleCreateAndLogin = async () => {
    if (!email || !email.includes("@")) {
      toast.error("Veuillez entrer un e-mail valide.");
      return;
    }
    if (!password || password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-artisan-account", {
        body: {
          email,
          password,
          firstName: artisanName.split(" ")[0] || "Artisan",
          lastName: artisanName.split(" ").slice(1).join(" ") || "",
          artisanId,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      sessionStorage.removeItem("owner_mode");
      sessionStorage.removeItem("owner_email");
      await supabase.auth.signOut();

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        console.error("Auto-login failed:", loginError);
        setStep("success");
        toast.success("Compte créé ! Connectez-vous avec vos identifiants.");
        setTimeout(() => {
          window.location.href = "/connexion";
        }, 2000);
        return;
      }

      setStep("success");
      toast.success("Bienvenue ! Redirection vers votre espace...");
      setTimeout(() => {
        window.location.href = "/artisan/dashboard";
      }, 1500);

    } catch (err: any) {
      console.error("Error creating account:", err);
      toast.error("Une erreur est survenue. Contactez notre support au " + SUPPORT_PHONE);
    } finally {
      setIsSending(false);
    }
  };

  const handleRefuse = () => {
    setShowRefuseDialog(true);
  };

  const handleConfirmRefuse = async () => {
    toast.info("Votre demande de suppression a été enregistrée. Notre équipe vous contactera.");
    setShowRefuseDialog(false);
    setBarVisible(false);
  };

  if (!barVisible) return null;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <>
      {/* ═══ STICKY BOTTOM DECISION BAR WITH COUNTDOWN ═══ */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[999999] animate-in slide-in-from-bottom-full duration-500"
        style={{
          background: "linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--card)) 100%)",
          borderTop: "2px solid hsl(var(--primary))",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
        }}
      >
        <div className="container mx-auto px-4 py-4 md:py-5">
          {/* Countdown timer */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-destructive animate-pulse" />
            <span className="text-xs font-bold text-destructive uppercase tracking-wider">
              Priorité expire dans
            </span>
            <div className="flex items-center gap-1 font-mono text-sm font-black text-destructive">
              <span className="bg-destructive/15 px-1.5 py-0.5 rounded">{pad(countdown.h)}</span>
              <span>:</span>
              <span className="bg-destructive/15 px-1.5 py-0.5 rounded">{pad(countdown.m)}</span>
              <span>:</span>
              <span className="bg-destructive/15 px-1.5 py-0.5 rounded">{pad(countdown.s)}</span>
            </div>
          </div>

          <p className="text-center text-xs md:text-sm mb-3 md:mb-4 leading-relaxed text-foreground/85">
            Votre outil de travail est prêt. Voulez-vous{" "}
            <span className="font-bold text-primary">activer votre exclusivité</span>{" "}
            sur le secteur de{" "}
            <span className="font-bold text-primary">{city}</span> ?
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleActivate}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-black text-sm uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] bg-primary text-primary-foreground relative overflow-hidden"
              style={{
                boxShadow: "0 6px 25px hsl(var(--primary) / 0.35)",
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              ✅ OUI, J'ACTIVE MON ACCÈS
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
            </button>

            <button
              onClick={handleRefuse}
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-medium transition-all border border-muted-foreground/15 text-muted-foreground/50 hover:border-red-500/50 hover:text-red-400/80"
              style={{ background: "transparent" }}
            >
              Non, abandonner mes chantiers
            </button>
          </div>
        </div>
      </div>

      {/* ═══ ACTIVATION MODAL WITH BEFORE/AFTER ═══ */}
      <Dialog open={showAccessDialog} onOpenChange={setShowAccessDialog}>
        <DialogContent
          className="sm:max-w-lg border-0 bg-card"
          style={{
            border: "1px solid hsl(var(--primary) / 0.3)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-black uppercase tracking-wide text-primary font-['DM_Sans']">
              <Lock className="inline h-5 w-5 mr-2 mb-0.5" />
              {step === "form" ? "Activez votre accès" : "Accès activé !"}
            </DialogTitle>
          </DialogHeader>

          {step === "form" ? (
            <div className="space-y-5 pt-2">
              {/* Before/After comparison */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 space-y-2">
                  <p className="font-bold text-destructive text-center text-[11px] uppercase">❌ Sans activation</p>
                  <ul className="space-y-1.5">
                    {["Fiche non référencée", "0 appel client", "Pas de badge validé", "Concurrents prioritaires"].map(t => (
                      <li key={t} className="flex items-start gap-1.5">
                        <XCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3 space-y-2">
                  <p className="font-bold text-green-500 text-center text-[11px] uppercase">✅ Avec activation</p>
                  <ul className="space-y-1.5">
                    {["SEO local optimisé", "3-5 chantiers/mois", "Badge Artisan Validé", "Exclusivité secteur"].map(t => (
                      <li key={t} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-foreground font-medium">{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Email field */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground/80">
                  Votre e-mail professionnel
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:ring-primary/20"
                />
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground/80">
                  Choisissez un mot de passe
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 caractères"
                    className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:ring-primary/20 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={handleCreateAndLogin}
                disabled={isSending}
                className="w-full py-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all disabled:opacity-50 bg-primary text-primary-foreground relative overflow-hidden"
                style={{
                  boxShadow: isSending ? "none" : "0 6px 25px hsl(var(--primary) / 0.35)",
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isSending ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> ACTIVATION EN COURS…</>
                  ) : (
                    "🚀 ACTIVER ET ACCÉDER À MON ESPACE"
                  )}
                </span>
                {!isSending && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                )}
              </button>

              {/* Countdown reminder */}
              <div className="flex items-center justify-center gap-2 text-xs text-destructive">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-bold">
                  Priorité expire dans {pad(countdown.h)}h{pad(countdown.m)}
                </span>
              </div>

              {/* Notes */}
              <div className="space-y-3 pt-2">
                <p className="text-xs flex items-start gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span>
                    Vos identifiants seront aussi envoyés par e-mail pour votre sécurité.
                  </span>
                </p>
                <p className="text-xs flex items-start gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span>
                    Support : <strong className="text-foreground/70">{SUPPORT_PHONE}</strong>
                  </span>
                </p>
              </div>
            </div>
          ) : (
            /* Success state */
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center bg-green-500/15 border-2 border-green-500">
                <span className="text-3xl">🎉</span>
              </div>
              <h3 className="text-lg font-bold text-green-500">
                Bienvenue dans l'Élite !
              </h3>
              <p className="text-sm text-muted-foreground">
                Redirection vers votre tableau de bord…
              </p>
              <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ REFUSE CONFIRMATION DIALOG ═══ */}
      <Dialog open={showRefuseDialog} onOpenChange={setShowRefuseDialog}>
        <DialogContent
          className="sm:max-w-md border-0 bg-card"
          style={{
            border: "1px solid rgba(239,68,68,0.3)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-black uppercase tracking-wide text-red-400 font-['DM_Sans']">
              <AlertTriangle className="inline h-5 w-5 mr-2 mb-0.5" />
              Confirmer la suppression
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            <p className="text-sm text-center leading-relaxed text-muted-foreground">
              <strong className="text-red-400">Attention</strong>, cela supprimera votre visibilité actuelle sur{" "}
              <strong className="text-primary">{city}</strong> au profit de vos concurrents.
              <br /><br />
              Votre fiche optimisée, votre référencement local et votre exclusivité de secteur seront définitivement perdus.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => setShowRefuseDialog(false)}
                className="w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider transition-all bg-primary text-primary-foreground"
                style={{ fontFamily: "'DM Sans',sans-serif" }}
              >
                ← Non, je garde ma place
              </button>

              <button
                onClick={handleConfirmRefuse}
                className="w-full py-3 rounded-xl text-xs font-medium transition-all border border-red-500/30 text-red-400/70 hover:bg-red-500/10"
                style={{ background: "transparent" }}
              >
                Oui, supprimer ma fiche
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </>
  );
};

export default OwnerClosingTunnel;
