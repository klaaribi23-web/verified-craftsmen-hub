import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Briefcase } from "lucide-react";

interface TopArtisan {
  id: string;
  name: string;
  category: string;
  missionsCompleted: number;
  rating: number;
  photo: string;
  rank: number;
}

const topArtisans: TopArtisan[] = [
  { id: "1", rank: 1, name: "Marc Lefebvre", category: "Plombier", missionsCompleted: 156, rating: 4.9, photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
  { id: "2", rank: 2, name: "Sophie Durant", category: "Électricienne", missionsCompleted: 142, rating: 4.8, photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" },
  { id: "3", rank: 3, name: "Thomas Moreau", category: "Menuisier", missionsCompleted: 128, rating: 4.9, photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" },
  { id: "4", rank: 4, name: "Claire Dubois", category: "Peintre", missionsCompleted: 115, rating: 4.7, photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
  { id: "5", rank: 5, name: "Antoine Roux", category: "Maçon", missionsCompleted: 98, rating: 4.8, photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" },
];

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
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Top Artisans
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {topArtisans.map((artisan) => (
          <div
            key={artisan.id}
            className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
          >
            <Badge className={`w-8 h-8 flex items-center justify-center rounded-full ${getRankColor(artisan.rank)}`}>
              {artisan.rank}
            </Badge>
            <img
              src={artisan.photo}
              alt={artisan.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground">{artisan.name}</p>
              <p className="text-sm text-muted-foreground">{artisan.category}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm font-medium">
                <Briefcase className="h-4 w-4 text-primary" />
                {artisan.missionsCompleted} missions
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                {artisan.rating}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
