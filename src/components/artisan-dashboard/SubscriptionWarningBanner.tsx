import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

export const SubscriptionWarningBanner = () => {
  return (
    <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg px-4 py-3 mb-6 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
        <span className="font-semibold text-sm">Attention</span>
      </div>
      <p className="text-sm text-foreground flex-1">
        Votre profil n'est pas encore visible par les clients. Activez votre abonnement pour apparaître dans les recherches.
      </p>
      <Link
        to="/artisan/abonnement"
        className="inline-flex items-center justify-center text-sm font-semibold text-primary-foreground bg-orange-500 hover:bg-orange-600 px-4 py-1.5 rounded-md transition-colors whitespace-nowrap"
      >
        Activer maintenant
      </Link>
    </div>
  );
};
