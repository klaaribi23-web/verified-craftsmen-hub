import { useState } from "react";
import { Link } from "react-router-dom";
import { ClientSidebar } from "@/components/client-dashboard/ClientSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus,
  Clock,
  MapPin,
  Calendar,
  MessageSquare,
  Eye,
  Users,
  Euro
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";

const missions = [
  {
    id: 1,
    title: "Réparation fuite salle de bain",
    description: "Fuite sous le lavabo de la salle de bain principale. Besoin d'une intervention rapide.",
    category: "Plomberie",
    budget: 500,
    status: "en_cours",
    artisan: { name: "Jean-Pierre M.", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" },
    location: "Paris 15ème",
    date: "15 janvier 2024",
    responses: 3,
    applicants: 8
  },
  {
    id: 2,
    title: "Installation tableau électrique",
    description: "Mise aux normes du tableau électrique dans un appartement de 70m².",
    category: "Électricité",
    budget: 2500,
    status: "terminee",
    artisan: { name: "Marc L.", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" },
    location: "Paris 12ème",
    date: "10 janvier 2024",
    responses: 5,
    applicants: 12
  },
  {
    id: 3,
    title: "Peinture salon",
    description: "Peinture complète du salon (environ 25m²) avec préparation des murs.",
    category: "Peinture",
    budget: 1200,
    status: "en_attente",
    artisan: null,
    location: "Paris 11ème",
    date: "18 janvier 2024",
    responses: 2,
    applicants: 15
  },
  {
    id: 4,
    title: "Installation climatisation",
    description: "Installation d'une climatisation réversible dans une chambre de 15m².",
    category: "Chauffage",
    budget: 3000,
    status: "en_attente",
    artisan: null,
    location: "Boulogne-Billancourt",
    date: "20 janvier 2024",
    responses: 0,
    applicants: 6
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

export const ClientMissions = () => {
  const [activeTab, setActiveTab] = useState("all");

  const filteredMissions = activeTab === "all" 
    ? missions 
    : missions.filter(m => m.status === activeTab);

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-background pt-16 lg:pt-20">
        <ClientSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader 
          title="Mes missions" 
          subtitle="Gérez vos demandes de travaux et consultez les candidatures"
        />

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">Toutes ({missions.length})</TabsTrigger>
                  <TabsTrigger value="en_attente">En attente ({missions.filter(m => m.status === "en_attente").length})</TabsTrigger>
                  <TabsTrigger value="en_cours">En cours ({missions.filter(m => m.status === "en_cours").length})</TabsTrigger>
                  <TabsTrigger value="terminee">Terminées ({missions.filter(m => m.status === "terminee").length})</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <Link to="/deposer-mission">
                <Button variant="gold">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle mission
                </Button>
              </Link>
            </div>

            {/* Missions List */}
            <div className="space-y-4">
              {filteredMissions.map((mission) => (
                <Card key={mission.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{mission.title}</h3>
                          {getStatusBadge(mission.status)}
                        </div>
                        
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                          {mission.description}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <Badge variant="secondary">{mission.category}</Badge>
                          <span className="flex items-center gap-1 text-gold font-semibold">
                            <Euro className="w-4 h-4" />
                            {mission.budget} €
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {mission.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {mission.date}
                          </span>
                        </div>
                        
                        {/* Applicants info for pending missions */}
                        {mission.status === "en_attente" && mission.applicants > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="flex items-center gap-2 text-sm">
                              <Users className="w-4 h-4 text-gold" />
                              <span className="font-medium text-foreground">
                                {mission.applicants} artisan{mission.applicants > 1 ? "s ont" : " a"} postulé
                              </span>
                              <Link to={`/client/missions/${mission.id}`}>
                                <Button variant="link" size="sm" className="text-gold p-0 h-auto">
                                  Voir les candidatures →
                                </Button>
                              </Link>
                            </div>
                          </div>
                        )}
                        
                        {/* Selected artisan for ongoing missions */}
                        {mission.artisan && (
                          <div className="flex items-center gap-3 mt-4 pt-4 border-t">
                            <img 
                              src={mission.artisan.photo} 
                              alt={mission.artisan.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                              <p className="text-sm font-medium">Artisan sélectionné</p>
                              <p className="text-sm text-muted-foreground">{mission.artisan.name}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Link to={`/client/missions/${mission.id}`}>
                          <Button variant="outline" size="sm" className="w-full">
                            <Eye className="w-4 h-4 mr-1" />
                            Détails
                          </Button>
                        </Link>
                        {mission.status !== "terminee" && (
                          <Link to="/client/messagerie">
                            <Button variant="ghost" size="sm" className="w-full">
                              <MessageSquare className="w-4 h-4 mr-1" />
                              Messages
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filteredMissions.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground mb-4">Aucune mission dans cette catégorie</p>
                    <Link to="/deposer-mission">
                      <Button variant="gold">
                        <Plus className="w-4 h-4 mr-2" />
                        Déposer une mission
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          </main>
        </div>
      </div>
    </>
  );
};
