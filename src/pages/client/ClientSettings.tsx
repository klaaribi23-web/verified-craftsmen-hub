import { ClientSidebar } from "@/components/client-dashboard/ClientSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  User,
  Mail,
  Phone,
  MapPin,
  Bell,
  Lock,
  Save
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";

export const ClientSettings = () => {
  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-background pt-16 lg:pt-20">
        <ClientSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader 
          title="Paramètres" 
          subtitle="Gérez votre compte et vos préférences"
        />

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informations personnelles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input id="firstName" defaultValue="Marie" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input id="lastName" defaultValue="Martin" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email
                  </Label>
                  <Input id="email" type="email" defaultValue="marie.martin@email.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Téléphone
                  </Label>
                  <Input id="phone" type="tel" defaultValue="06 12 34 56 78" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Adresse
                  </Label>
                  <Input id="address" defaultValue="15 rue de la Paix, 75002 Paris" />
                </div>
                <Button variant="gold">
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer les modifications
                </Button>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Nouvelles réponses d'artisans</p>
                    <p className="text-sm text-muted-foreground">
                      Recevez une notification quand un artisan répond à votre mission
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Messages</p>
                    <p className="text-sm text-muted-foreground">
                      Recevez une notification pour les nouveaux messages
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Promotions et actualités</p>
                    <p className="text-sm text-muted-foreground">
                      Recevez nos offres spéciales et actualités
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            {/* Security */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Sécurité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                  <Input id="newPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
                <Button variant="outline">
                  Modifier le mot de passe
                </Button>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Zone de danger</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  La suppression de votre compte est irréversible. Toutes vos données seront définitivement effacées.
                </p>
                <Button variant="destructive">
                  Supprimer mon compte
                </Button>
              </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};
