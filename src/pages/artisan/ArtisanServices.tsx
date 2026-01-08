import { useState, useEffect } from "react";
import { ArtisanSidebar } from "@/components/artisan-dashboard/ArtisanSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Euro,
  Clock,
  GripVertical,
  CheckCircle,
  Loader2,
  Wrench,
  Lock,
  Crown,
  AlertCircle
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";

interface Service {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  duration: string | null;
  artisan_id: string;
}

const FREE_TIER_SERVICE_LIMIT = 3;

export const ArtisanServices = () => {
  const { user } = useAuth();
  const { tier } = useSubscription();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", price: 0, description: "", duration: "", surDevis: false });
  const [newService, setNewService] = useState({ title: "", price: "", description: "", duration: "", surDevis: false });

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

  // Fetch services
  const { data: services = [], isLoading } = useQuery({
    queryKey: ["artisan-services", artisan?.id],
    queryFn: async () => {
      if (!artisan?.id) return [];
      const { data, error } = await supabase
        .from("artisan_services")
        .select("*")
        .eq("artisan_id", artisan.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Service[];
    },
    enabled: !!artisan?.id
  });

  // Subscription limit logic (must be after services query)
  const isFreeTier = tier === "free";
  const hasReachedLimit = isFreeTier && services.length >= FREE_TIER_SERVICE_LIMIT;
  const remainingServices = Math.max(0, FREE_TIER_SERVICE_LIMIT - services.length);

  // Add service mutation
  const addServiceMutation = useMutation({
    mutationFn: async (service: Omit<Service, "id" | "artisan_id">) => {
      if (!artisan?.id) throw new Error("Artisan non trouvé");
      const { error } = await supabase
        .from("artisan_services")
        .insert({
          artisan_id: artisan.id,
          title: service.title,
          description: service.description || null,
          price: service.price || null,
          duration: service.duration || null
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artisan-services"] });
      toast.success("Prestation ajoutée");
      setIsAdding(false);
      setNewService({ title: "", price: "", description: "", duration: "", surDevis: false });
    },
    onError: () => {
      toast.error("Erreur lors de l'ajout");
    }
  });

  // Update service mutation
  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Service> & { id: string }) => {
      const { error } = await supabase
        .from("artisan_services")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artisan-services"] });
      toast.success("Prestation mise à jour");
      setEditingId(null);
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    }
  });

  // Delete service mutation
  const deleteServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("artisan_services")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artisan-services"] });
      toast.success("Prestation supprimée");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    }
  });

  const startEdit = (service: Service) => {
    setEditingId(service.id);
    setEditForm({
      title: service.title,
      price: service.price || 0,
      description: service.description || "",
      duration: service.duration || "",
      surDevis: service.price === null
    });
  };

  const saveEdit = () => {
    if (editingId) {
      updateServiceMutation.mutate({
        id: editingId,
        title: editForm.title,
        price: editForm.surDevis ? null : (editForm.price || null),
        description: editForm.description || null,
        duration: editForm.duration || null
      });
    }
  };

  const handleAddService = () => {
    if (!newService.title.trim()) {
      toast.error("Le nom de la prestation est requis");
      return;
    }
    addServiceMutation.mutate({
      title: newService.title,
      description: newService.description || null,
      price: newService.surDevis ? null : (newService.price ? parseFloat(newService.price) : null),
      duration: newService.duration || null
    });
  };

  const avgPrice = services.filter(s => s.price).length > 0
    ? Math.round(services.filter(s => s.price).reduce((acc, s) => acc + (s.price || 0), 0) / services.filter(s => s.price).length)
    : 0;

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-background pt-16 lg:pt-20">
        <ArtisanSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader 
          title="Mes prestations" 
          subtitle="Définissez les services que vous proposez et vos tarifs"
        />

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card rounded-xl border border-border shadow-soft p-4">
                <p className="text-sm text-muted-foreground">Services actifs</p>
                <p className="text-2xl font-bold text-foreground">{services.length}</p>
              </div>
              <div className="bg-card rounded-xl border border-border shadow-soft p-4">
                <p className="text-sm text-muted-foreground">Prix moyen</p>
                <p className="text-2xl font-bold text-foreground">{avgPrice}€</p>
              </div>
              <div className="bg-card rounded-xl border border-border shadow-soft p-4">
                <p className="text-sm text-muted-foreground">Services avec prix</p>
                <p className="text-2xl font-bold text-accent">{services.filter(s => s.price).length}</p>
              </div>
            </div>

            {/* Free Tier Limit Warning */}
            {isFreeTier && (
              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-500/10 rounded-lg">
                      <Lock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-foreground">Abonnement Gratuit</h4>
                        <Badge variant="outline" className="text-amber-600 border-amber-500/30">
                          PRO 🔒
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {hasReachedLimit ? (
                          <>Vous avez atteint la limite de {FREE_TIER_SERVICE_LIMIT} prestations. Passez à un abonnement supérieur pour en ajouter davantage.</>
                        ) : (
                          <>Il vous reste <span className="font-semibold text-foreground">{remainingServices}</span> prestation{remainingServices > 1 ? 's' : ''} disponible{remainingServices > 1 ? 's' : ''} sur {FREE_TIER_SERVICE_LIMIT}.</>
                        )}
                      </p>
                      {hasReachedLimit && (
                        <Link to="/artisan/abonnement">
                          <Button variant="gold" size="sm" className="mt-3">
                            <Crown className="w-4 h-4 mr-2" />
                            Mettre à niveau
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Add Service Button */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-foreground">Liste des prestations</h3>
              {hasReachedLimit ? (
                <Button variant="gold" disabled className="opacity-50 cursor-not-allowed">
                  <Lock className="w-4 h-4 mr-2" /> Limite atteinte
                </Button>
              ) : (
                <Button variant="gold" onClick={() => setIsAdding(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Ajouter une prestation
                </Button>
              )}
            </div>

            {/* Add Service Form */}
            {isAdding && (
              <div className="bg-card rounded-xl border border-accent/30 shadow-soft p-6 animate-fade-in">
                <h4 className="font-semibold text-foreground mb-4">Nouvelle prestation</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nom de la prestation *</Label>
                    <Input 
                      placeholder="Ex: Dépannage plomberie" 
                      value={newService.title}
                      onChange={(e) => setNewService({...newService, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Prix</Label>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Switch 
                          id="new-sur-devis"
                          checked={newService.surDevis}
                          onCheckedChange={(checked) => setNewService({...newService, surDevis: checked, price: checked ? "" : newService.price})}
                        />
                        <Label htmlFor="new-sur-devis" className="text-sm font-normal cursor-pointer">Sur Devis</Label>
                      </div>
                      {!newService.surDevis && (
                        <Input 
                          type="number" 
                          placeholder="60€" 
                          value={newService.price}
                          onChange={(e) => setNewService({...newService, price: e.target.value})}
                          className="flex-1"
                        />
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Durée estimée</Label>
                    <Input 
                      placeholder="Ex: 1-2h" 
                      value={newService.duration}
                      onChange={(e) => setNewService({...newService, duration: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Description</Label>
                    <Textarea 
                      placeholder="Décrivez votre prestation..." 
                      rows={3} 
                      value={newService.description}
                      onChange={(e) => setNewService({...newService, description: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setIsAdding(false)}>
                    Annuler
                  </Button>
                  <Button 
                    variant="gold" 
                    onClick={handleAddService}
                    disabled={addServiceMutation.isPending}
                  >
                    {addServiceMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Ajouter
                  </Button>
                </div>
              </div>
            )}

            {/* Services List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : services.length === 0 ? (
              <div className="bg-card rounded-xl border border-border shadow-soft p-12 text-center">
                <Wrench className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Aucune prestation</h3>
                <p className="text-muted-foreground mb-4">
                  Ajoutez vos prestations pour les afficher sur votre profil public
                </p>
                <Button variant="outline" onClick={() => setIsAdding(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Ajouter une prestation
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {services.map((service) => (
                  <div 
                    key={service.id}
                    className="bg-card rounded-xl border border-border shadow-soft p-6 transition-all hover:border-accent/30"
                  >
                    {editingId === service.id ? (
                      /* Edit Mode */
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Nom de la prestation</Label>
                            <Input 
                              value={editForm.title}
                              onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Prix</Label>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <Switch 
                                  id="edit-sur-devis"
                                  checked={editForm.surDevis}
                                  onCheckedChange={(checked) => setEditForm({...editForm, surDevis: checked, price: checked ? 0 : editForm.price})}
                                />
                                <Label htmlFor="edit-sur-devis" className="text-sm font-normal cursor-pointer">Sur Devis</Label>
                              </div>
                              {!editForm.surDevis && (
                                <Input 
                                  type="number"
                                  placeholder="60€"
                                  value={editForm.price}
                                  onChange={(e) => setEditForm({...editForm, price: Number(e.target.value)})}
                                  className="flex-1"
                                />
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Durée estimée</Label>
                            <Input 
                              value={editForm.duration}
                              onChange={(e) => setEditForm({...editForm, duration: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label>Description</Label>
                            <Textarea 
                              value={editForm.description}
                              onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                              rows={2}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setEditingId(null)}>
                            Annuler
                          </Button>
                          <Button 
                            variant="gold" 
                            onClick={saveEdit}
                            disabled={updateServiceMutation.isPending}
                          >
                            {updateServiceMutation.isPending ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4 mr-2" />
                            )}
                            Enregistrer
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* View Mode */
                      <div className="flex items-start gap-4">
                        <button className="mt-1 text-muted-foreground hover:text-foreground cursor-grab">
                          <GripVertical className="w-5 h-5" />
                        </button>
                        
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{service.title}</h4>
                          {service.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {service.description}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-4 mt-4">
                            <div className="flex items-center gap-1 text-sm">
                              <Euro className="w-4 h-4 text-accent" />
                              {service.price ? (
                                <span className="text-foreground">{service.price}€</span>
                              ) : (
                                <span className="text-muted-foreground">Sur devis</span>
                              )}
                            </div>
                            {service.duration && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span>{service.duration}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8" 
                            onClick={() => startEdit(service)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive" 
                            onClick={() => deleteServiceMutation.mutate(service.id)}
                            disabled={deleteServiceMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
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
