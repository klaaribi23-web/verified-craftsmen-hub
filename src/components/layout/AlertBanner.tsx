import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Flame, X } from "lucide-react";

/** Routes where the alert banner must NEVER appear */
const HIDDEN_ROUTES = ["/admin", "/activation-elite", "/artisan/"];

const AlertBanner = () => {
  const { pathname } = useLocation();
  const [count, setCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const pseudo = ((seed * 9301 + 49297) % 233280) / 233280;
    setCount(Math.floor(pseudo * 40) + 40);
  }, []);

  // Hide on admin, artisan dashboard, and activation-elite pages
  const isHidden = HIDDEN_ROUTES.some((r) => pathname.startsWith(r));
  if (dismissed || !count || isHidden) return null;

  return (
    <div className="bg-destructive/90 backdrop-blur-sm text-destructive-foreground text-xs sm:text-sm font-semibold text-center px-4 py-2 relative z-[60]">
      <div className="flex items-center justify-center gap-2">
        <Flame className="w-4 h-4 shrink-0 animate-pulse" />
        <span>
          ALERTE : <strong>{count} clients</strong> attendent un artisan dans votre secteur.{" "}
          <a href="/devenir-artisan" className="underline underline-offset-2 font-bold hover:text-white/90">
            Activez votre accès pour débloquer.
          </a>
        </span>
        <button
          onClick={() => setDismissed(true)}
          className="ml-2 p-0.5 hover:bg-white/20 rounded transition-colors shrink-0"
          aria-label="Fermer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default AlertBanner;
