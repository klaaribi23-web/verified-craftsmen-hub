import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Euro, Calendar, Users, Send, X, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CategoryIcon } from "@/components/categories/CategoryIcon";
import { useState } from "react";

interface Mission {
  id: string;
  title: string;
  description: string | null;
  city: string;
  budget: number | null;
  created_at: string;
  photos?: string[] | null;
  category?: { id: string; name: string } | null;
  client_name?: string;
  applicants_count?: number;
}

interface MissionDetailModalProps {
  mission: Mission | null;
  open: boolean;
  onClose: () => void;
  onApply: () => void;
  canApply: boolean;
}

const MissionDetailModal = ({ mission, open, onClose, onApply, canApply }: MissionDetailModalProps) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  if (!mission) return null;

  const photos = mission.photos || [];
  const hasPhotos = photos.length > 0;

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMMM yyyy", { locale: fr });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{mission.title}</DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4" />
            {mission.city}
            {mission.category && (
              <>
                <span className="mx-2">•</span>
                <Badge variant="secondary" className="gap-1">
                  <CategoryIcon iconName="arrow-up-right" className="w-3 h-3" />
                  {mission.category.name}
                </Badge>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Photos Gallery */}
          {hasPhotos && (
            <div className="relative">
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <img
                  src={photos[currentPhotoIndex]}
                  alt={`Photo ${currentPhotoIndex + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {photos.length > 1 && (
                <>
                  <button
                    onClick={prevPhoto}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background p-2 rounded-full shadow-md transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextPhoto}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background p-2 rounded-full shadow-md transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  
                  {/* Photo indicators */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {photos.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentPhotoIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          idx === currentPhotoIndex ? "bg-primary" : "bg-background/60"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Mission Info */}
          <div className="grid grid-cols-2 gap-4">
            {mission.budget && (
              <div className="flex items-center gap-2 text-sm">
                <Euro className="w-4 h-4 text-muted-foreground" />
                <span>Budget : <strong className="text-foreground">{mission.budget.toLocaleString("fr-FR")} €</strong></span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>Publiée le {formatDate(mission.created_at)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>{mission.applicants_count || 0} postulant{(mission.applicants_count || 0) > 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground">Description du projet</h4>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {mission.description || "Aucune description fournie."}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Fermer
          </Button>
          <Button onClick={onApply} disabled={!canApply} className="w-full sm:w-auto gap-2">
            <Send className="w-4 h-4" />
            Postuler à cette mission
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MissionDetailModal;
