import { Link } from "react-router-dom";
import { ShieldCheck, Calendar, FileText, AlertTriangle, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SubscriptionDashboardCardProps {
  tier: string;
  subscriptionEnd: string | null;
  isLoading?: boolean;
}

export const SubscriptionDashboardCard = ({
  tier,
  subscriptionEnd,
  isLoading = false,
}: SubscriptionDashboardCardProps) => {
  const isSubscribed = tier !== "free";
  const isLegacy = tier === "legacy";

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-soft p-4 md:p-6 mb-6 md:mb-8 animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-muted" />
            <div className="flex-1">
              <div className="h-5 bg-muted rounded w-40 mb-2" />
              <div className="h-4 bg-muted rounded w-56" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isSubscribed) {
    return (
      <div className="bg-card rounded-xl border border-orange-500/30 shadow-soft p-4 md:p-6 mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">Abonnement inactif</h3>
                <Badge className="bg-orange-500/20 text-orange-600 dark:text-orange-400 border-0 text-xs px-2 py-0.5">
                  En attente
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Activez votre abonnement pour être visible et recevoir des demandes de clients.
              </p>
            </div>
          </div>
          <Link
            to="/artisan/abonnement"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-navy bg-gradient-to-r from-[#D4AF37] to-[#B8941F] hover:from-[#C9A430] hover:to-[#A6841A] px-5 py-2.5 rounded-lg transition-all whitespace-nowrap shadow-lg shadow-[#D4AF37]/20 hover:shadow-[#D4AF37]/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            🔒 ACTIVER MON EXCLUSIVITÉ SECTEUR
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-success/30 shadow-soft p-4 md:p-6 mb-6 md:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-success" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">
                {isLegacy ? "Partenaire Historique" : "Statut : Artisan Validé"}
              </h3>
              <Badge className="bg-success/20 text-success border-0 text-xs px-2 py-0.5">
                <ShieldCheck className="w-3 h-3 mr-1" />
                {isLegacy ? "Legacy" : "Actif"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Votre abonnement est actif.
              {subscriptionEnd && (
                <span className="inline-flex items-center gap-1 ml-2">
                  <Calendar className="w-3 h-3" />
                  Renouvellement le{" "}
                  {new Date(subscriptionEnd).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              )}
            </p>
          </div>
        </div>
        <Link
          to="/artisan/abonnement"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline whitespace-nowrap"
        >
          <FileText className="w-4 h-4" />
          Voir mes factures
        </Link>
      </div>
    </div>
  );
};
