import { ArtisanSidebar } from "@/components/artisan-dashboard/ArtisanSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { StatsCard } from "@/components/artisan-dashboard/StatsCard";
import { ProfileCompletionCard } from "@/components/artisan-dashboard/ProfileCompletionCard";
import { ApprovalNotifications } from "@/components/artisan-dashboard/ApprovalNotifications";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Briefcase, 
  MessageSquare, 
  Star, 
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight,
  FileText,
  AlertCircle,
  XCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import { Link } from "react-router-dom";

export const ArtisanDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch artisan profile
  const { data: artisanProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["artisan-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("artisans")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching artisan profile:", error);
        return null;
      }
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch real stats
  const { data: stats } = useQuery({
    queryKey: ["artisan-stats", artisanProfile?.id],
    queryFn: async () => {
      if (!artisanProfile?.id) return { requests: 0, inProgress: 0, completed: 0, rating: 0 };
      
      // Get mission applications for this artisan
      const { count: requestsCount } = await supabase
        .from("mission_applications")
        .select("*", { count: "exact", head: true })
        .eq("artisan_id", artisanProfile.id);

      return {
        requests: requestsCount || 0,
        inProgress: 0,
        completed: artisanProfile.missions_completed || 0,
        rating: artisanProfile.rating || 0
      };
    },
    enabled: !!artisanProfile?.id
  });

  // Fetch documents stats
  const { data: documentStats } = useQuery({
    queryKey: ["artisan-documents-stats", artisanProfile?.id],
    queryFn: async () => {
      if (!artisanProfile?.id) return { total: 0, verified: 0, pending: 0, rejected: 0 };
      
      const { data, error } = await supabase
        .from("artisan_documents")
        .select("status")
        .eq("artisan_id", artisanProfile.id);

      if (error) {
        console.error("Error fetching documents:", error);
        return { total: 0, verified: 0, pending: 0, rejected: 0 };
      }

      const docs = data || [];
      return {
        total: docs.length,
        verified: docs.filter(d => d.status === "verified").length,
        pending: docs.filter(d => d.status === "pending").length,
        rejected: docs.filter(d => d.status === "rejected").length
      };
    },
    enabled: !!artisanProfile?.id
  });

  // Fetch recent requests
  const { data: recentRequests = [] } = useQuery({
    queryKey: ["artisan-recent-requests", artisanProfile?.id],
    queryFn: async () => {
      if (!artisanProfile?.id) return [];
      
      const { data, error } = await supabase
        .from("mission_applications")
        .select(`
          id,
          status,
          created_at,
          missions (
            id,
            title,
            city,
            client_id,
            profiles:client_id (
              first_name,
              last_name
            )
          )
        `)
        .eq("artisan_id", artisanProfile.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        console.error("Error fetching requests:", error);
        return [];
      }
      return data || [];
    },
    enabled: !!artisanProfile?.id
  });

  // Request approval mutation
  const requestApprovalMutation = useMutation({
    mutationFn: async () => {
      if (!artisanProfile?.id) throw new Error("Profile not found");
      
      // Create notification for admins
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (adminRoles) {
        for (const admin of adminRoles) {
          await supabase.from("notifications").insert({
            user_id: admin.user_id,
            title: "Nouvelle demande d'approbation",
            message: `${artisanProfile.business_name} a demandé l'approbation de son profil.`,
            type: "approval_request",
            related_id: artisanProfile.id
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artisan-profile"] });
      toast.success("Demande d'approbation envoyée ! L'administrateur examinera votre profil.");
    },
    onError: () => {
      toast.error("Erreur lors de l'envoi de la demande");
    }
  });

  if (isLoadingProfile) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-screen bg-background pt-16 lg:pt-20">
          <ArtisanSidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-background pt-16 lg:pt-20">
        <ArtisanSidebar />
        
        <div className="flex-1 flex flex-col">
          <DashboardHeader 
            title="Tableau de bord" 
            subtitle={`Bienvenue${artisanProfile?.business_name ? `, ${artisanProfile.business_name}` : ''} ! Voici un aperçu de votre activité.`}
          />

          <main className="flex-1 p-6 overflow-auto">
            {/* Approval Notifications */}
            <div className="mb-6">
              <ApprovalNotifications />
            </div>

            {/* Profile Completion Card */}
            {artisanProfile && artisanProfile.status !== "active" && (
              <div className="mb-6">
                <ProfileCompletionCard
                  profile={{
                    photo_url: artisanProfile.photo_url,
                    description: artisanProfile.description,
                    siret: artisanProfile.siret,
                    city: artisanProfile.city,
                    portfolio_images: artisanProfile.portfolio_images,
                    experience_years: artisanProfile.experience_years,
                    status: artisanProfile.status
                  }}
                  onRequestApproval={() => requestApprovalMutation.mutate()}
                  isRequestingApproval={requestApprovalMutation.isPending}
                />
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatsCard
                title="Demandes reçues"
                value={stats?.requests || 0}
                icon={Briefcase}
              />
              <StatsCard
                title="Chantiers en cours"
                value={stats?.inProgress || 0}
                icon={Clock}
                variant="gold"
              />
              <StatsCard
                title="Chantiers terminés"
                value={stats?.completed || 0}
                icon={CheckCircle}
                variant="success"
              />
              <StatsCard
                title="Note moyenne"
                value={stats?.rating?.toFixed(1) || "0.0"}
                icon={Star}
              />
            </div>

            {/* Documents Status Card */}
            <div className="bg-card rounded-xl border border-border shadow-soft p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Statut de mes documents</h3>
                    <p className="text-sm text-muted-foreground">
                      {documentStats?.total || 0} document(s) soumis
                    </p>
                  </div>
                </div>
                <Link to="/artisan/documents">
                  <Button variant="outline" size="sm">
                    Gérer <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
              
              {documentStats && documentStats.total > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-success/10 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-success" />
                    <div>
                      <p className="text-2xl font-bold text-success">{documentStats.verified}</p>
                      <p className="text-xs text-muted-foreground">Vérifiés</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-accent/10 rounded-lg">
                    <Clock className="w-5 h-5 text-accent" />
                    <div>
                      <p className="text-2xl font-bold text-accent">{documentStats.pending}</p>
                      <p className="text-xs text-muted-foreground">En attente</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg">
                    <XCircle className="w-5 h-5 text-destructive" />
                    <div>
                      <p className="text-2xl font-bold text-destructive">{documentStats.rejected}</p>
                      <p className="text-xs text-muted-foreground">Refusés</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Aucun document soumis. Ajoutez vos documents professionnels pour compléter votre profil.
                    </p>
                  </div>
                  <Link to="/artisan/documents" className="ml-auto">
                    <Button size="sm" variant="gold">
                      Ajouter
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Requests */}
              <div className="bg-card rounded-xl border border-border shadow-soft">
                <div className="p-6 border-b border-border flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">Dernières demandes</h2>
                  <Link to="/artisan/demandes">
                    <Button variant="ghost" size="sm" className="text-accent hover:text-accent">
                      Voir tout <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
                <div className="divide-y divide-border">
                  {recentRequests.length === 0 ? (
                    <div className="p-8 text-center">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">Aucune demande pour le moment</p>
                      <p className="text-sm text-muted-foreground/70 mt-1">
                        Les demandes des clients apparaîtront ici
                      </p>
                    </div>
                  ) : (
                    recentRequests.map((request: any) => (
                      <div key={request.id} className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className="font-medium text-foreground">
                              {request.missions?.profiles?.first_name} {request.missions?.profiles?.last_name}
                            </span>
                            <p className="text-sm text-muted-foreground">{request.missions?.title}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{request.missions?.city}</span>
                          <span className="text-muted-foreground">
                            {new Date(request.created_at).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Upcoming Jobs */}
              <div className="bg-card rounded-xl border border-border shadow-soft">
                <div className="p-6 border-b border-border flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">Prochains chantiers</h2>
                  <Link to="/artisan/planning">
                    <Button variant="ghost" size="sm" className="text-accent hover:text-accent">
                      Planning complet <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
                <div className="p-8 text-center">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Aucun chantier prévu</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Vos chantiers planifiés apparaîtront ici
                  </p>
                </div>
                <div className="p-4 border-t border-border">
                  <Link to="/artisan/planning">
                    <Button variant="outline" className="w-full">
                      Gérer mon planning
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Performance Chart Placeholder */}
            <div className="mt-6 bg-card rounded-xl border border-border shadow-soft p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">Performance mensuelle</h2>
              </div>
              <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Graphique de performance</p>
                  <p className="text-sm text-muted-foreground/70">Sera disponible avec plus de données</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};
