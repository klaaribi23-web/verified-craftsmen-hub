import { useLocation } from "react-router-dom";
import { ALERT_BANNER_HEIGHT } from "@/components/layout/AlertBanner";

/** Reserves vertical space for the fixed AlertBanner on pages where it's visible */
const HIDDEN_ROUTES = ["/admin", "/activation-elite", "/artisan/", "/client/"];

const AlertBannerSpacer = () => {
  const { pathname } = useLocation();
  const isHidden = HIDDEN_ROUTES.some((r) => pathname.startsWith(r));
  if (isHidden) return null;
  return <div style={{ height: `${ALERT_BANNER_HEIGHT}px` }} aria-hidden />;
};

export default AlertBannerSpacer;
