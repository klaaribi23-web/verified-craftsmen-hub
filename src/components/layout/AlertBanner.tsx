import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Flame, X } from "lucide-react";

/** Routes where the alert banner must NEVER appear */
const HIDDEN_ROUTES = ["/admin", "/activation-elite", "/artisan/", "/client/"];

export const ALERT_BANNER_HEIGHT = 36; // px — used by Navbar for offset

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

  const isHidden = HIDDEN_ROUTES.some((r) => pathname.startsWith(r));
  if (dismissed || !count || isHidden) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[58] bg-destructive/90 backdrop-blur-sm text-destructive-foreground text-[11px] sm:text-xs font-semibold text-center px-3"
      style={{ height: `${ALERT_BANNER_HEIGHT}px`, lineHeight: `${ALERT_BANNER_HEIGHT}px` }}
    >
      <div className="flex items-center justify-center gap-1.5 h-full">
        <Flame className="w-3.5 h-3.5 shrink-0 animate-pulse" />
        <span className="truncate">
          <strong>{count} clients</strong> attendent un artisan.{" "}
          <a href="/devenir-partenaire" className="underline underline-offset-2 font-bold hover:text-white/90">
            Activez votre accès.
          </a>
        </span>
        <button
          onClick={() => setDismissed(true)}
          className="ml-1 p-0.5 hover:bg-white/20 rounded transition-colors shrink-0"
          aria-label="Fermer"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default AlertBanner;
