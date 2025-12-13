import { useState } from "react";
import { ArtisanSidebar } from "@/components/artisan-dashboard/ArtisanSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, 
  MapPin, 
  Calendar,
  Euro,
  MessageSquare,
  CheckCircle,
  XCircle,
  Eye,
  Image,
  AlertTriangle,
  Inbox,
  Loader2
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";

type RequestStatus = "pending" | "accepted" | "declined";

interface MissionApplication {
  id: string;
  status: RequestStatus;
  created_at: string;
  motivation_message: string | null;
  missions: {
    id: string;
    title: string;
    description: string | null;
    city: string;
    budget: number | null;
    created_at: string;
    profiles: {
      first_name: string | null;
      last_name: string | null;
    } | null;
  } | null;
}

const getStatusConfig = (status: RequestStatus) => {
  switch (status) {
    case "pending":
      return { label: "En attente", className: "bg-accent/20 text-accent border-0" };
    case "accepted":
      return { label: "Acceptée", className: "bg-success/20 text-success border-0" };
    case "declined":
      return { label: "Refusée", className: "bg-muted text-muted-foreground border-0" };
  }
};

export const ArtisanRequests = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<"all" | RequestStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch artisan profile
  const { data: artisan } = useQuery({
    queryKey: ["artisan-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("artisans")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch mission applications
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["artisan-applications", artisan?.id],
    queryFn: async () => {
      if (!artisan?.id) return [];
      const { data, error } = await supabase
        .from("mission_applications")
        .select(`
          id,
          status,
          created_at,
          motivation_message,
          missions (
            id,
            title,
            description,
            city,
            budget,
            created_at,
            profiles:client_id (
              first_name,
              last_name
            )
          )
        `)
        .eq("artisan_id", artisan.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as MissionApplication[];
    },
    enabled: !!artisan?.id
  });

  const filteredApplications = applications.filter((app) => {
    if (filter !== "all" && app.status !== filter) return false;
    if (searchQuery) {
      const clientName = `${app.missions?.profiles?.first_name || ""} ${app.missions?.profiles?.last_name || ""}`.toLowerCase();
      const missionTitle = app.missions?.title?.toLowerCase() || "";
      if (!clientName.includes(searchQuery.toLowerCase()) && !missionTitle.includes(searchQuery.toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  const pendingCount = applications.filter(a => a.status === "pending").length;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return date.toLocaleDateString("fr-FR");
  };

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-background pt-16 lg:pt-20">
        <ArtisanSidebar />
        
        <div className="flex-1 flex flex-col">
        <DashboardHeader 
          title="Demandes reçues" 
          subtitle={pendingCount > 0 ? `${pendingCount} demande${pendingCount > 1 ? "s" : ""} en attente` : "Aucune demande en attente"}
        />

        <main className="flex-1 p-3 md:p-6 overflow-auto">
          <div className="max-w-5xl mx-auto space-y-4 md:space-y-6">
            {/* Filters */}
            <div className="flex flex-col gap-3 md:gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Rechercher..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-1.5 md:gap-2">
                <Button 
                  variant={filter === "all" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setFilter("all")}
                  className="text-xs md:text-sm px-2 md:px-3"
                >
                  Toutes
                </Button>
                <Button 
                  variant={filter === "pending" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setFilter("pending")}
                  className={`text-xs md:text-sm px-2 md:px-3 ${filter === "pending" ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}`}
                >
                  Attente ({applications.filter(a => a.status === "pending").length})
                </Button>
                <Button 
                  variant={filter === "accepted" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setFilter("accepted")}
                  className="text-xs md:text-sm px-2 md:px-3"
                >
                  Acceptées
                </Button>
                <Button 
                  variant={filter === "declined" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setFilter("declined")}
                  className="text-xs md:text-sm px-2 md:px-3"
                >
                  Refusées
                </Button>
              </div>
            </div>

            {/* Applications List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <Inbox className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Aucune demande</h3>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? "Essayez de modifier votre recherche" 
                    : filter !== "all"
                      ? "Aucune demande dans cette catégorie"
                      : "Vous n'avez pas encore reçu de demandes. Postulez à des missions pour recevoir des demandes."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredApplications.map((application) => {
                  const statusConfig = getStatusConfig(application.status);
                  const clientName = application.missions?.profiles 
                    ? `${application.missions.profiles.first_name || ""} ${application.missions.profiles.last_name || ""}`.trim()
                    : "Client";
                  
                  return (
                    <div 
                      key={application.id}
                      className="bg-card rounded-xl border border-border shadow-soft overflow-hidden transition-all hover:shadow-elevated"
                    >
                      <div className="p-3 md:p-6">
                        <div className="flex flex-col gap-3 md:gap-4">
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2 md:mb-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-foreground text-sm md:text-lg truncate">
                                    {application.missions?.title || "Mission"}
                                  </h4>
                                  <Badge className={`${statusConfig.className} text-xs`}>
                                    {statusConfig.label}
                                  </Badge>
                                </div>
                                <p className="text-muted-foreground text-xs md:text-sm">{clientName}</p>
                              </div>
                              <span className="text-xs md:text-sm text-muted-foreground shrink-0">
                                {formatDate(application.created_at)}
                              </span>
                            </div>
                            
                            {application.missions?.description && (
                              <p className="text-foreground text-xs md:text-sm mb-3 md:mb-4 line-clamp-2">
                                {application.missions.description}
                              </p>
                            )}
                            
                            <div className="flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <MapPin className="w-3 h-3 md:w-4 md:h-4" />
                                <span>{application.missions?.city || "Non spécifié"}</span>
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                                <span>
                                  {application.missions?.created_at 
                                    ? new Date(application.missions.created_at).toLocaleDateString("fr-FR")
                                    : "Non spécifié"}
                                </span>
                              </div>
                              {application.missions?.budget && (
                                <div className="flex items-center gap-1 text-accent font-medium">
                                  <Euro className="w-3 h-3 md:w-4 md:h-4" />
                                  <span>{application.missions.budget}€</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1 text-xs md:text-sm">
                              <Eye className="w-3 h-3 md:w-4 md:h-4 mr-1" /> Détails
                            </Button>
                            {application.status === "accepted" && (
                              <Button variant="outline" size="sm" className="flex-1 text-xs md:text-sm">
                                <MessageSquare className="w-3 h-3 md:w-4 md:h-4 mr-1" /> Contacter
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
    </>
  );
};
