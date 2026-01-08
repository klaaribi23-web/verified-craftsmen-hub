import { useState } from "react";
import { ArtisanSidebar } from "@/components/artisan-dashboard/ArtisanSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, 
  MapPin, 
  Calendar,
  Euro,
  Clock,
  CheckCircle,
  XCircle,
  UserCheck,
  Inbox,
  Loader2
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";

type ApplicationStatus = "pending" | "accepted" | "declined";
type MissionStatus = "open" | "assigned" | "completed" | "cancelled";

interface MissionApplication {
  id: string;
  status: ApplicationStatus;
  created_at: string;
  motivation_message: string | null;
  missions: {
    id: string;
    title: string;
    description: string | null;
    city: string;
    budget: number | null;
    created_at: string;
    status: MissionStatus;
    assigned_artisan_id: string | null;
    profiles: {
      first_name: string | null;
      last_name: string | null;
    } | null;
  } | null;
}

const getApplicationStatusConfig = (
  appStatus: ApplicationStatus, 
  missionStatus: MissionStatus | undefined,
  assignedArtisanId: string | null | undefined,
  currentArtisanId: string | null
) => {
  // If mission is assigned to this artisan
  if (assignedArtisanId && assignedArtisanId === currentArtisanId) {
    return { 
      label: "Mission attribuée", 
      className: "bg-success/20 text-success border-0",
      icon: CheckCircle
    };
  }
  
  // If mission is assigned to another artisan or completed
  if (missionStatus === "assigned" || missionStatus === "completed" || 
      (assignedArtisanId && assignedArtisanId !== currentArtisanId)) {
    return { 
      label: "Client a trouvé un prestataire", 
      className: "bg-muted text-muted-foreground border-0",
      icon: UserCheck
    };
  }
  
  // If application was declined
  if (appStatus === "declined") {
    return { 
      label: "Non retenu", 
      className: "bg-destructive/20 text-destructive border-0",
      icon: XCircle
    };
  }
  
  // If accepted
  if (appStatus === "accepted") {
    return { 
      label: "Retenu", 
      className: "bg-success/20 text-success border-0",
      icon: CheckCircle
    };
  }
  
  // Default: pending
  return { 
    label: "En attente de réponse", 
    className: "bg-accent/20 text-accent border-0",
    icon: Clock
  };
};

export const ArtisanRequests = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "not_selected">("all");
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

  // Fetch mission applications with mission status
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
            status,
            assigned_artisan_id,
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
    const missionStatus = app.missions?.status;
    const assignedArtisanId = app.missions?.assigned_artisan_id;
    
    if (filter === "pending") {
      // Pending = waiting for response, mission still open
      return app.status === "pending" && missionStatus === "open" && !assignedArtisanId;
    }
    if (filter === "accepted") {
      // Accepted = this artisan was selected
      return app.status === "accepted" || assignedArtisanId === artisan?.id;
    }
    if (filter === "not_selected") {
      // Not selected = declined or another artisan was chosen
      return app.status === "declined" || 
        (assignedArtisanId && assignedArtisanId !== artisan?.id) ||
        missionStatus === "completed" || missionStatus === "assigned";
    }
    
    if (searchQuery) {
      const clientName = `${app.missions?.profiles?.first_name || ""} ${app.missions?.profiles?.last_name || ""}`.toLowerCase();
      const missionTitle = app.missions?.title?.toLowerCase() || "";
      if (!clientName.includes(searchQuery.toLowerCase()) && !missionTitle.includes(searchQuery.toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  const pendingCount = applications.filter(a => 
    a.status === "pending" && 
    a.missions?.status === "open" && 
    !a.missions?.assigned_artisan_id
  ).length;

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
          title="Missions postulées" 
          subtitle={pendingCount > 0 ? `${pendingCount} candidature${pendingCount > 1 ? "s" : ""} en attente` : "Aucune candidature en attente"}
        />

        <main className="flex-1 p-3 md:p-6 overflow-auto">
          <div className="max-w-5xl mx-auto space-y-4 md:space-y-6">
            {/* Filters */}
            <div className="flex flex-col gap-3 md:gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Rechercher une mission..." 
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
                  Toutes ({applications.length})
                </Button>
                <Button 
                  variant={filter === "pending" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setFilter("pending")}
                  className={`text-xs md:text-sm px-2 md:px-3 ${filter === "pending" ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}`}
                >
                  En attente ({pendingCount})
                </Button>
                <Button 
                  variant={filter === "accepted" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setFilter("accepted")}
                  className="text-xs md:text-sm px-2 md:px-3"
                >
                  Retenues
                </Button>
                <Button 
                  variant={filter === "not_selected" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setFilter("not_selected")}
                  className="text-xs md:text-sm px-2 md:px-3"
                >
                  Non retenues
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
                <h3 className="font-semibold text-foreground mb-2">Aucune mission</h3>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? "Essayez de modifier votre recherche" 
                    : filter !== "all"
                      ? "Aucune mission dans cette catégorie"
                      : "Vous n'avez pas encore postulé à des missions. Consultez les missions disponibles pour postuler."}
                </p>
                {filter === "all" && !searchQuery && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => window.location.href = "/nos-missions"}
                  >
                    Voir les missions disponibles
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredApplications.map((application) => {
                  const statusConfig = getApplicationStatusConfig(
                    application.status, 
                    application.missions?.status,
                    application.missions?.assigned_artisan_id,
                    artisan?.id || null
                  );
                  const StatusIcon = statusConfig.icon;
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
                                  <Badge className={`${statusConfig.className} text-xs flex items-center gap-1`}>
                                    <StatusIcon className="w-3 h-3" />
                                    {statusConfig.label}
                                  </Badge>
                                </div>
                                <p className="text-muted-foreground text-xs md:text-sm">Client : {clientName}</p>
                              </div>
                              <span className="text-xs md:text-sm text-muted-foreground shrink-0">
                                Postulé {formatDate(application.created_at)}
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