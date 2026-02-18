import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClientSidebar } from "@/components/client-dashboard/ClientSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FrenchPhoneInput, validateFrenchPhone } from "@/components/ui/french-phone-input";
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
  Loader2,
  Trash2,
  ShieldAlert,
  AlertTriangle
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

export const ClientSettings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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

  // Delete account state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<"warning" | "confirm">("warning");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleOpenDeleteModal = () => {
    setDeleteStep("warning");
    setDeleteConfirmText("");
    setIsDeleteModalOpen(true);
  };

  const handleProceedToConfirm = () => {
    setDeleteStep("confirm");
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "SUPPRIMER") {
      toast.error("Veuillez taper SUPPRIMER pour confirmer");
      return;
    }

    setIsDeleting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error("Session expirée");
      }

      const { data, error } = await supabase.functions.invoke("delete-client-account", {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.success === false) {
        throw new Error(data.message);
      }

      toast.success("Votre compte a été supprimé avec succès");
      
      // Sign out and redirect
      await supabase.auth.signOut();
      navigate("/");
      
    } catch (error: any) {
      console.error("Delete account error:", error);
      toast.error(error.message || "Erreur lors de la suppression du compte");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-screen bg-background">
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
      <div className="flex min-h-screen bg-background">
        <ClientSidebar />
      
        <div className="flex-1 flex flex-col">
          <DashboardHeader 
            title="Paramètres" 
            subtitle="Gérez votre compte et vos préférences"
          />

          <main className="flex-1 p-4 md:p-6 overflow-auto pb-24 lg:pb-6">
            <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
              {/* Personal Information */}
              <Card>
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <User className="w-4 h-4 sm:w-5 sm:h-5" />
                    Informations personnelles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="firstName" className="text-sm">Prénom</Label>
                      <Input 
                        id="firstName" 
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="h-9 sm:h-10"
                      />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="lastName" className="text-sm">Nom</Label>
                      <Input 
                        id="lastName" 
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="h-9 sm:h-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="email" className="text-sm">
                      <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1.5 sm:mr-2" />
                      Email
                    </Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={formData.email}
                      disabled
                      className="bg-muted h-9 sm:h-10"
                    />
                    <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié</p>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="phone" className="text-sm">
                      <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1.5 sm:mr-2" />
                      Téléphone (format français)
                    </Label>
                    <FrenchPhoneInput
                      id="phone" 
                      value={formData.phone}
                      onChange={(value) => setFormData({ ...formData, phone: value })}
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="city" className="text-sm">
                      <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1.5 sm:mr-2" />
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
                    className="w-full sm:w-auto"
                  >
                    {updateProfileMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Enregistrer
                  </Button>
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card>
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="flex items-start sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base">Nouvelles réponses d'artisans</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Notification quand un artisan répond
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.newResponses}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, newResponses: checked })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-start sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base">Messages</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Notification pour les nouveaux messages
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.messages}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, messages: checked })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-start sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base">Promotions et actualités</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Offres spéciales et actualités
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
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                    Sécurité
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="newPassword" className="text-sm">Nouveau mot de passe</Label>
                      <Input 
                        id="newPassword" 
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="h-9 sm:h-10"
                      />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm">Confirmer le mot de passe</Label>
                      <Input 
                        id="confirmPassword" 
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="h-9 sm:h-10"
                      />
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={handleChangePassword}
                    disabled={changePasswordMutation.isPending || !passwordForm.newPassword || !passwordForm.confirmPassword}
                    className="w-full sm:w-auto"
                  >
                    {changePasswordMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Modifier le mot de passe
                  </Button>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border-destructive/50 bg-destructive/5">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-destructive text-base sm:text-lg flex items-center gap-2">
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    Zone de danger
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                    La suppression de votre compte est irréversible. Toutes vos données seront définitivement effacées.
                  </p>
                  <Button 
                    variant="destructive" 
                    className="w-full sm:w-auto"
                    onClick={handleOpenDeleteModal}
                  >
                    Supprimer mon compte
                  </Button>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
      <ChatWidget />

      {/* Delete Account Modal */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent className="max-w-md">
          {deleteStep === "warning" && (
            <>
              <AlertDialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                    <ShieldAlert className="w-6 h-6 text-destructive" />
                  </div>
                  <AlertDialogTitle className="text-xl">Supprimer votre compte ?</AlertDialogTitle>
                </div>
                <AlertDialogDescription className="text-left space-y-3">
                  <p className="text-foreground font-medium">
                    Cette action est irréversible et entraînera :
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>La suppression de votre profil client</li>
                    <li>La suppression de toutes vos missions publiées</li>
                    <li>La suppression de vos devis reçus</li>
                    <li>La suppression de toutes vos conversations</li>
                    <li>La suppression de vos avis et recommandations</li>
                    <li>La perte de vos artisans favoris</li>
                  </ul>
                  <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 mt-4">
                    <p className="text-sm text-warning-foreground flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>Toutes ces données seront définitivement effacées et ne pourront pas être récupérées.</span>
                    </p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-4">
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <Button 
                  variant="destructive" 
                  onClick={handleProceedToConfirm}
                >
                  Continuer
                </Button>
              </AlertDialogFooter>
            </>
          )}

          {deleteStep === "confirm" && (
            <>
              <AlertDialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-destructive" />
                  </div>
                  <AlertDialogTitle className="text-xl">Confirmation finale</AlertDialogTitle>
                </div>
                <AlertDialogDescription className="text-left space-y-3">
                  <p className="text-foreground">
                    Pour confirmer la suppression définitive de votre compte, tapez <strong className="text-destructive">SUPPRIMER</strong> dans le champ ci-dessous.
                  </p>
                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                    placeholder="Tapez SUPPRIMER"
                    className="mt-2 text-center font-mono tracking-widest"
                  />
                  {deleteConfirmText && deleteConfirmText !== "SUPPRIMER" && (
                    <p className="text-sm text-destructive">Tapez exactement "SUPPRIMER" pour continuer</p>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-4">
                <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== "SUPPRIMER" || isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer définitivement
                    </>
                  )}
                </Button>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
