import { useState, useRef } from "react";
import { AdminSidebar } from "@/components/admin-dashboard/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Briefcase
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useCategories } from "@/hooks/useAdminData";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { supabase } from "@/integrations/supabase/client";

const cities = [
  "Paris", "Lyon", "Marseille", "Bordeaux", "Toulouse", 
  "Nantes", "Lille", "Strasbourg", "Nice", "Montpellier",
  "Rennes", "Grenoble", "Rouen", "Toulon", "Le Havre"
];

const regions: Record<string, { department: string; region: string }> = {
  "Paris": { department: "Paris", region: "Île-de-France" },
  "Lyon": { department: "Rhône", region: "Auvergne-Rhône-Alpes" },
  "Marseille": { department: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur" },
  "Bordeaux": { department: "Gironde", region: "Nouvelle-Aquitaine" },
  "Toulouse": { department: "Haute-Garonne", region: "Occitanie" },
  "Nantes": { department: "Loire-Atlantique", region: "Pays de la Loire" },
  "Lille": { department: "Nord", region: "Hauts-de-France" },
  "Strasbourg": { department: "Bas-Rhin", region: "Grand Est" },
  "Nice": { department: "Alpes-Maritimes", region: "Provence-Alpes-Côte d'Azur" },
  "Montpellier": { department: "Hérault", region: "Occitanie" },
  "Rennes": { department: "Ille-et-Vilaine", region: "Bretagne" },
  "Grenoble": { department: "Isère", region: "Auvergne-Rhône-Alpes" },
};

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
  duration: string;
}

const AdminAddArtisan = () => {
  const navigate = useNavigate();
  const { data: categories } = useCategories();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
  
  // Multi-category selection
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Photo and video management
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);
  
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
  const [newService, setNewService] = useState<ServiceItem>({ title: "", description: "", price: "", duration: "" });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) => 
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleAddPhotoUrl = () => {
    if (!newPhotoUrl) return;
    if (photoUrls.length >= 12) {
      toast({ title: "Limite atteinte", description: "Maximum 12 photos", variant: "destructive" });
      return;
    }
    setPhotoUrls((prev) => [...prev, newPhotoUrl]);
    setNewPhotoUrl("");
  };

  const handleAddVideoUrl = () => {
    if (!newVideoUrl) return;
    if (videoUrls.length >= 6) {
      toast({ title: "Limite atteinte", description: "Maximum 6 vidéos", variant: "destructive" });
      return;
    }
    setVideoUrls((prev) => [...prev, newVideoUrl]);
    setNewVideoUrl("");
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
    setNewService({ title: "", description: "", price: "", duration: "" });
  };

  const handleRemoveService = (index: number) => {
    setServices((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (file: File, type: "photo" | "video" | "profile") => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `admin-uploads/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('artisan-portfolios')
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: "Erreur", description: "Échec de l'upload", variant: "destructive" });
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('artisan-portfolios')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photoUrls.length >= 12) {
      toast({ title: "Limite atteinte", description: "Maximum 12 photos", variant: "destructive" });
      return;
    }
    const url = await handleFileUpload(file, "photo");
    if (url) setPhotoUrls((prev) => [...prev, url]);
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (videoUrls.length >= 6) {
      toast({ title: "Limite atteinte", description: "Maximum 6 vidéos", variant: "destructive" });
      return;
    }
    const url = await handleFileUpload(file, "video");
    if (url) setVideoUrls((prev) => [...prev, url]);
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const handleProfilePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await handleFileUpload(file, "profile");
    if (url) setProfilePhotoUrl(url);
    if (profilePhotoInputRef.current) profilePhotoInputRef.current.value = "";
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
    const cityInfo = regions[formData.city] || { department: "", region: "" };

    try {
      // Create artisan
      const { data: artisan, error: artisanError } = await supabase
        .from("artisans")
        .insert([{
          business_name: formData.businessName,
          description: formData.description || null,
          category_id: selectedCategories[0], // Primary category
          city: formData.city,
          department: cityInfo.department,
          region: cityInfo.region,
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

      // Add services
      if (services.length > 0 && artisan) {
        const servicesData = services.map((s) => ({
          artisan_id: artisan.id,
          title: s.title,
          description: s.description || null,
          price: parseFloat(s.price) || null,
          duration: s.duration || null,
        }));

        const { error: servicesError } = await supabase
          .from("artisan_services")
          .insert(servicesData);

        if (servicesError) {
          console.error("Error adding services:", servicesError);
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
                      />
                      <input
                        ref={profilePhotoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePhotoFileChange}
                        className="hidden"
                      />
                      <Button type="button" variant="outline" onClick={() => profilePhotoInputRef.current?.click()}>
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>
                    {profilePhotoUrl && (
                      <img src={profilePhotoUrl} alt="Preview" className="w-20 h-20 rounded-full object-cover mt-2" />
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
                    <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2 mt-1">
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

                  <div>
                    <Label>Ville *</Label>
                    <Select value={formData.city} onValueChange={(value) => handleChange("city", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une ville" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  <Input
                    placeholder="URL de l'image ou uploadez"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                  />
                  <Button type="button" variant="outline" onClick={handleAddPhotoUrl}>
                    <Plus className="h-4 w-4" />
                  </Button>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoFileChange}
                    className="hidden"
                  />
                  <Button type="button" variant="outline" onClick={() => photoInputRef.current?.click()}>
                    <Camera className="h-4 w-4" />
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
                <div className="flex gap-2">
                  <Input
                    placeholder="URL YouTube/Vimeo ou uploadez un fichier"
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                  />
                  <Button type="button" variant="outline" onClick={handleAddVideoUrl}>
                    <Plus className="h-4 w-4" />
                  </Button>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4,video/webm"
                    onChange={handleVideoFileChange}
                    className="hidden"
                  />
                  <Button type="button" variant="outline" onClick={() => videoInputRef.current?.click()}>
                    <Video className="h-4 w-4" />
                  </Button>
                </div>
                {videoUrls.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {videoUrls.map((url, index) => (
                      <div key={index} className="relative group p-2 border rounded-md">
                        <p className="text-xs truncate">{url}</p>
                        <button
                          type="button"
                          onClick={() => handleRemoveVideo(index)}
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

            {/* Services */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Prestations proposées
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
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
                  <Input
                    type="number"
                    placeholder="Prix (€) *"
                    value={newService.price}
                    onChange={(e) => setNewService((prev) => ({ ...prev, price: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="Durée"
                      value={newService.duration}
                      onChange={(e) => setNewService((prev) => ({ ...prev, duration: e.target.value }))}
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
                          {service.duration && <span className="text-sm text-muted-foreground">{service.duration}</span>}
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