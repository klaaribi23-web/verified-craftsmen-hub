import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload, X, Plus, Sparkles } from "lucide-react";
import { CategorySelect } from "@/components/categories/CategorySelect";
import { CategoryMultiSelect } from "@/components/categories/CategoryMultiSelect";
import { CityAutocompleteAPI } from "@/components/location/CityAutocompleteAPI";

interface ArtisanData {
  id: string;
  business_name: string;
  email?: string | null;
  description?: string | null;
  category_id?: string | null;
  city: string;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  photo_url?: string | null;
  portfolio_images?: string[] | null;
  portfolio_videos?: string[] | null;
  experience_years?: number | null;
  is_verified?: boolean | null;
  phone?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  linkedin_url?: string | null;
  website_url?: string | null;
  google_maps_url?: string | null;
  working_hours?: Record<string, unknown> | null;
  // Support for nested profile email (used by some artisan types)
  profile?: {
    email?: string;
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
  } | null;
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
  const [primaryCategoryId, setPrimaryCategoryId] = useState<string | null>(null);
  const [secondaryCategoryIds, setSecondaryCategoryIds] = useState<string[]>([]);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [availability, setAvailability] = useState<Record<string, { start: string; end: string; enabled: boolean }>>({});
  const [cityCoordinates, setCityCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isGeneratingSEO, setIsGeneratingSEO] = useState(false);

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

  // Fetch artisan's current categories from junction table
  const { data: artisanCategoriesData = [] } = useQuery({
    queryKey: ["artisan-categories-admin", artisan?.id],
    queryFn: async () => {
      if (!artisan?.id) return [];
      const { data, error } = await supabase
        .from("artisan_categories")
        .select("category_id")
        .eq("artisan_id", artisan.id);
      if (error) throw error;
      return data.map(ac => ac.category_id);
    },
    enabled: !!artisan?.id && open,
  });

  // Load artisan's categories when data is fetched - only run once per artisan
  useEffect(() => {
    if (!open || !artisan?.id) return;
    
    // Catégorie principale = category_id de l'artisan OU première catégorie de artisan_categories si null
    const primaryId = artisan?.category_id || (artisanCategoriesData.length > 0 ? artisanCategoriesData[0] : null);
    setPrimaryCategoryId(primaryId);
    
    // Compétences secondaires = artisan_categories (exclure la principale)
    if (artisanCategoriesData && artisanCategoriesData.length > 0) {
      const secondaries = artisanCategoriesData.filter(id => id !== primaryId);
      setSecondaryCategoryIds(secondaries);
    } else {
      setSecondaryCategoryIds([]);
    }
  }, [open, artisan?.id, artisan?.category_id, JSON.stringify(artisanCategoriesData)]);

