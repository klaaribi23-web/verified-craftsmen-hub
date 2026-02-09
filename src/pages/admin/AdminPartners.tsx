import { useState } from "react";
import { AdminSidebar } from "@/components/admin-dashboard/AdminSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, ExternalLink, Gift, GripVertical } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface PartnerOffer {
  id: string;
  name: string;
  description: string | null;
  discount_label: string;
  promo_code: string | null;
  logo_url: string | null;
  link_url: string | null;
  category: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

const EMPTY_FORM = {
  name: "",
  description: "",
  discount_label: "",
  promo_code: "",
  logo_url: "",
  link_url: "",
  category: "general",
  is_active: true,
  display_order: 100,
};

const AdminPartners = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: offers = [], isLoading } = useQuery({
    queryKey: ["admin-partner-offers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_offers")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as PartnerOffer[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: typeof EMPTY_FORM & { id?: string }) => {
      const payload = {
        name: values.name,
        description: values.description || null,
        discount_label: values.discount_label,
        promo_code: values.promo_code || null,
        logo_url: values.logo_url || null,
        link_url: values.link_url || null,
        category: values.category || "general",
        is_active: values.is_active,
        display_order: values.display_order,
      };

      if (values.id) {
        const { error } = await supabase.from("partner_offers").update(payload).eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("partner_offers").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-partner-offers"] });
      toast.success(editingId ? "Offre mise à jour" : "Offre créée");
      setDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("partner_offers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-partner-offers"] });
      toast.success("Offre supprimée");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("partner_offers").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-partner-offers"] }),
  });

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const openEdit = (offer: PartnerOffer) => {
    setEditingId(offer.id);
    setForm({
      name: offer.name,
      description: offer.description || "",
      discount_label: offer.discount_label,
      promo_code: offer.promo_code || "",
      logo_url: offer.logo_url || "",
      link_url: offer.link_url || "",
      category: offer.category || "general",
      is_active: offer.is_active,
      display_order: offer.display_order,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.discount_label) {
      toast.error("Nom et réduction sont obligatoires");
      return;
    }
    saveMutation.mutate(editingId ? { ...form, id: editingId } : form);
  };

  return (
    <>
      <SEOHead title="Gestion Partenaires" description="Gérez les offres partenaires" noIndex />
      <Navbar />
      <div className="flex min-h-screen bg-background pt-28 lg:pt-20">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader title="Gestion Partenaires" subtitle="Créez et gérez les offres partenaires pour les artisans" />

          <main className="flex-1 p-3 md:p-6 pb-24 lg:pb-6 overflow-auto">
            <div className="max-w-5xl mx-auto">
              {/* Add button */}
              <div className="flex justify-end mb-6">
                <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" /> Ajouter une offre
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>{editingId ? "Modifier l'offre" : "Nouvelle offre partenaire"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label>Nom du partenaire *</Label>
                        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Assurance Pro Décennale" />
                      </div>
                      <div>
                        <Label>Réduction / Avantage *</Label>
                        <Input value={form.discount_label} onChange={(e) => setForm({ ...form, discount_label: e.target.value })} placeholder="Ex: -15% sur votre décennale" />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description de l'offre..." rows={3} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Code promo</Label>
                          <Input value={form.promo_code} onChange={(e) => setForm({ ...form, promo_code: e.target.value })} placeholder="ARTISAN15" />
                        </div>
                        <div>
                          <Label>Catégorie</Label>
                          <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="assurance" />
                        </div>
                      </div>
                      <div>
                        <Label>URL du logo</Label>
                        <Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://..." />
                      </div>
                      <div>
                        <Label>Lien partenaire</Label>
                        <Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="https://..." />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Ordre d'affichage</Label>
                          <Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 100 })} />
                        </div>
                        <div className="flex items-center gap-3 pt-6">
                          <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                          <Label>Actif</Label>
                        </div>
                      </div>
                      <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                        {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        {editingId ? "Mettre à jour" : "Créer l'offre"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Offers list */}
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : offers.length === 0 ? (
                <Card className="p-12 text-center">
                  <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Aucune offre partenaire</h3>
                  <p className="text-muted-foreground">Cliquez sur "Ajouter une offre" pour commencer.</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {offers.map((offer) => (
                    <Card key={offer.id} className={`p-4 flex items-center gap-4 ${!offer.is_active ? "opacity-50" : ""}`}>
                      <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                      
                      {offer.logo_url ? (
                        <img src={offer.logo_url} alt={offer.name} className="w-12 h-12 rounded-lg object-contain bg-muted p-1 shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Gift className="w-6 h-6 text-primary" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-foreground truncate">{offer.name}</h4>
                          {!offer.is_active && <Badge variant="secondary">Inactif</Badge>}
                          {offer.category && <Badge variant="outline" className="text-[10px]">{offer.category}</Badge>}
                        </div>
                        <p className="text-sm font-medium text-primary">{offer.discount_label}</p>
                        {offer.description && <p className="text-xs text-muted-foreground truncate">{offer.description}</p>}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Switch
                          checked={offer.is_active}
                          onCheckedChange={(v) => toggleMutation.mutate({ id: offer.id, is_active: v })}
                        />
                        {offer.link_url && (
                          <Button variant="ghost" size="icon" asChild>
                            <a href={offer.link_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => openEdit(offer)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(offer.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default AdminPartners;
