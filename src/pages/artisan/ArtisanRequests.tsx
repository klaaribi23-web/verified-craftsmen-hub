import { useState } from "react";
import { ArtisanSidebar } from "@/components/artisan-dashboard/ArtisanSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar,
  Clock,
  Euro,
  MessageSquare,
  CheckCircle,
  XCircle,
  Eye,
  Image,
  AlertTriangle
} from "lucide-react";

type RequestStatus = "new" | "accepted" | "rejected" | "completed";

interface Request {
  id: number;
  client: string;
  service: string;
  description: string;
  location: string;
  date: string;
  budget: string;
  status: RequestStatus;
  urgent: boolean;
  hasPhotos: boolean;
  createdAt: string;
}

const requests: Request[] = [
  {
    id: 1,
    client: "Marie Martin",
    service: "Fuite d'eau urgente",
    description: "Fuite importante sous l'évier de la cuisine. L'eau coule en continu.",
    location: "Paris 15e",
    date: "Dès que possible",
    budget: "100-200€",
    status: "new",
    urgent: true,
    hasPhotos: true,
    createdAt: "Il y a 2h",
  },
  {
    id: 2,
    client: "Pierre Durand",
    service: "Installation chauffe-eau",
    description: "Remplacement d'un vieux chauffe-eau électrique par un nouveau modèle.",
    location: "Paris 12e",
    date: "Semaine prochaine",
    budget: "300-500€",
    status: "new",
    urgent: false,
    hasPhotos: false,
    createdAt: "Il y a 5h",
  },
  {
    id: 3,
    client: "Sophie Bernard",
    service: "Débouchage canalisation",
    description: "Évier de la salle de bain bouché, l'eau ne s'écoule plus du tout.",
    location: "Paris 11e",
    date: "Cette semaine",
    budget: "80-150€",
    status: "accepted",
    urgent: false,
    hasPhotos: true,
    createdAt: "Hier",
  },
  {
    id: 4,
    client: "Laurent Petit",
    service: "Rénovation salle de bain",
    description: "Rénovation complète d'une salle de bain de 6m². Remplacement baignoire par douche.",
    location: "Paris 2e",
    date: "Mois prochain",
    budget: "3000-5000€",
    status: "accepted",
    urgent: false,
    hasPhotos: true,
    createdAt: "Il y a 3 jours",
  },
  {
    id: 5,
    client: "Claire Moreau",
    service: "Fuite robinet",
    description: "Robinet de la baignoire qui goutte en permanence.",
    location: "Paris 16e",
    date: "Cette semaine",
    budget: "50-100€",
    status: "rejected",
    urgent: false,
    hasPhotos: false,
    createdAt: "Il y a 2 jours",
  },
];

const getStatusConfig = (status: RequestStatus) => {
  switch (status) {
    case "new":
      return { label: "Nouvelle", className: "bg-accent/20 text-accent border-0" };
    case "accepted":
      return { label: "Acceptée", className: "bg-success/20 text-success border-0" };
    case "rejected":
      return { label: "Refusée", className: "bg-muted text-muted-foreground border-0" };
    case "completed":
      return { label: "Terminée", className: "bg-primary/20 text-primary border-0" };
  }
};

export const ArtisanRequests = () => {
  const [filter, setFilter] = useState<"all" | RequestStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRequests = requests.filter((r) => {
    if (filter !== "all" && r.status !== filter) return false;
    if (searchQuery && !r.client.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !r.service.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const newCount = requests.filter(r => r.status === "new").length;

  return (
    <div className="flex min-h-screen bg-background">
      <ArtisanSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader 
          title="Demandes reçues" 
          subtitle={`${newCount} nouvelle${newCount > 1 ? "s" : ""} demande${newCount > 1 ? "s" : ""} en attente`}
        />

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Rechercher par client ou service..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant={filter === "all" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setFilter("all")}
                >
                  Toutes
                </Button>
                <Button 
                  variant={filter === "new" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setFilter("new")}
                  className={filter === "new" ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}
                >
                  Nouvelles ({requests.filter(r => r.status === "new").length})
                </Button>
                <Button 
                  variant={filter === "accepted" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setFilter("accepted")}
                >
                  Acceptées
                </Button>
                <Button 
                  variant={filter === "rejected" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setFilter("rejected")}
                >
                  Refusées
                </Button>
              </div>
            </div>

            {/* Requests List */}
            <div className="space-y-4">
              {filteredRequests.map((request) => {
                const statusConfig = getStatusConfig(request.status);
                
                return (
                  <div 
                    key={request.id}
                    className={`bg-card rounded-xl border shadow-soft overflow-hidden transition-all hover:shadow-elevated ${
                      request.urgent ? "border-destructive/30" : "border-border"
                    }`}
                  >
                    {request.urgent && (
                      <div className="bg-destructive/10 px-4 py-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                        <span className="text-sm font-medium text-destructive">Intervention urgente</span>
                      </div>
                    )}
                    
                    <div className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-foreground text-lg">{request.service}</h4>
                                <Badge className={statusConfig.className}>
                                  {statusConfig.label}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground">{request.client}</p>
                            </div>
                            <span className="text-sm text-muted-foreground">{request.createdAt}</span>
                          </div>
                          
                          <p className="text-foreground mb-4">{request.description}</p>
                          
                          <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              <span>{request.location}</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              <span>{request.date}</span>
                            </div>
                            <div className="flex items-center gap-1 text-accent font-medium">
                              <Euro className="w-4 h-4" />
                              <span>{request.budget}</span>
                            </div>
                            {request.hasPhotos && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Image className="w-4 h-4" />
                                <span>Photos jointes</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex lg:flex-col gap-2">
                          <Button variant="outline" size="sm" className="flex-1 lg:w-full">
                            <Eye className="w-4 h-4 mr-1" /> Voir détails
                          </Button>
                          {request.status === "new" && (
                            <>
                              <Button variant="gold" size="sm" className="flex-1 lg:w-full">
                                <CheckCircle className="w-4 h-4 mr-1" /> Accepter
                              </Button>
                              <Button variant="outline" size="sm" className="flex-1 lg:w-full text-destructive hover:text-destructive">
                                <XCircle className="w-4 h-4 mr-1" /> Refuser
                              </Button>
                            </>
                          )}
                          {request.status === "accepted" && (
                            <Button variant="outline" size="sm" className="flex-1 lg:w-full">
                              <MessageSquare className="w-4 h-4 mr-1" /> Contacter
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredRequests.length === 0 && (
                <div className="text-center py-12 bg-card rounded-xl border border-border">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Aucune demande trouvée</h3>
                  <p className="text-muted-foreground">
                    {searchQuery 
                      ? "Essayez de modifier votre recherche" 
                      : "Vous n'avez pas encore de demandes dans cette catégorie"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
