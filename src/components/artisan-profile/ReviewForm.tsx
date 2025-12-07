import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Send, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReviewFormProps {
  artisanName: string;
  isLoggedIn?: boolean;
  onSubmit?: (review: { rating: number; comment: string; jobType: string }) => void;
}

const jobTypes = [
  "Dépannage plomberie",
  "Installation chauffe-eau",
  "Réparation fuite",
  "Installation chauffage",
  "Débouchage canalisation",
  "Remplacement robinetterie",
  "Autre"
];

const ReviewForm = ({ artisanName, isLoggedIn = false, onSubmit }: ReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [jobType, setJobType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour laisser un avis.",
        variant: "destructive"
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: "Note requise",
        description: "Veuillez sélectionner une note.",
        variant: "destructive"
      });
      return;
    }

    if (!comment.trim()) {
      toast({
        title: "Commentaire requis",
        description: "Veuillez écrire un commentaire.",
        variant: "destructive"
      });
      return;
    }

    if (!jobType) {
      toast({
        title: "Type de prestation requis",
        description: "Veuillez sélectionner le type de prestation.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulation d'envoi
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (onSubmit) {
      onSubmit({ rating, comment, jobType });
    }

    toast({
      title: "Avis envoyé !",
      description: "Merci pour votre avis, il sera visible après validation.",
    });

    // Reset form
    setRating(0);
    setComment("");
    setJobType("");
    setIsSubmitting(false);
  };

  if (!isLoggedIn) {
    return (
      <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
        <CardContent className="p-6 text-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <User className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Partagez votre expérience</h3>
          <p className="text-muted-foreground mb-4">
            Connectez-vous pour laisser un avis sur {artisanName}
          </p>
          <Button asChild>
            <a href="/connexion">Se connecter</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Star className="h-5 w-5 text-primary" />
          Laisser un avis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating Stars */}
          <div>
            <Label className="mb-2 block">Votre note</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= (hoverRating || rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-muted-foreground">
                  {rating === 1 && "Décevant"}
                  {rating === 2 && "Moyen"}
                  {rating === 3 && "Bien"}
                  {rating === 4 && "Très bien"}
                  {rating === 5 && "Excellent"}
                </span>
              )}
            </div>
          </div>

          {/* Job Type */}
          <div>
            <Label htmlFor="jobType" className="mb-2 block">Type de prestation</Label>
            <Select value={jobType} onValueChange={setJobType}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez le type de prestation" />
              </SelectTrigger>
              <SelectContent>
                {jobTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Comment */}
          <div>
            <Label htmlFor="comment" className="mb-2 block">Votre avis</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Partagez votre expérience avec cet artisan..."
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimum 20 caractères
            </p>
          </div>

          {/* Submit */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || rating === 0 || !comment.trim() || !jobType}
          >
            {isSubmitting ? (
              <>Envoi en cours...</>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Publier mon avis
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ReviewForm;
