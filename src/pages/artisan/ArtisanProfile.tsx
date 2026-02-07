import { useState, useRef, useEffect, useMemo } from "react";
import { ArtisanSidebar } from "@/components/artisan-dashboard/ArtisanSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FrenchPhoneInput, validateFrenchPhone } from "@/components/ui/french-phone-input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useArtisanPortfolio } from "@/hooks/useArtisanPortfolio";
import { useArtisanProfile, WorkingHours } from "@/hooks/useArtisanProfile";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cities } from "@/data/frenchLocations";
import { CityAutocompleteAPI } from "@/components/location/CityAutocompleteAPI";
import { CategorySelect } from "@/components/categories/CategorySelect";
import { CategoryMultiSelect } from "@/components/categories/CategoryMultiSelect";
import { useCategoriesHierarchy } from "@/hooks/useCategories";
import { Slider } from "@/components/ui/slider";
import { 
  User, 
  Camera, 
  MapPin, 
  Phone, 
  Mail, 
  Globe,
  BadgeCheck,
  Plus,
  X,
  Save,
  Facebook,
  Instagram,
  Linkedin,
  Video,
  Link as LinkIcon,
  Upload,
  Loader2,
  Clock
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";

export const ArtisanProfile = () => {
  const queryClient = useQueryClient();
  const {
    artisan,
    profile,
    isLoading: profileLoading,
    isSaving: profileSaving,
    updateProfile,
    updateProfilePhoto,
    updateWorkingHours,
  } = useArtisanProfile();

  const {
    photos,
    videos,
    isLoading: portfolioLoading,
    isSaving: portfolioSaving,
    addPhoto,
    addVideoUrl,
    addVideoFile,
    removePhoto,
    removeVideo,
    maxPhotos,
    maxVideos,
  } = useArtisanPortfolio();

  const { data: categoriesHierarchy = [] } = useCategoriesHierarchy();

  // Fetch artisan's current categories
  const { data: artisanCategories = [] } = useQuery({
    queryKey: ["artisan-categories", artisan?.id],
    queryFn: async () => {
      if (!artisan?.id) return [];
      const { data, error } = await supabase
        .from("artisan_categories")
        .select("category_id")
        .eq("artisan_id", artisan.id);
      if (error) throw error;
      return data.map(c => c.category_id);
    },
    enabled: !!artisan?.id
  });

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [interventionRadius, setInterventionRadius] = useState<number>(50);
  const [businessName, setBusinessName] = useState("");
  const [siret, setSiret] = useState("");
  const [siretError, setSiretError] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [googleBusinessUrl, setGoogleBusinessUrl] = useState("");
  const [primaryCategory, setPrimaryCategory] = useState<string>("");
  const [primaryCategoryName, setPrimaryCategoryName] = useState<string>("");
  const [secondaryCategories, setSecondaryCategories] = useState<string[]>([]);
  const [categoriesInitialized, setCategoriesInitialized] = useState(false);
  
  // Working hours state
  const defaultWorkingHours: WorkingHours = {
    lundi: { enabled: true, start: "08:00", end: "18:00" },
    mardi: { enabled: true, start: "08:00", end: "18:00" },
    mercredi: { enabled: true, start: "08:00", end: "18:00" },
    jeudi: { enabled: true, start: "08:00", end: "18:00" },
    vendredi: { enabled: true, start: "08:00", end: "18:00" },
    samedi: { enabled: false, start: "09:00", end: "12:00" },
    dimanche: { enabled: false, start: "09:00", end: "12:00" },
  };
  const [workingHours, setWorkingHours] = useState<WorkingHours>(defaultWorkingHours);
  
  // City suggestions state
  const [cityOpen, setCityOpen] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);

  // Filter cities based on search
  const filteredCities = useMemo(() => {
    if (!citySearch) return cities.slice(0, 50);
    const search = citySearch.toLowerCase();
    return cities
      .filter(c => c.name.toLowerCase().includes(search))
      .slice(0, 50);
  }, [citySearch]);

  // Populate form when data loads
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setEmail(profile.email || "");
      setPhone(profile.phone || "");
    }
    if (artisan) {
      setBusinessName(artisan.business_name || "");
      setDescription(artisan.description || "");
      setCity(artisan.city === "Non renseigné" ? "" : artisan.city || "");
      setSiret(artisan.siret || "");
      setExperienceYears(artisan.experience_years?.toString() || "");
      setWebsiteUrl(artisan.website_url || "");
      setFacebookUrl(artisan.facebook_url || "");
      setInstagramUrl(artisan.instagram_url || "");
      setLinkedinUrl(artisan.linkedin_url || "");
      setGoogleBusinessUrl((artisan as any).google_maps_url || "");
      // Load coordinates and intervention radius
      if (artisan.latitude && artisan.longitude) {
        setCoordinates({ lat: artisan.latitude, lng: artisan.longitude });
      }
      setInterventionRadius(artisan.intervention_radius ?? 50);
      // Load working hours from artisan data
      if (artisan.working_hours && typeof artisan.working_hours === 'object') {
        setWorkingHours(artisan.working_hours as WorkingHours);
      }
    }
  }, [profile, artisan]);

  // Populate categories from artisan data - only once at initial load
  useEffect(() => {
    if (!categoriesInitialized && artisan?.category_id) {
      setPrimaryCategory(artisan.category_id);
      setSecondaryCategories(
        artisanCategories.filter(id => id !== artisan.category_id)
      );
      setCategoriesInitialized(true);
    }
  }, [artisanCategories, artisan?.category_id, categoriesInitialized]);

  // Update primary category mutation (real-time save)
  const updatePrimaryCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      if (!artisan?.id) throw new Error("Artisan non trouvé");
      
      // Update category_id in artisans table
      const { error: updateError } = await supabase
        .from("artisans")
        .update({ category_id: categoryId })
        .eq("id", artisan.id);
      
      if (updateError) throw updateError;
      
      // Ensure this category is in artisan_categories
      // First delete all, then insert all (primary + secondaries)
      await supabase
        .from("artisan_categories")
        .delete()
        .eq("artisan_id", artisan.id);
      
      const allCategories = [categoryId, ...secondaryCategories.filter(id => id !== categoryId)];
      if (allCategories.length > 0) {
        const { error } = await supabase
          .from("artisan_categories")
          .insert(allCategories.map(catId => ({
            artisan_id: artisan.id,
            category_id: catId
          })));
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Catégorie principale enregistrée");
      queryClient.invalidateQueries({ queryKey: ["artisan-profile"] });
    },
    onError: (error) => {
      console.error("Erreur:", error);
      toast.error("Erreur lors de l'enregistrement");
    }
  });

  // Update secondary categories mutation (real-time save)
  const updateSecondaryCategoriesMutation = useMutation({
    mutationFn: async (categoryIds: string[]) => {
      if (!artisan?.id) throw new Error("Artisan non trouvé");
      
      // Combine primary + secondaries
      const allCategories = primaryCategory 
        ? [primaryCategory, ...categoryIds.filter(id => id !== primaryCategory)]
        : categoryIds;
      
      // Delete all existing categories
      await supabase
        .from("artisan_categories")
        .delete()
        .eq("artisan_id", artisan.id);
      
      // Insert all categories
      if (allCategories.length > 0) {
        const { error } = await supabase
          .from("artisan_categories")
          .insert(allCategories.map(catId => ({
            artisan_id: artisan.id,
            category_id: catId
          })));
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Compétences secondaires enregistrées");
    },
    onError: (error) => {
      console.error("Erreur:", error);
      toast.error("Erreur lors de l'enregistrement");
    }
  });

  // Handlers for real-time category saving
  const handlePrimaryCategoryChange = (id: string, name: string) => {
    setPrimaryCategory(id);
    setPrimaryCategoryName(name);
    // Remove from secondaries if present
    setSecondaryCategories(prev => prev.filter(catId => catId !== id));
    // Save immediately
    if (id) {
      updatePrimaryCategoryMutation.mutate(id);
    }
  };

  const handleSecondaryCategoriesChange = (ids: string[]) => {
    // Exclude primary category
    const filteredIds = ids.filter(id => id !== primaryCategory);
    setSecondaryCategories(filteredIds);
    // Save immediately
    updateSecondaryCategoriesMutation.mutate(filteredIds);
  };

  // Validate SIRET format (14 digits)
  const validateSiret = (value: string): boolean => {
    const cleanedSiret = value.replace(/\s/g, "");
    if (!cleanedSiret) return true; // Empty is allowed, validation happens on save
    if (!/^\d{14}$/.test(cleanedSiret)) {
      setSiretError("Le SIRET doit contenir exactement 14 chiffres");
      return false;
    }
    setSiretError("");
    return true;
  };

  const handleSiretChange = (value: string) => {
    setSiret(value);
    validateSiret(value);
  };

  const handleSave = async () => {
    // Validate SIRET before saving
    const cleanedSiret = siret.replace(/\s/g, "");
    if (!cleanedSiret) {
      toast.error("Le numéro SIRET est obligatoire");
      setSiretError("Le numéro SIRET est obligatoire");
      return;
    }
    if (!/^\d{14}$/.test(cleanedSiret)) {
      toast.error("Le SIRET doit contenir exactement 14 chiffres");
      setSiretError("Le SIRET doit contenir exactement 14 chiffres");
      return;
    }

    await updateProfile({
      firstName,
      lastName,
      phone,
      businessName,
      description,
      city: city || "Non renseigné",
      siret: cleanedSiret,
      experienceYears: experienceYears ? parseInt(experienceYears) : undefined,
      websiteUrl,
      facebookUrl,
      instagramUrl,
      linkedinUrl,
      latitude: coordinates?.lat ?? null,
      longitude: coordinates?.lng ?? null,
      interventionRadius,
    });

    // Save google_maps_url directly (not in useArtisanProfile)
    if (artisan?.id) {
      await supabase
        .from("artisans")
        .update({ google_maps_url: googleBusinessUrl || null })
        .eq("id", artisan.id);
    }
    // Categories are saved in real-time, no need to save here
  };

  const handleProfilePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await updateProfilePhoto(file);
    if (profilePhotoInputRef.current) {
      profilePhotoInputRef.current.value = "";
    }
  };

  const isValidVideoUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    const vimeoRegex = /^(https?:\/\/)?(www\.)?vimeo\.com\/.+/;
    return youtubeRegex.test(url) || vimeoRegex.test(url);
  };

  const handleAddVideoUrl = async () => {
    if (!newVideoUrl) {
      toast.error("Veuillez entrer une URL de vidéo");
      return;
    }
    if (!isValidVideoUrl(newVideoUrl)) {
      toast.error("Veuillez entrer une URL YouTube ou Vimeo valide");
      return;
    }
    await addVideoUrl(newVideoUrl);
    setNewVideoUrl("");
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await addPhoto(file);
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await addVideoFile(file);
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  const getVideoThumbnail = (url: string) => {
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/);
    if (youtubeMatch) {
      return `https://img.youtube.com/vi/${youtubeMatch[1]}/mqdefault.jpg`;
    }
    return null;
  };

  const isStorageUrl = (url: string) => {
    return url.includes("artisan-portfolios");
  };

  const handleWorkingHoursChange = (
    day: string, 
    field: "enabled" | "start" | "end", 
    value: boolean | string
  ) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleSaveWorkingHours = async () => {
    await updateWorkingHours(workingHours);
  };

  const isLoading = profileLoading || portfolioLoading;
  const isSaving = profileSaving || portfolioSaving || 
    updatePrimaryCategoryMutation.isPending || 
    updateSecondaryCategoriesMutation.isPending;

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-screen bg-background pt-28 lg:pt-20">
          <ArtisanSidebar />
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-background pt-28 lg:pt-20">
        <ArtisanSidebar />
        
        <div className="flex-1 flex flex-col">
        <DashboardHeader 
          title="Mon profil" 
          subtitle="Gérez vos informations professionnelles"
        />

        <main className="flex-1 p-3 md:p-6 pb-24 lg:pb-6 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
            {/* Profile Header - Mobile optimized */}
            <div className="bg-card rounded-xl border border-border shadow-soft p-4 sm:p-6">
              <div className="flex flex-col gap-4">
                {/* Photo + Infos - Stack vertical on mobile */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                  {/* Profile photo - Centered on mobile */}
                  <div className="relative mx-auto sm:mx-0 flex-shrink-0">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
                      {artisan?.photo_url ? (
                        <img 
                          src={artisan.photo_url} 
                          alt="Photo de profil" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground" />
                      )}
                    </div>
                    <input
                      ref={profilePhotoInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleProfilePhotoChange}
                      className="hidden"
                    />
                    <button 
                      onClick={() => profilePhotoInputRef.current?.click()}
                      disabled={isSaving}
                      className="absolute -bottom-2 -right-2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </button>
                  </div>
                  
                  {/* Infos - Centered on mobile */}
                  <div className="flex-1 text-center sm:text-left min-w-0">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                      <h2 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                        {artisan?.business_name || businessName || "Nouveau profil"}
                      </h2>
                      {artisan?.status === "active" && (
                        <Badge className="bg-success/20 text-success border-0 gap-1 text-xs">
                          <BadgeCheck className="w-3 h-3 sm:w-4 sm:h-4" /> Validé
                        </Badge>
                      )}
                      {artisan?.status === "pending" && (
                        <Badge className="bg-warning/20 text-warning border-0 text-xs">
                          En attente
                        </Badge>
                      )}
                    </div>
                    {(firstName || lastName) && (
                      <p className="text-sm text-muted-foreground mb-1">
                        Géré par {`${firstName} ${lastName}`.trim()}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {description || "Complétez votre profil pour être visible par les clients"}
                    </p>
                    <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
                      {city && city !== "Non renseigné" && (
                        <span className="flex items-center justify-center sm:justify-start gap-1 text-muted-foreground">
                          <MapPin className="w-3 h-3 sm:w-4 sm:h-4" /> {city}
                        </span>
                      )}
                      {phone && (
                        <span className="flex items-center justify-center sm:justify-start gap-1 text-muted-foreground">
                          <Phone className="w-3 h-3 sm:w-4 sm:h-4" /> {phone}
                        </span>
                      )}
                      {email && (
                        <span className="flex items-center justify-center sm:justify-start gap-1 text-muted-foreground truncate">
                          <Mail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" /> 
                          <span className="truncate">{email}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Save button - Full width on mobile */}
                <Button variant="gold" disabled={isSaving} onClick={handleSave} className="w-full sm:w-auto sm:self-end">
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Enregistrer
                </Button>
              </div>
            </div>

            {/* Categories Selection */}
            <div className="bg-card rounded-xl border border-border shadow-soft p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">Catégories de services</h3>
              
              {/* Primary Category */}
              <div className="mb-4 sm:mb-6">
                <Label className="text-sm sm:text-base font-medium">Catégorie principale *</Label>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                  Sélectionnez votre spécialité principale (obligatoire)
                </p>
                <CategorySelect
                  value={primaryCategory}
                  onValueChange={handlePrimaryCategoryChange}
                  placeholder="Sélectionner votre catégorie principale"
                  allowParentSelection={false}
                />
                {updatePrimaryCategoryMutation.isPending && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Enregistrement...
                  </p>
                )}
              </div>

              <div className="border-t border-border pt-4 sm:pt-6">
                {/* Secondary Skills */}
                <Label className="text-sm sm:text-base font-medium">Compétences secondaires</Label>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                  Ajoutez d'autres compétences pour être trouvé sur plus de recherches (optionnel)
                </p>
                <CategoryMultiSelect
                  selectedIds={secondaryCategories}
                  onChange={handleSecondaryCategoriesChange}
                  placeholder="Ajouter des compétences secondaires..."
                  maxDisplay={4}
                />
                {updateSecondaryCategoriesMutation.isPending && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Enregistrement...
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Les clients pourront vous trouver en recherchant ces compétences
                </p>
              </div>
            </div>

            {/* Personal Information */}
            <div className="bg-card rounded-xl border border-border shadow-soft p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">Informations personnelles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bio" className="text-sm">Le mot de l'artisan (320 caractères max)</Label>
                  <Textarea 
                    id="bio" 
                    rows={3}
                    value={description}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Check for URLs
                      const urlPattern = /(https?:\/\/|www\.|\.com|\.fr|\.net|\.org|\.io)/i;
                      if (urlPattern.test(value)) {
                        return; // Block URL input
                      }
                      if (value.length <= 320) {
                        setDescription(value);
                      }
                    }}
                    placeholder="Décrivez votre activité, vos spécialités, votre expérience... (pas de liens)"
                    className={`text-sm ${description.length > 300 ? "border-amber-500" : ""}`}
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      Les liens ne sont pas autorisés
                    </p>
                    <p className={`text-xs ${description.length > 300 ? "text-amber-500 font-medium" : "text-muted-foreground"}`}>
                      {description.length}/320
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm">Prénom</Label>
                  <Input 
                    id="firstName" 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Votre prénom"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm">Nom</Label>
                  <Input 
                    id="lastName" 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Votre nom"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email}
                    disabled
                    className="bg-muted text-sm"
                  />
                  <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm">Téléphone (format français)</Label>
                  <FrenchPhoneInput
                    id="phone" 
                    value={phone}
                    onChange={setPhone}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm">Ville</Label>
                  <CityAutocompleteAPI
                    value={city}
                    onChange={(value, coords) => {
                      setCity(value);
                      setCoordinates(coords ?? null);
                    }}
                    placeholder="Tapez pour rechercher une ville..."
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4" />
                    Rayon d'intervention : {interventionRadius} km
                  </Label>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <Slider
                      value={[interventionRadius]}
                      onValueChange={(value) => setInterventionRadius(value[0])}
                      min={0}
                      max={200}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-xs sm:text-sm font-medium w-14 sm:w-16 text-right">{interventionRadius} km</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    0 km = uniquement dans votre ville | 200 km = zone étendue
                  </p>
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="bg-card rounded-xl border border-border shadow-soft p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">Informations professionnelles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="businessName" className="text-sm">
                    Nom de l'entreprise <span className="text-destructive">*</span>
                  </Label>
                  <Input 
                    id="businessName" 
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Dupont Plomberie"
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground">Ce nom sera affiché sur votre fiche publique</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siret" className="text-sm">
                    Numéro SIRET <span className="text-destructive">*</span>
                  </Label>
                  <Input 
                    id="siret" 
                    value={siret}
                    onChange={(e) => handleSiretChange(e.target.value)}
                    placeholder="12345678900012"
                    className={`text-sm ${siretError ? "border-destructive" : ""}`}
                    maxLength={17}
                  />
                  {siretError ? (
                    <p className="text-xs text-destructive">{siretError}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">14 chiffres sans espaces</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience" className="text-sm">Années d'expérience</Label>
                  <Input 
                    id="experience" 
                    type="number" 
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    placeholder="5"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="companyWebsite" className="text-sm">Site web entreprise</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="companyWebsite" 
                      className="pl-10 text-sm" 
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://votre-site.fr"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-card rounded-xl border border-border shadow-soft p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">Réseaux sociaux (facultatif)</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4">Ces liens seront affichés sur votre profil public.</p>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="facebook" className="text-sm">Facebook</Label>
                  <div className="relative">
                    <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="facebook" 
                      className="pl-10 text-sm" 
                      placeholder="https://facebook.com/votre-page"
                      value={facebookUrl}
                      onChange={(e) => setFacebookUrl(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram" className="text-sm">Instagram</Label>
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="instagram" 
                      className="pl-10 text-sm" 
                      placeholder="https://instagram.com/votre-compte"
                      value={instagramUrl}
                      onChange={(e) => setInstagramUrl(e.target.value)}
                    />
                  </div>
                </div>
              <div className="space-y-2">
                  <Label htmlFor="linkedin" className="text-sm">LinkedIn</Label>
                  <div className="relative">
                    <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="linkedin" 
                      className="pl-10 text-sm" 
                      placeholder="https://linkedin.com/in/votre-profil"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="googleBusiness" className="text-sm">Google Business Profile</Label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    <Input 
                      id="googleBusiness" 
                      className="pl-10 text-sm" 
                      placeholder="https://g.page/votre-entreprise"
                      value={googleBusinessUrl}
                      onChange={(e) => setGoogleBusinessUrl(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Lien vers votre fiche Google Business pour afficher vos avis Google</p>
                </div>
              </div>
            </div>

            {/* Working Hours - Completely redesigned for mobile */}
            <div className="bg-card rounded-xl border border-border shadow-soft p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                  <h3 className="text-base sm:text-lg font-semibold text-foreground">Horaires de travail</h3>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSaveWorkingHours}
                  disabled={isSaving}
                  className="w-full sm:w-auto"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Enregistrer
                </Button>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                Définissez vos horaires d'ouverture pour chaque jour.
              </p>
              <div className="space-y-3">
                {[
                  { key: "lundi", label: "Lundi" },
                  { key: "mardi", label: "Mardi" },
                  { key: "mercredi", label: "Mercredi" },
                  { key: "jeudi", label: "Jeudi" },
                  { key: "vendredi", label: "Vendredi" },
                  { key: "samedi", label: "Samedi" },
                  { key: "dimanche", label: "Dimanche" },
                ].map(({ key, label }) => (
                  <div key={key} className="p-3 border border-border rounded-lg bg-muted/30">
                    {/* Row 1: Switch + Day name + Closed status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={workingHours[key]?.enabled ?? false}
                          onCheckedChange={(checked) => handleWorkingHoursChange(key, "enabled", checked)}
                        />
                        <span className="font-medium text-sm sm:text-base text-foreground">{label}</span>
                      </div>
                      {!workingHours[key]?.enabled && (
                        <span className="text-muted-foreground text-xs sm:text-sm">Fermé</span>
                      )}
                    </div>
                    
                    {/* Row 2: Time inputs (only if enabled) */}
                    {workingHours[key]?.enabled && (
                      <div className="flex items-center gap-2 mt-3 pl-0 sm:pl-10">
                        <Input
                          type="time"
                          value={workingHours[key]?.start || "08:00"}
                          onChange={(e) => handleWorkingHoursChange(key, "start", e.target.value)}
                          className="flex-1 sm:w-24 sm:flex-initial text-sm"
                        />
                        <span className="text-muted-foreground text-xs sm:text-sm">à</span>
                        <Input
                          type="time"
                          value={workingHours[key]?.end || "18:00"}
                          onChange={(e) => handleWorkingHoursChange(key, "end", e.target.value)}
                          className="flex-1 sm:w-24 sm:flex-initial text-sm"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Portfolio Photos */}
            <div className="bg-card rounded-xl border border-border shadow-soft p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-foreground">Portfolio photos</h3>
                <Badge variant="outline" className="text-xs">
                  {photos.length}/{maxPhotos}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {photos.map((photo, i) => (
                  <div key={i} className="aspect-square bg-muted rounded-lg overflow-hidden relative group">
                    <img 
                      src={photo} 
                      alt={`Photo ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button 
                      onClick={() => removePhoto(i)}
                      disabled={isSaving}
                      className="absolute top-1.5 right-1.5 w-7 h-7 sm:w-6 sm:h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {photos.length < maxPhotos && (
                  <>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                      disabled={isSaving}
                    />
                    <button 
                      onClick={() => photoInputRef.current?.click()}
                      disabled={isSaving}
                      className="aspect-square bg-muted/50 rounded-lg border-2 border-dashed border-border hover:border-accent hover:bg-accent/5 transition-all flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-accent disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 sm:w-8 sm:h-8" />
                          <span className="text-xs sm:text-sm">Ajouter</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Portfolio Videos */}
            <div className="bg-card rounded-xl border border-border shadow-soft p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base sm:text-lg font-semibold text-foreground">Mes vidéos</h3>
                <Badge variant="outline" className="text-xs">
                  {videos.length}/{maxVideos}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
                Ajoutez des liens YouTube/Vimeo ou téléchargez des vidéos MP4
              </p>
              
              {/* Add video options - Stack on mobile */}
              <div className="space-y-3 mb-4 sm:mb-6">
                {/* YouTube/Vimeo URL */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="https://youtube.com/... ou https://vimeo.com/..."
                      className="pl-10 text-sm"
                      value={newVideoUrl}
                      onChange={(e) => setNewVideoUrl(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAddVideoUrl()}
                      disabled={videos.length >= maxVideos || isSaving}
                    />
                  </div>
                  <Button 
                    onClick={handleAddVideoUrl} 
                    variant="outline" 
                    disabled={videos.length >= maxVideos || isSaving}
                    className="w-full sm:w-auto"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-1" /> Ajouter lien
                      </>
                    )}
                  </Button>
                </div>
                
                {/* MP4 Upload */}
                <div className="flex items-center gap-2">
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4"
                    onChange={handleVideoUpload}
                    className="hidden"
                    id="video-upload"
                    disabled={videos.length >= maxVideos || isSaving}
                  />
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={videos.length >= maxVideos || isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Télécharger une vidéo MP4
                  </Button>
                </div>
              </div>

              {/* Video grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                {videos.map((videoUrl, index) => {
                  const thumbnail = getVideoThumbnail(videoUrl);
                  const isStorage = isStorageUrl(videoUrl);
                  return (
                    <div key={index} className="aspect-video bg-muted rounded-lg overflow-hidden relative group">
                      {thumbnail ? (
                        <img 
                          src={thumbnail} 
                          alt={`Vidéo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : isStorage ? (
                        <video 
                          src={videoUrl} 
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Video className="w-8 h-8" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Video className="w-8 h-8 text-white" />
                      </div>
                      {isStorage && (
                        <Badge className="absolute bottom-2 left-2 text-xs bg-primary/80">
                          MP4
                        </Badge>
                      )}
                      <button 
                        onClick={() => removeVideo(index)}
                        disabled={isSaving}
                        className="absolute top-1.5 right-1.5 w-7 h-7 sm:w-6 sm:h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
                {videos.length === 0 && (
                  <div className="aspect-video bg-muted/50 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground sm:col-span-2 md:col-span-3">
                    <Video className="w-6 h-6 sm:w-8 sm:h-8" />
                    <span className="text-xs sm:text-sm">Aucune vidéo ajoutée</span>
                    <span className="text-xs">Lien YouTube/Vimeo ou fichier MP4</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
    </>
  );
};
