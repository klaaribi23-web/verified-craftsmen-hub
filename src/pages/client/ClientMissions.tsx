import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClientSidebar } from "@/components/client-dashboard/ClientSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Plus,
  Clock,
  MapPin,
  Calendar,
  MessageSquare,
  Eye,
  Users,
  Euro,
  AlertCircle,
  Edit,
  Loader2,
  ImageIcon
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import MissionPhotoUpload from "@/components/missions/MissionPhotoUpload";

type MissionStatus = "pending" | "pending_approval" | "published" | "rejected" | "assigned" | "completed" | "cancelled";

const getStatusBadge = (status: MissionStatus) => {
  switch (status) {
    case "pending_approval":
      return <Badge className="bg-amber-500/10 text-amber-600 border-0">En attente d'approbation</Badge>;
    case "published":
      return <Badge className="bg-success/10 text-success border-0">Publiée</Badge>;
    case "rejected":
      return <Badge className="bg-destructive/10 text-destructive border-0">Refusée</Badge>;
    case "assigned":
      return <Badge className="bg-blue-500/10 text-blue-600 border-0">En cours</Badge>;
    case "completed":
      return <Badge className="bg-success/10 text-success border-0">Terminée</Badge>;
    case "pending":
      return <Badge className="bg-amber-500/10 text-amber-600 border-0">En attente</Badge>;
    case "cancelled":
      return <Badge className="bg-muted text-muted-foreground border-0">Annulée</Badge>;
    default:
      return null;
  }
};

