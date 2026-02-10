import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, Zap, Users, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import Footer from "@/components/layout/Footer";
import { ANDREA_INSCRIPTION_SUCCESS } from "@/config/andreaMessages";
import { CategorySelect } from "@/components/categories/CategorySelect";

const BENEFITS = [
  { icon: Zap, label: "Andrea travaille pour vous 24h/24 pendant que vous êtes sur le chantier" },
  { icon: Shield, label: "Profil vérifié et certifié — confiance maximale des clients" },
  { icon: Users, label: "Mise en relation qualifiée avec des particuliers de votre zone" },
];

const InscriptionArtisan = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ siret: "", business_name: "", metier: "", metierId: "", ville: "", phone: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.siret || !form.business_name || !form.metier || !form.ville || !form.phone || !form.email) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("partner_candidacies").insert({
        siret: form.siret,
        business_name: form.business_name,
        metier: form.metier,
        city: form.ville,
        phone: form.phone,
        email: form.email,
      });
      if (error) throw error;
      setShowSuccess(true);
      toast.success("Demande envoyée ! Notre équipe vous recontactera sous 24h.");
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Inscription Artisan Pro — Artisans Validés"
        description="Créez votre compte professionnel et activez vos avantages exclusifs. Andrea, votre IA experte, travaille pour vous 24h/24."
      />
      <Navbar />
      <main className="min-h-screen bg-background pt-24 pb-16">
        <div className="container max-w-4xl mx-auto px-4">
          {/* Andrea success message after inscription */}
          {showSuccess && (
            <div className="mb-8 p-6 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-navy-dark" />
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">Andrea — Votre IA Experte</p>
                  <p className="text-foreground/80">{ANDREA_INSCRIPTION_SUCCESS}</p>
                  <div className="flex gap-3 mt-4">
                    <Button onClick={() => navigate("/connexion")} className="gap-2">
                      Se connecter <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Hero */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-sm font-medium mb-4">
              <Shield className="w-4 h-4" />
              Technologie Exclusive
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Rejoignez l'Alliance des Artisans Validés
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Créez votre compte Pro et laissez Andrea, notre Super-IA Experte, générer des leads qualifiés pendant que vous êtes sur le chantier.
            </p>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {BENEFITS.map((b, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border">
                <b.icon className="w-6 h-6 text-gold shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">{b.label}</p>
              </div>
            ))}
          </div>

          {/* Form */}
          <Card className="max-w-lg mx-auto border-gold/20">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Créer mon compte Pro</CardTitle>
              <CardDescription>
                ⚠️ Aucun abonnement n'est possible sans compte personnel vérifié.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="siret">N° SIRET *</Label>
                  <Input id="siret" name="siret" value={form.siret} onChange={handleChange} placeholder="123 456 789 00010" maxLength={17} />
                </div>
                <div>
                  <Label htmlFor="business_name">Nom de l'entreprise *</Label>
                  <Input id="business_name" name="business_name" value={form.business_name} onChange={handleChange} placeholder="Ex: Bati-Pro SAS" maxLength={100} />
                </div>
                <div>
                  <Label>Spécialité / Métier *</Label>
                  <CategorySelect
                    value={form.metierId}
                    onValueChange={(id, name) => setForm(prev => ({ ...prev, metierId: id, metier: name }))}
                    placeholder="Sélectionnez votre spécialité"
                  />
                </div>
                <div>
                  <Label htmlFor="ville">Ville *</Label>
                  <Input id="ville" name="ville" value={form.ville} onChange={handleChange} placeholder="Ex: Bordeaux" maxLength={100} />
                </div>
                <div>
                  <Label htmlFor="email">Adresse Email *</Label>
                  <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="contact@entreprise.fr" maxLength={255} />
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone *</Label>
                  <Input id="phone" name="phone" value={form.phone} onChange={handleChange} placeholder="06 XX XX XX XX" maxLength={15} />
                </div>

                <Button type="submit" className="w-full bg-gold hover:bg-gold/90 text-navy-dark font-semibold gap-2" disabled={loading}>
                  {loading ? "Envoi…" : (
                    <>Créer mon compte Pro & Activer mes avantages <ArrowRight className="w-4 h-4" /></>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-2">
                  En soumettant, vous acceptez nos <a href="/cgu" className="underline">CGU</a>. Votre profil sera validé par notre équipe sous 24h.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default InscriptionArtisan;
