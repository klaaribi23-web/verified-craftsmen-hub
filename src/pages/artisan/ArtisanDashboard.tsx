import { ArtisanSidebar } from "@/components/artisan-dashboard/ArtisanSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { StatsCard } from "@/components/artisan-dashboard/StatsCard";
import { SEOHead } from "@/components/seo/SEOHead";
import { ProfileCompletionCard } from "@/components/artisan-dashboard/ProfileCompletionCard";
import { ActiveProfileCard } from "@/components/artisan-dashboard/ActiveProfileCard";
import { SuspendedProfileCard } from "@/components/artisan-dashboard/SuspendedProfileCard";
import { ProfileViewsCard } from "@/components/artisan-dashboard/ProfileViewsCard";
import { ApprovalNotifications } from "@/components/artisan-dashboard/ApprovalNotifications";
import { FirstLoginWelcomeOverlay } from "@/components/artisan-dashboard/FirstLoginWelcomeOverlay";
import { SubscriptionWarningBanner } from "@/components/artisan-dashboard/SubscriptionWarningBanner";
import { DemoMessaging } from "@/components/demo/DemoMessaging";
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
  XCircle,
  Video,
  Eye,
  Users,
  ShieldCheck
} from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { SubscriptionDashboardCard } from "@/components/subscription/SubscriptionDashboardCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import { Link, useSearchParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";

