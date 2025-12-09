import { useState, useRef } from "react";
import { ArtisanSidebar } from "@/components/artisan-dashboard/ArtisanSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
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
  Upload
} from "lucide-react";

const MAX_PHOTOS = 12;
const MAX_VIDEOS = 6;

export const ArtisanProfile = () => {
  const [zones, setZones] = useState(["Paris 11e", "Paris 12e", "Paris 20e"]);
  const [newZone, setNewZone] = useState("");
  const [socialLinks, setSocialLinks] = useState({
    facebook: "",
    instagram: "",
    linkedin: "",
    website: ""
  });
  const [videos, setVideos] = useState<string[]>([]);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [photos, setPhotos] = useState<string[]>(["Photo 1", "Photo 2", "Photo 3"]);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const addZone = () => {
    if (newZone && !zones.includes(newZone)) {
      setZones([...zones, newZone]);
      setNewZone("");
    }
  };

  const removeZone = (zone: string) => {
    setZones(zones.filter(z => z !== zone));
  };

  const isValidVideoUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    const vimeoRegex = /^(https?:\/\/)?(www\.)?vimeo\.com\/.+/;
    return youtubeRegex.test(url) || vimeoRegex.test(url);
  };

  const addVideoUrl = () => {
    if (!newVideoUrl) {
      toast.error("Veuillez entrer une URL de vidéo");
      return;
    }
    if (!isValidVideoUrl(newVideoUrl)) {
      toast.error("Veuillez entrer une URL YouTube ou Vimeo valide");
      return;
    }
    if (videos.length >= MAX_VIDEOS) {
      toast.error(`Vous ne pouvez pas ajouter plus de ${MAX_VIDEOS} vidéos`);
      return;
    }
    if (videos.includes(newVideoUrl)) {
      toast.error("Cette vidéo existe déjà");
      return;
    }
    setVideos([...videos, newVideoUrl]);
    setNewVideoUrl("");
    toast.success("Vidéo ajoutée");
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.includes('video/mp4')) {
      toast.error("Seuls les fichiers MP4 sont acceptés");
      return;
    }
    
    if (videos.length >= MAX_VIDEOS) {
      toast.error(`Vous ne pouvez pas ajouter plus de ${MAX_VIDEOS} vidéos`);
      return;
    }
    
    // For now, create a local URL (in production, this would upload to storage)
    const videoUrl = URL.createObjectURL(file);
    setVideos([...videos, videoUrl]);
    toast.success("Vidéo téléchargée");
    
    // Reset input
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  const removeVideo = (videoUrl: string) => {
    setVideos(videos.filter(v => v !== videoUrl));
    toast.success("Vidéo supprimée");
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
    toast.success("Photo supprimée");
  };

  const getVideoThumbnail = (url: string) => {
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/);
    if (youtubeMatch) {
      return `https://img.youtube.com/vi/${youtubeMatch[1]}/mqdefault.jpg`;
    }
    return null;
  };

  const isLocalVideo = (url: string) => {
    return url.startsWith('blob:');
  };

  return (
    <div className="flex min-h-screen bg-background">
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
                    <User className="w-16 h-16 text-muted-foreground" />
                  </div>
                  <button className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-foreground">Jean Dupont</h2>
                    <Badge className="bg-success/20 text-success border-0 gap-1">
                      <BadgeCheck className="w-4 h-4" /> Artisan Validé
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mb-4">Plombier professionnel depuis 15 ans</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="w-4 h-4" /> Paris, Île-de-France
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Phone className="w-4 h-4" /> 06 12 34 56 78
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Mail className="w-4 h-4" /> jean.dupont@email.com
                    </span>
                  </div>
                </div>
                <Button variant="gold">
                  <Save className="w-4 h-4 mr-2" /> Enregistrer
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
                    defaultValue="Plombier professionnel avec 15 ans d'expérience, je suis spécialisé dans les interventions d'urgence et les rénovations complètes de salle de bain. Travail soigné et garantie décennale."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input id="firstName" defaultValue="Jean" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input id="lastName" defaultValue="Dupont" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="jean.dupont@email.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input id="phone" type="tel" defaultValue="06 12 34 56 78" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Adresse professionnelle</Label>
                  <Input id="address" defaultValue="123 rue de la Plomberie, 75011 Paris" />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="bg-card rounded-xl border border-border shadow-soft p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6">Informations professionnelles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="siret">Numéro SIRET</Label>
                  <Input id="siret" defaultValue="123 456 789 00012" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trade">Métier principal</Label>
                  <Input id="trade" defaultValue="Plombier" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience">Années d'expérience</Label>
                  <Input id="experience" type="number" defaultValue="15" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyWebsite">Site web entreprise</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="companyWebsite" className="pl-10" placeholder="https://..." />
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
                      value={socialLinks.facebook}
                      onChange={(e) => setSocialLinks({...socialLinks, facebook: e.target.value})}
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
                      value={socialLinks.instagram}
                      onChange={(e) => setSocialLinks({...socialLinks, instagram: e.target.value})}
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
                      value={socialLinks.linkedin}
                      onChange={(e) => setSocialLinks({...socialLinks, linkedin: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="personalWebsite">Site web personnel</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="personalWebsite" 
                      className="pl-10" 
                      placeholder="https://votre-site.fr"
                      value={socialLinks.website}
                      onChange={(e) => setSocialLinks({...socialLinks, website: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Service Area */}
            <div className="bg-card rounded-xl border border-border shadow-soft p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6">Zone d'intervention</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {zones.map((zone) => (
                  <Badge 
                    key={zone} 
                    variant="secondary" 
                    className="px-3 py-1.5 text-sm flex items-center gap-2"
                  >
                    {zone}
                    <button 
                      onClick={() => removeZone(zone)}
                      className="hover:text-destructive transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input 
                  placeholder="Ajouter une zone (ex: Paris 16e)" 
                  value={newZone}
                  onChange={(e) => setNewZone(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addZone()}
                />
                <Button onClick={addZone} variant="outline">
                  <Plus className="w-4 h-4 mr-1" /> Ajouter
                </Button>
              </div>
            </div>

            {/* Portfolio Photos */}
            <div className="bg-card rounded-xl border border-border shadow-soft p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">Portfolio / Réalisations (Photos)</h3>
                <Badge variant="outline" className="text-xs">
                  {photos.length}/{MAX_PHOTOS} photos
                </Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {photos.map((photo, i) => (
                  <div key={i} className="aspect-square bg-muted rounded-lg overflow-hidden relative group">
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      {photo}
                    </div>
                    <button 
                      onClick={() => removePhoto(i)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <button className="aspect-square bg-muted/50 rounded-lg border-2 border-dashed border-border hover:border-accent hover:bg-accent/5 transition-all flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-accent">
                    <Plus className="w-8 h-8" />
                    <span className="text-sm">Ajouter</span>
                  </button>
                )}
              </div>
            </div>

            {/* Portfolio Videos */}
            <div className="bg-card rounded-xl border border-border shadow-soft p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-foreground">Mes vidéos</h3>
                <Badge variant="outline" className="text-xs">
                  {videos.length}/{MAX_VIDEOS} vidéos
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
                      onKeyPress={(e) => e.key === "Enter" && addVideoUrl()}
                      disabled={videos.length >= MAX_VIDEOS}
                    />
                  </div>
                  <Button onClick={addVideoUrl} variant="outline" disabled={videos.length >= MAX_VIDEOS}>
                    <Plus className="w-4 h-4 mr-1" /> Lien
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
                    disabled={videos.length >= MAX_VIDEOS}
                  />
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={videos.length >= MAX_VIDEOS}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Télécharger une vidéo MP4
                  </Button>
                </div>
              </div>

              {/* Video grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {videos.map((videoUrl, index) => {
                  const thumbnail = getVideoThumbnail(videoUrl);
                  const isLocal = isLocalVideo(videoUrl);
                  return (
                    <div key={index} className="aspect-video bg-muted rounded-lg overflow-hidden relative group">
                      {thumbnail ? (
                        <img 
                          src={thumbnail} 
                          alt={`Vidéo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : isLocal ? (
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
                      {isLocal && (
                        <Badge className="absolute bottom-2 left-2 text-xs bg-primary/80">
                          MP4
                        </Badge>
                      )}
                      <button 
                        onClick={() => removeVideo(videoUrl)}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
  );
};
