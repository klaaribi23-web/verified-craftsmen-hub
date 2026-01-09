import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Eye,
  Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import Navbar from "@/components/layout/Navbar";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const ClientFavorites = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch client profile
  const { data: profile } = useQuery({
    queryKey: ["client-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch favorites from database
  const { data: favoriteArtisans = [], isLoading } = useQuery({
    queryKey: ["client-favorites", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("client_favorites")
        .select(`
          id,
          artisans:artisan_id (
            id,
            business_name,
            city,
            photo_url,
            rating,
            review_count,
            slug,
            is_verified,
            categories:category_id (name)
          )
        `)
        .eq("client_id", profile.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id
  });

  // Remove favorite mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: async (favoriteId: string) => {
      const { error } = await supabase
        .from("client_favorites")
        .delete()
        .eq("id", favoriteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-favorites"] });
      toast.success("Artisan retiré de vos favoris");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    }
  });

  const handleRemoveFavorite = (favoriteId: string) => {
    removeFavoriteMutation.mutate(favoriteId);
  };

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-background pt-28 lg:pt-20">
        <ClientSidebar />
      
        <div className="flex-1 flex flex-col">
          <DashboardHeader 
            title="Artisans favoris" 
            subtitle="Vos artisans préférés enregistrés"
          />

          <main className="flex-1 p-3 md:p-6 overflow-auto">
            <div className="max-w-5xl mx-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : favoriteArtisans.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {favoriteArtisans.map((fav: any) => (
                    <Card key={fav.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <CardContent className="p-0">
                        {/* Photo & Favorite Button */}
                        <div className="relative">
                          <img 
                            src={fav.artisans?.photo_url || "/placeholder.svg"} 
                            alt={fav.artisans?.business_name}
                            className="w-full h-48 object-cover"
                          />
                          <button
                            onClick={() => handleRemoveFavorite(fav.id)}
                            disabled={removeFavoriteMutation.isPending}
                            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white text-rose-500 transition-colors"
                          >
                            <Heart className="w-5 h-5 fill-current" />
                          </button>
                          {fav.artisans?.is_verified && (
                            <Badge className="absolute bottom-3 left-3 bg-success text-white">
                              Artisan Validé
                            </Badge>
                          )}
                        </div>
                        
                        {/* Info */}
                        <div className="p-4">
                          <h3 className="font-semibold text-lg mb-1">{fav.artisans?.business_name}</h3>
                          <div className="flex items-center gap-2 mb-2">
                            {fav.artisans?.categories?.name && (
                              <Badge variant="secondary">{fav.artisans.categories.name}</Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                            <MapPin className="w-4 h-4" />
                            <span>{fav.artisans?.city || "Non renseigné"}</span>
                          </div>
                          
                          {fav.artisans?.rating > 0 && (
                            <div className="flex items-center gap-1 mb-4">
                              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                              <span className="font-medium">{fav.artisans.rating.toFixed(1)}</span>
                              <span className="text-muted-foreground text-sm">
                                ({fav.artisans.review_count || 0} avis)
                              </span>
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            <Link to={`/artisan/${fav.artisans?.slug || fav.artisans?.id}`} className="flex-1">
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
      <div className="hidden lg:block">
        <ChatWidget />
      </div>
    </>
  );
};
