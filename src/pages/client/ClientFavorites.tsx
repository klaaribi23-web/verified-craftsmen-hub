import { ClientSidebar } from "@/components/client-dashboard/ClientSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Star,
  MapPin,
  MessageSquare,
  Heart,
  Eye
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const favoriteArtisans = [
  {
    id: 1,
    name: "Jean-Pierre Martin",
    trade: "Plombier",
    specialty: "Chauffagiste",
    rating: 4.8,
    reviewCount: 127,
    city: "Paris 15ème",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    isVerified: true
  },
  {
    id: 2,
    name: "Marc Lefebvre",
    trade: "Électricien",
    specialty: "Domotique",
    rating: 4.9,
    reviewCount: 89,
    city: "Paris 12ème",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
    isVerified: true
  },
  {
    id: 3,
    name: "Sophie Durand",
    trade: "Peintre",
    specialty: "Décoration",
    rating: 4.7,
    reviewCount: 64,
    city: "Boulogne-Billancourt",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
    isVerified: true
  }
];

export const ClientFavorites = () => {
  const handleRemoveFavorite = (artisanName: string) => {
    toast.success(`${artisanName} a été retiré de vos favoris`);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <ClientSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader 
          title="Artisans favoris" 
          subtitle="Vos artisans préférés enregistrés"
        />

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-5xl mx-auto">
            {favoriteArtisans.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoriteArtisans.map((artisan) => (
                  <Card key={artisan.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      {/* Photo & Favorite Button */}
                      <div className="relative">
                        <img 
                          src={artisan.photo} 
                          alt={artisan.name}
                          className="w-full h-48 object-cover"
                        />
                        <button
                          onClick={() => handleRemoveFavorite(artisan.name)}
                          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white text-rose-500 transition-colors"
                        >
                          <Heart className="w-5 h-5 fill-current" />
                        </button>
                        {artisan.isVerified && (
                          <Badge className="absolute bottom-3 left-3 bg-success text-white">
                            Artisan Validé
                          </Badge>
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-1">{artisan.name}</h3>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">{artisan.trade}</Badge>
                          <span className="text-sm text-muted-foreground">{artisan.specialty}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          <MapPin className="w-4 h-4" />
                          <span>{artisan.city}</span>
                        </div>
                        
                        <div className="flex items-center gap-1 mb-4">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span className="font-medium">{artisan.rating}</span>
                          <span className="text-muted-foreground text-sm">
                            ({artisan.reviewCount} avis)
                          </span>
                        </div>
                        
                        <div className="flex gap-2">
                          <Link to={`/artisan/${artisan.id}`} className="flex-1">
                            <Button variant="outline" className="w-full">
                              <Eye className="w-4 h-4 mr-2" />
                              Voir profil
                            </Button>
                          </Link>
                          <Link to="/client/messagerie">
                            <Button variant="gold">
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Heart className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun artisan favori</h3>
                  <p className="text-muted-foreground mb-4">
                    Ajoutez des artisans à vos favoris pour les retrouver facilement
                  </p>
                  <Link to="/trouver-artisan">
                    <Button variant="gold">
                      Trouver un artisan
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
