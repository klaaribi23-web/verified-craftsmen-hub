import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Lock, AlertTriangle, Phone, Mail } from "lucide-react";

interface OwnerClosingTunnelProps {
  artisanName: string;
  city: string;
  artisanEmail?: string | null;
  artisanId: string;
  delaySeconds?: number;
}

const SUPPORT_PHONE = "09 70 70 70 70";

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
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

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

  const handleSendKeys = async () => {
    if (!email || !email.includes("@")) {
      toast.error("Veuillez entrer un e-mail valide.");
      return;
    }

    setIsSending(true);
    try {
      // Call the edge function to create account and send credentials
      const { data, error } = await supabase.functions.invoke("create-artisan-account", {
        body: {
          artisan_id: artisanId,
          email: email,
        },
      });

      if (error) throw error;

      setSent(true);
      toast.success("Vos identifiants ont été envoyés par e-mail !");

      // Clear owner mode persistence
      sessionStorage.removeItem("owner_mode");

      // Redirect after 3 seconds
      setTimeout(() => {
        window.location.href = "/connexion";
      }, 3000);
    } catch (err) {
      console.error("Error creating account:", err);
      toast.error("Une erreur est survenue. Contactez notre support.");
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

  return (
    <>
      {/* ═══ STICKY BOTTOM DECISION BAR ═══ */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[999999] animate-in slide-in-from-bottom-full duration-500"
        style={{
          background: "linear-gradient(180deg, #0A192F 0%, #0d1f3c 100%)",
          borderTop: "2px solid #FFB800",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
        }}
      >
        <div className="container mx-auto px-4 py-4 md:py-5">
          {/* Text */}
          <p
            className="text-center text-xs md:text-sm mb-3 md:mb-4 leading-relaxed"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            Votre outil de travail est prêt. Voulez-vous{" "}
            <span className="font-bold" style={{ color: "#FFB800" }}>
              activer votre exclusivité
            </span>{" "}
            sur le secteur de{" "}
            <span className="font-bold" style={{ color: "#FFB800" }}>
              {city}
            </span>{" "}
            ?
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {/* YES */}
            <button
              onClick={handleActivate}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-black text-sm uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #FFB800, #f0a500)",
                color: "#0A192F",
                boxShadow: "0 6px 25px rgba(255,184,0,0.35)",
                fontFamily: "'Montserrat',sans-serif",
              }}
            >
              ✅ OUI, J'ACTIVE MON ACCÈS
            </button>

            {/* NO */}
            <button
              onClick={handleRefuse}
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-medium transition-all border"
              style={{
                background: "transparent",
                color: "rgba(255,255,255,0.5)",
                borderColor: "rgba(255,255,255,0.15)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(239,68,68,0.5)";
                e.currentTarget.style.color = "rgba(239,68,68,0.8)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                e.currentTarget.style.color = "rgba(255,255,255,0.5)";
              }}
            >
              Non, supprimer la fiche
            </button>
          </div>
        </div>
      </div>

      {/* ═══ ACCESS GENERATION POP-IN ═══ */}
      <Dialog open={showAccessDialog} onOpenChange={setShowAccessDialog}>
        <DialogContent
          className="sm:max-w-md border-0"
          style={{
            background: "#0A192F",
            border: "1px solid rgba(255,184,0,0.3)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          }}
        >
          <DialogHeader>
            <DialogTitle
              className="text-center text-lg font-black uppercase tracking-wide"
              style={{ color: "#FFB800", fontFamily: "'Montserrat',sans-serif" }}
            >
              <Lock className="inline h-5 w-5 mr-2 mb-0.5" />
              Génération de vos accès
            </DialogTitle>
          </DialogHeader>

          {!sent ? (
            <div className="space-y-5 pt-2">
              {/* Email field */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>
                  Confirmez l'e-mail pour recevoir vos accès :
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-[#FFB800] focus:ring-[#FFB800]/20"
                />
              </div>

              {/* CTA */}
              <button
                onClick={handleSendKeys}
                disabled={isSending}
                className="w-full py-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all disabled:opacity-50"
                style={{
                  background: isSending ? "#666" : "linear-gradient(135deg, #FFB800, #f0a500)",
                  color: "#0A192F",
                  boxShadow: isSending ? "none" : "0 6px 25px rgba(255,184,0,0.35)",
                  fontFamily: "'Montserrat',sans-serif",
                }}
              >
                {isSending ? "Envoi en cours..." : "🔑 RECEVOIR MES CLÉS"}
              </button>

              {/* Notes */}
              <div className="space-y-3 pt-2">
                <p className="text-xs flex items-start gap-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                  <Mail className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#FFB800" }} />
                  <span>
                    📧 Pensez à vérifier vos <strong className="text-white/70">spams</strong>, nos clés d'accès s'y glissent parfois.
                  </span>
                </p>
                <p className="text-xs flex items-start gap-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                  <Phone className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#FFB800" }} />
                  <span>
                    📞 Une difficulté ? Contactez notre support au{" "}
                    <strong className="text-white/70">{SUPPORT_PHONE}</strong> ou via le chat.
                  </span>
                </p>
              </div>
            </div>
          ) : (
            /* Success state */
            <div className="text-center py-6 space-y-4">
              <div
                className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "rgba(34,197,94,0.15)", border: "2px solid #22c55e" }}
              >
                <span className="text-3xl">🎉</span>
              </div>
              <h3 className="text-lg font-bold" style={{ color: "#22c55e" }}>
                Identifiants envoyés !
              </h3>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                Vérifiez votre boîte mail. Redirection vers la connexion en cours...
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ REFUSE CONFIRMATION DIALOG ═══ */}
      <Dialog open={showRefuseDialog} onOpenChange={setShowRefuseDialog}>
        <DialogContent
          className="sm:max-w-md border-0"
          style={{
            background: "#0A192F",
            border: "1px solid rgba(239,68,68,0.3)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          }}
        >
          <DialogHeader>
            <DialogTitle
              className="text-center text-lg font-black uppercase tracking-wide"
              style={{ color: "#EF4444", fontFamily: "'Montserrat',sans-serif" }}
            >
              <AlertTriangle className="inline h-5 w-5 mr-2 mb-0.5" />
              Confirmer la suppression
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            <p className="text-sm text-center leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
              <strong style={{ color: "#EF4444" }}>Attention</strong>, cela supprimera votre visibilité actuelle sur{" "}
              <strong style={{ color: "#FFB800" }}>{city}</strong> au profit de vos concurrents.
              <br />
              <br />
              Votre fiche optimisée, votre référencement local et votre exclusivité de secteur seront définitivement perdus.
            </p>

            <div className="flex flex-col gap-3">
              {/* Cancel — go back */}
              <button
                onClick={() => setShowRefuseDialog(false)}
                className="w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider transition-all"
                style={{
                  background: "linear-gradient(135deg, #FFB800, #f0a500)",
                  color: "#0A192F",
                  fontFamily: "'Montserrat',sans-serif",
                }}
              >
                ← Non, je garde ma place
              </button>

              {/* Confirm delete */}
              <button
                onClick={handleConfirmRefuse}
                className="w-full py-3 rounded-xl text-xs font-medium transition-all border"
                style={{
                  background: "transparent",
                  color: "rgba(239,68,68,0.7)",
                  borderColor: "rgba(239,68,68,0.3)",
                }}
              >
                Oui, supprimer ma fiche
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OwnerClosingTunnel;
