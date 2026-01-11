import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Eye, MapPin, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { useNewArtisans } from "@/hooks/useAdminData";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_AVATAR } from "@/lib/utils";

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
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3">
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <UserPlus className="h-4 w-4 md:h-5 md:w-5 text-primary" />
          Nouveaux artisans
        </CardTitle>
        <Badge className="bg-primary/10 text-primary w-fit text-xs">
          {newArtisans?.length || 0} cette semaine
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {newArtisans && newArtisans.length > 0 ? (
          <>
            {newArtisans.map((artisan) => (
              <div
                key={artisan.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <img
                    src={artisan.photo_url || DEFAULT_AVATAR}
                    alt={artisan.business_name}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground text-sm md:text-base truncate">{artisan.business_name}</p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs md:text-sm text-muted-foreground">
                      <span className="truncate">{artisan.category?.name || "Non catégorisé"}</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{artisan.city}</span>
                      </span>
                    </div>
                    <p className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3 shrink-0" />
                      {formatDate(artisan.created_at)}
                    </p>
                  </div>
                </div>
                <Link to={`/artisan/${artisan.id}`} className="shrink-0">
                  <Button size="sm" variant="outline" className="gap-1 w-full sm:w-auto text-xs md:text-sm">
                    <Eye className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="sm:inline">Voir</span>
                  </Button>
                </Link>
              </div>
            ))}
            <Link to="/admin/artisans">
              <Button variant="outline" className="w-full text-sm">
                Voir tous les artisans
              </Button>
            </Link>
          </>
        ) : (
          <p className="text-center text-muted-foreground py-6 text-sm">
            Aucun nouvel artisan cette semaine
          </p>
        )}
      </CardContent>
    </Card>
  );
};
