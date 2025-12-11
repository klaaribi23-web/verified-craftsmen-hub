import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload, X, Plus, Trash2, Save } from "lucide-react";

interface ArtisanData {
  id: string;
  business_name: string;
  description: string | null;
  category_id: string | null;
  city: string;
  region: string | null;
  department: string | null;
  postal_code: string | null;
  address: string | null;
  photo_url: string | null;
  portfolio_images: string[] | null;
  portfolio_videos: string[] | null;
  qualifications: string[] | null;
  experience_years: number | null;
  is_verified: boolean | null;
  facebook_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  availability: Record<string, unknown> | null;
}

interface Service {
  id: string;
  artisan_id: string;
  title: string;
  description: string | null;
  price: number | null;
  duration: string | null;
}

interface AdminEditArtisanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artisan: ArtisanData | null;
}

const DAYS_FR = [
  { key: "lundi", label: "Lundi" },
  { key: "mardi", label: "Mardi" },
  { key: "mercredi", label: "Mercredi" },
  { key: "jeudi", label: "Jeudi" },
  { key: "vendredi", label: "Vendredi" },
  { key: "samedi", label: "Samedi" },
  { key: "dimanche", label: "Dimanche" },
];

export const AdminEditArtisanDialog = ({ open, onOpenChange, artisan }: AdminEditArtisanDialogProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<ArtisanData> & { category_id?: string | null }>({});
  const [newQualification, setNewQualification] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [availability, setAvailability] = useState<Record<string, { start: string; end: string; enabled: boolean }>>({});
  const [services, setServices] = useState<Service[]>([]);
  const [newService, setNewService] = useState({ title: "", description: "", price: "", duration: "" });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, parent_id")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  // Fetch services for this artisan
  const { data: existingServices = [], refetch: refetchServices } = useQuery({
    queryKey: ["artisan-services-admin", artisan?.id],
    queryFn: async () => {
      if (!artisan?.id) return [];
      const { data, error } = await supabase
        .from("artisan_services")
        .select("*")
        .eq("artisan_id", artisan.id)
        .order("created_at");
      if (error) throw error;
      return data as Service[];
    },
    enabled: !!artisan?.id && open,
  });

  useEffect(() => {
    if (existingServices) {
      setServices(existingServices);
    }
  }, [existingServices]);

  useEffect(() => {
    if (artisan) {
      setFormData({
        business_name: artisan.business_name,
        description: artisan.description,
        category_id: artisan.category_id,
        city: artisan.city,
        region: artisan.region,
        department: artisan.department,
        postal_code: artisan.postal_code,
        address: artisan.address,
        photo_url: artisan.photo_url,
        portfolio_images: artisan.portfolio_images || [],
        portfolio_videos: artisan.portfolio_videos || [],
        qualifications: artisan.qualifications || [],
        experience_years: artisan.experience_years,
        is_verified: artisan.is_verified,
        facebook_url: artisan.facebook_url,
        instagram_url: artisan.instagram_url,
        linkedin_url: artisan.linkedin_url,
        website_url: artisan.website_url,
      });

      // Parse availability
      const defaultAvailability: Record<string, { start: string; end: string; enabled: boolean }> = {};
      DAYS_FR.forEach(day => {
        const dayData = artisan.availability?.[day.key];
        if (typeof dayData === 'string') {
          if (dayData === 'Fermé' || dayData === '') {
            defaultAvailability[day.key] = { start: '08:00', end: '18:00', enabled: false };
          } else {
            const parts = dayData.split(' - ');
            defaultAvailability[day.key] = { 
              start: parts[0]?.replace('h', ':00') || '08:00', 
              end: parts[1]?.replace('h', ':00') || '18:00', 
              enabled: true 
            };
          }
        } else if (dayData && typeof dayData === 'object') {
          const obj = dayData as { start?: string; end?: string; enabled?: boolean };
          defaultAvailability[day.key] = {
            start: obj.start || '08:00',
            end: obj.end || '18:00',
            enabled: obj.enabled !== false,
          };
        } else {
          defaultAvailability[day.key] = { start: '08:00', end: '18:00', enabled: day.key !== 'dimanche' };
        }
      });
      setAvailability(defaultAvailability);
    }
  }, [artisan]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<ArtisanData> & { availability: Record<string, { start: string; end: string; enabled: boolean }>, category_id?: string | null }) => {
      if (!artisan?.id) throw new Error("No artisan ID");
      
      const { error } = await supabase
        .from('artisans')
        .update({
          business_name: data.business_name,
          description: data.description,
          category_id: data.category_id,
          city: data.city,
          region: data.region,
          department: data.department,
          postal_code: data.postal_code,
          address: data.address,
          photo_url: data.photo_url,
          portfolio_images: data.portfolio_images,
          portfolio_videos: data.portfolio_videos,
          qualifications: data.qualifications,
          experience_years: data.experience_years,
          is_verified: data.is_verified,
          facebook_url: data.facebook_url,
          instagram_url: data.instagram_url,
          linkedin_url: data.linkedin_url,
          website_url: data.website_url,
          availability: JSON.parse(JSON.stringify(data.availability)),
        })
        .eq('id', artisan.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artisans'] });
      queryClient.invalidateQueries({ queryKey: ['admin-artisans'] });
      toast.success("Artisan mis à jour avec succès");
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast.error("Erreur lors de la mise à jour");
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      ...formData,
      availability,
    });
  };

  // Service mutations
  const addServiceMutation = useMutation({
    mutationFn: async (service: { title: string; description: string; price: number | null; duration: string }) => {
      if (!artisan?.id) throw new Error("No artisan ID");
      const { data, error } = await supabase
        .from("artisan_services")
        .insert({
          artisan_id: artisan.id,
          title: service.title,
          description: service.description || null,
          price: service.price,
          duration: service.duration || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      refetchServices();
      setNewService({ title: "", description: "", price: "", duration: "" });
      toast.success("Service ajouté");
    },
    onError: () => {
      toast.error("Erreur lors de l'ajout du service");
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: async (service: Service) => {
      const { error } = await supabase
        .from("artisan_services")
        .update({
          title: service.title,
          description: service.description,
          price: service.price,
          duration: service.duration,
        })
        .eq("id", service.id);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchServices();
      toast.success("Service mis à jour");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const { error } = await supabase
        .from("artisan_services")
        .delete()
        .eq("id", serviceId);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchServices();
      toast.success("Service supprimé");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });

  const handleAddService = () => {
    if (!newService.title.trim()) {
      toast.error("Le titre du service est requis");
      return;
    }
    addServiceMutation.mutate({
      title: newService.title,
      description: newService.description,
      price: newService.price ? parseFloat(newService.price) : null,
      duration: newService.duration,
    });
  };

  const handleUpdateService = (service: Service) => {
    updateServiceMutation.mutate(service);
  };

  const handleDeleteService = (serviceId: string) => {
    deleteServiceMutation.mutate(serviceId);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !artisan?.id) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${artisan.id}/photo.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('artisan-portfolios')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast.error("Erreur lors de l'upload");
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('artisan-portfolios')
      .getPublicUrl(fileName);

    setFormData(prev => ({ ...prev, photo_url: publicUrl }));
    toast.success("Photo mise à jour");
  };

  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !artisan?.id) return;

    const currentImages = formData.portfolio_images || [];
    if (currentImages.length + files.length > 12) {
      toast.error("Maximum 12 photos autorisées");
      return;
    }

    for (const file of Array.from(files)) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${artisan.id}/portfolio-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('artisan-portfolios')
        .upload(fileName, file);

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('artisan-portfolios')
          .getPublicUrl(fileName);

        setFormData(prev => ({
          ...prev,
          portfolio_images: [...(prev.portfolio_images || []), publicUrl],
        }));
      }
    }
    toast.success("Photos ajoutées");
  };

  const removePortfolioImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      portfolio_images: prev.portfolio_images?.filter((_, i) => i !== index) || [],
    }));
  };

  const addQualification = () => {
    if (newQualification.trim()) {
      setFormData(prev => ({
        ...prev,
        qualifications: [...(prev.qualifications || []), newQualification.trim()],
      }));
      setNewQualification("");
    }
  };

  const removeQualification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      qualifications: prev.qualifications?.filter((_, i) => i !== index) || [],
    }));
  };

  const addVideo = () => {
    if (newVideoUrl.trim()) {
      const currentVideos = formData.portfolio_videos || [];
      if (currentVideos.length >= 6) {
        toast.error("Maximum 6 vidéos autorisées");
        return;
      }
      setFormData(prev => ({
        ...prev,
        portfolio_videos: [...(prev.portfolio_videos || []), newVideoUrl.trim()],
      }));
      setNewVideoUrl("");
    }
  };

  const removeVideo = (index: number) => {
    setFormData(prev => ({
      ...prev,
      portfolio_videos: prev.portfolio_videos?.filter((_, i) => i !== index) || [],
    }));
  };

  // Group categories by parent
  const parentCategories = categories.filter(c => !c.parent_id);
  const getSubcategories = (parentId: string) => categories.filter(c => c.parent_id === parentId);

  if (!artisan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Modifier l'artisan</DialogTitle>
          <DialogDescription>
            Modifiez les informations de {artisan.business_name}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[70vh] pr-4">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="general">Général</TabsTrigger>
              <TabsTrigger value="category">Catégorie</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
              <TabsTrigger value="videos">Vidéos</TabsTrigger>
              <TabsTrigger value="horaires">Horaires</TabsTrigger>
              <TabsTrigger value="qualifications">Certifs</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              {/* Profile Photo */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={formData.photo_url || undefined} />
                  <AvatarFallback>{formData.business_name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <Label htmlFor="photo-upload" className="cursor-pointer">
                    <Button variant="outline" size="sm" asChild>
                      <span><Upload className="h-4 w-4 mr-2" />Changer la photo</span>
                    </Button>
                  </Label>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom de l'entreprise</Label>
                  <Input
                    value={formData.business_name || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Années d'expérience</Label>
                  <Input
                    type="number"
                    value={formData.experience_years || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, experience_years: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ville</Label>
                  <Input
                    value={formData.city || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Code postal</Label>
                  <Input
                    value={formData.postal_code || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Département</Label>
                  <Input
                    value={formData.department || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Région</Label>
                  <Input
                    value={formData.region || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Adresse complète</Label>
                <Input
                  value={formData.address || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>

              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
                <Switch
                  checked={formData.is_verified || false}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_verified: checked }))}
                />
                <Label>Artisan vérifié</Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Facebook URL</Label>
                  <Input
                    value={formData.facebook_url || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, facebook_url: e.target.value }))}
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Instagram URL</Label>
                  <Input
                    value={formData.instagram_url || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, instagram_url: e.target.value }))}
                    placeholder="https://instagram.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>LinkedIn URL</Label>
                  <Input
                    value={formData.linkedin_url || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                    placeholder="https://linkedin.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Site web</Label>
                  <Input
                    value={formData.website_url || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="category" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Catégorie principale</Label>
                <Select
                  value={formData.category_id || ""}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {parentCategories.map(parent => (
                      <div key={parent.id}>
                        <SelectItem value={parent.id} className="font-semibold">
                          {parent.name}
                        </SelectItem>
                        {getSubcategories(parent.id).map(sub => (
                          <SelectItem key={sub.id} value={sub.id} className="pl-6">
                            ↳ {sub.name}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Catégorie actuelle: {categories.find(c => c.id === formData.category_id)?.name || "Non définie"}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="services" className="space-y-4 mt-4">
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <Label className="text-base font-semibold">Ajouter un nouveau service</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    value={newService.title}
                    onChange={(e) => setNewService(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Titre du service *"
                  />
                  <Input
                    value={newService.price}
                    onChange={(e) => setNewService(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="Prix (€)"
                    type="number"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    value={newService.duration}
                    onChange={(e) => setNewService(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="Durée (ex: 2h, 1 jour)"
                  />
                  <Input
                    value={newService.description}
                    onChange={(e) => setNewService(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description"
                  />
                </div>
                <Button onClick={handleAddService} disabled={addServiceMutation.isPending}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter le service
                </Button>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Services existants ({services.length})</Label>
                {services.map((service, index) => (
                  <div key={service.id} className="p-4 border rounded-lg space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        value={service.title}
                        onChange={(e) => {
                          const updated = [...services];
                          updated[index] = { ...service, title: e.target.value };
                          setServices(updated);
                        }}
                        placeholder="Titre"
                      />
                      <Input
                        value={service.price || ""}
                        onChange={(e) => {
                          const updated = [...services];
                          updated[index] = { ...service, price: e.target.value ? parseFloat(e.target.value) : null };
                          setServices(updated);
                        }}
                        placeholder="Prix (€)"
                        type="number"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        value={service.duration || ""}
                        onChange={(e) => {
                          const updated = [...services];
                          updated[index] = { ...service, duration: e.target.value };
                          setServices(updated);
                        }}
                        placeholder="Durée"
                      />
                      <Input
                        value={service.description || ""}
                        onChange={(e) => {
                          const updated = [...services];
                          updated[index] = { ...service, description: e.target.value };
                          setServices(updated);
                        }}
                        placeholder="Description"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateService(service)}
                        disabled={updateServiceMutation.isPending}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Sauvegarder
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteService(service.id)}
                        disabled={deleteServiceMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ))}
                {services.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">Aucun service configuré</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="photos" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <Label>Portfolio photos ({formData.portfolio_images?.length || 0}/12)</Label>
                <Label htmlFor="portfolio-upload" className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild>
                    <span><Plus className="h-4 w-4 mr-2" />Ajouter des photos</span>
                  </Button>
                </Label>
                <input
                  id="portfolio-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePortfolioUpload}
                />
              </div>

              <div className="grid grid-cols-4 gap-3">
                {formData.portfolio_images?.map((img, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                    <img src={img} alt={`Portfolio ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removePortfolioImage(index)}
                      className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="videos" className="space-y-4 mt-4">
              <div className="flex gap-2">
                <Input
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  placeholder="URL YouTube ou Vimeo"
                  className="flex-1"
                />
                <Button onClick={addVideo} disabled={(formData.portfolio_videos?.length || 0) >= 6}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter ({formData.portfolio_videos?.length || 0}/6)
                </Button>
              </div>

              <div className="space-y-2">
                {formData.portfolio_videos?.map((video, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <span className="flex-1 truncate text-sm">{video}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeVideo(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="horaires" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">Définissez les heures de travail pour chaque jour</p>
              
              {DAYS_FR.map(day => (
                <div key={day.key} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="w-32">
                    <span className="font-medium">{day.label}</span>
                  </div>
                  <Switch
                    checked={availability[day.key]?.enabled || false}
                    onCheckedChange={(checked) => 
                      setAvailability(prev => ({
                        ...prev,
                        [day.key]: { ...prev[day.key], enabled: checked }
                      }))
                    }
                  />
                  {availability[day.key]?.enabled && (
                    <>
                      <Input
                        type="time"
                        value={availability[day.key]?.start || "08:00"}
                        onChange={(e) => 
                          setAvailability(prev => ({
                            ...prev,
                            [day.key]: { ...prev[day.key], start: e.target.value }
                          }))
                        }
                        className="w-32"
                      />
                      <span>à</span>
                      <Input
                        type="time"
                        value={availability[day.key]?.end || "18:00"}
                        onChange={(e) => 
                          setAvailability(prev => ({
                            ...prev,
                            [day.key]: { ...prev[day.key], end: e.target.value }
                          }))
                        }
                        className="w-32"
                      />
                    </>
                  )}
                  {!availability[day.key]?.enabled && (
                    <span className="text-muted-foreground">Fermé</span>
                  )}
                </div>
              ))}
            </TabsContent>

            <TabsContent value="qualifications" className="space-y-4 mt-4">
              <div className="flex gap-2">
                <Input
                  value={newQualification}
                  onChange={(e) => setNewQualification(e.target.value)}
                  placeholder="Nouvelle qualification ou certification"
                  onKeyPress={(e) => e.key === 'Enter' && addQualification()}
                />
                <Button onClick={addQualification}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>

              <div className="space-y-2">
                {formData.qualifications?.map((qual, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span>{qual}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeQualification(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Enregistrer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
