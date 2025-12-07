import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Briefcase } from "lucide-react";
import { useTopArtisans } from "@/hooks/useAdminData";
import { Skeleton } from "@/components/ui/skeleton";

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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Top Artisans
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {topArtisans && topArtisans.length > 0 ? (
          topArtisans.map((artisan, index) => (
            <div
              key={artisan.id}
              className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              <Badge className={`w-8 h-8 flex items-center justify-center rounded-full ${getRankColor(index + 1)}`}>
                {index + 1}
              </Badge>
              <img
                src={artisan.photo_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"}
                alt={artisan.business_name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{artisan.business_name}</p>
                <p className="text-sm text-muted-foreground">{artisan.category?.name || "Non catégorisé"}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-sm font-medium">
                  <Briefcase className="h-4 w-4 text-primary" />
                  {artisan.missions_completed || 0} missions
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                  {artisan.rating?.toFixed(1) || "N/A"}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-muted-foreground py-8">
            Aucun artisan pour le moment
          </p>
        )}
      </CardContent>
    </Card>
  );
};
