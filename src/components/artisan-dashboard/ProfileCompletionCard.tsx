import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  AlertCircle,
  Camera,
  FileText,
  MapPin,
  Image,
  Briefcase,
  Send,
  Clock,
  Lock,
  AlertTriangle,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";

interface ProfileData {
  photo_url: string | null;
  description: string | null;
  siret: string | null;
  city: string;
  portfolio_images: string[] | null;
  experience_years: number | null;
  status: string;
}

interface ProfileCompletionCardProps {
  profile: ProfileData;
  onRequestApproval: () => void;
  isRequestingApproval?: boolean;
  mandatoryDocumentsUploaded: number;
  totalMandatoryDocuments: number;
}

export const ProfileCompletionCard = ({
  profile,
  onRequestApproval,
  isRequestingApproval = false,
  mandatoryDocumentsUploaded,
  totalMandatoryDocuments
}: ProfileCompletionCardProps) => {
  const allDocumentsUploaded = mandatoryDocumentsUploaded === totalMandatoryDocuments;

  // Éléments optionnels pour optimiser le profil
  const optionalItems = useMemo(() => [
    {
      id: "photo",
      label: "Photo de profil",
      icon: Camera,
      completed: !!profile.photo_url,
      link: "/artisan/profil"
    },
    {
      id: "description",
      label: "Description (50+ caractères)",
      icon: FileText,
      completed: !!profile.description && profile.description.length >= 50,
      link: "/artisan/profil"
    },
    {
      id: "siret",
      label: "Numéro SIRET",
      icon: Briefcase,
      completed: !!profile.siret,
      link: "/artisan/profil"
    },
    {
      id: "city",
      label: "Ville renseignée",
      icon: MapPin,
      completed: profile.city && profile.city !== "Non renseigné",
      link: "/artisan/profil"
    },
    {
      id: "portfolio",
      label: "Portfolio (3+ photos)",
      icon: Image,
      completed: !!profile.portfolio_images && profile.portfolio_images.length >= 3,
      link: "/artisan/profil"
    },
    {
      id: "experience",
      label: "Années d'expérience",
      icon: Briefcase,
      completed: !!profile.experience_years && profile.experience_years > 0,
      link: "/artisan/profil"
    }
  ], [profile]);

  const optionalCompletedCount = optionalItems.filter(item => item.completed).length;
  const totalOptionalCount = optionalItems.length;
  
  // Progression totale incluant documents obligatoires + éléments optionnels
  const totalItems = totalOptionalCount + 1; // +1 pour les documents obligatoires
  const completedItems = optionalCompletedCount + (allDocumentsUploaded ? 1 : 0);
  const percentage = Math.round((completedItems / totalItems) * 100);
  
  // Le bouton se débloque uniquement si les 4 documents obligatoires sont téléchargés
  const canRequestApproval = allDocumentsUploaded;
  const isPending = profile.status === "pending";

  return (
    <Card className={`${
      isPending ? 'border-amber-500/30 bg-amber-500/5' :
      canRequestApproval ? 'border-emerald-500/30 bg-emerald-500/5' : 
      'border-primary/30 bg-primary/5'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {isPending ? (
              <>
                <Clock className="h-5 w-5 text-amber-500" />
                En attente d'approbation
              </>
            ) : canRequestApproval ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Prêt pour l'approbation
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-primary" />
                Complétez votre profil
              </>
            )}
          </CardTitle>
          <Badge variant={canRequestApproval ? "default" : "secondary"}>
            {percentage}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progression globale</span>
            <span className="font-medium">{percentage}%</span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>

        {/* Section OBLIGATOIRE - Documents */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="text-xs">OBLIGATOIRE</Badge>
            <span className="text-sm font-medium">Étape requise pour l'approbation</span>
          </div>
          
          <div className={`p-3 rounded-lg border ${
            allDocumentsUploaded 
              ? 'bg-emerald-500/10 border-emerald-500/30' 
              : 'bg-amber-500/10 border-amber-500/30'
          }`}>
            <div className="flex items-center gap-3">
              {allDocumentsUploaded ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${
                    allDocumentsUploaded ? 'text-emerald-700' : 'text-amber-700'
                  }`}>
                    Documents obligatoires ({mandatoryDocumentsUploaded}/{totalMandatoryDocuments})
                  </span>
                  {!allDocumentsUploaded && (
                    <Link 
                      to="/artisan/documents"
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Télécharger →
                    </Link>
                  )}
                </div>
                <p className={`text-xs mt-1 ${
                  allDocumentsUploaded ? 'text-emerald-600' : 'text-amber-600'
                }`}>
                  {allDocumentsUploaded 
                    ? "Tous vos documents ont été téléchargés !" 
                    : "RC Pro, Décennale, KBIS"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section OPTIMISATION - Éléments optionnels */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">OPTIMISATION</Badge>
            <span className="text-sm text-muted-foreground">Améliorez votre visibilité</span>
          </div>
          
          <div className="space-y-2">
            {optionalItems.map((item) => (
              <div 
                key={item.id}
                className={`flex items-center gap-3 p-2 rounded-lg ${
                  item.completed ? 'bg-emerald-500/10' : 'bg-muted/50'
                }`}
              >
                {item.completed ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                ) : (
                  <item.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className={`text-sm flex-1 ${
                  item.completed ? 'text-emerald-700' : 'text-foreground'
                }`}>
                  {item.label}
                </span>
                {!item.completed && (
                  <Link 
                    to={item.link}
                    className="text-xs text-primary hover:underline"
                  >
                    Compléter
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Message et bouton */}
        {isPending ? (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-start gap-2">
              <Clock className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-700">
                  Demande en cours de traitement
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  L'administrateur vérifiera votre profil et vos documents prochainement.
                </p>
              </div>
            </div>
          </div>
        ) : canRequestApproval ? (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-start gap-2">
                <Sparkles className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                <p className="text-sm text-emerald-700">
                  Vous pouvez maintenant demander l'approbation ! 
                  {optionalCompletedCount < totalOptionalCount && (
                    <span className="text-emerald-600 block mt-1">
                      Complétez les éléments facultatifs pour optimiser votre visibilité.
                    </span>
                  )}
                </p>
              </div>
            </div>
            <Button 
              className="w-full" 
              onClick={onRequestApproval}
              disabled={isRequestingApproval}
            >
              <Send className="h-4 w-4 mr-2" />
              {isRequestingApproval ? "Envoi en cours..." : "Demander l'approbation"}
            </Button>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-start gap-2">
              <Lock className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Téléchargez vos 3 documents obligatoires pour débloquer le bouton d'approbation.
                </p>
                <Link 
                  to="/artisan/documents"
                  className="text-sm text-primary hover:underline font-medium mt-2 inline-block"
                >
                  Aller aux documents →
                </Link>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
