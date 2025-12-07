import { useState } from "react";
import { AdminSidebar } from "@/components/admin-dashboard/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  UserPlus,
  Upload,
  Save,
  Facebook,
  Instagram,
  Linkedin,
  Globe,
  Loader2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useCategories, useAddArtisan } from "@/hooks/useAdminData";
import { useNavigate } from "react-router-dom";

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

const AdminAddArtisan = () => {
  const navigate = useNavigate();
  const { data: categories } = useCategories();
  const addArtisan = useAddArtisan();
  
  const [formData, setFormData] = useState({
    businessName: "",
    email: "",
    phone: "",
    category: "",
    city: "",
    address: "",
    description: "",
    hourlyRate: "",
    siret: "",
    facebook: "",
    instagram: "",
    linkedin: "",
    website: "",
  });
  const [photoUrl, setPhotoUrl] = useState("");

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.businessName || !formData.category || !formData.city) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    const cityInfo = regions[formData.city] || { department: "", region: "" };

    try {
      await addArtisan.mutateAsync({
        business_name: formData.businessName,
        description: formData.description || undefined,
        category_id: formData.category,
        city: formData.city,
        department: cityInfo.department,
        region: cityInfo.region,
        hourly_rate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
        siret: formData.siret || undefined,
        photo_url: photoUrl || undefined,
        facebook_url: formData.facebook || undefined,
        instagram_url: formData.instagram || undefined,
        linkedin_url: formData.linkedin || undefined,
        website_url: formData.website || undefined,
      });

      toast({
        title: "Artisan ajouté",
        description: `${formData.businessName} a été ajouté à la plateforme.`,
      });

      navigate("/admin/artisans");
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout de l'artisan.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Ajouter un artisan</h1>
          <p className="text-muted-foreground mt-1">Créez un nouveau profil artisan sur la plateforme</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-6">
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
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Nom de l'entreprise / Artisan *
                  </label>
                  <Input
                    placeholder="Ex: Jean Dupont Plomberie"
                    value={formData.businessName}
                    onChange={(e) => handleChange("businessName", e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Téléphone
                  </label>
                  <Input
                    placeholder="06 12 34 56 78"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    URL de la photo de profil
                  </label>
                  <Input
                    placeholder="https://..."
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                  />
                  {photoUrl && (
                    <img src={photoUrl} alt="Preview" className="w-20 h-20 rounded-full object-cover mt-2" />
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
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Catégorie *
                  </label>
                  <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Ville *
                  </label>
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
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Adresse complète
                  </label>
                  <Input
                    placeholder="Adresse"
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Tarif horaire (€/h)
                  </label>
                  <Input
                    type="number"
                    placeholder="50"
                    value={formData.hourlyRate}
                    onChange={(e) => handleChange("hourlyRate", e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Numéro SIRET
                  </label>
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
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Description
                  </label>
                  <Textarea
                    placeholder="Décrivez l'artisan, son expérience, ses spécialités..."
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    className="min-h-[200px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Social Media */}
            <Card>
              <CardHeader>
                <CardTitle>Réseaux sociaux</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <Facebook className="h-4 w-4 text-blue-600" />
                    Facebook
                  </label>
                  <Input
                    placeholder="https://facebook.com/..."
                    value={formData.facebook}
                    onChange={(e) => handleChange("facebook", e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <Instagram className="h-4 w-4 text-pink-600" />
                    Instagram
                  </label>
                  <Input
                    placeholder="https://instagram.com/..."
                    value={formData.instagram}
                    onChange={(e) => handleChange("instagram", e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <Linkedin className="h-4 w-4 text-blue-700" />
                    LinkedIn
                  </label>
                  <Input
                    placeholder="https://linkedin.com/in/..."
                    value={formData.linkedin}
                    onChange={(e) => handleChange("linkedin", e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-600" />
                    Site web
                  </label>
                  <Input
                    placeholder="https://..."
                    value={formData.website}
                    onChange={(e) => handleChange("website", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Submit Button */}
          <div className="mt-6 flex justify-end">
            <Button type="submit" size="lg" className="gap-2" disabled={addArtisan.isPending}>
              {addArtisan.isPending ? (
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
  );
};

export default AdminAddArtisan;
