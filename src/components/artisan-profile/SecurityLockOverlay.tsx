import { useState, useEffect, useCallback } from "react";
import { Lock, ShieldAlert } from "lucide-react";

interface SecurityLockOverlayProps {
  artisanName: string;
  city: string;
  delaySeconds?: number;
}

const SecurityLockOverlay = ({ artisanName, city, delaySeconds = 8 }: SecurityLockOverlayProps) => {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Countdown to tomorrow 18h
  const getDeadline = useCallback(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(18, 0, 0, 0);
    return d;
  }, []);

  const [timeLeft, setTimeLeft] = useState(() => {
    const diff = getDeadline().getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 1000));
  });

  // Show after delay
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delaySeconds * 1000);
    return () => clearTimeout(timer);
  }, [delaySeconds]);

  // Countdown tick
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      const diff = getDeadline().getTime() - Date.now();
      setTimeLeft(Math.max(0, Math.floor(diff / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [visible, getDeadline]);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");

  if (!visible || dismissed) return null;

  return (
    <>
      {/* Full-screen overlay */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"
        style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", backgroundColor: "rgba(10,25,47,0.6)" }}
      >
        <div
          className="w-full max-w-lg rounded-2xl p-px"
          style={{ background: "linear-gradient(135deg, #FFB800, rgba(255,184,0,0.3), #FFB800)" }}
        >
          <div className="rounded-2xl p-6 md:p-8 text-center" style={{ background: "#0A192F" }}>
            {/* Animated lock icon */}
            <div className="mx-auto mb-5 w-16 h-16 rounded-full flex items-center justify-center animate-pulse"
              style={{ background: "rgba(255,184,0,0.12)", border: "2px solid #FFB800" }}
            >
              <Lock className="h-8 w-8" style={{ color: "#FFB800" }} />
            </div>

            {/* Title */}
            <h2 className="text-lg md:text-xl font-black uppercase tracking-wider mb-4"
              style={{ color: "#FFB800", fontFamily: "'Montserrat',sans-serif" }}
            >
              STATUT : SECTEUR {city.toUpperCase()} NON SÉCURISÉ
            </h2>

            {/* Impact text */}
            <p className="text-sm md:text-base leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.7)" }}>
              Votre fiche est configurée et attire déjà l'attention. Cependant, votre{" "}
              <span className="font-bold" style={{ color: "#FFB800" }}>exclusivité prioritaire</span>{" "}
              n'est pas encore activée. Passé le délai de 18h00 demain, cette position sera proposée à votre concurrent direct sur le secteur.
            </p>

            {/* Countdown */}
            <div className="flex items-center justify-center gap-3 mb-7">
              {[
                { val: pad(hours), label: "HEURES" },
                { val: pad(minutes), label: "MIN" },
                { val: pad(seconds), label: "SEC" },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span
                    className="text-3xl md:text-4xl font-black tabular-nums"
                    style={{ color: "#EF4444", fontFamily: "'Montserrat',sans-serif", textShadow: "0 0 20px rgba(239,68,68,0.4)" }}
                  >
                    {item.val}
                  </span>
                  <span className="text-[10px] font-bold tracking-widest mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Primary CTA */}
            <a
              href="/connexion"
              className="relative block w-full py-4 px-6 rounded-xl text-center font-black text-sm md:text-base uppercase tracking-wider overflow-hidden mb-4"
              style={{
                background: "#FFB800",
                color: "#0A192F",
                boxShadow: "0 8px 30px rgba(255,184,0,0.35)",
                fontFamily: "'Montserrat',sans-serif",
              }}
            >
              {/* Shimmer */}
              <span
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
                style={{
                  background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)",
                  animation: "overlay-shimmer 3s ease-in-out infinite",
                }}
              />
              <span className="relative z-10">🔒 SCELLER MON EXCLUSIVITÉ & ACTIVER LES APPELS</span>
            </a>

            {/* Secondary — guilt link */}
            <button
              onClick={() => setDismissed(true)}
              className="text-xs underline transition-colors cursor-pointer bg-transparent border-none"
              style={{ color: "rgba(255,255,255,0.35)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
            >
              Quitter et prendre le risque qu'un concurrent récupère ma place
            </button>
          </div>
        </div>
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes overlay-shimmer {
          0% { transform: translateX(-100%); }
          60% { transform: translateX(150%); }
          100% { transform: translateX(150%); }
        }
      `}</style>
    </>
  );
};

export default SecurityLockOverlay;
