import { ThumbsUp, LogIn, Star, Loader2, ShieldAlert, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useArtisanRecommendations, useHasRecommended, useMyRecommendation } from "@/hooks/useRecommendations";
import RecommendationCard from "./RecommendationCard";
import RecommendationForm from "./RecommendationForm";
import { useAuth, UserRole } from "@/hooks/useAuth";

interface RecommendationsSectionProps {
  artisanId: string;
  artisanName: string;
  isLoggedIn: boolean;
}

const RecommendationsSection = ({ artisanId, artisanName, isLoggedIn }: RecommendationsSectionProps) => {
  const { role } = useAuth();
  const isClient = role === "client";
  const isAdmin = role === "admin";
  const isArtisan = role === "artisan";
  const { data: recommendations = [], isLoading } = useArtisanRecommendations(artisanId);
  const { data: hasRecommended } = useHasRecommended(artisanId);
  const { data: myRecommendation } = useMyRecommendation(artisanId);

  // Not logged in - show login CTA
  if (!isLoggedIn) {
    return (
      <Card className="border-dashed border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-8 text-center">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <ThumbsUp className="h-7 w-7 text-primary" />
          </div>
          <h3 className="font-semibold text-xl mb-2">Avez-vous déjà travaillé avec cet artisan ?</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Connectez-vous pour partager votre expérience et recommander {artisanName} à d'autres clients.
          </p>
          <Button asChild size="lg">
            <Link to="/auth" className="gap-2">
              <LogIn className="h-4 w-4" />
              Se connecter
            </Link>
          </Button>

          {/* Show existing recommendations */}
          {recommendations.length > 0 && (
            <div className="mt-8 pt-8 border-t">
              <h4 className="font-medium mb-4 text-left">
                {recommendations.length} recommandation{recommendations.length > 1 ? "s" : ""}
              </h4>
              <div className="space-y-4">
                {recommendations.map((rec) => (
                  <RecommendationCard key={rec.id} recommendation={rec} />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Determine if user can leave a recommendation (only clients)
  const canRecommend = isClient && !isAdmin && !isArtisan;

  // Logged in - show recommendations and form
  return (
    <div className="space-y-6">
      {/* Header with action button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <ThumbsUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-base md:text-lg">Recommandations</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {recommendations.length} recommandation{recommendations.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        
        {/* Only show form for clients */}
        {canRecommend ? (
          <RecommendationForm
            artisanId={artisanId}
            artisanName={artisanName}
            existingRecommendation={myRecommendation}
            trigger={
              <Button variant={hasRecommended ? "outline" : "default"} className="gap-2">
                <Star className="h-4 w-4" />
                {hasRecommended ? "Modifier ma recommandation" : "Laisser une recommandation"}
              </Button>
            }
          />
        ) : isAdmin ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <ShieldAlert className="h-4 w-4" />
            <span>Admin : lecture seule</span>
          </div>
        ) : isArtisan ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <UserX className="h-4 w-4" />
            <span>Les artisans ne peuvent pas recommander</span>
          </div>
        ) : null}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && recommendations.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <ThumbsUp className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h4 className="font-medium text-lg mb-2">Aucune recommandation</h4>
            <p className="text-muted-foreground mb-4">
              {canRecommend ? `Soyez le premier à recommander ${artisanName} !` : "Aucune recommandation pour le moment."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recommendations list */}
      {!isLoading && recommendations.length > 0 && (
        <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2">
          {recommendations.map((rec) => (
            <RecommendationCard key={rec.id} recommendation={rec} />
          ))}
        </div>
      )}
    </div>
  );
};

export default RecommendationsSection;
