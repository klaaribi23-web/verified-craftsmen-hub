import { useState } from "react";
import { Link } from "react-router-dom";
import { ThumbsUp, Star, Check, X, Loader2, Clock, CheckCircle, XCircle, ExternalLink, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import SEOHead from "@/components/seo/SEOHead";
import Navbar from "@/components/layout/Navbar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { AdminSidebar } from "@/components/admin-dashboard/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useAdminRecommendations,
  useApproveRecommendation,
  useRejectRecommendation,
  useRecommendationsCounts,
  Recommendation,
} from "@/hooks/useRecommendations";

const ratingLabels = [
  { key: "punctuality_rating", label: "Ponctualité" },
  { key: "presentation_rating", label: "Présentation" },
  { key: "work_quality_rating", label: "Qualité" },
  { key: "communication_rating", label: "Communication" },
] as const;

const AdminRecommendations = () => {
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected" | "all">("all");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: recommendations = [], isLoading } = useAdminRecommendations(activeTab);
  const { data: counts = { pending: 0, approved: 0, rejected: 0, total: 0 } } = useRecommendationsCounts();
  const approveMutation = useApproveRecommendation();
  const rejectMutation = useRejectRecommendation();

  const handleApprove = (id: string) => {
    approveMutation.mutate(id);
  };

  const handleRejectClick = (rec: Recommendation) => {
    setSelectedRecommendation(rec);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    if (selectedRecommendation) {
      rejectMutation.mutate({ id: selectedRecommendation.id, reason: rejectReason });
      setRejectDialogOpen(false);
      setSelectedRecommendation(null);
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${
            star <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"
          }`}
        />
      ))}
    </div>
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> En attente</Badge>;
      case "approved":
        return <Badge className="gap-1 bg-green-500"><CheckCircle className="h-3 w-3" /> Approuvée</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Rejetée</Badge>;
      default:
        return null;
    }
  };

  const getAverageRating = (rec: Recommendation) =>
    (rec.punctuality_rating + rec.presentation_rating + rec.work_quality_rating + rec.communication_rating) / 4;

  return (
    <>
      <SEOHead
        title="Modération des Recommandations | Admin - Artisan Validé"
        description="Gérez et modérez les recommandations clients"
      />
      <Navbar />
      <div className="flex min-h-screen pt-28 lg:pt-20 bg-background">
        <AdminSidebar />
        <main className="flex-1">
          <DashboardHeader 
            title="Modération des Recommandations" 
            subtitle="Validez ou rejetez les recommandations clients" 
          />

          <div className="p-4 md:p-8">

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
            <Card>
              <CardContent className="p-3 md:p-4 flex items-center gap-2 md:gap-4">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5 md:h-6 md:w-6 text-amber-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold">{counts.pending}</p>
                  <p className="text-xs md:text-sm text-muted-foreground truncate">En attente</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 md:p-4 flex items-center gap-2 md:gap-4">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-green-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold">{counts.approved}</p>
                  <p className="text-xs md:text-sm text-muted-foreground truncate">Approuvées</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 md:p-4 flex items-center gap-2 md:gap-4">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                  <XCircle className="h-5 w-5 md:h-6 md:w-6 text-red-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold">{counts.rejected}</p>
                  <p className="text-xs md:text-sm text-muted-foreground truncate">Rejetées</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="mb-4 flex-wrap h-auto gap-1">
              <TabsTrigger value="all" className="text-xs md:text-sm px-2 md:px-3">Toutes</TabsTrigger>
              <TabsTrigger value="approved" className="text-xs md:text-sm px-2 md:px-3">
                <span className="hidden sm:inline">Approuvées</span>
                <span className="sm:hidden">OK</span>
              </TabsTrigger>
              <TabsTrigger value="pending" className="gap-1 text-xs md:text-sm px-2 md:px-3">
                <span className="hidden sm:inline">En attente</span>
                <span className="sm:hidden">Attente</span>
                {counts.pending > 0 && (
                  <Badge variant="secondary" className="ml-0.5 md:ml-1 text-[10px] md:text-xs px-1">{counts.pending}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="rejected" className="text-xs md:text-sm px-2 md:px-3">
                <span className="hidden sm:inline">Rejetées</span>
                <span className="sm:hidden">Refus</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {isLoading && (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}

              {!isLoading && recommendations.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="py-16 text-center">
                    <ThumbsUp className="h-16 w-16 text-muted-foreground/30 mx-auto mb-6" />
                    <h3 className="text-xl font-semibold mb-2">Aucune recommandation</h3>
                    <p className="text-muted-foreground">
                      {activeTab === "pending" 
                        ? "Aucune recommandation en attente de modération."
                        : "Aucune recommandation dans cette catégorie."}
                    </p>
                  </CardContent>
                </Card>
              )}

              {!isLoading && recommendations.length > 0 && (
                <div className="space-y-4">
                  {recommendations.map((rec) => {
                    const client = rec.client;
                    const artisan = rec.artisan;
                    const avgRating = getAverageRating(rec);

                    return (
                      <Card key={rec.id}>
                        <CardContent className="p-6">
                          <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                            {/* Client & Artisan info */}
                            <div className="flex-1 space-y-4">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={client?.avatar_url || undefined} />
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                      <User className="h-5 w-5" />
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">
                                      {client?.first_name} {client?.last_name}
                                    </p>
                                  </div>
                                </div>
                                {getStatusBadge(rec.status)}
                              </div>

                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">Recommande :</span>
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={artisan?.photo_url || undefined} />
                                  <AvatarFallback className="text-xs">
                                    {artisan?.business_name?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{artisan?.business_name}</span>
                                {artisan?.slug && (
                                  <Link
                                    to={`/artisan/${artisan.slug}`}
                                    target="_blank"
                                    className="text-primary hover:underline inline-flex items-center gap-1"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Link>
                                )}
                              </div>

                              {/* Ratings */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {ratingLabels.map(({ key, label }) => (
                                  <div
                                    key={key}
                                    className="flex flex-col gap-1 bg-muted/30 rounded-lg px-3 py-2"
                                  >
                                    <span className="text-xs text-muted-foreground">{label}</span>
                                    {renderStars(rec[key] as number)}
                                  </div>
                                ))}
                              </div>

                              {/* Comment */}
                              {rec.comment && (
                                <p className="text-sm bg-muted/20 rounded-lg p-3">"{rec.comment}"</p>
                              )}

                              {/* Rejection reason */}
                              {rec.status === "rejected" && rec.rejection_reason && (
                                <div className="text-sm bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-lg p-3">
                                  <span className="font-medium">Raison du rejet :</span> {rec.rejection_reason}
                                </div>
                              )}

                              <p className="text-xs text-muted-foreground">
                                Soumise {formatDistanceToNow(new Date(rec.created_at), { addSuffix: true, locale: fr })}
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="flex lg:flex-col gap-2 shrink-0">
                              <div className="flex items-center gap-1.5 bg-primary/5 px-3 py-1.5 rounded-full mb-2">
                                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                <span className="font-semibold">{avgRating.toFixed(1)}</span>
                              </div>
                              
                              {rec.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    className="gap-2"
                                    onClick={() => handleApprove(rec.id)}
                                    disabled={approveMutation.isPending}
                                  >
                                    <Check className="h-4 w-4" />
                                    Approuver
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-2"
                                    onClick={() => handleRejectClick(rec)}
                                    disabled={rejectMutation.isPending}
                                  >
                                    <X className="h-4 w-4" />
                                    Rejeter
                                  </Button>
                                </>
                              )}

                              {rec.status === "rejected" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-2"
                                  onClick={() => handleApprove(rec.id)}
                                  disabled={approveMutation.isPending}
                                >
                                  <Check className="h-4 w-4" />
                                  Approuver
                                </Button>
                              )}

                              {rec.status === "approved" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-2"
                                  onClick={() => handleRejectClick(rec)}
                                  disabled={rejectMutation.isPending}
                                >
                                  <X className="h-4 w-4" />
                                  Rejeter
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
          </div>
        </main>
      </div>

      {/* Reject Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeter cette recommandation ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous pouvez indiquer une raison pour ce rejet (optionnel).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Raison du rejet (optionnel)..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Rejeter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminRecommendations;