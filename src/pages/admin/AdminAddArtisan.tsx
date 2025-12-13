import { useState, useRef, useMemo } from "react";
import { AdminSidebar } from "@/components/admin-dashboard/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  UserPlus,
  Save,
  Facebook,
  Instagram,
  Linkedin,
  Globe,
  Loader2,
  Clock,
  Camera,
  Video,
  X,
  Plus,
  Briefcase,
  MapPin,
  Link as LinkIcon,
  Upload,
  FileText
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useCategories } from "@/hooks/useAdminData";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { 
  cities as frenchCities, 
  departments as frenchDepartments, 
  regions as frenchRegions 
} from "@/data/frenchLocations";

const weekDays = [
  { key: "monday", label: "Lundi" },
  { key: "tuesday", label: "Mardi" },
  { key: "wednesday", label: "Mercredi" },
  { key: "thursday", label: "Jeudi" },
  { key: "friday", label: "Vendredi" },
  { key: "saturday", label: "Samedi" },
  { key: "sunday", label: "Dimanche" },
];

interface ServiceItem {
  title: string;
  description: string;
  price: string;
}

const AdminAddArtisan = () => {
  const navigate = useNavigate();
  const { data: categories } = useCategories();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  
  const [formData, setFormData] = useState({
    businessName: "",
    email: "",
    phone: "",
    city: "",
    address: "",
    description: "",
    siret: "",
    experienceYears: "",
    facebook: "",
    instagram: "",
    linkedin: "",
    website: "",
  });

  // City search
  const [citySearch, setCitySearch] = useState("");
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  
  // Multi-category selection
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Photo and video management
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  
  // Legal documents
  const [legalDocuments, setLegalDocuments] = useState<{ name: string; url: string }[]>([]);
  
  // Work schedule
  const [availability, setAvailability] = useState<Record<string, { enabled: boolean; start: string; end: string }>>({
    monday: { enabled: true, start: "08:00", end: "18:00" },
    tuesday: { enabled: true, start: "08:00", end: "18:00" },
    wednesday: { enabled: true, start: "08:00", end: "18:00" },
    thursday: { enabled: true, start: "08:00", end: "18:00" },
    friday: { enabled: true, start: "08:00", end: "18:00" },
    saturday: { enabled: false, start: "09:00", end: "12:00" },
    sunday: { enabled: false, start: "09:00", end: "12:00" },
  });
  
  // Services
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [newService, setNewService] = useState<ServiceItem>({ title: "", description: "", price: "" });

  // City suggestions - filtered from all French cities
  const citySuggestions = useMemo(() => {
    if (!citySearch || citySearch.length < 2) return [];
    
    const searchLower = citySearch.toLowerCase();
    const results: { name: string; department: string; departmentName: string; region: string }[] = [];
    
    // Search in cities
    frenchCities.forEach(city => {
      if (city.name.toLowerCase().includes(searchLower)) {
        const dept = frenchDepartments.find(d => d.code === city.department);
        const region = dept ? frenchRegions.find(r => r.id === dept.region) : null;
        results.push({
          name: city.name,
          department: city.department,
          departmentName: dept?.name || "",
          region: region?.name || ""
        });
      }
    });
    
    // Also search in department names
    frenchDepartments.forEach(dept => {
      if (dept.name.toLowerCase().includes(searchLower)) {
        const region = frenchRegions.find(r => r.id === dept.region);
        // Add the main city of the department if exists
        const deptCities = frenchCities.filter(c => c.department === dept.code);
        if (deptCities.length > 0) {
          deptCities.forEach(city => {
            if (!results.find(r => r.name === city.name && r.department === city.department)) {
              results.push({
                name: city.name,
                department: dept.code,
                departmentName: dept.name,
                region: region?.name || ""
              });
            }
          });
        }
      }
    });
    
    return results.slice(0, 15);
  }, [citySearch]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCitySelect = (cityData: { name: string; department: string; departmentName: string; region: string }) => {
    setFormData(prev => ({
      ...prev,
      city: cityData.name
    }));
    setCitySearch(`${cityData.name} (${cityData.department})`);
    setShowCitySuggestions(false);
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) => 
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleAddVideoUrl = () => {
    if (!newVideoUrl) return;
    if (videoUrls.length >= 6) {
      toast({ title: "Limite atteinte", description: "Maximum 6 vidéos", variant: "destructive" });
      return;
    }
    // Validate YouTube/Vimeo URL
    const isValidUrl = newVideoUrl.includes("youtube.com") || 
                       newVideoUrl.includes("youtu.be") || 
                       newVideoUrl.includes("vimeo.com") ||
                       newVideoUrl.startsWith("http");
    if (!isValidUrl) {
      toast({ title: "URL invalide", description: "Veuillez entrer une URL YouTube, Vimeo ou un lien valide", variant: "destructive" });
      return;
    }
    setVideoUrls((prev) => [...prev, newVideoUrl]);
    setNewVideoUrl("");
    toast({ title: "Vidéo ajoutée", description: "Le lien vidéo a été ajouté" });
  };

  const handleRemovePhoto = (index: number) => {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveVideo = (index: number) => {
    setVideoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAvailabilityChange = (day: string, field: "enabled" | "start" | "end", value: boolean | string) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleAddService = () => {
    if (!newService.title || !newService.price) {
      toast({ title: "Erreur", description: "Titre et prix requis", variant: "destructive" });
      return;
    }
    setServices((prev) => [...prev, newService]);
    setNewService({ title: "", description: "", price: "" });
    toast({ title: "Prestation ajoutée", description: `${newService.title} a été ajoutée` });
  };

  const handleRemoveService = (index: number) => {
    setServices((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (file: File, type: "photo" | "video" | "profile" | "document"): Promise<string | null> => {
    // Validate file type
    if (type === "photo" || type === "profile") {
      if (!file.type.startsWith("image/")) {
        toast({ title: "Erreur", description: "Veuillez sélectionner une image valide (JPG, PNG, etc.)", variant: "destructive" });
        return null;
      }
    }
    if (type === "video") {
      if (!file.type.startsWith("video/")) {
        toast({ title: "Erreur", description: "Veuillez sélectionner une vidéo valide (MP4, WebM, etc.)", variant: "destructive" });
        return null;
      }
    }
    if (type === "document") {
      if (file.type !== "application/pdf") {
        toast({ title: "Erreur", description: "Veuillez sélectionner un fichier PDF", variant: "destructive" });
        return null;
      }
    }

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ title: "Fichier trop volumineux", description: "La taille maximum est de 50 MB", variant: "destructive" });
      return null;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `admin-uploads/${type}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('artisan-portfolios')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast({ 
          title: "Erreur d'upload", 
          description: `${uploadError.message}. Vérifiez que vous êtes connecté en tant qu'admin.`, 
          variant: "destructive" 
        });
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('artisan-portfolios')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Upload exception:", error);
      toast({ 
        title: "Erreur", 
        description: "Une erreur inattendue s'est produite lors de l'upload", 
        variant: "destructive" 
      });
      return null;
    }
  };

  const handleDocumentFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingDocument(true);
    try {
      const url = await handleFileUpload(file, "document");
      if (url) {
        setLegalDocuments((prev) => [...prev, { name: file.name, url }]);
        toast({ title: "Document ajouté", description: "Le document a été uploadé avec succès" });
      }
    } finally {
      setIsUploadingDocument(false);
      if (documentInputRef.current) documentInputRef.current.value = "";
    }
  };

  const handleRemoveDocument = (index: number) => {
    setLegalDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photoUrls.length >= 12) {
      toast({ title: "Limite atteinte", description: "Maximum 12 photos", variant: "destructive" });
      return;
    }
    
    setIsUploadingPhoto(true);
    try {
      const url = await handleFileUpload(file, "photo");
      if (url) {
        setPhotoUrls((prev) => [...prev, url]);
        toast({ title: "Photo ajoutée", description: "La photo a été uploadée avec succès" });
      }
    } finally {
      setIsUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (videoUrls.length >= 6) {
      toast({ title: "Limite atteinte", description: "Maximum 6 vidéos", variant: "destructive" });
      return;
    }
    
    setIsUploadingVideo(true);
    try {
      const url = await handleFileUpload(file, "video");
      if (url) {
        setVideoUrls((prev) => [...prev, url]);
        toast({ title: "Vidéo ajoutée", description: "La vidéo a été uploadée avec succès" });
      }
    } finally {
      setIsUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  const handleProfilePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingProfile(true);
    try {
      const url = await handleFileUpload(file, "profile");
      if (url) {
        setProfilePhotoUrl(url);
        toast({ title: "Photo de profil ajoutée", description: "La photo de profil a été uploadée" });
      }
    } finally {
      setIsUploadingProfile(false);
      if (profilePhotoInputRef.current) profilePhotoInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.businessName || selectedCategories.length === 0 || !formData.city) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires (nom, catégorie, ville).",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Find department and region from city
    const selectedCity = frenchCities.find(c => c.name === formData.city);
    const selectedDept = selectedCity ? frenchDepartments.find(d => d.code === selectedCity.department) : null;
    const selectedRegion = selectedDept ? frenchRegions.find(r => r.id === selectedDept.region) : null;

    try {
      // Create artisan
      const { data: artisan, error: artisanError } = await supabase
        .from("artisans")
        .insert([{
          business_name: formData.businessName,
          email: formData.email || null,
          description: formData.description || null,
          category_id: selectedCategories[0], // Primary category
          city: formData.city,
          department: selectedDept?.name || null,
          region: selectedRegion?.name || null,
          siret: formData.siret || null,
          experience_years: formData.experienceYears ? parseInt(formData.experienceYears) : null,
          photo_url: profilePhotoUrl || null,
          portfolio_images: photoUrls.length > 0 ? photoUrls : null,
          portfolio_videos: videoUrls.length > 0 ? videoUrls : null,
          facebook_url: formData.facebook || null,
          instagram_url: formData.instagram || null,
          linkedin_url: formData.linkedin || null,
          website_url: formData.website || null,
          availability: availability,
          status: "active",
          is_verified: true,
        }])
        .select()
        .single();

      if (artisanError) throw artisanError;

      // Add multiple categories to junction table
      if (selectedCategories.length > 0 && artisan) {
        const categoriesData = selectedCategories.map((catId) => ({
          artisan_id: artisan.id,
          category_id: catId,
        }));

        const { error: categoriesError } = await supabase
          .from("artisan_categories")
          .insert(categoriesData);

        if (categoriesError) {
          console.error("Error adding categories:", categoriesError);
        }
      }

      // Add services
      if (services.length > 0 && artisan) {
        const servicesData = services.map((s) => ({
          artisan_id: artisan.id,
          title: s.title,
          description: s.description || null,
          price: parseFloat(s.price) || null,
        }));

        const { error: servicesError } = await supabase
          .from("artisan_services")
          .insert(servicesData);

        if (servicesError) {
          console.error("Error adding services:", servicesError);
        }
      }

      // Add legal documents to artisan_documents table
      if (legalDocuments.length > 0 && artisan) {
        const documentsData = legalDocuments.map((doc) => ({
          artisan_id: artisan.id,
          name: doc.name.replace(/\.[^/.]+$/, ""), // Name without extension
          file_name: doc.name,
          file_path: doc.url,
          status: 'verified', // Verified because added by admin
        }));

        const { error: documentsError } = await supabase
          .from("artisan_documents")
          .insert(documentsData);

        if (documentsError) {
          console.error("Error adding documents:", documentsError);
        }
      }

      toast({
        title: "Artisan ajouté",
        description: `${formData.businessName} a été ajouté à la plateforme avec succès.`,
      });

      navigate("/admin/artisans");
    } catch (error) {
      console.error("Error adding artisan:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout de l'artisan.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get all categories
  const allCategories = categories || [];
  
  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-background pt-16 lg:pt-20">
        <AdminSidebar />
      
        <main className="flex-1 p-8 overflow-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Ajouter un artisan</h1>
            <p className="text-muted-foreground mt-1">Créez un nouveau profil artisan complet sur la plateforme</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Informations de l'artisan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Nom de l'entreprise / Artisan *</Label>
                    <Input
                      placeholder="Ex: Jean Dupont Plomberie"
                      value={formData.businessName}
                      onChange={(e) => handleChange("businessName", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Téléphone</Label>
                    <Input
                      placeholder="06 12 34 56 78"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Photo de profil</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="URL de la photo ou uploadez un fichier"
                        value={profilePhotoUrl}
                        onChange={(e) => setProfilePhotoUrl(e.target.value)}
                        className="flex-1"
                      />
                      <input
                        ref={profilePhotoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePhotoFileChange}
                        className="hidden"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => profilePhotoInputRef.current?.click()}
                        disabled={isUploadingProfile}
                      >
                        {isUploadingProfile ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {profilePhotoUrl && (
                      <div className="relative w-20 h-20 mt-2">
                        <img src={profilePhotoUrl} alt="Preview" className="w-full h-full rounded-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setProfilePhotoUrl("")}
                          className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Professional Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations professionnelles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Catégories * (sélection multiple)</Label>
                    <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2 mt-1 bg-background">
                      {allCategories.map((cat) => (
                        <div key={cat.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={cat.id}
                            checked={selectedCategories.includes(cat.id)}
                            onCheckedChange={() => handleCategoryToggle(cat.id)}
                          />
                          <label htmlFor={cat.id} className="text-sm cursor-pointer">{cat.name}</label>
                        </div>
                      ))}
                    </div>
                    {selectedCategories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedCategories.map((id) => {
                          const cat = categories?.find((c) => c.id === id);
                          return cat ? (
                            <Badge key={id} variant="secondary" className="text-xs">
                              {cat.name}
                              <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => handleCategoryToggle(id)} />
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Ville *
                    </Label>
                    <Input
                      placeholder="Rechercher une ville française..."
                      value={citySearch}
                      onChange={(e) => {
                        setCitySearch(e.target.value);
                        setShowCitySuggestions(true);
                      }}
                      onFocus={() => setShowCitySuggestions(true)}
                    />
                    {showCitySuggestions && citySuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {citySuggestions.map((city, index) => (
                          <button
                            key={`${city.name}-${city.department}-${index}`}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-muted transition-colors border-b last:border-b-0"
                            onClick={() => handleCitySelect(city)}
                          >
                            <div className="font-medium">{city.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {city.departmentName} ({city.department}) - {city.region}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {formData.city && (
                      <Badge variant="outline" className="mt-2">
                        Ville sélectionnée: {formData.city}
                      </Badge>
                    )}
                  </div>

                  <div>
                    <Label>Adresse complète</Label>
                    <Input
                      placeholder="Adresse"
                      value={formData.address}
                      onChange={(e) => handleChange("address", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Années d'expérience</Label>
                    <Input
                      type="number"
                      placeholder="5"
                      value={formData.experienceYears}
                      onChange={(e) => handleChange("experienceYears", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Numéro SIRET</Label>
                    <Input
                      placeholder="123 456 789 00012"
                      value={formData.siret}
                      onChange={(e) => handleChange("siret", e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Décrivez l'artisan, son expérience, ses spécialités..."
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    className="min-h-[150px]"
                  />
                </CardContent>
              </Card>

              {/* Social Media */}
              <Card>
                <CardHeader>
                  <CardTitle>Réseaux sociaux</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="flex items-center gap-2">
                      <Facebook className="h-4 w-4 text-blue-600" />
                      Facebook
                    </Label>
                    <Input
                      placeholder="https://facebook.com/..."
                      value={formData.facebook}
                      onChange={(e) => handleChange("facebook", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Instagram className="h-4 w-4 text-pink-600" />
                      Instagram
                    </Label>
                    <Input
                      placeholder="https://instagram.com/..."
                      value={formData.instagram}
                      onChange={(e) => handleChange("instagram", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4 text-blue-700" />
                      LinkedIn
                    </Label>
                    <Input
                      placeholder="https://linkedin.com/in/..."
                      value={formData.linkedin}
                      onChange={(e) => handleChange("linkedin", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-600" />
                      Site web
                    </Label>
                    <Input
                      placeholder="https://..."
                      value={formData.website}
                      onChange={(e) => handleChange("website", e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Work Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Horaires de travail
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {weekDays.map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Checkbox
                        checked={availability[key]?.enabled}
                        onCheckedChange={(checked) => handleAvailabilityChange(key, "enabled", !!checked)}
                      />
                      <div className="flex-1">
                        <span className="font-medium text-sm">{label}</span>
                        {availability[key]?.enabled && (
                          <div className="flex items-center gap-1 mt-1">
                            <Input
                              type="time"
                              value={availability[key]?.start}
                              onChange={(e) => handleAvailabilityChange(key, "start", e.target.value)}
                              className="h-8 text-xs w-24"
                            />
                            <span className="text-xs text-muted-foreground">-</span>
                            <Input
                              type="time"
                              value={availability[key]?.end}
                              onChange={(e) => handleAvailabilityChange(key, "end", e.target.value)}
                              className="h-8 text-xs w-24"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Portfolio Photos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Photos du portfolio
                  <Badge variant="outline" className="ml-2">{photoUrls.length}/12</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoFileChange}
                    className="hidden"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => photoInputRef.current?.click()}
                    disabled={isUploadingPhoto || photoUrls.length >= 12}
                    className="gap-2"
                  >
                    {isUploadingPhoto ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {isUploadingPhoto ? "Upload en cours..." : "Uploader une photo"}
                  </Button>
                </div>
                {photoUrls.length > 0 && (
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {photoUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img src={url} alt={`Photo ${index + 1}`} className="w-full h-20 object-cover rounded-md" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Portfolio Videos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Vidéos du portfolio
                  <Badge variant="outline" className="ml-2">{videoUrls.length}/6</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Ajoutez des liens YouTube/Vimeo ou uploadez des fichiers vidéo (MP4, WebM)
                </p>
                
                {/* URL input */}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Lien YouTube ou Vimeo..."
                      value={newVideoUrl}
                      onChange={(e) => setNewVideoUrl(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleAddVideoUrl}
                    disabled={videoUrls.length >= 6}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* File upload */}
                <div className="flex gap-2">
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4,video/webm"
                    onChange={handleVideoFileChange}
                    className="hidden"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => videoInputRef.current?.click()}
                    disabled={isUploadingVideo || videoUrls.length >= 6}
                    className="gap-2"
                  >
                    {isUploadingVideo ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {isUploadingVideo ? "Upload en cours..." : "Uploader une vidéo"}
                  </Button>
                </div>
                
                {videoUrls.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {videoUrls.map((url, index) => (
                      <div key={index} className="relative group p-3 border rounded-md bg-muted/30 flex items-center gap-2">
                        <Video className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <p className="text-xs truncate flex-1">{url}</p>
                        <button
                          type="button"
                          onClick={() => handleRemoveVideo(index)}
                          className="bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Legal Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documents légaux
                  <Badge variant="outline" className="ml-2">{legalDocuments.length} document(s)</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Ajoutez les documents légaux de l'artisan : attestation d'assurance, Kbis, certificats, etc. (format PDF uniquement)
                </p>
                
                <div className="flex gap-2">
                  <input
                    ref={documentInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleDocumentFileChange}
                    className="hidden"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => documentInputRef.current?.click()}
                    disabled={isUploadingDocument}
                    className="gap-2"
                  >
                    {isUploadingDocument ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {isUploadingDocument ? "Upload en cours..." : "Ajouter un document PDF"}
                  </Button>
                </div>
                
                {legalDocuments.length > 0 && (
                  <div className="space-y-2">
                    {legalDocuments.map((doc, index) => (
                      <div key={index} className="relative group p-3 border rounded-md bg-muted/30 flex items-center gap-3">
                        <FileText className="h-5 w-5 text-red-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{doc.name}</p>
                          <a 
                            href={doc.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            Voir le document
                          </a>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDocument(index)}
                          className="bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Services */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Prestations proposées
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Input
                    placeholder="Titre de la prestation *"
                    value={newService.title}
                    onChange={(e) => setNewService((prev) => ({ ...prev, title: e.target.value }))}
                  />
                  <Input
                    placeholder="Description"
                    value={newService.description}
                    onChange={(e) => setNewService((prev) => ({ ...prev, description: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Prix (€) *"
                      value={newService.price}
                      onChange={(e) => setNewService((prev) => ({ ...prev, price: e.target.value }))}
                    />
                    <Button type="button" variant="outline" onClick={handleAddService}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {services.length > 0 && (
                  <div className="space-y-2">
                    {services.map((service, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
                        <div>
                          <span className="font-medium">{service.title}</span>
                          {service.description && <span className="text-muted-foreground ml-2">- {service.description}</span>}
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">{service.price}€</Badge>
                          <button type="button" onClick={() => handleRemoveService(index)}>
                            <X className="h-4 w-4 text-destructive" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" size="lg" className="gap-2" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Save className="h-5 w-5" />
                )}
                Créer le profil artisan
              </Button>
            </div>
          </form>
        </main>
      </div>
    </>
  );
};

export default AdminAddArtisan;
