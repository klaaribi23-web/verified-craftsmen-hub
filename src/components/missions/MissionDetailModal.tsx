import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Euro, Calendar, Send, ChevronLeft, ChevronRight, Camera, Phone } from "lucide-react";
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

  const photos = mission.photos?.filter(p => p && p.length > 0) || [];
  const hasPhotos = photos.length > 0;
  const applicants = mission.applicants_count || 0;

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

          {/* Availability Badge */}
          <div>
            {applicants === 0 ? (
              <Badge className="bg-gold/10 text-gold-dark border-gold/30 text-sm font-semibold px-3 py-1">
                Soyez le premier à postuler
              </Badge>
            ) : applicants >= 2 ? (
              <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-sm font-semibold px-3 py-1">
                Disponibilité : Dernière place
              </Badge>
            ) : (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-sm font-semibold px-3 py-1">
                Place disponible : 1/2
              </Badge>
            )}
          </div>

          {/* Photo / Validation Badge */}
          <div>
            {hasPhotos ? (
              <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-sm font-medium px-3 py-1 gap-1.5">
                📸 Photos du chantier incluses
              </Badge>
            ) : (
              <Badge className="bg-muted text-muted-foreground border-border text-sm font-medium px-3 py-1 gap-1.5">
                📞 Projet validé par nos experts
              </Badge>
            )}
          </div>

          {/* Mission Info */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>Publiée le {formatDate(mission.created_at)}</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground">Description du projet</h4>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {mission.description?.split('--- Infos structurées ---')[0]?.trim() || "Aucune description fournie."}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Fermer
          </Button>
          <div className="flex flex-col items-center gap-1 w-full sm:w-auto">
            <p className="text-xs text-muted-foreground text-center">
              En postulant, vous demandez l'ouverture d'un salon de discussion privé avec le client.
            </p>
            <Button onClick={onApply} disabled={!canApply} className="w-full gap-2">
              <Send className="w-4 h-4" />
              Postuler à cette mission
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MissionDetailModal;
