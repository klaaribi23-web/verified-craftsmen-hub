import { useState } from "react";
import { ArtisanSidebar } from "@/components/artisan-dashboard/ArtisanSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Save
} from "lucide-react";

export const ArtisanProfile = () => {
  const [zones, setZones] = useState(["Paris 11e", "Paris 12e", "Paris 20e"]);
  const [newZone, setNewZone] = useState("");

  const addZone = () => {
    if (newZone && !zones.includes(newZone)) {
      setZones([...zones, newZone]);
      setNewZone("");
    }
  };

  const removeZone = (zone: string) => {
    setZones(zones.filter(z => z !== zone));
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
                  <Label htmlFor="website">Site web</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="website" className="pl-10" placeholder="https://..." />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bio">Description / Présentation</Label>
                  <Textarea 
                    id="bio" 
                    rows={4}
                    defaultValue="Plombier professionnel avec 15 ans d'expérience, je suis spécialisé dans les interventions d'urgence et les rénovations complètes de salle de bain. Travail soigné et garantie décennale."
                  />
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

            {/* Portfolio */}
            <div className="bg-card rounded-xl border border-border shadow-soft p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6">Portfolio / Réalisations</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aspect-square bg-muted rounded-lg overflow-hidden relative group">
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      Photo {i}
                    </div>
                    <button className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button className="aspect-square bg-muted/50 rounded-lg border-2 border-dashed border-border hover:border-accent hover:bg-accent/5 transition-all flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-accent">
                  <Plus className="w-8 h-8" />
                  <span className="text-sm">Ajouter</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
