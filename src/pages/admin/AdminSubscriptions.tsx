import { useState } from "react";
import { AdminSidebar } from "@/components/admin-dashboard/AdminSidebar";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  CreditCard, 
  ExternalLink, 
  Calendar, 
  RefreshCw,
  Building2,
  Mail,
  Phone,
  Crown,
  Award,
  Medal,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { useSubscribedArtisans, SubscribedArtisan } from "@/hooks/useSubscribedArtisans";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Plan configuration with real Stripe prices
const PLAN_CONFIG = {
  essentiel: {
    name: "Essentiel",
    color: "bg-amber-600",
    icon: Medal,
    prices: { monthly: "29,90€/mois", yearly: "299€/an" }
  },
  pro: {
    name: "Pro",
    color: "bg-slate-400",
    icon: Award,
    prices: { monthly: "59,90€/mois", yearly: "599€/an" }
  },
  elite: {
    name: "Elite",
    color: "bg-yellow-500",
    icon: Crown,
    prices: { monthly: "99,90€/mois", yearly: "999€/an" }
  }
};

interface SubscriptionDetails {
  tier: string;
  billing_interval: string;
  subscription_start: string | null;
  subscription_end: string | null;
  price_amount: number | null;
  canceled: boolean;
  canceled_at: string | null;
}

const AdminSubscriptions = () => {
  const { data: artisans, isLoading, refetch } = useSubscribedArtisans();
  const [selectedArtisan, setSelectedArtisan] = useState<SubscribedArtisan | null>(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const handleViewSubscription = async (artisan: SubscribedArtisan) => {
    setSelectedArtisan(artisan);
    setLoadingDetails(true);
    setSubscriptionDetails(null);

    try {
      if (!artisan.stripe_customer_id) {
        // Fallback to database data only
        setSubscriptionDetails({
          tier: artisan.subscription_tier || "free",
          billing_interval: "monthly",
          subscription_start: artisan.created_at,
          subscription_end: artisan.subscription_end,
          price_amount: null,
          canceled: false,
          canceled_at: null
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke("get-subscription-details", {
        body: { stripe_customer_id: artisan.stripe_customer_id }
      });

      if (error) throw error;

      setSubscriptionDetails(data);
    } catch (error) {
      console.error("Error fetching subscription details:", error);
      // Fallback to database data
      setSubscriptionDetails({
        tier: artisan.subscription_tier || "free",
        billing_interval: "monthly",
        subscription_start: artisan.created_at,
        subscription_end: artisan.subscription_end,
        price_amount: null,
        canceled: false,
        canceled_at: null
      });
      toast.error("Impossible de récupérer les détails depuis Stripe");
    } finally {
      setLoadingDetails(false);
    }
  };

  const getTierBadge = (tier: string | null) => {
    if (!tier || tier === "free") return null;
    
    const config = PLAN_CONFIG[tier as keyof typeof PLAN_CONFIG];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <Badge className={`${config.color} text-white gap-1`}>
        <Icon className="w-3 h-3" />
        {config.name}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    try {
      return format(new Date(dateString), "d MMMM yyyy", { locale: fr });
    } catch {
      return "—";
    }
  };

  const getPrice = (tier: string, interval: string) => {
    const config = PLAN_CONFIG[tier as keyof typeof PLAN_CONFIG];
    if (!config) return "—";
    return interval === "yearly" ? config.prices.yearly : config.prices.monthly;
  };

  return (
    <>
      <SEOHead
        title="Abonnements | Admin - Artisans Validés"
        description="Gestion des abonnements artisans"
        noIndex
      />

      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        
        <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
                  <CreditCard className="w-7 h-7 text-primary" />
                  Abonnements
                </h1>
                <p className="text-muted-foreground mt-1">
                  {artisans?.length || 0} artisan(s) avec abonnement payant
                </p>
              </div>
              <Button variant="outline" onClick={() => refetch()} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Actualiser
              </Button>
            </div>

            {/* Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Liste des abonnés</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : !artisans || artisans.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun artisan avec abonnement payant</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Entreprise</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Téléphone</TableHead>
                          <TableHead>Abonnement</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {artisans.map((artisan) => (
                          <TableRow key={artisan.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10">
                                  <AvatarImage src={artisan.photo_url || ""} />
                                  <AvatarFallback>
                                    <Building2 className="w-5 h-5" />
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{artisan.business_name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {artisan.category?.name || "Non catégorisé"}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                {artisan.email || "—"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-4 h-4 text-muted-foreground" />
                                {artisan.phone || "—"}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getTierBadge(artisan.subscription_tier)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                >
                                  <Link to={`/artisan/${artisan.slug}`} target="_blank">
                                    <ExternalLink className="w-4 h-4 mr-1" />
                                    Voir fiche
                                  </Link>
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleViewSubscription(artisan)}
                                >
                                  <Calendar className="w-4 h-4 mr-1" />
                                  Voir abonnement
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Subscription Details Dialog */}
      <Dialog open={!!selectedArtisan} onOpenChange={() => setSelectedArtisan(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Détails de l'abonnement
            </DialogTitle>
          </DialogHeader>
          
          {selectedArtisan && (
            <div className="space-y-4">
              {/* Artisan Info */}
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={selectedArtisan.photo_url || ""} />
                  <AvatarFallback>
                    <Building2 className="w-6 h-6" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{selectedArtisan.business_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedArtisan.email}</p>
                </div>
              </div>

              {loadingDetails ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : subscriptionDetails ? (
                <div className="space-y-3">
                  {/* Plan */}
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Plan</span>
                    <div className="flex items-center gap-2">
                      {getTierBadge(subscriptionDetails.tier)}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Tarif</span>
                    <span className="font-medium">
                      {getPrice(subscriptionDetails.tier, subscriptionDetails.billing_interval)}
                    </span>
                  </div>

                  {/* Billing Interval */}
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Facturation</span>
                    <Badge variant="outline">
                      {subscriptionDetails.billing_interval === "yearly" ? "Annuelle" : "Mensuelle"}
                    </Badge>
                  </div>

                  {/* Start Date */}
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Souscrit le</span>
                    <span className="font-medium">
                      {formatDate(subscriptionDetails.subscription_start)}
                    </span>
                  </div>

                  {/* Next Billing Date */}
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Prochaine facturation</span>
                    <span className="font-medium text-primary">
                      {formatDate(subscriptionDetails.subscription_end)}
                    </span>
                  </div>

                  {/* Cancellation Alert - Only shown if canceled */}
                  {subscriptionDetails.canceled && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Abonnement annulé</AlertTitle>
                      <AlertDescription className="space-y-1">
                        {subscriptionDetails.canceled_at && (
                          <p>Annulé le {formatDate(subscriptionDetails.canceled_at)}</p>
                        )}
                        <p className="text-sm">
                          L'accès reste actif jusqu'au {formatDate(subscriptionDetails.subscription_end)}
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  Impossible de charger les détails
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminSubscriptions;