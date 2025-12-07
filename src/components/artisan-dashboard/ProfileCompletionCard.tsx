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
  Clock
} from "lucide-react";

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
}

export const ProfileCompletionCard = ({
  profile,
  onRequestApproval,
  isRequestingApproval = false
}: ProfileCompletionCardProps) => {
  const checklistItems = useMemo(() => [
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

  const completedCount = checklistItems.filter(item => item.completed).length;
  const totalCount = checklistItems.length;
  const percentage = Math.round((completedCount / totalCount) * 100);
  const isComplete = completedCount === totalCount;
  const isPending = profile.status === "pending";

  return (
    <Card className={`${
      isPending ? 'border-amber-500/30 bg-amber-500/5' :
      isComplete ? 'border-emerald-500/30 bg-emerald-500/5' : 
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
            ) : isComplete ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Profil complet
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-primary" />
                Complétez votre profil
              </>
            )}
          </CardTitle>
          <Badge variant={isComplete ? "default" : "secondary"}>
            {completedCount}/{totalCount}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progression</span>
            <span className="font-medium">{percentage}%</span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>

        {/* Checklist */}
        <div className="space-y-2">
          {checklistItems.map((item) => (
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
                item.completed ? 'text-emerald-700 line-through' : 'text-foreground'
              }`}>
                {item.label}
              </span>
              {!item.completed && (
                <a 
                  href={item.link}
                  className="text-xs text-primary hover:underline"
                >
                  Compléter
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Status message */}
        {isPending ? (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-sm text-amber-700">
              Votre demande d'approbation est en cours de traitement. 
              L'administrateur vérifiera votre profil prochainement.
            </p>
          </div>
        ) : isComplete ? (
          <Button 
            className="w-full" 
            onClick={onRequestApproval}
            disabled={isRequestingApproval}
          >
            <Send className="h-4 w-4 mr-2" />
            {isRequestingApproval ? "Envoi en cours..." : "Demander l'approbation"}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground text-center">
            Complétez tous les éléments ci-dessus pour pouvoir demander l'approbation 
            et rendre votre profil visible aux clients.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
