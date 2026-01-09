import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCreateRecommendation, useUpdateRecommendation, Recommendation } from "@/hooks/useRecommendations";

interface RecommendationFormProps {
  artisanId: string;
  artisanName: string;
  existingRecommendation?: Recommendation | null;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

interface RatingCriteria {
  key: "punctuality_rating" | "presentation_rating" | "work_quality_rating" | "communication_rating";
  label: string;
  description: string;
}

const ratingCriteria: RatingCriteria[] = [
  { key: "punctuality_rating", label: "Ponctualité", description: "Respect des horaires et délais" },
  { key: "presentation_rating", label: "Présentation", description: "Professionnalisme et tenue" },
  { key: "work_quality_rating", label: "Qualité du travail", description: "Résultat et finitions" },
  { key: "communication_rating", label: "Communication", description: "Écoute et explications" },
];

const RecommendationForm = ({
  artisanId,
  artisanName,
  existingRecommendation,
  trigger,
  onSuccess,
}: RecommendationFormProps) => {
  const [open, setOpen] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({
    punctuality_rating: existingRecommendation?.punctuality_rating || 0,
    presentation_rating: existingRecommendation?.presentation_rating || 0,
    work_quality_rating: existingRecommendation?.work_quality_rating || 0,
    communication_rating: existingRecommendation?.communication_rating || 0,
  });
  const [hoverRatings, setHoverRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState(existingRecommendation?.comment || "");

  const createMutation = useCreateRecommendation();
  const updateMutation = useUpdateRecommendation();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const allRatingsSet = Object.values(ratings).every((r) => r > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!allRatingsSet) return;

    const data = {
      artisan_id: artisanId,
      punctuality_rating: ratings.punctuality_rating,
      presentation_rating: ratings.presentation_rating,
      work_quality_rating: ratings.work_quality_rating,
      communication_rating: ratings.communication_rating,
      comment: comment.trim() || undefined,
    };

    if (existingRecommendation) {
      await updateMutation.mutateAsync({ id: existingRecommendation.id, ...data });
    } else {
      await createMutation.mutateAsync(data);
    }

    setOpen(false);
    onSuccess?.();
  };

  const renderStars = (criteriaKey: string, currentRating: number) => {
    const hoverRating = hoverRatings[criteriaKey] || 0;

    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRatings((prev) => ({ ...prev, [criteriaKey]: star }))}
            onMouseEnter={() => setHoverRatings((prev) => ({ ...prev, [criteriaKey]: star }))}
            onMouseLeave={() => setHoverRatings((prev) => ({ ...prev, [criteriaKey]: 0 }))}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                star <= (hoverRating || currentRating)
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/30"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Star className="h-4 w-4" />
            {existingRecommendation ? "Modifier ma recommandation" : "Laisser une recommandation"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {existingRecommendation ? "Modifier votre recommandation" : "Recommander"} {artisanName}
          </DialogTitle>
          <DialogDescription>
            Partagez votre expérience avec cet artisan en notant les critères suivants.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Rating Criteria */}
          <div className="space-y-4">
            {ratingCriteria.map((criteria) => (
              <div key={criteria.key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">{criteria.label}</Label>
                    <p className="text-xs text-muted-foreground">{criteria.description}</p>
                  </div>
                  {renderStars(criteria.key, ratings[criteria.key])}
                </div>
              </div>
            ))}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Commentaire (optionnel)</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Décrivez votre expérience avec cet artisan..."
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !allRatingsSet}
          >
            {isSubmitting ? (
              <>Envoi en cours...</>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {existingRecommendation ? "Modifier" : "Publier"} ma recommandation
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RecommendationForm;
