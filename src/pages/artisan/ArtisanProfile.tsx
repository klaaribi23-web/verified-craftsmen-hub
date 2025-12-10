import { useState, useRef, useEffect } from "react";
import { ArtisanSidebar } from "@/components/artisan-dashboard/ArtisanSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useArtisanPortfolio } from "@/hooks/useArtisanPortfolio";
import { useArtisanProfile } from "@/hooks/useArtisanProfile";
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
  Loader2
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";

export const ArtisanProfile = () => {
  const {
    artisan,
    profile,
    isLoading: profileLoading,
    isSaving: profileSaving,
    updateProfile,
    updateProfilePhoto,
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

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [siret, setSiret] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);

  // Populate form when data loads
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setEmail(profile.email || "");
      setPhone(profile.phone || "");
    }
    if (artisan) {
      setDescription(artisan.description || "");
      setAddress(artisan.address || "");
      setCity(artisan.city === "Non renseigné" ? "" : artisan.city || "");
      setSiret(artisan.siret || "");
      setExperienceYears(artisan.experience_years?.toString() || "");
      setWebsiteUrl(artisan.website_url || "");
      setFacebookUrl(artisan.facebook_url || "");
      setInstagramUrl(artisan.instagram_url || "");
      setLinkedinUrl(artisan.linkedin_url || "");
    }
  }, [profile, artisan]);

  const handleSave = async () => {
    const success = await updateProfile({
      firstName,
      lastName,
      phone,
      description,
      city: city || "Non renseigné",
      address,
      siret,
      experienceYears: experienceYears ? parseInt(experienceYears) : undefined,
      websiteUrl,
      facebookUrl,
      instagramUrl,
      linkedinUrl,
    });
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

  const isLoading = profileLoading || portfolioLoading;
  const isSaving = profileSaving || portfolioSaving;

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-screen bg-background pt-16 lg:pt-20">
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
      <div className="flex min-h-screen bg-background pt-16 lg:pt-20">
        <ArtisanSidebar />
        
        <div className="flex-1 flex flex-col">
        <DashboardHeader 
          title="Mon profil" 
          subtitle="Gérez vos informations professionnelles"
        />

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Profile Header */}
            <div className="bg-card rounded-xl border border-border shadow-soft p-6">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="relative">
                  <div className="w-32 h-32 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
                    {artisan?.photo_url ? (
                      <img 
                        src={artisan.photo_url} 
                        alt="Photo de profil" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-16 h-16 text-muted-foreground" />
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
                    className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-foreground">
                      {firstName || lastName ? `${firstName} ${lastName}`.trim() : "Nouveau profil"}
                    </h2>
                    {artisan?.status === "active" && (
                      <Badge className="bg-success/20 text-success border-0 gap-1">
                        <BadgeCheck className="w-4 h-4" /> Artisan Validé
                      </Badge>
                    )}
                    {artisan?.status === "pending" && (
                      <Badge className="bg-warning/20 text-warning border-0">
                        En attente de validation
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mb-4">
                    {description || "Complétez votre profil pour être visible par les clients"}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    {city && city !== "Non renseigné" && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="w-4 h-4" /> {city}
                      </span>
                    )}
                    {phone && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="w-4 h-4" /> {phone}
                      </span>
                    )}
                    {email && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Mail className="w-4 h-4" /> {email}
                      </span>
                    )}
                  </div>
                </div>
                <Button variant="gold" disabled={isSaving} onClick={handleSave}>
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Enregistrer
                </Button>
              </div>
            </div>

            {/* Personal Information */}
            <div className="bg-card rounded-xl border border-border shadow-soft p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6">Informations personnelles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bio">Description / Présentation</Label>
                  <Textarea 
                    id="bio" 
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Décrivez votre activité, vos spécialités, votre expérience..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input 
                    id="firstName" 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Votre prénom"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input 
                    id="lastName" 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Votre nom"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="06 12 34 56 78"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input 
                    id="city" 
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Paris"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse professionnelle</Label>
                  <Input 
                    id="address" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 rue de votre activité"
                  />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="bg-card rounded-xl border border-border shadow-soft p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6">Informations professionnelles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="siret">Numéro SIRET</Label>
                  <Input 
                    id="siret" 
                    value={siret}
                    onChange={(e) => setSiret(e.target.value)}
                    placeholder="123 456 789 00012"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience">Années d'expérience</Label>
                  <Input 
                    id="experience" 
                    type="number" 
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    placeholder="5"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="companyWebsite">Site web entreprise</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="companyWebsite" 
                      className="pl-10" 
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://votre-site.fr"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-card rounded-xl border border-border shadow-soft p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6">Réseaux sociaux (facultatif)</h3>
              <p className="text-sm text-muted-foreground mb-4">Ces liens seront affichés sur votre profil public pour permettre aux clients de vous suivre.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="facebook">Facebook</Label>
                  <div className="relative">
                    <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="facebook" 
                      className="pl-10" 
                      placeholder="https://facebook.com/votre-page"
                      value={facebookUrl}
                      onChange={(e) => setFacebookUrl(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="instagram" 
                      className="pl-10" 
                      placeholder="https://instagram.com/votre-compte"
                      value={instagramUrl}
                      onChange={(e) => setInstagramUrl(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <div className="relative">
                    <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="linkedin" 
                      className="pl-10" 
                      placeholder="https://linkedin.com/in/votre-profil"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Portfolio Photos */}
            <div className="bg-card rounded-xl border border-border shadow-soft p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">Portfolio / Réalisations (Photos)</h3>
                <Badge variant="outline" className="text-xs">
                  {photos.length}/{maxPhotos} photos
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
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
                        <Loader2 className="w-8 h-8 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8" />
                          <span className="text-sm">Ajouter</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Portfolio Videos */}
            <div className="bg-card rounded-xl border border-border shadow-soft p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-foreground">Mes vidéos</h3>
                <Badge variant="outline" className="text-xs">
                  {videos.length}/{maxVideos} vidéos
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Ajoutez des liens YouTube/Vimeo ou téléchargez des vidéos MP4
              </p>
              
              {/* Add video options */}
              <div className="space-y-3 mb-6">
                {/* YouTube/Vimeo URL */}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="https://www.youtube.com/watch?v=... ou https://vimeo.com/..."
                      className="pl-10"
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
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-1" /> Lien
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
                {videos.length === 0 && (
                  <div className="aspect-video bg-muted/50 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground md:col-span-3">
                    <Video className="w-8 h-8" />
                    <span className="text-sm">Aucune vidéo ajoutée</span>
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
