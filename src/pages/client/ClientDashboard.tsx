import { ClientSidebar } from "@/components/client-dashboard/ClientSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Briefcase, 
  MessageSquare, 
  Heart,
  Clock,
  ArrowRight,
  Plus,
  FileText,
  Users
} from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "assigned":
      return <Badge className="bg-blue-500/10 text-blue-600 border-0">En cours</Badge>;
    case "completed":
      return <Badge className="bg-success/10 text-success border-0">Terminée</Badge>;
    case "pending":
      return <Badge className="bg-amber-500/10 text-amber-600 border-0">En attente</Badge>;
    case "pending_approval":
      return <Badge className="bg-amber-500/10 text-amber-600 border-0">En approbation</Badge>;
    case "published":
      return <Badge className="bg-success/10 text-success border-0">Publiée</Badge>;
    case "rejected":
      return <Badge className="bg-destructive/10 text-destructive border-0">Refusée</Badge>;
    case "cancelled":
      return <Badge className="bg-destructive/10 text-destructive border-0">Annulée</Badge>;
    default:
      return null;
  }
};

export const ClientDashboard = () => {
  const { user } = useAuth();

  // Fetch client profile
  const { data: profile } = useQuery({
    queryKey: ["client-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch real missions
  const { data: missions = [], isLoading: isLoadingMissions } = useQuery({
    queryKey: ["client-missions", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from("missions")
        .select(`
          id,
          title,
          status,
          created_at,
          categories:category_id (name),
          artisans:assigned_artisan_id (business_name)
        `)
        .eq("client_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        console.error("Error fetching missions:", error);
        return [];
      }
      return data || [];
    },
    enabled: !!profile?.id
  });

  // Fetch favorites count
  const { data: favoritesCount = 0 } = useQuery({
    queryKey: ["client-favorites-count", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 0;
      
      const { count, error } = await supabase
        .from("client_favorites")
        .select("*", { count: "exact", head: true })
        .eq("client_id", profile.id);

      if (error) {
        console.error("Error fetching favorites count:", error);
        return 0;
      }
      return count || 0;
    },
    enabled: !!profile?.id
  });

  // Fetch favorite artisans
  const { data: favoriteArtisans = [] } = useQuery({
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
            photo_url,
            rating,
            slug,
            categories:category_id (name)
          )
        `)
        .eq("client_id", profile.id)
        .limit(3);

      if (error) {
        console.error("Error fetching favorites:", error);
        return [];
      }
      return data || [];
    },
    enabled: !!profile?.id
  });

  // Fetch conversations count
  const { data: conversationsCount = 0 } = useQuery({
    queryKey: ["client-conversations-count", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 0;
      
      const { data, error } = await supabase
        .from("messages")
        .select("sender_id, receiver_id")
        .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`);

      if (error) {
        console.error("Error fetching conversations:", error);
        return 0;
      }
      
      // Count unique conversation partners
      const partners = new Set<string>();
      data?.forEach((msg: any) => {
        if (msg.sender_id !== profile.id) partners.add(msg.sender_id);
        if (msg.receiver_id !== profile.id) partners.add(msg.receiver_id);
      });
      return partners.size;
    },
    enabled: !!profile?.id
  });

  return (
    <>
      <SEOHead 
        title="Tableau de bord Client" 
        description="Gérez vos missions et artisans favoris sur Artisans Validés"
        noIndex={true}
      />
      <Navbar />
      <div className="flex min-h-screen bg-background pt-16 lg:pt-20">
        <ClientSidebar />
        
        <div className="flex-1 flex flex-col">
          <DashboardHeader 
            title="Tableau de bord" 
            subtitle={`Bienvenue${profile?.first_name ? `, ${profile.first_name}` : ''} sur votre espace client`}
          />

          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-primary/10">
                        <Briefcase className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{missions.length}</p>
                        <p className="text-sm text-muted-foreground">Missions déposées</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-accent/10">
                        <MessageSquare className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{conversationsCount}</p>
                        <p className="text-sm text-muted-foreground">Conversations actives</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-rose-500/10">
                        <Heart className="w-6 h-6 text-rose-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{favoritesCount}</p>
                        <p className="text-sm text-muted-foreground">Artisans favoris</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Besoin d'un artisan ?</h3>
                      <p className="text-muted-foreground text-sm">
                        Déposez une mission et recevez des propositions d'artisans qualifiés
                      </p>
                    </div>
                    <Link to="/demande-devis" className="w-full sm:w-auto">
                      <Button variant="gold" className="w-full sm:w-auto">
                        <Plus className="w-4 h-4 mr-2" />
                        Déposer une mission
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Recent Missions */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Mes missions récentes</CardTitle>
                    <Link to="/client/missions">
                      <Button variant="ghost" size="sm">
                        Voir tout <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    {isLoadingMissions ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    ) : missions.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">Aucune mission pour le moment</p>
                        <p className="text-sm text-muted-foreground/70 mt-1">
                          Déposez votre première mission pour trouver un artisan
                        </p>
                        <Link to="/demande-devis">
                          <Button variant="outline" className="mt-4">
                            <Plus className="w-4 h-4 mr-2" />
                            Déposer une mission
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {missions.map((mission: any) => (
                          <div 
                            key={mission.id} 
                            className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{mission.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {mission.categories?.name && (
                                  <Badge variant="secondary" className="text-xs">
                                    {mission.categories.name}
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(mission.created_at).toLocaleDateString("fr-FR")}
                                </span>
                              </div>
                              {mission.artisans?.business_name && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  Artisan: {mission.artisans.business_name}
                                </p>
                              )}
                            </div>
                            {getStatusBadge(mission.status)}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Favorite Artisans */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Artisans favoris</CardTitle>
                    <Link to="/client/favoris">
                      <Button variant="ghost" size="sm">
                        Voir tout <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    {favoriteArtisans.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">Aucun artisan favori</p>
                        <p className="text-sm text-muted-foreground/70 mt-1">
                          Explorez nos artisans et ajoutez-les à vos favoris
                        </p>
                        <Link to="/trouver-artisan">
                          <Button variant="outline" className="mt-4">
                            Trouver un artisan
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {favoriteArtisans.map((fav: any) => (
                          <Link 
                            key={fav.id}
                            to={`/artisan/${fav.artisans?.slug || fav.artisans?.id}`}
                            className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <img 
                              src={fav.artisans?.photo_url || "/placeholder.svg"} 
                              alt={fav.artisans?.business_name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div className="flex-1">
                              <p className="font-medium">{fav.artisans?.business_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {fav.artisans?.categories?.name || "Artisan"}
                              </p>
                            </div>
                            {fav.artisans?.rating > 0 && (
                              <div className="flex items-center gap-1 text-amber-500">
                                <span>★</span>
                                <span className="font-medium">{fav.artisans.rating.toFixed(1)}</span>
                              </div>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
      <ChatWidget />
    </>
  );
};
