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
  UserPlus,
  Send,
  Mail
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";

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
  status: string;
  category: { name: string } | null;
  profile: { 
    first_name: string | null; 
    last_name: string | null;
    email: string;
    phone: string | null;
  } | null;
}

interface PendingMission {
  id: string;
  title: string;
  description: string | null;
  city: string;
  budget: number | null;
  created_at: string;
  category: { name: string } | null;
  client: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
}

const AdminApprovals = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("missions");
  const [selectedArtisan, setSelectedArtisan] = useState<PendingArtisan | null>(null);
  const [selectedMission, setSelectedMission] = useState<PendingMission | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showMissionRejectDialog, setShowMissionRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [sendingActivationFor, setSendingActivationFor] = useState<string | null>(null);

  // Fetch pending artisans (status = pending, awaiting approval after self-registration)
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
          status,
          category:categories(name),
          profile:profiles!artisans_profile_id_fkey(first_name, last_name, email, phone)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PendingArtisan[];
    }
  });

  // Fetch prospect artisans (status = prospect, created by admin)
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
          siret,
          experience_years,
          portfolio_images,
          created_at,
          status,
          category:categories(name),
          profile:profiles!artisans_profile_id_fkey(first_name, last_name, email, phone)
        `)
        .eq("status", "prospect")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PendingArtisan[];
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

  // Send activation email mutation
  const sendActivationEmailMutation = useMutation({
    mutationFn: async (prospect: PendingArtisan) => {
      if (!prospect.profile?.email) {
        throw new Error("Email non disponible pour ce prospect");
      }

      const { data, error } = await supabase.functions.invoke("send-activation-email", {
        body: {
          artisanId: prospect.id,
          businessName: prospect.business_name,
          email: prospect.profile.email,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, prospect) => {
      toast.success(`Email d'activation envoyé à ${prospect.profile?.email}`);
      queryClient.invalidateQueries({ queryKey: ["prospect-artisans"] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de l'envoi: ${error.message}`);
    },
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
          await supabase.from("notifications").insert({
            user_id: userData.user_id,
            title: "Profil approuvé !",
            message: "Félicitations ! Votre profil a été approuvé et est maintenant visible publiquement.",
            type: "approval"
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
          await supabase.from("notifications").insert({
            user_id: userData.user_id,
            title: "Profil non approuvé",
            message: `Votre demande d'approbation a été refusée. Raison : ${reason}. Veuillez corriger les éléments mentionnés et soumettre à nouveau votre demande.`,
            type: "rejection"
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
          await supabase.from("notifications").insert({
            user_id: userData.user_id,
            title: "Mission approuvée !",
            message: `Votre mission "${mission.title}" a été approuvée et est maintenant publiée.`,
            type: "mission_approved",
            related_id: missionId
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
          await supabase.from("notifications").insert({
            user_id: userData.user_id,
            title: "Mission refusée",
            message: `Votre mission "${mission.title}" a été refusée. Raison : ${reason}.`,
            type: "mission_rejected",
            related_id: missionId
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

  const getProfileCompleteness = (artisan: PendingArtisan) => {
    let score = 0;
    const total = 6;
    
    if (artisan.photo_url) score++;
    if (artisan.description && artisan.description.length > 50) score++;
    if (artisan.siret) score++;
    if (artisan.portfolio_images && artisan.portfolio_images.length >= 3) score++;
    if (artisan.experience_years && artisan.experience_years > 0) score++;
    if (artisan.city && artisan.city !== "Non renseigné") score++;

    return { score, total, percentage: Math.round((score / total) * 100) };
  };

  const handleSendActivation = async (prospect: PendingArtisan) => {
    setSendingActivationFor(prospect.id);
    try {
      await sendActivationEmailMutation.mutateAsync(prospect);
    } finally {
      setSendingActivationFor(null);
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-background pt-16 lg:pt-20">
        <AdminSidebar />
      
        <main className="flex-1 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Demandes d'approbation</h1>
            <p className="text-muted-foreground mt-1">
              Gérez les missions, artisans et prospects en attente
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-2xl grid-cols-3">
              <TabsTrigger value="missions" className="gap-2">
                <Briefcase className="w-4 h-4" />
                Missions ({pendingMissions.length})
              </TabsTrigger>
              <TabsTrigger value="artisans" className="gap-2">
                <User className="w-4 h-4" />
                Artisans ({pendingArtisans.length})
              </TabsTrigger>
              <TabsTrigger value="prospects" className="gap-2">
                <UserPlus className="w-4 h-4" />
                Prospects ({prospectArtisans.length})
              </TabsTrigger>
            </TabsList>

            {/* MISSIONS TAB */}
            <TabsContent value="missions">
              {isLoadingMissions ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : pendingMissions.length > 0 ? (
                <div className="grid gap-6">
                  {pendingMissions.map((mission) => (
                    <Card key={mission.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-6">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="text-xl font-bold">{mission.title}</h3>
                                <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                                  <MapPin className="h-4 w-4" />
                                  {mission.city}
                                  {mission.category && (
                                    <>
                                      <span>•</span>
                                      <Badge variant="secondary">{mission.category.name}</Badge>
                                    </>
                                  )}
                                  {mission.budget && (
                                    <>
                                      <span>•</span>
                                      <span className="flex items-center gap-1 text-gold font-medium">
                                        <Euro className="h-3 w-3" />
                                        {mission.budget} €
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <Badge variant="outline" className="gap-1">
                                <Clock className="h-3 w-3" />
                                En attente
                              </Badge>
                            </div>

                            {mission.description && (
                              <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                                {mission.description}
                              </p>
                            )}

                            <div className="text-sm text-muted-foreground mb-4">
                              <span className="font-medium">Client : </span>
                              {mission.client?.first_name} {mission.client?.last_name} ({mission.client?.email})
                            </div>

                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => setSelectedMission(mission)}>
                                <Eye className="h-4 w-4 mr-1" />
                                Voir détails
                              </Button>
                              <Button size="sm" onClick={() => approveMissionMutation.mutate(mission.id)} disabled={approveMissionMutation.isPending}>
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Approuver
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => { setSelectedMission(mission); setShowMissionRejectDialog(true); }}>
                                <XCircle className="h-4 w-4 mr-1" />
                                Refuser
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
                  <CardContent className="py-20 text-center">
                    <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Aucune mission en attente</h3>
                    <p className="text-muted-foreground">Toutes les missions ont été traitées.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ARTISANS TAB */}
            <TabsContent value="artisans">
              {isLoadingArtisans ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : pendingArtisans.length > 0 ? (
                <div className="grid gap-6">
                  {pendingArtisans.map((artisan) => {
                    const completeness = getProfileCompleteness(artisan);
                    return (
                      <Card key={artisan.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row gap-6">
                            <Avatar className="h-24 w-24 ring-4 ring-muted">
                              <AvatarImage src={artisan.photo_url || undefined} />
                              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                                {artisan.business_name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h3 className="text-xl font-bold">{artisan.business_name}</h3>
                                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                    <MapPin className="h-4 w-4" />
                                    {artisan.city}
                                    {artisan.category && (
                                      <>
                                        <span>•</span>
                                        <Badge variant="secondary">{artisan.category.name}</Badge>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <Badge variant="outline" className="gap-1">
                                  <Clock className="h-3 w-3" />
                                  En attente
                                </Badge>
                              </div>

                              {artisan.description && (
                                <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                                  {artisan.description}
                                </p>
                              )}

                              <div className="flex flex-wrap gap-2 mb-4">
                                <Badge variant={artisan.photo_url ? "default" : "secondary"} className="gap-1">
                                  {artisan.photo_url ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                                  Photo
                                </Badge>
                                <Badge variant={artisan.siret ? "default" : "secondary"} className="gap-1">
                                  {artisan.siret ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                                  SIRET
                                </Badge>
                                <Badge variant={artisan.portfolio_images && artisan.portfolio_images.length >= 3 ? "default" : "secondary"} className="gap-1">
                                  {artisan.portfolio_images && artisan.portfolio_images.length >= 3 ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                                  Portfolio ({artisan.portfolio_images?.length || 0}/3)
                                </Badge>
                              </div>

                              <div className="mb-4">
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-muted-foreground">Profil complété</span>
                                  <span className="font-medium">{completeness.percentage}%</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all ${
                                      completeness.percentage >= 80 ? 'bg-emerald-500' : 
                                      completeness.percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${completeness.percentage}%` }}
                                  />
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setSelectedArtisan(artisan)}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  Voir le profil
                                </Button>
                                <Button size="sm" onClick={() => approveArtisanMutation.mutate(artisan.id)} disabled={approveArtisanMutation.isPending}>
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Approuver
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => { setSelectedArtisan(artisan); setShowRejectDialog(true); }}>
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Refuser
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
                  <CardContent className="py-20 text-center">
                    <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Aucune demande en attente</h3>
                    <p className="text-muted-foreground">Toutes les demandes d'approbation ont été traitées.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* PROSPECTS TAB */}
            <TabsContent value="prospects">
              {isLoadingProspects ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : prospectArtisans.length > 0 ? (
                <div className="grid gap-6">
                  {prospectArtisans.map((prospect) => (
                    <Card key={prospect.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-amber-500">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-6">
                          <Avatar className="h-24 w-24 ring-4 ring-amber-500/20">
                            <AvatarImage src={prospect.photo_url || undefined} />
                            <AvatarFallback className="text-2xl bg-amber-500/20 text-amber-700">
                              {prospect.business_name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="text-xl font-bold">{prospect.business_name}</h3>
                                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                  <MapPin className="h-4 w-4" />
                                  {prospect.city}
                                  {prospect.category && (
                                    <>
                                      <span>•</span>
                                      <Badge variant="secondary">{prospect.category.name}</Badge>
                                    </>
                                  )}
                                </div>
                              </div>
                              <Badge className="gap-1 bg-amber-500/20 text-amber-700 border-amber-500/30">
                                <UserPlus className="h-3 w-3" />
                                Prospect
                              </Badge>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                              <Mail className="h-4 w-4" />
                              <span>{prospect.profile?.email || "Email non renseigné"}</span>
                            </div>

                            {prospect.description && (
                              <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                                {prospect.description}
                              </p>
                            )}

                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => setSelectedArtisan(prospect)}>
                                <Eye className="h-4 w-4 mr-1" />
                                Voir le profil
                              </Button>
                              <Button 
                                size="sm" 
                                variant="gold"
                                onClick={() => handleSendActivation(prospect)}
                                disabled={sendingActivationFor === prospect.id || !prospect.profile?.email}
                              >
                                {sendingActivationFor === prospect.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                    Envoi...
                                  </>
                                ) : (
                                  <>
                                    <Send className="h-4 w-4 mr-1" />
                                    Finaliser l'inscription
                                  </>
                                )}
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
                  <CardContent className="py-20 text-center">
                    <UserPlus className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Aucun prospect</h3>
                    <p className="text-muted-foreground mb-4">
                      Les artisans créés par l'admin apparaîtront ici.
                    </p>
                    <Button variant="outline" onClick={() => window.location.href = "/admin/ajouter-artisan"}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Ajouter un artisan
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
                placeholder="Raison du refus..."
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
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              {selectedArtisan && (
                <>
                  <DialogHeader>
                    <DialogTitle>Profil de {selectedArtisan.business_name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Email</p>
                        <p className="font-medium">{selectedArtisan.profile?.email || "Non renseigné"}</p>
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
                        <p className="text-muted-foreground text-sm mb-1">Description</p>
                        <p className="text-sm">{selectedArtisan.description}</p>
                      </div>
                    )}

                    {selectedArtisan.portfolio_images && selectedArtisan.portfolio_images.length > 0 && (
                      <div>
                        <p className="text-muted-foreground text-sm mb-2">Portfolio</p>
                        <div className="grid grid-cols-3 gap-2">
                          {selectedArtisan.portfolio_images.map((img, i) => (
                            <img key={i} src={img} alt={`Portfolio ${i + 1}`} className="aspect-square object-cover rounded-lg" />
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedArtisan.status === "prospect" ? (
                      <div className="flex gap-2 pt-4 border-t">
                        <Button 
                          className="flex-1" 
                          variant="gold"
                          onClick={() => handleSendActivation(selectedArtisan)}
                          disabled={sendingActivationFor === selectedArtisan.id || !selectedArtisan.profile?.email}
                        >
                          {sendingActivationFor === selectedArtisan.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Envoi en cours...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Finaliser l'inscription
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2 pt-4 border-t">
                        <Button className="flex-1" onClick={() => approveArtisanMutation.mutate(selectedArtisan.id)} disabled={approveArtisanMutation.isPending}>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Approuver
                        </Button>
                        <Button variant="destructive" className="flex-1" onClick={() => setShowRejectDialog(true)}>
                          <XCircle className="h-4 w-4 mr-2" />
                          Refuser
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>

          {/* View Mission Details Dialog */}
          <Dialog open={!!selectedMission && !showMissionRejectDialog} onOpenChange={() => setSelectedMission(null)}>
            <DialogContent className="max-w-2xl">
              {selectedMission && (
                <>
                  <DialogHeader>
                    <DialogTitle>{selectedMission.title}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Client</p>
                        <p className="font-medium">{selectedMission.client?.first_name} {selectedMission.client?.last_name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Email</p>
                        <p className="font-medium">{selectedMission.client?.email}</p>
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
                        <p className="text-muted-foreground text-sm mb-1">Description</p>
                        <p className="text-sm">{selectedMission.description}</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4 border-t">
                      <Button className="flex-1" onClick={() => approveMissionMutation.mutate(selectedMission.id)} disabled={approveMissionMutation.isPending}>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Approuver et Publier
                      </Button>
                      <Button variant="destructive" className="flex-1" onClick={() => setShowMissionRejectDialog(true)}>
                        <XCircle className="h-4 w-4 mr-2" />
                        Refuser
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </>
  );
};

export default AdminApprovals;
