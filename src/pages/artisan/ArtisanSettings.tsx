import { ArtisanSidebar } from "@/components/artisan-dashboard/ArtisanSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Bell, 
  Mail, 
  Lock, 
  Smartphone,
  Globe,
  CreditCard,
  Shield,
  Trash2
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";

export const ArtisanSettings = () => {
  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-background pt-16 lg:pt-20">
        <ArtisanSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader 
          title="Paramètres" 
          subtitle="Gérez les préférences de votre compte"
        />

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Notifications */}
            <div className="bg-card rounded-xl border border-border shadow-soft p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Notifications</h3>
                  <p className="text-sm text-muted-foreground">Gérez vos préférences de notification</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <p className="font-medium text-foreground">Nouvelles demandes</p>
                    <p className="text-sm text-muted-foreground">Recevoir une notification pour chaque nouvelle demande</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <p className="font-medium text-foreground">Messages clients</p>
                    <p className="text-sm text-muted-foreground">Notification à chaque nouveau message</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <p className="font-medium text-foreground">Rappels de rendez-vous</p>
                    <p className="text-sm text-muted-foreground">Rappel 24h avant chaque rendez-vous</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-foreground">Newsletter</p>
                    <p className="text-sm text-muted-foreground">Recevoir nos conseils et actualités</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </div>

            {/* Email Preferences */}
            <div className="bg-card rounded-xl border border-border shadow-soft p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Email</h3>
                  <p className="text-sm text-muted-foreground">Modifier votre adresse email</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Adresse email actuelle</Label>
                  <Input defaultValue="jean.dupont@email.com" />
                </div>
                <Button variant="outline">Modifier l'email</Button>
              </div>
            </div>

            {/* Security */}
            <div className="bg-card rounded-xl border border-border shadow-soft p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Sécurité</h3>
                  <p className="text-sm text-muted-foreground">Protégez votre compte</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <p className="font-medium text-foreground">Mot de passe</p>
                    <p className="text-sm text-muted-foreground">Dernière modification il y a 3 mois</p>
                  </div>
                  <Button variant="outline" size="sm">Modifier</Button>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <p className="font-medium text-foreground">Authentification à deux facteurs</p>
                    <p className="text-sm text-muted-foreground">Ajoutez une couche de sécurité supplémentaire</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-foreground">Sessions actives</p>
                    <p className="text-sm text-muted-foreground">2 appareils connectés</p>
                  </div>
                  <Button variant="outline" size="sm">Gérer</Button>
                </div>
              </div>
            </div>

            {/* Language & Region */}
            <div className="bg-card rounded-xl border border-border shadow-soft p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Langue & Région</h3>
                  <p className="text-sm text-muted-foreground">Préférences régionales</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Langue</Label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Fuseau horaire</Label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="europe/paris">Europe/Paris (UTC+1)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-destructive/5 rounded-xl border border-destructive/30 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold text-destructive">Zone de danger</h3>
                  <p className="text-sm text-destructive/80">Actions irréversibles</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Supprimer mon compte</p>
                  <p className="text-sm text-muted-foreground">
                    Cette action est irréversible et supprimera toutes vos données
                  </p>
                </div>
                <Button variant="destructive" size="sm">
                  Supprimer
                </Button>
              </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};