  useEffect(() => {
    if (artisan) {
      // Extract email from either direct field or nested profile
      const artisanEmail = artisan.email || artisan.profile?.email || null;
      
      setFormData({
        business_name: artisan.business_name,
        email: artisanEmail,
        description: artisan.description || null,
        category_id: artisan.category_id || null,
        city: artisan.city,
        postal_code: artisan.postal_code || null,
        latitude: artisan.latitude || null,
        longitude: artisan.longitude || null,
        photo_url: artisan.photo_url || null,
        portfolio_images: artisan.portfolio_images || [],
        portfolio_videos: artisan.portfolio_videos || [],
        experience_years: artisan.experience_years || null,
        is_verified: artisan.is_verified || null,
        phone: (artisan as any).phone || null,
        facebook_url: artisan.facebook_url || null,
        instagram_url: artisan.instagram_url || null,
        linkedin_url: artisan.linkedin_url || null,
        website_url: artisan.website_url || null,
        google_maps_url: (artisan as any).google_maps_url || null,
      });

      // Set initial coordinates if available
      if (artisan.latitude && artisan.longitude) {
        setCityCoordinates({ lat: artisan.latitude, lng: artisan.longitude });
      }

      // Parse working_hours
      const defaultAvailability: Record<string, { start: string; end: string; enabled: boolean }> = {};
      DAYS_FR.forEach(day => {
        const dayData = artisan.working_hours?.[day.key];
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
    mutationFn: async (data: Partial<ArtisanData> & { working_hours: Record<string, { start: string; end: string; enabled: boolean }>, primaryCategoryId: string | null, secondaryCategoryIds: string[], coordinates: { lat: number; lng: number } | null }) => {
      if (!artisan?.id) throw new Error("No artisan ID");
      
      // Update artisan main data with primary category
      const { error } = await supabase
        .from('artisans')
        .update({
          business_name: data.business_name,
          email: data.email,
          phone: data.phone,
          description: data.description,
          category_id: data.primaryCategoryId,
          city: data.city,
          postal_code: data.postal_code,
          latitude: data.coordinates?.lat || data.latitude || null,
          longitude: data.coordinates?.lng || data.longitude || null,
          photo_url: data.photo_url,
          portfolio_images: data.portfolio_images,
          portfolio_videos: data.portfolio_videos,
          experience_years: data.experience_years,
          is_verified: data.is_verified,
          is_rge: (data as any).is_rge || false,
          facebook_url: data.facebook_url,
          instagram_url: data.instagram_url,
          linkedin_url: data.linkedin_url,
          website_url: data.website_url,
          google_maps_url: data.google_maps_url,
          working_hours: JSON.parse(JSON.stringify(data.working_hours)),
        })
        .eq('id', artisan.id);

      if (error) throw error;

      // Update junction table: delete existing and insert all categories (primary + secondary)
      await supabase
        .from('artisan_categories')
        .delete()
        .eq('artisan_id', artisan.id);

      // Build list of all categories (primary first, then secondaries, no duplicates)
      const allCategoryIds = data.primaryCategoryId 
        ? [data.primaryCategoryId, ...data.secondaryCategoryIds.filter(id => id !== data.primaryCategoryId)]
        : data.secondaryCategoryIds;

      if (allCategoryIds.length > 0) {
        const { error: catError } = await supabase
          .from('artisan_categories')
          .insert(
            allCategoryIds.map(catId => ({
              artisan_id: artisan.id,
              category_id: catId
            }))
          );
        if (catError) throw catError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artisans'] });
      queryClient.invalidateQueries({ queryKey: ['admin-artisans'] });
      queryClient.invalidateQueries({ queryKey: ['public-artisans'] });
      queryClient.invalidateQueries({ queryKey: ['artisan-categories-admin'] });
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
      working_hours: availability,
      primaryCategoryId,
      secondaryCategoryIds,
      coordinates: cityCoordinates,
    });
  };

  const handleGenerateSEO = async () => {
    // Find category name from primaryCategoryId
    const catName = categories.find(c => c.id === primaryCategoryId)?.name;
    if (!formData.business_name || !catName || !formData.city) {
      toast.error("Remplissez le nom, la catégorie et la ville avant de générer.");
      return;
    }
    setIsGeneratingSEO(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-seo-description", {
        body: { businessName: formData.business_name, metier: catName, city: formData.city },
      });
      if (error) throw error;
      if (data?.description) {
        setFormData(prev => ({ ...prev, description: data.description }));
        toast.success("Description SEO générée ✨");
      }
    } catch (err: any) {
      console.error("SEO generation error:", err);
      toast.error(err.message || "Impossible de générer la description");
    } finally {
      setIsGeneratingSEO(false);
    }
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

  const handleCityChange = (value: string, coordinates?: { lat: number; lng: number } | null, postalCode?: string) => {
    setFormData(prev => ({ 
      ...prev, 
      city: value,
      postal_code: postalCode || prev.postal_code
    }));
    if (coordinates) {
      setCityCoordinates(coordinates);
    }
  };

  if (!artisan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
          <DialogTitle className="truncate text-lg">Modifier l'artisan</DialogTitle>
          <DialogDescription className="truncate text-sm">
            {artisan.business_name}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="flex-1 flex flex-col min-h-0">
          <div className="flex-shrink-0 px-6 pt-4">
            <TabsList className="w-full h-auto flex flex-wrap gap-1 p-1 bg-muted">
              <TabsTrigger value="general" className="flex-1 min-w-[65px] text-xs px-2 py-1.5">Général</TabsTrigger>
              <TabsTrigger value="category" className="flex-1 min-w-[65px] text-xs px-2 py-1.5">Catégorie</TabsTrigger>
              <TabsTrigger value="skills" className="flex-1 min-w-[65px] text-xs px-2 py-1.5">Compétences</TabsTrigger>
              <TabsTrigger value="photos" className="flex-1 min-w-[65px] text-xs px-2 py-1.5">Photos</TabsTrigger>
              <TabsTrigger value="videos" className="flex-1 min-w-[65px] text-xs px-2 py-1.5">Vidéos</TabsTrigger>
              <TabsTrigger value="horaires" className="flex-1 min-w-[65px] text-xs px-2 py-1.5">Horaires</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
            <TabsContent value="general" className="space-y-4 mt-0 data-[state=active]:block">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemple.fr"
                />
              </div>

              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="06 12 34 56 78"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Description</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateSEO}
                    disabled={isGeneratingSEO}
                    className="gap-2"
                  >
                    {isGeneratingSEO ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    {isGeneratingSEO ? "Génération..." : "SEO IA"}
                  </Button>
                </div>
                <Textarea
                  value={formData.description || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  maxLength={320}
                />
                <p className="text-xs text-muted-foreground">{(formData.description || "").length}/320 caractères</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ville *</Label>
                  <CityAutocompleteAPI
                    value={formData.city || ""}
                    onChange={handleCityChange}
                    placeholder="Rechercher une ville..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Code postal</Label>
                  <Input
                    value={formData.postal_code || ""}
                    readOnly
                    className="bg-muted"
                    placeholder="Rempli automatiquement"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
                <Switch
                  checked={formData.is_verified || false}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_verified: checked }))}
                />
                <Label>Artisan vérifié</Label>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
                <Switch
                  checked={(formData as any).is_rge || false}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_rge: checked }))}
                />
                <Label>Certifié RGE</Label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Lien Google Business
                </Label>
                <Input
                  value={formData.google_maps_url || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, google_maps_url: e.target.value }))}
                  placeholder="https://g.page/... ou https://maps.google.com/..."
                />
                <p className="text-xs text-muted-foreground">Lien vers la fiche Google Business Profile</p>
              </div>
            </TabsContent>

            <TabsContent value="category" className="space-y-4 mt-0">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Catégorie principale</Label>
                <p className="text-sm text-muted-foreground">
                  Sélectionnez la catégorie principale de l'artisan (obligatoire)
                </p>
                <CategorySelect
                  value={primaryCategoryId || ""}
                  onValueChange={(value) => setPrimaryCategoryId(value || null)}
                  placeholder="Sélectionnez une catégorie..."
                />
                {primaryCategoryId && (
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <p className="text-sm font-medium text-primary">
                      Catégorie principale : {categories.find(c => c.id === primaryCategoryId)?.name}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="skills" className="space-y-4 mt-0">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Compétences secondaires</Label>
                <p className="text-sm text-muted-foreground">
                  Sélectionnez les compétences additionnelles de l'artisan (optionnel)
                </p>
                <CategoryMultiSelect
                  selectedIds={secondaryCategoryIds}
                  onChange={setSecondaryCategoryIds}
                  placeholder="Sélectionnez des compétences..."
                />
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">
                  Compétences sélectionnées ({secondaryCategoryIds.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {secondaryCategoryIds.map(catId => {
                    const cat = categories.find(c => c.id === catId);
                    return cat ? (
                      <span key={catId} className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-sm">
                        {cat.name}
                      </span>
                    ) : null;
                  })}
                  {secondaryCategoryIds.length === 0 && (
                    <span className="text-muted-foreground text-sm">Aucune compétence secondaire</span>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="photos" className="space-y-4 mt-0">
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

            <TabsContent value="videos" className="space-y-4 mt-0">
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

            <TabsContent value="horaires" className="space-y-3 mt-0">
              <p className="text-sm text-muted-foreground">Définissez les heures de travail pour chaque jour</p>
              
              {DAYS_FR.map(day => (
                <div key={day.key} className="flex flex-wrap items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-lg bg-muted/50">
                  <div className="w-20 sm:w-28 flex-shrink-0">
                    <span className="font-medium text-sm">{day.label}</span>
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
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Input
                        type="time"
                        value={availability[day.key]?.start || "08:00"}
                        onChange={(e) => 
                          setAvailability(prev => ({
                            ...prev,
                            [day.key]: { ...prev[day.key], start: e.target.value }
                          }))
                        }
                        className="w-24 sm:w-28 text-sm"
                      />
                      <span className="text-sm">à</span>
                      <Input
                        type="time"
                        value={availability[day.key]?.end || "18:00"}
                        onChange={(e) => 
                          setAvailability(prev => ({
                            ...prev,
                            [day.key]: { ...prev[day.key], end: e.target.value }
                          }))
                        }
                        className="w-24 sm:w-28 text-sm"
                      />
                    </div>
                  )}
                  {!availability[day.key]?.enabled && (
                    <span className="text-muted-foreground text-sm">Fermé</span>
                  )}
                </div>
              ))}
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex-shrink-0 flex justify-end gap-2 px-6 py-4 border-t bg-background">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="px-4">
            Annuler
          </Button>
          <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending} className="px-4">
            {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Enregistrer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
