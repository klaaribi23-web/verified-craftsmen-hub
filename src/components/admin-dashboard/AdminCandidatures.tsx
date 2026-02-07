import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Phone, Briefcase, Clock, CheckCircle2, XCircle, Eye } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface Candidacy {
  id: string;
  business_name: string;
  phone: string;
  city: string;
  metier: string;
  siret: string;
  status: string;
  admin_notes: string | null;
  insurance_file_url: string | null;
  created_at: string;
  updated_at: string;
}

export const usePartnerCandidacies = () => {
  return useQuery({
    queryKey: ["partner-candidacies-pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_candidacies")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Candidacy[];
    },
  });
};

export const usePartnerCandidaciesCount = () => {
  return useQuery({
    queryKey: ["partner-candidacies-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("partner_candidacies")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      if (error) throw error;
      return count || 0;
    },
  });
};

export const AdminCandidatures = () => {
  const queryClient = useQueryClient();
  const { data: candidacies = [], isLoading } = usePartnerCandidacies();
  const [selectedCandidacy, setSelectedCandidacy] = useState<Candidacy | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { error } = await supabase
        .from("partner_candidacies")
        .update({ status, admin_notes: notes || null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-candidacies-pending"] });
      queryClient.invalidateQueries({ queryKey: ["partner-candidacies-count"] });
    },
  });

  const handleAccept = async (candidacy: Candidacy) => {
    await updateStatus.mutateAsync({ id: candidacy.id, status: "accepted", notes: adminNotes });
    toast.success(`Candidature de ${candidacy.business_name} acceptée`);
    setSelectedCandidacy(null);
    setAdminNotes("");
  };

  const handleReject = async (candidacy: Candidacy) => {
    await updateStatus.mutateAsync({ id: candidacy.id, status: "rejected", notes: adminNotes });
    toast.success(`Candidature de ${candidacy.business_name} refusée`);
    setSelectedCandidacy(null);
    setAdminNotes("");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (candidacies.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune candidature en attente</h3>
          <p className="text-muted-foreground text-sm">
            Toutes les candidatures ont été traitées.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4">
        {candidacies.map((candidacy) => (
          <Card key={candidacy.id} className="border-l-4 border-l-gold hover:shadow-md transition-shadow">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-base md:text-lg">{candidacy.business_name}</h3>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      <Clock className="h-3 w-3 mr-1" />
                      En attente
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" />
                      {candidacy.metier}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {candidacy.city}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {candidacy.phone}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Reçue le {formatDate(candidacy.created_at)}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedCandidacy(candidacy);
                      setAdminNotes(candidacy.admin_notes || "");
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Détails
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleAccept(candidacy)}
                    disabled={updateStatus.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Accepter
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleReject(candidacy)}
                    disabled={updateStatus.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Refuser
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedCandidacy} onOpenChange={(open) => !open && setSelectedCandidacy(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Candidature de {selectedCandidacy?.business_name}</DialogTitle>
            <DialogDescription>Détails de la candidature artisan</DialogDescription>
          </DialogHeader>
          {selectedCandidacy && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Métier</p>
                  <p className="font-medium">{selectedCandidacy.metier}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ville</p>
                  <p className="font-medium">{selectedCandidacy.city}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Téléphone</p>
                  <p className="font-medium">{selectedCandidacy.phone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">{formatDate(selectedCandidacy.created_at)}</p>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground text-sm mb-1">Notes admin</p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Ajouter des notes..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={() => selectedCandidacy && handleReject(selectedCandidacy)}
              disabled={updateStatus.isPending}
            >
              Refuser
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => selectedCandidacy && handleAccept(selectedCandidacy)}
              disabled={updateStatus.isPending}
            >
              Accepter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
