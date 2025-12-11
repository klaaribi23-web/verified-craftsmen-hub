import { useState, useEffect } from "react";
import { ArtisanSidebar } from "@/components/artisan-dashboard/ArtisanSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Bell, 
  Mail, 
  Lock, 
  Smartphone,
  Globe,
  Shield,
  Trash2,
  Eye,
  EyeOff,
  Check,
  X,
  Loader2,
  Monitor,
  LogOut
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

export const ArtisanSettings = () => {
  // Password change state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Sessions state
  const [isSessionsModalOpen, setIsSessionsModalOpen] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  // Password strength checks
  const passwordChecks = {
    length: newPassword.length >= 12,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
  };

  const isPasswordStrong = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword !== "";

  const handleChangePassword = async () => {
    if (!isPasswordStrong) {
      toast.error("Le mot de passe ne respecte pas les critères de sécurité");
      return;
    }
    if (!passwordsMatch) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success("Mot de passe modifié avec succès");
      setIsPasswordModalOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du changement de mot de passe");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    try {
      // Get current session info
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // For now, we show the current session
        // Supabase doesn't expose all sessions via client API
        setSessions([{
          id: session.access_token.slice(-8),
          device: navigator.userAgent.includes("Mobile") ? "Mobile" : "Desktop",
          browser: getBrowserName(),
          lastActive: "Maintenant",
          isCurrent: true
        }]);
      }
    } catch (error) {
      console.error("Error loading sessions:", error);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const getBrowserName = () => {
    const ua = navigator.userAgent;
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Safari")) return "Safari";
    if (ua.includes("Edge")) return "Edge";
    return "Navigateur";
  };

  const handleSignOutAllDevices = async () => {
    try {
      await supabase.auth.signOut({ scope: "global" });
      toast.success("Déconnecté de tous les appareils");
      window.location.href = "/auth";
    } catch (error) {
      toast.error("Erreur lors de la déconnexion");
    }
  };

  const CheckItem = ({ checked, label }: { checked: boolean; label: string }) => (
    <div className="flex items-center gap-2 text-sm">
      {checked ? (
        <Check className="w-4 h-4 text-success" />
      ) : (
        <X className="w-4 h-4 text-destructive" />
      )}
      <span className={checked ? "text-success" : "text-muted-foreground"}>{label}</span>
    </div>
  );

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
                  <Input disabled className="bg-muted" placeholder="Chargement..." />
                  <p className="text-xs text-muted-foreground">Contactez le support pour modifier votre email</p>
                </div>
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
                    <p className="text-sm text-muted-foreground">Utilisez un mot de passe fort</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setIsPasswordModalOpen(true)}>
                    Modifier
                  </Button>
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
                    <p className="text-sm text-muted-foreground">Gérez vos appareils connectés</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setIsSessionsModalOpen(true);
                      loadSessions();
                    }}
                  >
                    Gérer
                  </Button>
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

    {/* Password Change Modal */}
    <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier le mot de passe</DialogTitle>
          <DialogDescription>
            Créez un mot de passe fort pour sécuriser votre compte
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nouveau mot de passe</Label>
            <div className="relative">
              <Input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Entrez votre nouveau mot de passe"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium text-foreground mb-2">Critères de sécurité :</p>
            <CheckItem checked={passwordChecks.length} label="Au moins 12 caractères" />
            <CheckItem checked={passwordChecks.uppercase} label="Une lettre majuscule" />
            <CheckItem checked={passwordChecks.lowercase} label="Une lettre minuscule" />
            <CheckItem checked={passwordChecks.number} label="Un chiffre" />
            <CheckItem checked={passwordChecks.special} label="Un caractère spécial (!@#$%^&*)" />
          </div>

          <div className="space-y-2">
            <Label>Confirmer le mot de passe</Label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmez votre nouveau mot de passe"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="text-sm text-destructive">Les mots de passe ne correspondent pas</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsPasswordModalOpen(false)}>
            Annuler
          </Button>
          <Button 
            variant="gold" 
            onClick={handleChangePassword}
            disabled={!isPasswordStrong || !passwordsMatch || isChangingPassword}
          >
            {isChangingPassword ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Lock className="w-4 h-4 mr-2" />
            )}
            Modifier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Sessions Modal */}
    <Dialog open={isSessionsModalOpen} onOpenChange={setIsSessionsModalOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sessions actives</DialogTitle>
          <DialogDescription>
            Gérez les appareils connectés à votre compte
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {isLoadingSessions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune session active
            </p>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div 
                  key={session.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Monitor className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {session.browser} - {session.device}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.lastActive}
                        {session.isCurrent && (
                          <span className="ml-2 text-success">(Session actuelle)</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="destructive" 
            onClick={handleSignOutAllDevices}
            className="w-full sm:w-auto"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Déconnecter tous les appareils
          </Button>
          <Button variant="outline" onClick={() => setIsSessionsModalOpen(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};
