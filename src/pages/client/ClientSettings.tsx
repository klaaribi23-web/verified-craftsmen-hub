import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClientSidebar } from "@/components/client-dashboard/ClientSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { CityAutocompleteAPI } from "@/components/location/CityAutocompleteAPI";
import { 
  User,
  Mail,
  Phone,
  MapPin,
  Bell,
  Lock,
  Save,
  Loader2
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const ClientSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: ""
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [notifications, setNotifications] = useState({
    newResponses: true,
    messages: true,
    promotions: false
  });

  // Fetch profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ["client-settings-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.first_name || "",
        lastName: profile.last_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        city: profile.city || ""
      });
    }
  }, [profile]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error("Profile not found");
      
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          city: formData.city
        })
        .eq("id", profile.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-settings-profile"] });
      toast.success("Profil mis à jour avec succès");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    }
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        throw new Error("Les mots de passe ne correspondent pas");
      }
      if (passwordForm.newPassword.length < 8) {
        throw new Error("Le mot de passe doit contenir au moins 8 caractères");
      }

      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Mot de passe modifié avec succès");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors du changement de mot de passe");
    }
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate();
  };

  const handleChangePassword = () => {
    changePasswordMutation.mutate();
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-screen bg-background pt-16 lg:pt-20">
          <ClientSidebar />
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </>
    );
  }

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
                      <Input 
                        id="firstName" 
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom</Label>
                      <Input 
                        id="lastName" 
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email
                    </Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={formData.email}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Téléphone
                    </Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Ville
                    </Label>
                    <CityAutocompleteAPI
                      value={formData.city}
                      onChange={(value) => setFormData({ ...formData, city: value })}
                      placeholder="Rechercher votre ville..."
                    />
                  </div>
                  <Button 
                    variant="gold" 
                    onClick={handleSaveProfile}
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
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
                    <Switch 
                      checked={notifications.newResponses}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, newResponses: checked })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Messages</p>
                      <p className="text-sm text-muted-foreground">
                        Recevez une notification pour les nouveaux messages
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.messages}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, messages: checked })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Promotions et actualités</p>
                      <p className="text-sm text-muted-foreground">
                        Recevez nos offres spéciales et actualités
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.promotions}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, promotions: checked })}
                    />
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
                    <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                    <Input 
                      id="newPassword" 
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                    <Input 
                      id="confirmPassword" 
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    />
                  </div>
                  <Button 
                    variant="outline"
                    onClick={handleChangePassword}
                    disabled={changePasswordMutation.isPending || !passwordForm.newPassword || !passwordForm.confirmPassword}
                  >
                    {changePasswordMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
      <ChatWidget />
    </>
  );
};
