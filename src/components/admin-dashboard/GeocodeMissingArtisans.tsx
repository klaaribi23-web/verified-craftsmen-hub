import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { geocodeCity } from "@/lib/communesApi";
import { MapPin, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

interface GeocodeMissingArtisansProps {
  onComplete?: () => void;
}

export function GeocodeMissingArtisans({ onComplete }: GeocodeMissingArtisansProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{
    total: number;
    success: number;
    failed: number;
  } | null>(null);

  const handleGeocode = async () => {
    setIsProcessing(true);
    setProgress(0);
    setResults(null);

    try {
      // Récupérer tous les artisans sans coordonnées GPS
      const { data: artisans, error } = await supabase
        .from("artisans")
        .select("id, city, postal_code")
        .is("latitude", null)
        .not("city", "is", null)
        .neq("city", "À compléter");

      if (error) throw error;

      if (!artisans || artisans.length === 0) {
        toast({
          title: "Aucun artisan à géocoder",
          description: "Tous les artisans ont déjà des coordonnées GPS",
        });
        setIsProcessing(false);
        return;
      }

      let successCount = 0;
      let failedCount = 0;
      const total = artisans.length;

      for (let i = 0; i < artisans.length; i++) {
        const artisan = artisans[i];
        
        try {
          const geoResult = await geocodeCity(artisan.city, artisan.postal_code || undefined);
          
          if (geoResult) {
            const { error: updateError } = await supabase
              .from("artisans")
              .update({
                latitude: geoResult.lat,
                longitude: geoResult.lng,
                intervention_radius: 50, // 50 km par défaut
              })
              .eq("id", artisan.id);

            if (updateError) throw updateError;
            successCount++;
          } else {
            failedCount++;
          }
        } catch (artisanError) {
          console.error(`Erreur géocodage artisan ${artisan.id}:`, artisanError);
          failedCount++;
        }

        // Mise à jour du progrès
        setProgress(Math.round(((i + 1) / total) * 100));

        // Petit délai pour éviter le rate limiting
        if ((i + 1) % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      setResults({ total, success: successCount, failed: failedCount });

      toast({
        title: successCount > 0 ? "✅ Géocodage terminé" : "⚠️ Géocodage terminé",
        description: `${successCount}/${total} artisans géocodés avec succès`,
        variant: failedCount > successCount ? "destructive" : "default",
      });

      onComplete?.();
    } catch (error: any) {
      console.error("Erreur géocodage:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Géocoder les artisans sans coordonnées
        </CardTitle>
        <CardDescription>
          Ajoute automatiquement les coordonnées GPS aux artisans importés pour afficher leur zone d'intervention sur la carte.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isProcessing && !results && (
          <Button onClick={handleGeocode} className="w-full">
            <MapPin className="mr-2 h-4 w-4" />
            Lancer le géocodage
          </Button>
        )}

        {isProcessing && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Géocodage en cours...
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">{progress}%</p>
          </div>
        )}

        {results && (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                {results.success} réussis
              </Badge>
              {results.failed > 0 && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  {results.failed} échoués
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {results.success} artisans sur {results.total} ont maintenant des coordonnées GPS
            </p>
            <Button onClick={handleGeocode} variant="outline" className="w-full">
              Relancer
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
