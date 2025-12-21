import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/admin-dashboard/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  MapPin,
  AlertCircle,
  Loader2,
  Briefcase,
  Euro,
  User,
  Store,
  ExternalLink,
  Pencil,
  Trash2,
  TrendingUp,
  Users,
  ShoppingBag
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { DEFAULT_AVATAR } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { AdminEditArtisanDialog } from "@/components/admin-dashboard/AdminEditArtisanDialog";

interface PendingArtisan {
  id: string;
  business_name: string;
  city: string;
  description: string | null;
  photo_url: string | null;
  siret: string | null;
  experience_years: number | null;
  portfolio_images: string[] | null;
  created_at: string;
  slug: string | null;
  category: { name: string } | null;
  profile: { 
    first_name: string | null; 
    last_name: string | null;
    email: string;
    phone: string | null;
  } | null;
}

interface ProspectArtisan {
  id: string;
  business_name: string;
  city: string;
  description: string | null;
  photo_url: string | null;
  portfolio_images: string[] | null;
  created_at: string;
  slug: string | null;
  category: { name: string } | null;
}

interface PendingMission {
  id: string;
  title: string;
  description: string | null;
  city: string;
  budget: number | null;
  created_at: string;
  photos?: string[] | null;
  category: { name: string } | null;
  client: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
}

