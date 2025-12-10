import { ClientSidebar } from "@/components/client-dashboard/ClientSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Briefcase, 
  MessageSquare, 
  Heart,
  Clock,
  CheckCircle2,
  ArrowRight,
  Plus
} from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";

const recentMissions = [
  {
    id: 1,
    title: "Réparation fuite salle de bain",
    category: "Plomberie",
    status: "en_cours",
    artisan: "Jean-Pierre M.",
    date: "15 janvier 2024"
  },
  {
    id: 2,
    title: "Installation tableau électrique",
    category: "Électricité",
    status: "terminee",
    artisan: "Marc L.",
    date: "10 janvier 2024"
  },
  {
    id: 3,
    title: "Peinture salon",
    category: "Peinture",
    status: "en_attente",
    artisan: null,
    date: "18 janvier 2024"
  }
];

const favoriteArtisans = [
  {
    id: 1,
    name: "Jean-Pierre Martin",
    trade: "Plombier",
    rating: 4.8,
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
  },
  {
    id: 2,
    name: "Marc Lefebvre",
    trade: "Électricien",
    rating: 4.9,
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
  }
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "en_cours":
      return <Badge className="bg-blue-500/10 text-blue-600 border-0">En cours</Badge>;
    case "terminee":
      return <Badge className="bg-success/10 text-success border-0">Terminée</Badge>;
    case "en_attente":
      return <Badge className="bg-amber-500/10 text-amber-600 border-0">En attente</Badge>;
    default:
      return null;
  }
};

export const ClientDashboard = () => {
  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-background pt-16 lg:pt-20">
        <ClientSidebar />
        
        <div className="flex-1 flex flex-col">
          <DashboardHeader 
            title="Tableau de bord" 
            subtitle="Bienvenue sur votre espace client"
          />

          <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <Briefcase className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">3</p>
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
                      <p className="text-2xl font-bold">2</p>
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
                      <p className="text-2xl font-bold">2</p>
                      <p className="text-sm text-muted-foreground">Artisans favoris</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Besoin d'un artisan ?</h3>
                    <p className="text-muted-foreground text-sm">
                      Déposez une mission et recevez des propositions d'artisans qualifiés
                    </p>
                  </div>
                  <Link to="/deposer-mission">
                    <Button variant="gold">
                      <Plus className="w-4 h-4 mr-2" />
                      Déposer une mission
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-2 gap-6">
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
                  <div className="space-y-4">
                    {recentMissions.map((mission) => (
                      <div 
                        key={mission.id} 
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{mission.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {mission.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {mission.date}
                            </span>
                          </div>
                          {mission.artisan && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Artisan: {mission.artisan}
                            </p>
                          )}
                        </div>
                        {getStatusBadge(mission.status)}
                      </div>
                    ))}
                  </div>
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
                  <div className="space-y-4">
                    {favoriteArtisans.map((artisan) => (
                      <div 
                        key={artisan.id} 
                        className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <img 
                          src={artisan.photo} 
                          alt={artisan.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{artisan.name}</p>
                          <p className="text-sm text-muted-foreground">{artisan.trade}</p>
                        </div>
                        <div className="flex items-center gap-1 text-amber-500">
                          <span>★</span>
                          <span className="font-medium">{artisan.rating}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        </div>
      </div>
    </>
  );
};