export const ClientMissions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [editingMission, setEditingMission] = useState<any>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", photos: [] as string[] });

  // Fetch client profile
  const { data: profile } = useQuery({
    queryKey: ["client-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch real missions from database
  const { data: missions = [], isLoading } = useQuery({
    queryKey: ["client-missions", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("missions")
        .select(`
          id,
          title,
          description,
          budget,
          status,
          city,
          photos,
          rejection_reason,
          created_at,
          categories:category_id (name),
          artisans:assigned_artisan_id (business_name, photo_url)
        `)
        .eq("client_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id
  });

  // Fetch application counts for each mission
  const { data: applicationCounts = {} } = useQuery({
    queryKey: ["mission-applications-counts", missions.map(m => m.id)],
    queryFn: async () => {
      if (missions.length === 0) return {};
      const { data, error } = await supabase
        .from("mission_applications")
        .select("mission_id")
        .in("mission_id", missions.map(m => m.id));

      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach((app: any) => {
        counts[app.mission_id] = (counts[app.mission_id] || 0) + 1;
      });
      return counts;
    },
    enabled: missions.length > 0
  });

  // Update mission mutation (for resubmission)
  const updateMissionMutation = useMutation({
    mutationFn: async ({ id, title, description, photos }: { id: string; title: string; description: string; photos: string[] }) => {
      const { error } = await supabase
        .from("missions")
        .update({ 
          title, 
          description, 
          photos: photos.length > 0 ? photos : null,
          status: "pending_approval",
          rejection_reason: null 
        })
        .eq("id", id);

      if (error) throw error;

      // Notify admin of resubmission
      const { data: adminUsers } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (adminUsers) {
        for (const admin of adminUsers) {
          await supabase.from("notifications").insert({
            user_id: admin.user_id,
            title: "MISSION modifiée et resoumise",
            message: `La mission "${title}" a été modifiée et resoumise pour approbation.`,
            type: "mission_resubmit",
            related_id: id
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-missions"] });
      toast.success("Mission resoumise pour approbation");
      setEditingMission(null);
    },
    onError: () => {
      toast.error("Erreur lors de la modification");
    }
  });

  const filteredMissions = activeTab === "all" 
    ? missions 
    : missions.filter((m: any) => {
        if (activeTab === "pending_approval") return m.status === "pending_approval";
        if (activeTab === "published") return m.status === "published";
        if (activeTab === "rejected") return m.status === "rejected";
        if (activeTab === "en_cours") return m.status === "assigned";
        if (activeTab === "terminee") return m.status === "completed";
        return true;
      });

  const openEditDialog = (mission: any) => {
    setEditForm({ 
      title: mission.title, 
      description: mission.description || "",
      photos: mission.photos || []
    });
    setEditingMission(mission);
  };

  const handleResubmit = () => {
    if (editingMission) {
      updateMissionMutation.mutate({
        id: editingMission.id,
        title: editForm.title,
        description: editForm.description,
        photos: editForm.photos
      });
    }
  };

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
                  <TabsList className="flex-wrap">
                    <TabsTrigger value="all">Toutes ({missions.length})</TabsTrigger>
                    <TabsTrigger value="pending_approval">
                      En approbation ({missions.filter((m: any) => m.status === "pending_approval").length})
                    </TabsTrigger>
                    <TabsTrigger value="published">
                      Publiées ({missions.filter((m: any) => m.status === "published").length})
                    </TabsTrigger>
                    <TabsTrigger value="rejected">
                      Refusées ({missions.filter((m: any) => m.status === "rejected").length})
                    </TabsTrigger>
                    <TabsTrigger value="en_cours">
                      En cours ({missions.filter((m: any) => m.status === "assigned").length})
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                
                <Link to="/demande-devis">
                  <Button variant="gold">
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvelle mission
                  </Button>
                </Link>
              </div>

              {/* Loading */}
              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}

              {/* Missions List */}
              {!isLoading && (
                <div className="space-y-4">
                  {filteredMissions.map((mission: any) => (
                    <Card key={mission.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">{mission.title}</h3>
                              {getStatusBadge(mission.status as MissionStatus)}
                            </div>
                            
                            {/* Rejection reason alert */}
                            {mission.status === "rejected" && mission.rejection_reason && (
                              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 mb-4">
                                <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-medium text-destructive text-sm">Raison du refus :</p>
                                  <p className="text-sm text-destructive/80">{mission.rejection_reason}</p>
                                </div>
                              </div>
                            )}
                            
                            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                              {mission.description}
                            </p>

                            {/* Mission photos preview */}
                            {mission.photos && mission.photos.length > 0 && (
                              <div className="flex gap-2 mb-4">
                                {mission.photos.slice(0, 3).map((photo: string, i: number) => (
                                  <img 
                                    key={i}
                                    src={photo}
                                    alt={`Photo ${i + 1}`}
                                    className="w-16 h-16 object-cover rounded-lg border"
                                  />
                                ))}
                                {mission.photos.length > 0 && (
                                  <span className="text-xs text-muted-foreground flex items-center">
                                    <ImageIcon className="w-3 h-3 mr-1" />
                                    {mission.photos.length} photo{mission.photos.length > 1 ? "s" : ""}
                                  </span>
                                )}
                              </div>
                            )}
                            
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              {mission.categories?.name && (
                                <Badge variant="secondary">{mission.categories.name}</Badge>
                              )}
                              {mission.budget && (
                                <span className="flex items-center gap-1 text-gold font-semibold">
                                  <Euro className="w-4 h-4" />
                                  {mission.budget} €
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {mission.city}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(mission.created_at).toLocaleDateString("fr-FR")}
                              </span>
                            </div>
                            
                            {/* Applicants info for published missions */}
                            {mission.status === "published" && applicationCounts[mission.id] > 0 && (
                              <div className="mt-4 pt-4 border-t">
                                <div className="flex items-center gap-2 text-sm">
                                  <Users className="w-4 h-4 text-gold" />
                                  <span className="font-medium text-foreground">
                                    {applicationCounts[mission.id]} artisan{applicationCounts[mission.id] > 1 ? "s ont" : " a"} postulé
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
                            {mission.artisans && (
                              <div className="flex items-center gap-3 mt-4 pt-4 border-t">
                                <img 
                                  src={mission.artisans.photo_url || "/placeholder.svg"} 
                                  alt={mission.artisans.business_name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                                <div>
                                  <p className="text-sm font-medium">Artisan sélectionné</p>
                                  <p className="text-sm text-muted-foreground">{mission.artisans.business_name}</p>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            {mission.status === "rejected" && (
                              <Button 
                                variant="gold" 
                                size="sm" 
                                onClick={() => openEditDialog(mission)}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Modifier et resoumettre
                              </Button>
                            )}
                            <Link to={`/client/missions/${mission.id}`}>
                              <Button variant="outline" size="sm" className="w-full">
                                <Eye className="w-4 h-4 mr-1" />
                                Détails
                              </Button>
                            </Link>
                            {mission.status !== "completed" && mission.status !== "cancelled" && (
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
                  
                  {filteredMissions.length === 0 && !isLoading && (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <p className="text-muted-foreground mb-4">Aucune mission dans cette catégorie</p>
                        <Link to="/demande-devis">
                          <Button variant="gold">
                            <Plus className="w-4 h-4 mr-2" />
                            Déposer une mission
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Edit & Resubmit Dialog */}
      <Dialog open={!!editingMission} onOpenChange={() => setEditingMission(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier et resoumettre la mission</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <Label htmlFor="edit-title">Titre</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={5}
              />
            </div>
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <ImageIcon className="w-4 h-4" />
                Photos (optionnel - max 3)
              </Label>
              <MissionPhotoUpload
                photos={editForm.photos}
                onPhotosChange={(photos) => setEditForm({ ...editForm, photos })}
                maxPhotos={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMission(null)}>
              Annuler
            </Button>
            <Button 
              variant="gold" 
              onClick={handleResubmit}
              disabled={updateMissionMutation.isPending || !editForm.title.trim()}
            >
              {updateMissionMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Resoumettre pour approbation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ChatWidget />
    </>
  );
};
