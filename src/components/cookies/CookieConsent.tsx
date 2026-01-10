import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Cookie, Settings, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CookiePreferences {
  essential: boolean;
  performance: boolean;
  functional: boolean;
  consented: boolean;
  consentDate: string | null;
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true, // Always true, cannot be disabled
  performance: false,
  functional: false,
  consented: false,
  consentDate: null,
};

const STORAGE_KEY = "artisans-valides-cookie-preferences";

export const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CookiePreferences;
        setPreferences(parsed);
        if (parsed.consented) {
          setHasConsented(true);
        } else {
          setShowBanner(true);
        }
      } catch {
        setShowBanner(true);
      }
    } else {
      // Small delay to avoid banner flash on page load
      const timer = setTimeout(() => setShowBanner(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    const toSave = {
      ...prefs,
      consented: true,
      consentDate: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    setPreferences(toSave);
    setHasConsented(true);
    setShowBanner(false);
    setShowSettings(false);
  };

  const acceptAll = () => {
    savePreferences({
      essential: true,
      performance: true,
      functional: true,
      consented: true,
      consentDate: new Date().toISOString(),
    });
  };

  const rejectNonEssential = () => {
    savePreferences({
      essential: true,
      performance: false,
      functional: false,
      consented: true,
      consentDate: new Date().toISOString(),
    });
  };

  const saveCustomPreferences = () => {
    savePreferences(preferences);
  };

  const openSettingsFromButton = () => {
    setShowSettings(true);
  };

  return (
    <>
      {/* Discrete Cookie Settings Button - shown after consent */}
      <AnimatePresence>
        {hasConsented && !showBanner && !showSettings && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={openSettingsFromButton}
            className="fixed bottom-4 left-4 z-40 p-3 bg-card border border-border rounded-full shadow-lg hover:shadow-xl hover:bg-muted transition-all group"
            aria-label="Gérer les cookies"
            title="Gérer les cookies"
          >
            <Cookie className="w-5 h-5 text-muted-foreground group-hover:text-navy transition-colors" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Cookie Banner */}
      <AnimatePresence>
        {showBanner && !showSettings && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
          >
            <div className="container mx-auto max-w-5xl">
              <div className="bg-card border border-border rounded-xl shadow-2xl p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                  {/* Icon and Text */}
                  <div className="flex gap-4 flex-1">
                    <div className="hidden md:flex w-12 h-12 bg-navy/10 rounded-xl items-center justify-center flex-shrink-0">
                      <Cookie className="w-6 h-6 text-navy" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <Cookie className="w-5 h-5 md:hidden text-navy" />
                        Nous utilisons des cookies
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Ce site utilise des cookies pour améliorer votre expérience de navigation, 
                        analyser le trafic et personnaliser le contenu. Vous pouvez accepter tous 
                        les cookies ou personnaliser vos préférences.
                      </p>
                      <a 
                        href="/confidentialite" 
                        className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <Shield className="w-3 h-3" />
                        En savoir plus sur notre politique de confidentialité
                      </a>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <Button
                      variant="outline"
                      onClick={rejectNonEssential}
                      className="order-3 sm:order-1"
                    >
                      Refuser
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowSettings(true)}
                      className="order-2 gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Personnaliser
                    </Button>
                    <Button
                      onClick={acceptAll}
                      className="order-1 sm:order-3 bg-navy hover:bg-navy/90"
                    >
                      Tout accepter
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-navy" />
              Paramètres des cookies
            </DialogTitle>
            <DialogDescription>
              Personnalisez vos préférences de cookies. Les cookies essentiels sont 
              nécessaires au fonctionnement du site et ne peuvent pas être désactivés.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Essential Cookies */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b">
              <div className="space-y-1">
                <Label className="text-base font-semibold flex items-center gap-2">
                  Cookies essentiels
                  <span className="text-xs bg-navy/10 text-navy px-2 py-0.5 rounded">
                    Obligatoires
                  </span>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Nécessaires au fonctionnement du site (authentification, sécurité, 
                  préférences de session). Ces cookies ne collectent pas de données personnelles.
                </p>
              </div>
              <Switch checked disabled className="data-[state=checked]:bg-navy" />
            </div>

            {/* Performance Cookies */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b">
              <div className="space-y-1">
                <Label htmlFor="performance" className="text-base font-semibold">
                  Cookies de performance
                </Label>
                <p className="text-sm text-muted-foreground">
                  Permettent de mesurer l'audience et d'analyser le comportement des 
                  visiteurs pour améliorer le site. Les données sont anonymisées.
                </p>
              </div>
              <Switch
                id="performance"
                checked={preferences.performance}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, performance: checked })
                }
                className="data-[state=checked]:bg-navy"
              />
            </div>

            {/* Functional Cookies */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Label htmlFor="functional" className="text-base font-semibold">
                  Cookies fonctionnels
                </Label>
                <p className="text-sm text-muted-foreground">
                  Permettent de mémoriser vos préférences (langue, région, paramètres 
                  d'affichage) pour personnaliser votre expérience.
                </p>
              </div>
              <Switch
                id="functional"
                checked={preferences.functional}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, functional: checked })
                }
                className="data-[state=checked]:bg-navy"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={rejectNonEssential}
              className="flex-1"
            >
              Refuser tout
            </Button>
            <Button
              variant="outline"
              onClick={acceptAll}
              className="flex-1"
            >
              Tout accepter
            </Button>
            <Button
              onClick={saveCustomPreferences}
              className="flex-1 bg-navy hover:bg-navy/90"
            >
              Enregistrer mes choix
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CookieConsent;
