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
  const initials = client
    ? `${client.first_name?.[0] || ""}${client.last_name?.[0] || ""}`.toUpperCase() || "?"
    : "?";

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
            className={`${size} ${
              star <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-card rounded-xl p-5 border shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={client?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{displayName}.</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(recommendation.created_at), {
                addSuffix: true,
                locale: fr,
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-primary/5 px-2.5 py-1 rounded-full">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          <span className="font-semibold text-sm">{averageRating.toFixed(1)}</span>
        </div>
      </div>

      {/* Ratings Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {ratingLabels.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between gap-2 bg-muted/30 rounded-lg px-3 py-2">
            <span className="text-xs text-muted-foreground">{label}</span>
            {renderStars(recommendation[key] as number, true)}
          </div>
        ))}
      </div>

      {/* Comment */}
      {recommendation.comment && (
        <p className="text-sm text-muted-foreground leading-relaxed">
          "{recommendation.comment}"
        </p>
      )}
    </div>
  );
};

export default RecommendationCard;
