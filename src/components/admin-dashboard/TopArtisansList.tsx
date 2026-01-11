import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Briefcase } from "lucide-react";
import { useTopArtisans } from "@/hooks/useAdminData";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_AVATAR } from "@/lib/utils";

const getRankColor = (rank: number) => {
  switch (rank) {
    case 1:
      return "bg-yellow-500 text-white";
    case 2:
      return "bg-gray-400 text-white";
    case 3:
      return "bg-amber-600 text-white";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export const TopArtisansList = () => {
  const { data: topArtisans, isLoading } = useTopArtisans();

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top Artisans
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <Trophy className="h-4 w-4 md:h-5 md:w-5 text-yellow-500" />
          Top Artisans
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 md:space-y-3 pt-0">
        {topArtisans && topArtisans.length > 0 ? (
          topArtisans.map((artisan, index) => (
            <div
              key={artisan.id}
              className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-2 md:p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                <Badge className={`w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-full text-xs md:text-sm shrink-0 ${getRankColor(index + 1)}`}>
                  {index + 1}
                </Badge>
                <img
                  src={artisan.photo_url || DEFAULT_AVATAR}
                  alt={artisan.business_name}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground text-sm md:text-base truncate">{artisan.business_name}</p>
                  <p className="text-xs md:text-sm text-muted-foreground truncate">{artisan.category?.name || "Non catégorisé"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 text-right ml-auto pl-8 sm:pl-0">
                <div className="flex items-center gap-1 text-xs md:text-sm font-medium">
                  <Briefcase className="h-3 w-3 md:h-4 md:w-4 text-primary shrink-0" />
                  <span>{artisan.missions_completed || 0}</span>
                  <span className="hidden sm:inline">missions</span>
                </div>
                <div className="flex items-center gap-1 text-xs md:text-sm text-muted-foreground">
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 shrink-0" />
                  {artisan.rating?.toFixed(1) || "N/A"}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-muted-foreground py-6 text-sm">
            Aucun artisan pour le moment
          </p>
        )}
      </CardContent>
    </Card>
  );
};
