import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Sparkles,
  Camera,
  FileText,
  MapPin,
  Image,
  Briefcase,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo } from "react";

interface ProfileData {
  photo_url: string | null;
  description: string | null;
  siret: string | null;
  city: string;
  portfolio_images: string[] | null;
  experience_years: number | null;
}

interface ActiveProfileCardProps {
  profile: ProfileData;
}

export const ActiveProfileCard = ({ profile }: ActiveProfileCardProps) => {
  // Éléments optionnels pour optimiser le profil
  const optionalItems = useMemo(() => [
    {
      id: "photo",
      label: "Photo de profil",
      icon: Camera,
      completed: !!profile.photo_url
    },
    {
      id: "description",
      label: "Description (50+ caractères)",
      icon: FileText,
      completed: !!profile.description && profile.description.length >= 50
    },
    {
      id: "siret",
      label: "Numéro SIRET",
      icon: Briefcase,
      completed: !!profile.siret
    },
    {
      id: "city",
      label: "Ville renseignée",
      icon: MapPin,
      completed: profile.city && profile.city !== "Non renseigné"
    },
    {
      id: "portfolio",
      label: "Portfolio (3+ photos)",
      icon: Image,
      completed: !!profile.portfolio_images && profile.portfolio_images.length >= 3
    },
    {
      id: "experience",
      label: "Années d'expérience",
      icon: Briefcase,
      completed: !!profile.experience_years && profile.experience_years > 0
    }
  ], [profile]);

  const completedCount = optionalItems.filter(item => item.completed).length;
  const incompleteItems = optionalItems.filter(item => !item.completed);
  const allCompleted = incompleteItems.length === 0;

  return (
    <Card className="border-emerald-500/30 bg-emerald-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            Profil actif et vérifié
          </CardTitle>
          <Badge className="bg-emerald-500 hover:bg-emerald-600">
            <Sparkles className="h-3 w-3 mr-1" />
            Actif
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Success message */}
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-sm text-emerald-700">
            🎉 Félicitations ! Votre profil est approuvé et visible par tous les clients sur la plateforme.
          </p>
        </div>

        {/* Optional items to complete */}
        {!allCompleted && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">OPTIMISATION</Badge>
              <span className="text-sm text-muted-foreground">
                Complétez ces éléments pour améliorer votre visibilité ({completedCount}/{optionalItems.length})
              </span>
            </div>
            
            <div className="space-y-2">
              {incompleteItems.slice(0, 3).map((item) => (
                <div 
                  key={item.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                >
                  <item.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm flex-1">{item.label}</span>
                </div>
              ))}
              {incompleteItems.length > 3 && (
                <p className="text-xs text-muted-foreground pl-2">
                  + {incompleteItems.length - 3} autre(s) élément(s) à compléter
                </p>
              )}
            </div>

            <Link to="/artisan/profil">
              <Button variant="outline" size="sm" className="w-full">
                Compléter mon profil
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}

        {/* All completed */}
        {allCompleted && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              <p className="text-sm text-emerald-700 font-medium">
                Votre profil est 100% complet ! Vous maximisez votre visibilité.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