export const ArtisanDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const demoMode = !user;
  const { tier, subscriptionEnd, checkSubscription, isLoading: isLoadingSubscription } = useSubscription();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showWelcome, setShowWelcome] = useState(false);

  // First login detection
  useEffect(() => {
    if (!user?.id) return;
    const storageKey = `artisan_welcome_shown_${user.id}`;
    if (!sessionStorage.getItem(storageKey) && !localStorage.getItem(storageKey)) {
      setShowWelcome(true);
    }
  }, [user?.id]);

  const handleDismissWelcome = () => {
    if (user?.id) {
      const storageKey = `artisan_welcome_shown_${user.id}`;
      localStorage.setItem(storageKey, "true");
      sessionStorage.setItem(storageKey, "true");
    }
    setShowWelcome(false);
  };

  // Handle subscription success redirect from Stripe
  useEffect(() => {
    if (searchParams.get("subscription_success") === "true") {
      toast.success("Félicitations ! Votre abonnement est maintenant actif. Profitez de vos nouveaux avantages !");
      // Clean URL
      searchParams.delete("subscription_success");
      setSearchParams(searchParams, { replace: true });
      // Refresh subscription data
      checkSubscription();
    }
  }, [searchParams, setSearchParams, checkSubscription]);

  // Realtime subscription for artisan profile updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('artisan-profile-realtime')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'artisans',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log("[Realtime] Artisan profile updated:", payload);
        queryClient.invalidateQueries({ queryKey: ["artisan-profile"] });
        queryClient.invalidateQueries({ queryKey: ["artisan-documents-stats"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Fetch artisan profile with auto-refresh
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
    enabled: !!user?.id,
    refetchInterval: 30000 // Auto-refresh every 30 seconds
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

  // Fetch documents stats with mandatory document count
  const MANDATORY_DOC_IDS = ["rc_pro", "decennale", "kbis"];
  const TOTAL_MANDATORY_DOCS = 3;

  const { data: documentStats } = useQuery({
    queryKey: ["artisan-documents-stats", artisanProfile?.id],
    queryFn: async () => {
      if (!artisanProfile?.id) return { total: 0, verified: 0, pending: 0, rejected: 0, mandatoryUploaded: 0 };
      
      const { data, error } = await supabase
        .from("artisan_documents")
        .select("name, status")
        .eq("artisan_id", artisanProfile.id);

      if (error) {
        console.error("Error fetching documents:", error);
        return { total: 0, verified: 0, pending: 0, rejected: 0, mandatoryUploaded: 0 };
      }

      const docs = data || [];
      const mandatoryUploaded = MANDATORY_DOC_IDS.filter(docId => 
        docs.some(d => d.name === docId)
      ).length;

      return {
        total: docs.length,
        verified: docs.filter(d => d.status === "verified").length,
        pending: docs.filter(d => d.status === "pending").length,
        rejected: docs.filter(d => d.status === "rejected").length,
        mandatoryUploaded
      };
    },
    enabled: !!artisanProfile?.id,
    refetchInterval: 30000 // Auto-refresh every 30 seconds
  });

  // Fetch stories stats
  const { data: storiesStats } = useQuery({
    queryKey: ["artisan-stories-stats", artisanProfile?.id],
    queryFn: async () => {
      if (!artisanProfile?.id) return { active: 0, total: 0, views: 0, uniqueViewers: 0 };
      
      // Get all stories for this artisan
      const { data: stories, error } = await supabase
        .from("artisan_stories")
        .select("id, views_count, expires_at")
        .eq("artisan_id", artisanProfile.id);

      if (error) {
        console.error("Error fetching stories stats:", error);
        return { active: 0, total: 0, views: 0, uniqueViewers: 0 };
      }

      const now = new Date().toISOString();
      const activeStories = stories?.filter(s => s.expires_at > now) || [];
      const totalViews = stories?.reduce((sum, s) => sum + (s.views_count || 0), 0) || 0;

      // Get unique viewers count
      const storyIds = stories?.map(s => s.id) || [];
      let uniqueViewers = 0;
      
      if (storyIds.length > 0) {
        const { count } = await supabase
          .from("story_views")
          .select("viewer_id", { count: "exact", head: true })
          .in("story_id", storyIds);
        uniqueViewers = count || 0;
      }

      return {
        active: activeStories.length,
        total: stories?.length || 0,
        views: totalViews,
        uniqueViewers
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
      
      // Update artisan status to pending and set approval_requested_at
      const { error: updateError } = await supabase
        .from("artisans")
        .update({ 
          status: "pending",
          approval_requested_at: new Date().toISOString()
        })
        .eq("id", artisanProfile.id);

      if (updateError) throw updateError;

      // Create notification for admins
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (adminRoles) {
        for (const admin of adminRoles) {
          await supabase.rpc("create_notification", {
            p_user_id: admin.user_id,
            p_type: "approval_request",
            p_title: "Nouvelle demande d'approbation",
            p_message: `${artisanProfile.business_name} a soumis ses 4 documents obligatoires et demande l'approbation de son profil.`,
            p_related_id: artisanProfile.id
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artisan-profile"] });
      toast.success("Demande d'approbation envoyée ! L'administrateur examinera vos documents et votre profil.");
    },
    onError: (error: any) => {
      console.error("Approval request error details:", {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      });
      const errorMessage = error?.message || "Erreur lors de l'envoi de la demande";
      toast.error(`Erreur: ${errorMessage}`);
    }
  });

  if (isLoadingProfile && !demoMode) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-screen bg-background pt-28 lg:pt-20">
          <ArtisanSidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </>
    );
  }

  const demoStats = { requests: 12, inProgress: 3, completed: 47, rating: 4.8 };
  const displayStats = demoMode ? demoStats : stats;
  const displayTier = demoMode ? "pro" as const : tier;
  const displayBusinessName = demoMode ? "Durand Peinture & Décoration" : artisanProfile?.business_name;

  const isSubscribed = tier !== "free";

  return (
    <>
      <SEOHead 
        title="Tableau de bord Artisan" 
        description="Gérez votre activité d'artisan sur Artisans Validés"
        noIndex={true}
      />
      <Navbar />

      {/* First Login Welcome Overlay */}
      {showWelcome && !demoMode && artisanProfile && (
        <FirstLoginWelcomeOverlay
          artisanName={artisanProfile.business_name || "Artisan"}
          city={artisanProfile.city || ""}
          onDismiss={handleDismissWelcome}
        />
      )}

      <div className="flex min-h-screen bg-background pt-28 lg:pt-20">
        <ArtisanSidebar />
        
        <div className="flex-1 flex flex-col">
          <DashboardHeader 
            title="Tableau de bord" 
            subtitle={`Bienvenue${displayBusinessName ? `, ${displayBusinessName}` : ''} ! Voici un aperçu de votre activité.`}
          />

          <main className="flex-1 p-3 md:p-6 pb-24 lg:pb-6 overflow-auto">
            {/* Subscription Warning Banner */}
            {!demoMode && !isLoadingSubscription && !isSubscribed && (
              <SubscriptionWarningBanner />
            )}

            {/* Approval Notifications */}
            <div className="mb-4 md:mb-6">
              <ApprovalNotifications />
            </div>

            {/* Subscription Card */}
            <div id="subscription-section">
              <SubscriptionDashboardCard tier={displayTier} subscriptionEnd={subscriptionEnd} isLoading={demoMode ? false : isLoadingSubscription} />
            </div>

            {/* Profile Status Cards */}
            {artisanProfile?.status === "active" && (
              <div className="mb-6">
                <ActiveProfileCard
                  profile={{
                    photo_url: artisanProfile.photo_url,
                    description: artisanProfile.description,
                    siret: artisanProfile.siret,
                    city: artisanProfile.city,
                    portfolio_images: artisanProfile.portfolio_images,
                    experience_years: artisanProfile.experience_years
                  }}
                />
              </div>
            )}

            {artisanProfile?.status === "suspended" && (
              <div className="mb-6">
                <SuspendedProfileCard />
              </div>
            )}

            {artisanProfile && 
             (artisanProfile.status === "pending" || artisanProfile.status === "prospect") && (
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
                  mandatoryDocumentsUploaded={documentStats?.mandatoryUploaded || 0}
                  totalMandatoryDocuments={TOTAL_MANDATORY_DOCS}
                />
              </div>
            )}

            {/* Profile Views Counter */}
            <ProfileViewsCard artisanId={artisanProfile?.id} demoMode={demoMode} />

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
              <StatsCard
                title="Demandes reçues"
                value={displayStats?.requests || 0}
                icon={Briefcase}
              />
              <StatsCard
                title="Chantiers en cours"
                value={displayStats?.inProgress || 0}
                icon={Clock}
                variant="gold"
              />
              <StatsCard
                title="Chantiers terminés"
                value={displayStats?.completed || 0}
                icon={CheckCircle}
                variant="success"
              />
              <StatsCard
                title="Note moyenne"
                value={displayStats?.rating?.toFixed(1) || "0.0"}
                icon={Star}
              />
            </div>

            {/* Stories Stats Card */}
            <div className="bg-card rounded-xl border border-border shadow-soft p-4 md:p-6 mb-6 md:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <Video className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Mes Stories</h3>
                    <p className="text-sm text-muted-foreground">
                      {demoMode ? 2 : (storiesStats?.active || 0)} story active sur {demoMode ? 8 : (storiesStats?.total || 0)} total
                    </p>
                  </div>
                </div>
                <Link to="/artisan/stories">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    Gérer <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
              
              <div className="grid grid-cols-3 gap-2 md:gap-4">
                <div className="flex flex-col md:flex-row items-center md:gap-3 p-2 md:p-3 bg-primary/10 rounded-lg text-center md:text-left">
                  <Video className="w-5 h-5 text-primary hidden md:block" />
                  <div>
                    <p className="text-lg md:text-2xl font-bold text-primary">{demoMode ? 2 : (storiesStats?.active || 0)}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground">Actives (24h)</p>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row items-center md:gap-3 p-2 md:p-3 bg-accent/10 rounded-lg text-center md:text-left">
                  <Eye className="w-5 h-5 text-accent hidden md:block" />
                  <div>
                    <p className="text-lg md:text-2xl font-bold text-accent">{demoMode ? 89 : (storiesStats?.views || 0)}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground">Vues totales</p>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row items-center md:gap-3 p-2 md:p-3 bg-success/10 rounded-lg text-center md:text-left">
                  <Users className="w-5 h-5 text-success hidden md:block" />
                  <div>
                    <p className="text-lg md:text-2xl font-bold text-success">{demoMode ? 34 : (storiesStats?.uniqueViewers || 0)}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground">Visiteurs uniques</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mon Dossier - Document Validation Card */}
            <div className="bg-card rounded-xl border border-border shadow-soft p-4 md:p-6 mb-6 md:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Mon Dossier</h3>
                    <p className="text-sm text-muted-foreground">
                      Documents professionnels vérifiés
                    </p>
                  </div>
                </div>
                <Link to="/artisan/documents">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    Gérer <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
              
              {documentStats && documentStats.total > 0 ? (
                <div className="space-y-2">
                  {[
                    { name: "Extrait KBIS", docId: "kbis" },
                    { name: "Garantie Décennale", docId: "decennale" },
                    { name: "RC Professionnelle", docId: "rc_pro" },
                  ].map((doc) => {
                    const isVerified = documentStats.verified > 0;
                    return (
                      <div key={doc.docId} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">{doc.name}</span>
                        </div>
                        <Badge className="bg-success/20 text-success border-0 text-xs gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Vérifié
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      Aucun document soumis. Ajoutez vos documents professionnels pour compléter votre profil.
                    </p>
                  </div>
                  <Link to="/artisan/documents" className="w-full sm:w-auto sm:ml-auto">
                    <Button size="sm" variant="gold" className="w-full sm:w-auto">
                      Ajouter
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Demo Messaging - Artisan View */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-accent" />
                  Messagerie — Rénovation Salle de Bain
                </h3>
                <DemoMessaging viewAs="artisan" />
              </div>

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
