import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Recommendation } from "@/hooks/useRecommendations";

interface RecommendationCardProps {
  recommendation: Recommendation;
}

const ratingLabels = [
  { key: "punctuality_rating", label: "Ponctualité" },
  { key: "presentation_rating", label: "Présentation" },
  { key: "work_quality_rating", label: "Qualité" },
  { key: "communication_rating", label: "Communication" },
] as const;

const RecommendationCard = ({ recommendation }: RecommendationCardProps) => {
  const client = recommendation.client;
  const initials = client ? `${client.first_name?.[0] || ""}${client.last_name?.[0] || ""}`.toUpperCase() || "?" : "?";

  const displayName = client
    ? `${client.first_name || ""} ${client.last_name?.[0] || ""}`.trim() || "Client"
    : "Client";

  const averageRating =
    (recommendation.punctuality_rating +
      recommendation.presentation_rating +
      recommendation.work_quality_rating +
      recommendation.communication_rating) /
    4;

  const renderStars = (rating: number, small = false) => {
    const size = small ? "h-3.5 w-3.5" : "h-4 w-4";
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${star <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-card rounded-xl p-3 sm:p-5 border shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0">
            <AvatarImage src={client?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs sm:text-sm">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium text-xs sm:text-sm truncate">{displayName}.</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(recommendation.created_at), {
                addSuffix: true,
                locale: fr,
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 bg-primary/5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shrink-0">
          <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-amber-400 text-amber-400" />
          <span className="font-semibold text-xs sm:text-sm">{averageRating.toFixed(1)}</span>
        </div>
      </div>

      {/* Comment */}
      {recommendation.comment && (
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">"{recommendation.comment}"</p>
      )}
    </div>
  );
};

export default RecommendationCard;
