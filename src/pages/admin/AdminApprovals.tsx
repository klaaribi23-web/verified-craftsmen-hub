import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/admin-dashboard/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
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
  FileCheck,
  Image as ImageIcon,
  AlertCircle,
  Loader2
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
  category: { name: string } | null;
  profile: { 
    first_name: string | null; 
    last_name: string | null;
    email: string;
    phone: string | null;
  } | null;
}

const AdminApprovals = () => {
  const queryClient = useQueryClient();
  const [selectedArtisan, setSelectedArtisan] = useState<PendingArtisan | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Fetch pending artisans
  const { data: pendingArtisans, isLoading } = useQuery({
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
          category:categories(name),
          profile:profiles!artisans_profile_id_fkey(first_name, last_name, email, phone)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PendingArtisan[];
    }
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (artisanId: string) => {
      const { error } = await supabase
        .from("artisans")
        .update({ status: "active", is_verified: true })
        .eq("id", artisanId);

      if (error) throw error;

      // Send notification to artisan
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

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ artisanId, reason }: { artisanId: string; reason: string }) => {
      // Get artisan's user_id
      const artisan = pendingArtisans?.find(a => a.id === artisanId);
      if (artisan?.profile) {
        const { data: userData } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("email", artisan.profile.email)
          .single();

        if (userData) {
          // Send rejection notification with reason
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
      
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Demandes d'approbation</h1>
          <p className="text-muted-foreground mt-1">
            Vérifiez et approuvez les profils artisans
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : pendingArtisans && pendingArtisans.length > 0 ? (
          <div className="grid gap-6">
            {pendingArtisans.map((artisan) => {
              const completeness = getProfileCompleteness(artisan);
              return (
                <Card key={artisan.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Avatar */}
                      <Avatar className="h-24 w-24 ring-4 ring-muted">
                        <AvatarImage src={artisan.photo_url || undefined} />
                        <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                          {artisan.business_name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      {/* Info */}
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

                        {/* Completeness indicators */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge 
                            variant={artisan.photo_url ? "default" : "secondary"}
                            className="gap-1"
                          >
                            {artisan.photo_url ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                            Photo
                          </Badge>
                          <Badge 
                            variant={artisan.siret ? "default" : "secondary"}
                            className="gap-1"
                          >
                            {artisan.siret ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                            SIRET
                          </Badge>
                          <Badge 
                            variant={artisan.portfolio_images && artisan.portfolio_images.length >= 3 ? "default" : "secondary"}
                            className="gap-1"
                          >
                            {artisan.portfolio_images && artisan.portfolio_images.length >= 3 ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                            Portfolio ({artisan.portfolio_images?.length || 0}/3)
                          </Badge>
                          <Badge 
                            variant={artisan.description && artisan.description.length > 50 ? "default" : "secondary"}
                            className="gap-1"
                          >
                            {artisan.description && artisan.description.length > 50 ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                            Description
                          </Badge>
                        </div>

                        {/* Progress bar */}
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

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedArtisan(artisan)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Voir le profil
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => approveMutation.mutate(artisan.id)}
                            disabled={approveMutation.isPending}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Approuver
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedArtisan(artisan);
                              setShowRejectDialog(true);
                            }}
                          >
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
              <p className="text-muted-foreground">
                Toutes les demandes d'approbation ont été traitées.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Refuser la demande</DialogTitle>
              <DialogDescription>
                Expliquez à l'artisan pourquoi sa demande est refusée et ce qu'il doit corriger.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Raison du refus (ex: Photo de profil manquante, description trop courte, documents non valides...)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (selectedArtisan && rejectReason.trim()) {
                    rejectMutation.mutate({
                      artisanId: selectedArtisan.id,
                      reason: rejectReason
                    });
                  }
                }}
                disabled={!rejectReason.trim() || rejectMutation.isPending}
              >
                {rejectMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Envoyer le refus
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Profile Dialog */}
        <Dialog open={!!selectedArtisan && !showRejectDialog} onOpenChange={() => setSelectedArtisan(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedArtisan && (
              <>
                <DialogHeader>
                  <DialogTitle>Profil de {selectedArtisan.business_name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Contact Info */}
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

                  {/* Description */}
                  {selectedArtisan.description && (
                    <div>
                      <p className="text-muted-foreground text-sm mb-1">Description</p>
                      <p className="text-sm">{selectedArtisan.description}</p>
                    </div>
                  )}

                  {/* Portfolio */}
                  {selectedArtisan.portfolio_images && selectedArtisan.portfolio_images.length > 0 && (
                    <div>
                      <p className="text-muted-foreground text-sm mb-2">Portfolio</p>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedArtisan.portfolio_images.map((img, i) => (
                          <img
                            key={i}
                            src={img}
                            alt={`Portfolio ${i + 1}`}
                            className="aspect-square object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      className="flex-1"
                      onClick={() => approveMutation.mutate(selectedArtisan.id)}
                      disabled={approveMutation.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Approuver
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => setShowRejectDialog(true)}
                    >
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
