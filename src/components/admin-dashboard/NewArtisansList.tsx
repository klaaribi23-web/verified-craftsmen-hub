import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Eye, MapPin, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

interface NewArtisan {
  id: string;
  name: string;
  category: string;
  city: string;
  registeredAt: string;
  photo: string;
}

const newArtisans: NewArtisan[] = [
  { id: "1", name: "Jean Dupont", category: "Plombier", city: "Paris", registeredAt: "Aujourd'hui à 10h30", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
  { id: "2", name: "Pierre Martin", category: "Électricien", city: "Lyon", registeredAt: "Aujourd'hui à 09h15", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" },
  { id: "3", name: "Marie Bernard", category: "Peintre", city: "Marseille", registeredAt: "Hier à 18h45", photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" },
  { id: "4", name: "Luc Petit", category: "Menuisier", city: "Bordeaux", registeredAt: "Hier à 14h20", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" },
];

export const NewArtisansList = () => {
  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          Nouveaux artisans inscrits
        </CardTitle>
        <Badge className="bg-primary/10 text-primary">
          {newArtisans.length} aujourd'hui
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {newArtisans.map((artisan) => (
          <div
            key={artisan.id}
            className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
          >
            <img
              src={artisan.photo}
              alt={artisan.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground">{artisan.name}</p>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{artisan.category}</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {artisan.city}
                </span>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Calendar className="h-3 w-3" />
                {artisan.registeredAt}
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
      </CardContent>
    </Card>
  );
};