const AdminApprovals = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("missions");
  const [selectedArtisan, setSelectedArtisan] = useState<PendingArtisan | null>(null);
  const [selectedMission, setSelectedMission] = useState<PendingMission | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showMissionRejectDialog, setShowMissionRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [prospectToDelete, setProspectToDelete] = useState<ProspectArtisan | null>(null);
  const [editProspect, setEditProspect] = useState<ProspectArtisan | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Fetch pending artisans
  const { data: pendingArtisans = [], isLoading: isLoadingArtisans } = useQuery({
    queryKey: ["pending-artisans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artisans")
        .select(`
          id,
          business_name,
          city,
          description,
          photo_url,
          siret,
          experience_years,
          portfolio_images,
          created_at,
          slug,
          category:categories(name),
          profile:profiles!artisans_profile_id_fkey(first_name, last_name, email, phone)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PendingArtisan[];
    }
  });

  // Fetch prospect artisans (vitrines)
  const { data: prospectArtisans = [], isLoading: isLoadingProspects } = useQuery({
    queryKey: ["prospect-artisans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artisans")
        .select(`
          id,
          business_name,
          city,
          description,
          photo_url,
          portfolio_images,
          created_at,
          slug,
          category:categories(name)
        `)
        .eq("status", "prospect")
        .is("user_id", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ProspectArtisan[];
    }
  });

  // Count recently claimed (prospects that became pending this month)
  const { data: claimedThisMonth = 0 } = useQuery({
    queryKey: ["claimed-this-month"],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { count, error } = await supabase
        .from("artisans")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")
        .not("user_id", "is", null)
        .gte("updated_at", startOfMonth.toISOString());

      if (error) throw error;
      return count || 0;
    }
  });

  // Fetch pending missions
  const { data: pendingMissions = [], isLoading: isLoadingMissions } = useQuery({
    queryKey: ["pending-missions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("missions")
        .select(`
          id,
          title,
          description,
          city,
          budget,
          photos,
          created_at,
          category:categories(name),
          client:profiles!missions_client_id_fkey(first_name, last_name, email)
        `)
        .eq("status", "pending_approval")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PendingMission[];
    }
  });

  // Approve artisan mutation
  const approveArtisanMutation = useMutation({
    mutationFn: async (artisanId: string) => {
      const { error } = await supabase
        .from("artisans")
        .update({ status: "active", is_verified: true })
        .eq("id", artisanId);

      if (error) throw error;

      const artisan = pendingArtisans?.find(a => a.id === artisanId);
      if (artisan?.profile) {
        const { data: userData } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("email", artisan.profile.email)
          .single();

        if (userData) {
          await supabase.rpc("create_notification", {
            p_user_id: userData.user_id,
            p_type: "approval",
            p_title: "Profil approuvé !",
            p_message: "Félicitations ! Votre profil a été approuvé et est maintenant visible publiquement.",
            p_related_id: null
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-artisans"] });
      toast.success("Artisan approuvé avec succès");
      setSelectedArtisan(null);
    },
    onError: () => {
      toast.error("Erreur lors de l'approbation");
    }
  });

  // Reject artisan mutation
  const rejectArtisanMutation = useMutation({
    mutationFn: async ({ artisanId, reason }: { artisanId: string; reason: string }) => {
      const artisan = pendingArtisans?.find(a => a.id === artisanId);
      if (artisan?.profile) {
        const { data: userData } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("email", artisan.profile.email)
          .single();

        if (userData) {
          await supabase.rpc("create_notification", {
            p_user_id: userData.user_id,
            p_type: "rejection",
            p_title: "Profil non approuvé",
            p_message: `Votre demande d'approbation a été refusée. Raison : ${reason}. Veuillez corriger les éléments mentionnés et soumettre à nouveau votre demande.`,
            p_related_id: null
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-artisans"] });
      toast.success("Notification de refus envoyée");
      setShowRejectDialog(false);
      setSelectedArtisan(null);
      setRejectReason("");
    },
    onError: () => {
      toast.error("Erreur lors de l'envoi de la notification");
    }
  });

  // Approve mission mutation
  const approveMissionMutation = useMutation({
    mutationFn: async (missionId: string) => {
      const { error } = await supabase
        .from("missions")
        .update({ status: "published" })
        .eq("id", missionId);

      if (error) throw error;

      const mission = pendingMissions?.find(m => m.id === missionId);
      if (mission?.client) {
        const { data: userData } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("email", mission.client.email)
          .single();

        if (userData) {
          await supabase.rpc("create_notification", {
            p_user_id: userData.user_id,
            p_type: "mission_approved",
            p_title: "Mission approuvée !",
            p_message: `Votre mission "${mission.title}" a été approuvée et est maintenant publiée. Les artisans peuvent désormais postuler.`,
            p_related_id: missionId
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-missions"] });
      toast.success("Mission approuvée et publiée");
      setSelectedMission(null);
    },
    onError: () => {
      toast.error("Erreur lors de l'approbation");
    }
  });

  // Reject mission mutation
  const rejectMissionMutation = useMutation({
    mutationFn: async ({ missionId, reason }: { missionId: string; reason: string }) => {
      const { error } = await supabase
        .from("missions")
        .update({ status: "rejected", rejection_reason: reason })
        .eq("id", missionId);

      if (error) throw error;

      const mission = pendingMissions?.find(m => m.id === missionId);
      if (mission?.client) {
        const { data: userData } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("email", mission.client.email)
          .single();

        if (userData) {
          await supabase.rpc("create_notification", {
            p_user_id: userData.user_id,
            p_type: "mission_rejected",
            p_title: "Mission refusée",
            p_message: `Votre mission "${mission.title}" a été refusée. Raison : ${reason}. Vous pouvez modifier votre annonce et la resoumettre.`,
            p_related_id: missionId
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-missions"] });
      toast.success("Mission refusée");
      setShowMissionRejectDialog(false);
      setSelectedMission(null);
      setRejectReason("");
    },
    onError: () => {
      toast.error("Erreur lors du refus");
    }
  });

  // Delete prospect mutation
  const deleteProspectMutation = useMutation({
    mutationFn: async (prospectId: string) => {
      const { error } = await supabase
        .from("artisans")
        .delete()
        .eq("id", prospectId)
        .eq("status", "prospect");

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospect-artisans"] });
      toast.success("Fiche vitrine supprimée");
      setProspectToDelete(null);
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    }
  });

  const getProfileCompleteness = (artisan: PendingArtisan) => {
    let score = 0;
    let total = 6;
    
    if (artisan.photo_url) score++;
    if (artisan.description && artisan.description.length > 50) score++;
    if (artisan.siret) score++;
    if (artisan.portfolio_images && artisan.portfolio_images.length >= 3) score++;
    if (artisan.experience_years && artisan.experience_years > 0) score++;
    if (artisan.city && artisan.city !== "Non renseigné") score++;

    return { score, total, percentage: Math.round((score / total) * 100) };
  };

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-background pt-16 lg:pt-20">
        <AdminSidebar />
      
        <main className="flex-1 p-4 md:p-8">
          <div className="mb-4 md:mb-8">
            <h1 className="text-xl md:text-3xl font-bold text-foreground">Demandes d'approbation</h1>
            <p className="text-muted-foreground text-sm md:text-base mt-1">
              Vérifiez et approuvez les profils artisans et les missions
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
            <TabsList className="w-full flex h-auto gap-1 p-1">
              <TabsTrigger value="missions" className="flex-1 gap-1.5 text-xs sm:text-sm px-2 sm:px-4 py-2">
                <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Missions</span>
                <span className="xs:hidden">Miss.</span>
                <Badge variant="secondary" className="ml-1 text-xs h-5 px-1.5">{pendingMissions.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="artisans" className="flex-1 gap-1.5 text-xs sm:text-sm px-2 sm:px-4 py-2">
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Artisans</span>
                <span className="xs:hidden">Art.</span>
                <Badge variant="secondary" className="ml-1 text-xs h-5 px-1.5">{pendingArtisans.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="vitrines" className="flex-1 gap-1.5 text-xs sm:text-sm px-2 sm:px-4 py-2">
                <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Vitrines</span>
                <span className="xs:hidden">Vitr.</span>
                <Badge variant="secondary" className="ml-1 text-xs h-5 px-1.5">{prospectArtisans.length}</Badge>
              </TabsTrigger>
            </TabsList>

            {/* MISSIONS TAB */}
            <TabsContent value="missions">
              {isLoadingMissions ? (
                <div className="flex items-center justify-center py-12 md:py-20">
                  <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" />
                </div>
              ) : pendingMissions.length > 0 ? (
                <div className="grid gap-3 md:gap-6">
                  {pendingMissions.map((mission) => (
                    <Card key={mission.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-3 md:p-6">
                        <div className="flex flex-col gap-3 md:gap-4">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base md:text-xl font-bold truncate">{mission.title}</h3>
                              <div className="flex flex-wrap items-center gap-1.5 md:gap-2 text-muted-foreground text-xs md:text-sm mt-1">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 md:h-4 md:w-4 shrink-0" />
                                  <span className="truncate max-w-[100px] md:max-w-none">{mission.city}</span>
                                </span>
                                {mission.category && (
                                  <Badge variant="secondary" className="text-xs px-1.5 py-0">{mission.category.name}</Badge>
                                )}
                                {mission.budget && (
                                  <span className="flex items-center gap-0.5 text-gold font-medium">
                                    <Euro className="h-3 w-3" />
                                    {mission.budget} €
                                  </span>
                                )}
                              </div>
                            </div>
                            <Badge variant="outline" className="gap-1 text-xs shrink-0">
                              <Clock className="h-2.5 w-2.5 md:h-3 md:w-3" />
                              <span className="hidden sm:inline">En attente</span>
                            </Badge>
                          </div>

                          {mission.description && (
                            <p className="text-muted-foreground text-xs md:text-sm line-clamp-2">
                              {mission.description}
                            </p>
                          )}

                          <div className="text-xs md:text-sm text-muted-foreground">
                            <span className="font-medium">Client : </span>
                            <span className="truncate">{mission.client?.first_name} {mission.client?.last_name}</span>
                            <span className="hidden md:inline"> ({mission.client?.email})</span>
                          </div>

                          {/* Actions - Mobile optimized */}
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 min-w-[80px] text-xs md:text-sm h-8 md:h-9"
                              onClick={() => setSelectedMission(mission)}
                            >
                              <Eye className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                              Détails
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 min-w-[80px] text-xs md:text-sm h-8 md:h-9"
                              onClick={() => approveMissionMutation.mutate(mission.id)}
                              disabled={approveMissionMutation.isPending}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                              <span className="hidden sm:inline">Approuver</span>
                              <span className="sm:hidden">OK</span>
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="flex-1 min-w-[80px] text-xs md:text-sm h-8 md:h-9"
                              onClick={() => {
                                setSelectedMission(mission);
                                setShowMissionRejectDialog(true);
                              }}
                            >
                              <XCircle className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                              Refuser
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 md:py-20 text-center">
                    <CheckCircle2 className="h-12 w-12 md:h-16 md:w-16 text-emerald-500 mx-auto mb-3 md:mb-4" />
                    <h3 className="text-lg md:text-xl font-semibold mb-2">Aucune mission en attente</h3>
                    <p className="text-muted-foreground text-sm md:text-base">
                      Toutes les missions ont été traitées.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ARTISANS TAB */}
            <TabsContent value="artisans">
              {isLoadingArtisans ? (
                <div className="flex items-center justify-center py-12 md:py-20">
                  <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" />
                </div>
              ) : pendingArtisans.length > 0 ? (
                <div className="grid gap-3 md:gap-6">
                  {pendingArtisans.map((artisan) => {
                    const completeness = getProfileCompleteness(artisan);
                    return (
                      <Card key={artisan.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-3 md:p-6">
                          <div className="flex gap-3 md:gap-6">
                            {/* Avatar - Smaller on mobile */}
                            <Avatar className="h-14 w-14 md:h-24 md:w-24 ring-2 md:ring-4 ring-muted shrink-0">
                              <AvatarImage src={artisan.photo_url || DEFAULT_AVATAR} />
                              <AvatarFallback className="text-lg md:text-2xl bg-primary text-primary-foreground">
                                <img src={DEFAULT_AVATAR} alt="Avatar" className="w-full h-full object-cover" />
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              {/* Header */}
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="min-w-0">
                                  <h3 className="text-base md:text-xl font-bold truncate">{artisan.business_name}</h3>
                                  <div className="flex flex-wrap items-center gap-1.5 text-muted-foreground text-xs md:text-sm">
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3 md:h-4 md:w-4" />
                                      <span className="truncate max-w-[80px] md:max-w-none">{artisan.city}</span>
                                    </span>
                                    {artisan.category && (
                                      <Badge variant="secondary" className="text-xs px-1.5 py-0">{artisan.category.name}</Badge>
                                    )}
                                  </div>
                                </div>
                                <Badge variant="outline" className="gap-1 text-xs shrink-0 hidden sm:flex">
                                  <Clock className="h-2.5 w-2.5" />
                                  En attente
                                </Badge>
                              </div>

                              {artisan.description && (
                                <p className="text-muted-foreground text-xs md:text-sm line-clamp-2 mb-2 md:mb-4">
                                  {artisan.description}
                                </p>
                              )}

                              {/* Badges - Compact on mobile */}
                              <div className="flex flex-wrap gap-1 md:gap-2 mb-2 md:mb-4">
                                <Badge variant={artisan.photo_url ? "default" : "secondary"} className="gap-0.5 text-xs px-1.5 py-0">
                                  {artisan.photo_url ? <CheckCircle2 className="h-2.5 w-2.5" /> : <AlertCircle className="h-2.5 w-2.5" />}
                                  <span className="hidden sm:inline">Photo</span>
                                </Badge>
                                <Badge variant={artisan.siret ? "default" : "secondary"} className="gap-0.5 text-xs px-1.5 py-0">
                                  {artisan.siret ? <CheckCircle2 className="h-2.5 w-2.5" /> : <AlertCircle className="h-2.5 w-2.5" />}
                                  SIRET
                                </Badge>
                                <Badge variant={artisan.portfolio_images && artisan.portfolio_images.length >= 3 ? "default" : "secondary"} className="gap-0.5 text-xs px-1.5 py-0">
                                  {artisan.portfolio_images && artisan.portfolio_images.length >= 3 ? <CheckCircle2 className="h-2.5 w-2.5" /> : <AlertCircle className="h-2.5 w-2.5" />}
                                  {artisan.portfolio_images?.length || 0}/3
                                </Badge>
                              </div>

                              {/* Progress bar - Compact on mobile */}
                              <div className="mb-2 md:mb-4">
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-muted-foreground">Profil</span>
                                  <span className="font-medium">{completeness.percentage}%</span>
                                </div>
                                <div className="h-1.5 md:h-2 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all ${
                                      completeness.percentage >= 80 ? 'bg-emerald-500' : 
                                      completeness.percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${completeness.percentage}%` }}
                                  />
                                </div>
                              </div>

                              {/* Actions - Mobile optimized */}
                              <div className="flex flex-wrap gap-1.5 md:gap-2">
                                <Button variant="outline" size="sm" className="flex-1 min-w-[60px] text-xs md:text-sm h-8 md:h-9 px-2 md:px-3" onClick={() => setSelectedArtisan(artisan)}>
                                  <Eye className="h-3.5 w-3.5 md:h-4 md:w-4 mr-0.5 md:mr-1" />
                                  <span className="hidden sm:inline">Voir</span>
                                </Button>
                                <Button size="sm" className="flex-1 min-w-[60px] text-xs md:text-sm h-8 md:h-9 px-2 md:px-3" onClick={() => approveArtisanMutation.mutate(artisan.id)} disabled={approveArtisanMutation.isPending}>
                                  <CheckCircle2 className="h-3.5 w-3.5 md:h-4 md:w-4 mr-0.5 md:mr-1" />
                                  <span className="hidden sm:inline">Approuver</span>
                                  <span className="sm:hidden">OK</span>
                                </Button>
                                <Button variant="destructive" size="sm" className="flex-1 min-w-[60px] text-xs md:text-sm h-8 md:h-9 px-2 md:px-3" onClick={() => { setSelectedArtisan(artisan); setShowRejectDialog(true); }}>
                                  <XCircle className="h-3.5 w-3.5 md:h-4 md:w-4 mr-0.5 md:mr-1" />
                                  <span className="hidden sm:inline">Refuser</span>
                                  <span className="sm:hidden">Non</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 md:py-20 text-center">
                    <CheckCircle2 className="h-12 w-12 md:h-16 md:w-16 text-emerald-500 mx-auto mb-3 md:mb-4" />
                    <h3 className="text-lg md:text-xl font-semibold mb-2">Aucune demande en attente</h3>
                    <p className="text-muted-foreground text-sm md:text-base">
                      Toutes les demandes d'approbation ont été traitées.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* VITRINES TAB */}
            <TabsContent value="vitrines">
              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
                <Card>
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <ShoppingBag className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Actives</p>
                        <p className="text-lg md:text-2xl font-bold">{prospectArtisans.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <Users className="h-4 w-4 md:h-5 md:w-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Revendiquées</p>
                        <p className="text-lg md:text-2xl font-bold">{claimedThisMonth}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="p-2 bg-gold/10 rounded-lg">
                        <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-gold" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Conversion</p>
                        <p className="text-lg md:text-2xl font-bold">
                          {prospectArtisans.length + claimedThisMonth > 0 
                            ? Math.round((claimedThisMonth / (prospectArtisans.length + claimedThisMonth)) * 100) 
                            : 0}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {isLoadingProspects ? (
                <div className="flex items-center justify-center py-12 md:py-20">
                  <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" />
                </div>
              ) : prospectArtisans.length > 0 ? (
                <div className="grid gap-3 md:gap-6">
                  {prospectArtisans.map((prospect) => (
                    <Card key={prospect.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-3 md:p-6">
                        <div className="flex gap-3 md:gap-6">
                          <Avatar className="h-14 w-14 md:h-20 md:w-20 ring-2 ring-muted shrink-0">
                            <AvatarImage src={prospect.photo_url || DEFAULT_AVATAR} />
                            <AvatarFallback className="text-lg md:text-xl bg-primary text-primary-foreground">
                              {prospect.business_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="min-w-0">
                                <h3 className="text-base md:text-xl font-bold truncate">{prospect.business_name}</h3>
                                <div className="flex flex-wrap items-center gap-1.5 text-muted-foreground text-xs md:text-sm">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3 md:h-4 md:w-4" />
                                    <span className="truncate max-w-[80px] md:max-w-none">{prospect.city}</span>
                                  </span>
                                  {prospect.category && (
                                    <Badge variant="secondary" className="text-xs px-1.5 py-0">{prospect.category.name}</Badge>
                                  )}
                                </div>
                              </div>
                              <Badge variant="outline" className="gap-1 text-xs shrink-0 bg-amber-500/10 text-amber-600 border-amber-500/30">
                                <Store className="h-2.5 w-2.5" />
                                Vitrine
                              </Badge>
                            </div>

                            {prospect.description && (
                              <p className="text-muted-foreground text-xs md:text-sm line-clamp-2 mb-2 md:mb-3">
                                {prospect.description}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-3">
                              <span>Créée le {new Date(prospect.created_at).toLocaleDateString('fr-FR')}</span>
                              {prospect.portfolio_images && prospect.portfolio_images.length > 0 && (
                                <span>• {prospect.portfolio_images.length} photo(s)</span>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-1.5 md:gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 min-w-[70px] text-xs md:text-sm h-8 md:h-9 px-2 md:px-3"
                                onClick={() => window.open(`/artisan/${prospect.slug}`, '_blank')}
                              >
                                <ExternalLink className="h-3.5 w-3.5 md:h-4 md:w-4 mr-0.5 md:mr-1" />
                                <span className="hidden sm:inline">Voir</span>
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 min-w-[70px] text-xs md:text-sm h-8 md:h-9 px-2 md:px-3"
                                onClick={() => {
                                  setEditProspect(prospect);
                                  setEditDialogOpen(true);
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4 mr-0.5 md:mr-1" />
                                <span className="hidden sm:inline">Modifier</span>
                              </Button>
                              <Button
                                variant="destructive" 
                                size="sm" 
                                className="flex-1 min-w-[70px] text-xs md:text-sm h-8 md:h-9 px-2 md:px-3"
                                onClick={() => setProspectToDelete(prospect)}
                              >
                                <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4 mr-0.5 md:mr-1" />
                                <span className="hidden sm:inline">Supprimer</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 md:py-20 text-center">
                    <Store className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground/50 mx-auto mb-3 md:mb-4" />
                    <h3 className="text-lg md:text-xl font-semibold mb-2">Aucune fiche vitrine</h3>
                    <p className="text-muted-foreground text-sm md:text-base mb-4">
                      Créez des fiches vitrines pour attirer de nouveaux artisans.
                    </p>
                    <Button onClick={() => navigate("/admin/ajouter-artisan")}>
                      Créer une fiche vitrine
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Reject Artisan Dialog */}
          <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Refuser la demande artisan</DialogTitle>
                <DialogDescription>
                  Expliquez à l'artisan pourquoi sa demande est refusée.
                </DialogDescription>
              </DialogHeader>
              <Textarea
                placeholder="Raison du refus..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Annuler</Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (selectedArtisan && rejectReason.trim()) {
                      rejectArtisanMutation.mutate({ artisanId: selectedArtisan.id, reason: rejectReason });
                    }
                  }}
                  disabled={!rejectReason.trim() || rejectArtisanMutation.isPending}
                >
                  {rejectArtisanMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Envoyer le refus
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Reject Mission Dialog */}
          <Dialog open={showMissionRejectDialog} onOpenChange={setShowMissionRejectDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Refuser la mission</DialogTitle>
                <DialogDescription>
                  Expliquez au client pourquoi sa mission est refusée.
                </DialogDescription>
              </DialogHeader>
              <Textarea
                placeholder="Raison du refus (ex: Description incomplète, budget irréaliste...)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowMissionRejectDialog(false)}>Annuler</Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (selectedMission && rejectReason.trim()) {
                      rejectMissionMutation.mutate({ missionId: selectedMission.id, reason: rejectReason });
                    }
                  }}
                  disabled={!rejectReason.trim() || rejectMissionMutation.isPending}
                >
                  {rejectMissionMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Refuser la mission
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* View Artisan Profile Dialog */}
          <Dialog open={!!selectedArtisan && !showRejectDialog} onOpenChange={() => setSelectedArtisan(null)}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto mx-2 md:mx-auto">
              {selectedArtisan && (
                <>
                  <DialogHeader>
                    <DialogTitle className="text-lg md:text-xl">Profil de {selectedArtisan.business_name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 md:space-y-6">
                    <div className="grid grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm">
                      <div>
                        <p className="text-muted-foreground">Email</p>
                        <p className="font-medium truncate">{selectedArtisan.profile?.email || "Non renseigné"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Téléphone</p>
                        <p className="font-medium">{selectedArtisan.profile?.phone || "Non renseigné"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">SIRET</p>
                        <p className="font-medium">{selectedArtisan.siret || "Non renseigné"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Expérience</p>
                        <p className="font-medium">{selectedArtisan.experience_years || 0} ans</p>
                      </div>
                    </div>

                    {selectedArtisan.description && (
                      <div>
                        <p className="text-muted-foreground text-xs md:text-sm mb-1">Description</p>
                        <p className="text-xs md:text-sm">{selectedArtisan.description}</p>
                      </div>
                    )}

                    {selectedArtisan.portfolio_images && selectedArtisan.portfolio_images.length > 0 && (
                      <div>
                        <p className="text-muted-foreground text-xs md:text-sm mb-2">Portfolio</p>
                        <div className="grid grid-cols-3 gap-1.5 md:gap-2">
                          {selectedArtisan.portfolio_images.map((img, i) => (
                            <img key={i} src={img} alt={`Portfolio ${i + 1}`} className="aspect-square object-cover rounded-lg" />
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-3 md:pt-4 border-t">
                      <Button className="flex-1 h-9 md:h-10 text-sm" onClick={() => approveArtisanMutation.mutate(selectedArtisan.id)} disabled={approveArtisanMutation.isPending}>
                        <CheckCircle2 className="h-4 w-4 mr-1 md:mr-2" />
                        Approuver
                      </Button>
                      <Button variant="destructive" className="flex-1 h-9 md:h-10 text-sm" onClick={() => setShowRejectDialog(true)}>
                        <XCircle className="h-4 w-4 mr-1 md:mr-2" />
                        Refuser
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>

          {/* View Mission Details Dialog */}
          <Dialog open={!!selectedMission && !showMissionRejectDialog} onOpenChange={() => setSelectedMission(null)}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto mx-2 md:mx-auto">
              {selectedMission && (
                <>
                  <DialogHeader>
                    <DialogTitle className="text-lg md:text-xl">{selectedMission.title}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 md:space-y-4">
                    <div className="grid grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm">
                      <div>
                        <p className="text-muted-foreground">Client</p>
                        <p className="font-medium">{selectedMission.client?.first_name} {selectedMission.client?.last_name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Email</p>
                        <p className="font-medium truncate">{selectedMission.client?.email}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Ville</p>
                        <p className="font-medium">{selectedMission.city}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Budget</p>
                        <p className="font-medium">{selectedMission.budget ? `${selectedMission.budget} €` : "Non spécifié"}</p>
                      </div>
                    </div>

                    {selectedMission.description && (
                      <div>
                        <p className="text-muted-foreground text-xs md:text-sm mb-1">Description</p>
                        <p className="text-xs md:text-sm whitespace-pre-wrap">{selectedMission.description}</p>
                      </div>
                    )}

                    {selectedMission.photos && selectedMission.photos.length > 0 && (
                      <div>
                        <p className="text-muted-foreground text-xs md:text-sm mb-2">Photos ({selectedMission.photos.length})</p>
                        <div className="grid grid-cols-3 gap-1.5 md:gap-2">
                          {selectedMission.photos.map((photo, i) => (
                            <img 
                              key={i} 
                              src={photo} 
                              alt={`Photo ${i + 1}`} 
                              className="aspect-square object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(photo, '_blank')}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-3 md:pt-4 border-t">
                      <Button className="flex-1 h-9 md:h-10 text-sm" onClick={() => approveMissionMutation.mutate(selectedMission.id)} disabled={approveMissionMutation.isPending}>
                        <CheckCircle2 className="h-4 w-4 mr-1 md:mr-2" />
                        <span className="hidden sm:inline">Approuver et Publier</span>
                        <span className="sm:hidden">Approuver</span>
                      </Button>
                      <Button variant="destructive" className="flex-1 h-9 md:h-10 text-sm" onClick={() => setShowMissionRejectDialog(true)}>
                        <XCircle className="h-4 w-4 mr-1 md:mr-2" />
                        Refuser
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>

          {/* Delete Prospect Confirmation Dialog */}
          <AlertDialog open={!!prospectToDelete} onOpenChange={() => setProspectToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer la fiche vitrine ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir supprimer la fiche vitrine "{prospectToDelete?.business_name}" ? 
                  Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => {
                    if (prospectToDelete) {
                      deleteProspectMutation.mutate(prospectToDelete.id);
                    }
                  }}
                  disabled={deleteProspectMutation.isPending}
                >
                  {deleteProspectMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Edit Prospect Dialog */}
          <AdminEditArtisanDialog
            open={editDialogOpen}
            onOpenChange={(open) => {
              setEditDialogOpen(open);
              if (!open) {
                setEditProspect(null);
                queryClient.invalidateQueries({ queryKey: ["prospect-artisans"] });
              }
            }}
            artisan={editProspect as any}
          />
        </main>
      </div>
    </>
  );
};

export default AdminApprovals;
