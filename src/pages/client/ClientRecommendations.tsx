import { Link } from "react-router-dom";
import { ThumbsUp, Star, Trash2, Pencil, ExternalLink, Loader2, Clock, CheckCircle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import SEOHead from "@/components/seo/SEOHead";
import Navbar from "@/components/layout/Navbar";
import { ClientSidebar } from "@/components/client-dashboard/ClientSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useClientRecommendations, useDeleteRecommendation, Recommendation } from "@/hooks/useRecommendations";
import RecommendationForm from "@/components/artisan-profile/RecommendationForm";

const ratingLabels = [
  { key: "punctuality_rating", label: "Ponctualité" },
  { key: "presentation_rating", label: "Présentation" },
  { key: "work_quality_rating", label: "Qualité" },
  { key: "communication_rating", label: "Communication" },
] as const;

const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300"><Clock className="h-3 w-3" /> En attente de validation</Badge>;
    case "approved":
      return <Badge className="gap-1 bg-green-500"><CheckCircle className="h-3 w-3" /> Publiée</Badge>;
    case "rejected":
      return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Rejetée</Badge>;
    default:
      return null;
  }
};

const ClientRecommendations = () => {
  const { data: recommendations = [], isLoading } = useClientRecommendations();
  const deleteMutation = useDeleteRecommendation();

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

  const getAverageRating = (rec: Recommendation) =>
    (rec.punctuality_rating + rec.presentation_rating + rec.work_quality_rating + rec.communication_rating) / 4;

  return (
    <>
      <SEOHead
        title="Mes Recommandations | Client - Artisan Validé"
        description="Gérez vos recommandations d'artisans"
      />
      <Navbar />
      <div className="flex min-h-screen pt-16 bg-background">
        <ClientSidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 md:ml-64">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Mes Recommandations</h1>
            <p className="text-muted-foreground">Gérez les recommandations que vous avez laissées aux artisans</p>
          </div>
          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Empty state */}
          {!isLoading && recommendations.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <ThumbsUp className="h-16 w-16 text-muted-foreground/30 mx-auto mb-6" />
                <h3 className="text-xl font-semibold mb-2">Aucune recommandation</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Vous n'avez pas encore recommandé d'artisan. Visitez le profil d'un artisan avec qui vous avez travaillé pour laisser une recommandation.
                </p>
                <Button asChild>
                  <Link to="/trouver-artisan">Trouver un artisan</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Recommendations list */}
          {!isLoading && recommendations.length > 0 && (
            <div className="space-y-4">
              {recommendations.map((rec) => {
                const artisan = rec.artisan;
                const avgRating = getAverageRating(rec);

                return (
                  <Card key={rec.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start gap-4">
                        {/* Artisan info */}
                        <div className="flex items-center gap-4 flex-1">
                          <Avatar className="h-14 w-14">
                            <AvatarImage src={artisan?.photo_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                              {artisan?.business_name?.[0] || "A"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold truncate">{artisan?.business_name || "Artisan"}</h3>
                              {artisan?.slug && (
                                <Link
                                  to={`/artisan/${artisan.slug}`}
                                  className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  Voir le profil
                                </Link>
                              )}
                            </div>
                            {artisan?.category && (
                              <p className="text-sm text-muted-foreground">{artisan.category.name}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              Recommandé {formatDistanceToNow(new Date(rec.created_at), { addSuffix: true, locale: fr })}
                            </p>
                          </div>
                        </div>

                        {/* Status & Average rating */}
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(rec.status)}
                          <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-full">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            <span className="font-semibold">{avgRating.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Ratings grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
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
                        <p className="text-sm text-muted-foreground mt-4 bg-muted/20 rounded-lg p-3">
                          "{rec.comment}"
                        </p>
                      )}

                      {/* Rejection reason */}
                      {rec.status === "rejected" && rec.rejection_reason && (
                        <div className="text-sm bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-lg p-3 mt-3">
                          <span className="font-medium">Raison du rejet :</span> {rec.rejection_reason}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                        <RecommendationForm
                          artisanId={rec.artisan_id}
                          artisanName={artisan?.business_name || "Artisan"}
                          existingRecommendation={rec}
                          trigger={
                            <Button variant="outline" size="sm" className="gap-2">
                              <Pencil className="h-3.5 w-3.5" />
                              Modifier
                            </Button>
                          }
                        />

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                              Supprimer
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer cette recommandation ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Cette action est irréversible. Votre recommandation pour {artisan?.business_name || "cet artisan"} sera définitivement supprimée.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate({ id: rec.id, artisanId: rec.artisan_id })}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default ClientRecommendations;
