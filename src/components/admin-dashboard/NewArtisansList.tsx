import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Eye, MapPin, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { useNewArtisans } from "@/hooks/useAdminData";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

export const NewArtisansList = () => {
  const { data: newArtisans, isLoading } = useNewArtisans();

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: fr });
  };

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Nouveaux artisans inscrits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-3">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          Nouveaux artisans inscrits
        </CardTitle>
        <Badge className="bg-primary/10 text-primary">
          {newArtisans?.length || 0} cette semaine
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {newArtisans && newArtisans.length > 0 ? (
          <>
            {newArtisans.map((artisan) => (
              <div
                key={artisan.id}
                className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <img
                  src={artisan.photo_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"}
                  alt={artisan.business_name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{artisan.business_name}</p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{artisan.category?.name || "Non catégorisé"}</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {artisan.city}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(artisan.created_at)}
                  </p>
                </div>
                <Link to={`/artisan/${artisan.id}`}>
                  <Button size="sm" variant="outline" className="gap-1">
                    <Eye className="h-4 w-4" />
                    Voir profil
                  </Button>
                </Link>
              </div>
            ))}
            <Link to="/admin/artisans">
              <Button variant="outline" className="w-full">
                Voir tous les artisans
              </Button>
            </Link>
          </>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            Aucun nouvel artisan cette semaine
          </p>
        )}
      </CardContent>
    </Card>
  );
};
