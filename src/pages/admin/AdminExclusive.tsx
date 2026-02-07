import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Loader2,
  Eye,
  UserPlus,
  Shield,
} from "lucide-react";

const AdminExclusive = () => {
  const { user, role, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCandidacy, setSelectedCandidacy] = useState<any>(null);
  const [createDialog, setCreateDialog] = useState<any>(null);
  const [tempPassword, setTempPassword] = useState("Artisan2026!");
  const [isCreating, setIsCreating] = useState(false);

  // Only allow admin access
  if (!authLoading && (!user || role !== "admin")) {
    return <Navigate to="/auth" replace />;
  }

  const { data: candidacies = [], isLoading } = useQuery({
    queryKey: ["partner-candidacies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_candidacies")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: role === "admin",
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { error } = await supabase
        .from("partner_candidacies")
        .update({ status, admin_notes: notes })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-candidacies"] });
      toast({ title: "Statut mis à jour" });
    },
  });

  const handleCreateAccess = async (candidacy: any) => {
    setIsCreating(true);
    try {
      // Create artisan account via edge function
      const { data, error } = await supabase.functions.invoke("create-test-artisan", {
        body: {
          email: `artisan-${candidacy.id.slice(0, 8)}@artisansvalides.fr`,
          password: tempPassword,
          businessName: candidacy.business_name,
          city: candidacy.city,
          phone: candidacy.phone,
          siret: candidacy.siret,
          metier: candidacy.metier,
        },
      });

      if (error) throw error;

      // Mark candidacy as validated
      await supabase
        .from("partner_candidacies")
        .update({ status: "validated" })
        .eq("id", candidacy.id);

      queryClient.invalidateQueries({ queryKey: ["partner-candidacies"] });

      toast({
        title: "Compte artisan créé !",
        description: `Identifiants : artisan-${candidacy.id.slice(0, 8)}@artisansvalides.fr / ${tempPassword}`,
      });
      setCreateDialog(null);
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" />En attente</Badge>;
      case "validated":
        return <Badge className="bg-success text-white gap-1"><CheckCircle2 className="w-3 h-3" />Validé</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />Refusé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = candidacies.filter((c: any) => c.status === "pending").length;
  const validatedCount = candidacies.filter((c: any) => c.status === "validated").length;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 lg:pt-20 pb-20">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-navy flex items-center justify-center">
              <Shield className="w-6 h-6 text-gold" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Gestion des candidatures</h1>
              <p className="text-muted-foreground">Espace réservé au gestionnaire de la plateforme</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Users className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{candidacies.length}</p>
                  <p className="text-sm text-muted-foreground">Total candidatures</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                  <p className="text-sm text-muted-foreground">En attente</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{validatedCount}</p>
                  <p className="text-sm text-muted-foreground">Validés</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>Candidatures reçues</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : candidacies.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Aucune candidature pour le moment</p>
                  <p className="text-sm">Les demandes du formulaire "Devenir Partenaire" apparaîtront ici.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Entreprise</TableHead>
                        <TableHead>Métier</TableHead>
                        <TableHead>Ville</TableHead>
                        <TableHead>Téléphone</TableHead>
                        <TableHead>SIRET</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {candidacies.map((c: any) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.business_name}</TableCell>
                          <TableCell>{c.metier}</TableCell>
                          <TableCell>{c.city}</TableCell>
                          <TableCell>{c.phone}</TableCell>
                          <TableCell className="font-mono text-xs">{c.siret}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(c.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                          </TableCell>
                          <TableCell>{statusBadge(c.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedCandidacy(c)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {c.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="gold"
                                    onClick={() => setCreateDialog(c)}
                                  >
                                    <UserPlus className="w-4 h-4 mr-1" />
                                    Valider
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => updateStatus.mutate({ id: c.id, status: "rejected" })}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Detail Dialog */}
      <Dialog open={!!selectedCandidacy} onOpenChange={() => setSelectedCandidacy(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détail de la candidature</DialogTitle>
          </DialogHeader>
          {selectedCandidacy && (
            <div className="space-y-3">
              <div><Label className="text-muted-foreground">Entreprise</Label><p className="font-medium">{selectedCandidacy.business_name}</p></div>
              <div><Label className="text-muted-foreground">SIRET</Label><p className="font-mono">{selectedCandidacy.siret}</p></div>
              <div><Label className="text-muted-foreground">Métier</Label><p>{selectedCandidacy.metier}</p></div>
              <div><Label className="text-muted-foreground">Ville</Label><p>{selectedCandidacy.city}</p></div>
              <div><Label className="text-muted-foreground">Téléphone</Label><p>{selectedCandidacy.phone}</p></div>
              <div><Label className="text-muted-foreground">Assurance</Label><p>{selectedCandidacy.insurance_file_url ? "Fichier uploadé" : "Non fourni"}</p></div>
              <div><Label className="text-muted-foreground">Statut</Label><div className="mt-1">{statusBadge(selectedCandidacy.status)}</div></div>
              {selectedCandidacy.admin_notes && (
                <div><Label className="text-muted-foreground">Notes admin</Label><p className="text-sm">{selectedCandidacy.admin_notes}</p></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Access Dialog */}
      <Dialog open={!!createDialog} onOpenChange={() => setCreateDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer l'accès artisan</DialogTitle>
            <DialogDescription>
              Validez la candidature de {createDialog?.business_name} et créez son compte Pro.
            </DialogDescription>
          </DialogHeader>
          {createDialog && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <p className="text-sm"><strong>Entreprise :</strong> {createDialog.business_name}</p>
                <p className="text-sm"><strong>Métier :</strong> {createDialog.metier}</p>
                <p className="text-sm"><strong>Ville :</strong> {createDialog.city}</p>
              </div>
              <div>
                <Label>Mot de passe temporaire</Label>
                <Input value={tempPassword} onChange={e => setTempPassword(e.target.value)} className="mt-1.5" />
                <p className="text-xs text-muted-foreground mt-1">Ce mot de passe sera communiqué à l'artisan lors du rappel.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(null)}>Annuler</Button>
            <Button variant="gold" onClick={() => handleCreateAccess(createDialog)} disabled={isCreating}>
              {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Valider et Créer l'accès
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminExclusive;
