import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/admin-dashboard/AdminSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Rocket, Package, Clock, UserCheck,
  MapPin, Search, Copy, Link2, ExternalLink,
  Send, Eye, Loader2, ChevronLeft, ChevronRight,
  MessageCircle, FileText, Download,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { DEFAULT_AVATAR } from "@/lib/utils";
import { SEOHead } from "@/components/seo/SEOHead";

const PUBLISHED_URL = "https://verified-craftsmen-hub.lovable.app";
const PER_PAGE = 50;

interface CommandantArtisan {
  id: string;
  business_name: string;
  city: string;
  email: string | null;
  phone: string | null;
  description: string | null;
  photo_url: string | null;
  slug: string | null;
  status: string;
  source: string | null;
  created_at: string;
  updated_at: string;
  category: { name: string } | null;
}

type TabKey = "stock" | "en-cours" | "clients";
type ArtisanStatus = "active" | "disponible" | "pending" | "prospect" | "suspended";

const statusForTab: Record<TabKey, ArtisanStatus[]> = {
  "stock": ["disponible"],
  "en-cours": ["pending", "suspended"],
  "clients": ["active"],
};

const tabConfig: { key: TabKey; label: string; icon: typeof Package; color: string }[] = [
  { key: "stock", label: "STOCK", icon: Package, color: "data-[state=active]:bg-gray-700 data-[state=active]:text-white" },
  { key: "en-cours", label: "EN COURS", icon: Clock, color: "data-[state=active]:bg-orange-500 data-[state=active]:text-white" },
  { key: "clients", label: "CLIENTS", icon: UserCheck, color: "data-[state=active]:bg-emerald-600 data-[state=active]:text-white" },
];

const AdminCommandant = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>("stock");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [accessDialog, setAccessDialog] = useState<CommandantArtisan | null>(null);
  const [messageDialog, setMessageDialog] = useState<CommandantArtisan | null>(null);

  // Reset pagination on tab/search change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab as TabKey);
    setPage(0);
    setSearch("");
  };

  // Fetch counts for all tabs
  const { data: counts = { stock: 0, "en-cours": 0, clients: 0, archives: 0 } } = useQuery({
    queryKey: ["commandant-counts"],
    queryFn: async () => {
      const results: Record<string, number> = {};
      for (const tab of tabConfig) {
        const { count, error } = await supabase
          .from("artisans")
          .select("*", { count: "exact", head: true })
          .in("status", statusForTab[tab.key]);
        if (error) throw error;
        results[tab.key] = count || 0;
      }
      return results;
    },
  });

  // Fetch artisans for current tab
  const { data: artisans = [], isLoading } = useQuery({
    queryKey: ["commandant-artisans", activeTab, page, search],
    queryFn: async () => {
      let query = supabase
        .from("artisans")
        .select(`
          id, business_name, city, email, phone, description, photo_url,
          slug, status, source, created_at, updated_at,
          category:categories(name)
        `)
        .in("status", statusForTab[activeTab]);

      if (search.trim()) {
        query = query.or(`business_name.ilike.%${search}%,city.ilike.%${search}%`);
      }

      const { data, error } = await query
        .order("updated_at", { ascending: false })
        .range(page * PER_PAGE, (page + 1) * PER_PAGE - 1);

      if (error) throw error;
      return data as CommandantArtisan[];
    },
  });

  // "Lancer l'assaut" — move to pending
  const assaultMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("artisans")
        .update({ status: "suspended", updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("🚀 Assaut lancé ! Fiche EN COURS avec bandeau orange");
      queryClient.invalidateQueries({ queryKey: ["commandant-artisans"] });
      queryClient.invalidateQueries({ queryKey: ["commandant-counts"] });
      queryClient.invalidateQueries({ queryKey: ["public-artisans"] });
    },
    onError: () => toast.error("Erreur lors du lancement"),
  });

  // Move to other statuses
  const changeStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ArtisanStatus }) => {
      const { error } = await supabase
        .from("artisans")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      const labels: Record<string, string> = {
        active: "CLIENTS (Validé)",
        disponible: "STOCK",
        suspended: "EN COURS",
        prospect: "ARCHIVES",
      };
      toast.success(`Déplacé vers ${labels[vars.status] || vars.status}`);
      queryClient.invalidateQueries({ queryKey: ["commandant-artisans"] });
      queryClient.invalidateQueries({ queryKey: ["commandant-counts"] });
      queryClient.invalidateQueries({ queryKey: ["public-artisans"] });
    },
    onError: () => toast.error("Erreur lors du changement de statut"),
  });

  const getProfileUrl = (artisan: CommandantArtisan) =>
    `${PUBLISHED_URL}/artisan/${artisan.slug || artisan.id}`;

  const copyLink = (artisan: CommandantArtisan) => {
    navigator.clipboard.writeText(getProfileUrl(artisan));
    toast.success("🔗 Lien Magique copié !");
  };

  const getWhatsAppLink = (artisan: CommandantArtisan) => {
    const phone = artisan.phone?.replace(/[\s.-]/g, "");
    if (!phone) return null;
    let intlPhone = phone.startsWith("0") ? `33${phone.slice(1)}` : phone.startsWith("33") ? phone : `33${phone}`;
    intlPhone = intlPhone.replace("+", "");
    const url = getProfileUrl(artisan);
    const msg = `Bonjour, votre vitrine professionnelle est prête sur Artisans Validés : ${url}. Il ne reste qu'une place sur votre secteur. On l'active ?`;
    return `https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`;
  };

  const generateAccessText = (artisan: CommandantArtisan) => {
    const url = getProfileUrl(artisan);
    const dashboardUrl = `${PUBLISHED_URL}/connexion`;
    return `Bonjour ${artisan.business_name},

Votre fiche professionnelle est en ligne :
👉 ${url}

Pour gérer votre vitrine, connectez-vous ici :
🔑 ${dashboardUrl}
${artisan.email ? `Identifiant : ${artisan.email}` : ""}

Cordialement,
L'équipe Artisans Validés`;
  };

  const copyAccessText = (artisan: CommandantArtisan) => {
    navigator.clipboard.writeText(generateAccessText(artisan));
    toast.success("📧 Texte d'accès copié !");
  };

  const generateClosingMessage = (artisan: CommandantArtisan) => {
    const url = getProfileUrl(artisan);
    return `Bonjour ${artisan.business_name}, votre vitrine exclusive est prête pour ${artisan.city}. Elle est actuellement en attente de validation finale. Consultez-la ici pour bloquer votre zone : ${url}. Attention, la priorité expire demain à 18h.`;
  };

  const copyClosingMessage = (artisan: CommandantArtisan) => {
    navigator.clipboard.writeText(generateClosingMessage(artisan));
    toast.success("📋 Message de closing copié !");
  };

  const downloadOfferPDF = (artisan: CommandantArtisan) => {
    const url = getProfileUrl(artisan);
    const year = new Date().getFullYear();
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${artisan.business_name} — Offre Exclusive</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',system-ui,sans-serif;color:#1A2B48;background:#FFFFFF;-webkit-print-color-adjust:exact;print-color-adjust:exact}

/* ── HEADER SÉCURITÉ RÉSEAU ── */
.header{background:#0A192F;padding:16px 40px;display:flex;align-items:center;justify-content:space-between}
.nav-brand{display:flex;align-items:center;gap:10px}
.nav-logo{width:38px;height:38px;background:rgba(255,184,0,0.15);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;color:#FFB800;letter-spacing:1px}
.nav-brand-text span:first-child{font-size:15px;font-weight:900;color:#FFFFFF;display:block;letter-spacing:2px;line-height:1}
.nav-brand-text span:last-child{font-size:8px;font-weight:700;color:#FFB800;display:block;letter-spacing:2.5px;margin-top:2px}
.countdown-box{display:flex;align-items:center;gap:8px;padding:8px 18px;border-radius:8px;background:rgba(255,184,0,0.1);border:1px solid rgba(255,184,0,0.3)}
.countdown-label{font-size:9px;font-weight:700;color:rgba(255,255,255,0.5);letter-spacing:1px;text-transform:uppercase}
.countdown-value{font-size:18px;font-weight:900;color:#FFB800;letter-spacing:2px;font-variant-numeric:tabular-nums}

/* ── HERO ULTIMATUM ── */
.hero{background:#0A192F;padding:56px 40px 64px;text-align:center;border-top:1px solid rgba(255,255,255,0.05)}
.hero h1{font-size:30px;font-weight:900;color:#FFB800;line-height:1.25;letter-spacing:0.5px;margin-bottom:18px;max-width:700px;margin-left:auto;margin-right:auto}
.hero .sub{font-size:14px;color:rgba(255,255,255,0.55);font-weight:500}
.hero .sub strong{color:#FFFFFF;font-weight:700}

/* ── 3 ACTIFS STRATÉGIQUES ── */
.actifs{background:#F8F9FA;padding:56px 40px}
.section-label{text-align:center;font-size:12px;font-weight:800;color:#0A192F;letter-spacing:2px;text-transform:uppercase;margin-bottom:36px}
.actifs-grid{display:flex;gap:22px}
.actif-card{flex:1;background:#FFFFFF;border-radius:16px;padding:32px 24px;box-shadow:0 6px 30px rgba(10,25,47,0.08);border:1px solid #F0F1F3;text-align:center;position:relative;overflow:hidden}
.actif-card::before{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:#FFB800}
.actif-icon{width:54px;height:54px;background:rgba(255,184,0,0.1);border-radius:14px;display:flex;align-items:center;justify-content:center;margin:0 auto 18px;font-size:24px}
.actif-card h3{font-size:13px;font-weight:800;color:#0A192F;letter-spacing:0.8px;margin-bottom:12px;text-transform:uppercase}
.actif-card p{font-size:11.5px;color:#6B7280;line-height:1.75;font-weight:400}

/* ── FAQ DÉCISIVE (2 COLONNES) ── */
.faq{padding:56px 40px;background:#FFFFFF}
.faq-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.faq-item{padding:22px 24px;background:#FAFBFC;border-radius:12px;border-left:4px solid #FFB800}
.faq-q{font-size:13px;font-weight:700;color:#0A192F;margin-bottom:10px}
.faq-a{font-size:11px;color:#6B7280;line-height:1.85;font-weight:400}

/* ── URGENCE & CTA ── */
.closing{padding:48px 40px 56px;background:#FFFFFF}
.alert-banner{background:linear-gradient(135deg,#EA580C,#DC2626);border-radius:14px;padding:20px 28px;text-align:center;color:#FFFFFF;font-size:15px;font-weight:800;letter-spacing:0.5px;margin-bottom:32px;box-shadow:0 4px 20px rgba(220,38,38,0.25)}
.cta-stack{display:flex;flex-direction:column;gap:14px;max-width:520px;margin:0 auto}
.btn{display:flex;align-items:center;justify-content:center;gap:10px;padding:22px 28px;text-decoration:none;font-weight:800;letter-spacing:1px;font-size:16px;font-family:'Inter',sans-serif;border-radius:14px;transition:transform 0.2s}
.btn-gold{background:#FFB800;color:#0A192F;box-shadow:0 8px 24px rgba(255,184,0,0.35);font-size:17px}
.btn-outline{background:#FFFFFF;color:#0A192F;border:2.5px solid #0A192F}
.guarantee{text-align:center;margin-top:20px;font-size:10px;color:#9CA3AF;font-weight:500;letter-spacing:0.3px}

/* ── FOOTER D'AUTORITÉ ── */
.footer{background:#0A192F;padding:44px 40px 24px}
.footer-grid{display:flex;gap:28px;margin-bottom:32px}
.footer-col{flex:1}
.footer-col-brand{flex:1.5}
.footer-col-title{font-size:10px;font-weight:700;color:#FFFFFF;letter-spacing:1.5px;margin-bottom:14px;text-transform:uppercase}
.footer-col a,.footer-col span{display:block;font-size:9px;color:rgba(255,255,255,0.45);text-decoration:none;margin-bottom:6px;font-weight:400}
.footer-brand{display:flex;align-items:center;gap:8px;margin-bottom:16px}
.footer-brand-logo{width:32px;height:32px;background:rgba(255,255,255,0.08);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;color:#FFB800}
.footer-brand-text span:first-child{font-size:13px;font-weight:800;color:#FFFFFF;display:block;line-height:1}
.footer-brand-text span:last-child{font-size:7px;font-weight:700;color:#FFB800;display:block;margin-top:1px;letter-spacing:1.5px}
.footer-desc{font-size:9px;color:rgba(255,255,255,0.4);line-height:1.7;max-width:220px}
.footer-slogan{margin-top:16px;font-size:9px;font-weight:800;color:#FFB800;letter-spacing:2.5px;text-transform:uppercase}
.footer-contact{margin-top:14px}
.footer-contact span{display:block;font-size:8px;color:rgba(255,255,255,0.45);margin-bottom:5px}
.footer-guarantee{margin-top:16px;padding:10px 16px;background:rgba(255,184,0,0.08);border:1px solid rgba(255,184,0,0.2);border-radius:8px;font-size:9px;font-weight:600;color:#FFB800;text-align:center}
.footer-bottom{border-top:1px solid rgba(255,255,255,0.06);padding-top:18px;text-align:center;font-size:7.5px;color:rgba(255,255,255,0.25)}
</style></head><body>

<!-- ═══ HEADER SÉCURITÉ RÉSEAU ═══ -->
<div class="header">
  <div class="nav-brand">
    <div class="nav-logo">AV</div>
    <div class="nav-brand-text"><span>ARTISANS</span><span>VALIDÉS</span></div>
  </div>
  <div class="countdown-box">
    <div>
      <div class="countdown-label">VOTRE OFFRE EXPIRE DANS</div>
      <div class="countdown-value">17H 59M 30S</div>
    </div>
  </div>
</div>

<!-- ═══ HERO — L'ULTIMATUM ═══ -->
<div class="hero">
  <h1>NE LAISSEZ PAS VOTRE COMPÉTITEUR VOLER VOTRE SECTEUR.</h1>
  <div class="sub">Dossier prioritaire pour : <strong>${artisan.business_name}</strong> &nbsp;|&nbsp; Ville : <strong>${artisan.city}</strong>${artisan.category?.name ? ` &nbsp;|&nbsp; 🔧 ${artisan.category.name}` : ''}</div>
</div>

<!-- ═══ LES 3 ACTIFS STRATÉGIQUES ═══ -->
<div class="actifs">
  <div class="section-label">Vos 3 actifs stratégiques</div>
  <div class="actifs-grid">
    <div class="actif-card">
      <div class="actif-icon">🛡️</div>
      <h3>Secteur Privé</h3>
      <p>Zéro concurrence directe. Vous possédez l'exclusivité totale sur votre zone. Aucun concurrent ne peut apparaître à côté de vous.</p>
    </div>
    <div class="actif-card">
      <div class="actif-icon">✨</div>
      <h3>Vitrine VIP</h3>
      <p>Votre profil est déjà en ligne et optimisé. Prêt à recevoir des appels. Les clients vous contactent directement, sans intermédiaire.</p>
    </div>
    <div class="actif-card">
      <div class="actif-icon">🚀</div>
      <h3>Clients Directs</h3>
      <p>Position N°1 sur les recherches locales. Aucun intermédiaire. Vous captez 100% des demandes pour votre métier sur ${artisan.city}.</p>
    </div>
  </div>
</div>

<!-- ═══ FAQ DÉCISIVE (2 COLONNES) ═══ -->
<div class="faq">
  <div class="section-label">Questions / Réponses</div>
  <div class="faq-grid">
    <div class="faq-item">
      <div class="faq-q">Quel est le coût ?</div>
      <div class="faq-a">L'accès exclusif est proposé sous forme de licence mensuelle. Le tarif dépend de votre secteur géographique et de la demande locale. Aucun engagement longue durée.</div>
    </div>
    <div class="faq-item">
      <div class="faq-q">Comment est-ce garanti ?</div>
      <div class="faq-a">Satisfaction garantie ou 100% remboursé sous 30 jours. Si aucun chantier n'est décroché durant le premier mois, vous ne payez rien.</div>
    </div>
    <div class="faq-item">
      <div class="faq-q">Ma vitrine est déjà en ligne ?</div>
      <div class="faq-a">Oui. Votre fiche professionnelle est déjà créée avec vos informations, photos et coordonnées. Il ne vous reste qu'à activer votre accès pour la rendre opérationnelle.</div>
    </div>
    <div class="faq-item">
      <div class="faq-q">Pourquoi pas Google Ads ?</div>
      <div class="faq-a">Google Ads facture au clic sans garantie de résultat. Notre modèle vous offre une visibilité permanente et exclusive sans frais publicitaires récurrents ni enchères.</div>
    </div>
  </div>
</div>

<!-- ═══ URGENCE & CTA ═══ -->
<div class="closing">
  <div class="alert-banner">⚠️ OFFRE ANNULÉE AUTOMATIQUEMENT DEMAIN À 18H00. UNE LISTE D'ATTENTE EXISTE.</div>
  <div class="cta-stack">
    <a class="btn btn-gold" href="${url}">⚡ ACTIVER MON EXCLUSIVITÉ MAINTENANT</a>
    <a class="btn btn-outline" href="${url}">👁️ VOIR MA PRÉ-VITRINE (360°)</a>
  </div>
  <div class="guarantee">🔒 Accès limité à 2 artisans par métier et par ville — Satisfaction garantie ou remboursé</div>
</div>

<!-- ═══ FOOTER D'AUTORITÉ ═══ -->
<div class="footer">
  <div class="footer-grid">
    <div class="footer-col footer-col-brand">
      <div class="footer-brand">
        <div class="footer-brand-logo">AV</div>
        <div class="footer-brand-text"><span>ARTISANS</span><span>VALIDÉS</span></div>
      </div>
      <div class="footer-desc">La plateforme de confiance qui connecte les particuliers avec des artisans vérifiés et qualifiés dans toute la France.</div>
      <div class="footer-slogan">MOINS DE BLABLA, PLUS DE RÉSULTATS.</div>
      <div class="footer-contact">
        <span>📞 03 53 63 29 99</span>
        <span>📧 contact@artisansvalides.fr</span>
        <span>📍 77 rue de la Monnaie, 59800 Lille</span>
      </div>
      <div class="footer-guarantee">✅ Satisfaction garantie ou 100% remboursé sous 30 jours</div>
    </div>
    <div class="footer-col">
      <div class="footer-col-title">Nos métiers</div>
      <a>Plombier</a><a>Électricien</a><a>Chauffagiste</a><a>Peintre</a><a>Serrurier</a><a>Maçon</a>
    </div>
    <div class="footer-col">
      <div class="footer-col-title">Entreprise</div>
      <a>À propos</a><a>Comment ça marche</a><a>Devenir partenaire</a><a>Blog</a><a>Contact</a>
    </div>
    <div class="footer-col">
      <div class="footer-col-title">Nos régions</div>
      <a>Île-de-France</a><a>Hauts-de-France</a><a>PACA</a><a>Auvergne-Rhône-Alpes</a><a>Occitanie</a><a>Nouvelle-Aquitaine</a>
    </div>
  </div>
  <div class="footer-bottom">© ${year} Artisans Validés. Tous droits réservés. — www.artisansvalides.fr</div>
</div>

</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Attestation-${artisan.business_name.replace(/\\s+/g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("📄 Attestation téléchargée ! Ouvrez-la et imprimez en PDF.");
  };

  const totalPages = Math.ceil((counts[activeTab] || 0) / PER_PAGE);

  return (
    <>
      <SEOHead title="Commandant" description="Centre de commandement prospection" noIndex />
      <Navbar />
      <div className="flex min-h-screen bg-background pt-28 lg:pt-20">
        <AdminSidebar />
        <main className="flex-1">
          <DashboardHeader
            title="🎖️ Poste de Commandement"
            subtitle="Pilotez votre prospection artisan"
          />
          <div className="p-4 md:p-8">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="mb-6 flex-wrap bg-muted/50">
                {tabConfig.map((tab) => (
                  <TabsTrigger
                    key={tab.key}
                    value={tab.key}
                    className={`gap-2 ${tab.color}`}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {(counts[tab.key] || 0).toLocaleString("fr-FR")}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Search bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom ou ville..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                  className="pl-9"
                />
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
                  <span>Page {page + 1} / {totalPages}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Content for all tabs — same layout */}
              {tabConfig.map((tab) => (
                <TabsContent key={tab.key} value={tab.key}>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : artisans.length > 0 ? (
                    <div className="grid gap-3">
                      {artisans.map((artisan) => (
                        <ArtisanRow
                          key={artisan.id}
                          artisan={artisan}
                          tabKey={activeTab}
                          onAssault={() => assaultMutation.mutate(artisan.id)}
                          onChangeStatus={(status) => changeStatusMutation.mutate({ id: artisan.id, status })}
                          onCopyLink={() => copyLink(artisan)}
                          onWhatsApp={() => {
                            const link = getWhatsAppLink(artisan);
                            if (link) window.open(link, "_blank");
                            else toast.error("Pas de numéro de téléphone");
                          }}
                          onViewProfile={() => window.open(getProfileUrl(artisan), "_blank")}
                          onSendAccess={() => setAccessDialog(artisan)}
                          onGenerateMessage={() => setMessageDialog(artisan)}
                          isAssaulting={assaultMutation.isPending}
                        />
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="py-16 text-center">
                        <tab.icon className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold mb-1">
                          {search ? "Aucun résultat" : `Aucun artisan dans ${tab.label}`}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {search ? `Aucun artisan trouvé pour "${search}"` : "Cet onglet est vide pour le moment."}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </main>
      </div>

      {/* Access Dialog */}
      <Dialog open={!!accessDialog} onOpenChange={() => setAccessDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Envoyer l'accès — {accessDialog?.business_name}
            </DialogTitle>
          </DialogHeader>
          {accessDialog && (
            <div className="space-y-4">
              <pre className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap font-sans leading-relaxed">
                {generateAccessText(accessDialog)}
              </pre>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => copyAccessText(accessDialog)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copier le texte
                </Button>
                {accessDialog.phone && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const link = getWhatsAppLink(accessDialog);
                      if (link) window.open(link, "_blank");
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Message de Closing Dialog */}
      <Dialog open={!!messageDialog} onOpenChange={() => setMessageDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Message de closing — {messageDialog?.business_name}
            </DialogTitle>
          </DialogHeader>
          {messageDialog && (
            <div className="space-y-4">
              <pre className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap font-sans leading-relaxed">
                {generateClosingMessage(messageDialog)}
              </pre>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => copyClosingMessage(messageDialog)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copier le message
                </Button>
                <Button variant="outline" onClick={() => downloadOfferPDF(messageDialog)}>
                  <Download className="h-4 w-4 mr-2" />
                  Récapitulatif PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

// --- ArtisanRow Component ---
interface ArtisanRowProps {
  artisan: CommandantArtisan;
  tabKey: TabKey;
  onAssault: () => void;
  onChangeStatus: (status: ArtisanStatus) => void;
  onCopyLink: () => void;
  onWhatsApp: () => void;
  onViewProfile: () => void;
  onSendAccess: () => void;
  onGenerateMessage: () => void;
  isAssaulting: boolean;
}

const ArtisanRow = ({
  artisan, tabKey, onAssault, onChangeStatus,
  onCopyLink, onWhatsApp, onViewProfile, onSendAccess, onGenerateMessage, isAssaulting,
}: ArtisanRowProps) => {
  const statusDot = {
    active: "bg-emerald-500",
    suspended: "bg-orange-500",
    pending: "bg-orange-500",
    disponible: "bg-gray-400",
    prospect: "bg-gray-300",
  }[artisan.status] || "bg-gray-300";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-3 md:p-4">
        <div className="flex gap-3">
          <Avatar className="h-12 w-12 md:h-14 md:w-14 shrink-0">
            <AvatarImage src={artisan.photo_url || DEFAULT_AVATAR} />
            <AvatarFallback>{artisan.business_name.charAt(0)}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusDot}`} />
              <h3 className="font-semibold text-sm md:text-base truncate">{artisan.business_name}</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {artisan.city}
              </span>
              {artisan.category?.name && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  {artisan.category.name}
                </Badge>
              )}
              {artisan.email && <span className="truncate max-w-[150px]">{artisan.email}</span>}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-1.5">
              {/* STOCK tab: Lancer l'assaut */}
              {tabKey === "stock" && (
                <Button
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-8 gap-1"
                  onClick={onAssault}
                  disabled={isAssaulting}
                >
                  <Rocket className="h-3.5 w-3.5" />
                  Lancer l'assaut
                </Button>
              )}

              {/* EN COURS tab: Copy magic link + Generate message + Move to CLIENTS or back to STOCK */}
              {tabKey === "en-cours" && (
                <>
                  <Button
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-8 gap-1 font-bold"
                    onClick={onCopyLink}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    COPIER LE LIEN MAGIQUE
                  </Button>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 gap-1 font-bold"
                    onClick={onGenerateMessage}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    GÉNÉRER LE MESSAGE
                  </Button>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 gap-1"
                    onClick={() => onChangeStatus("active")}
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    Valider client
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-8 gap-1"
                    onClick={() => onChangeStatus("disponible")}
                  >
                    <Package className="h-3.5 w-3.5" />
                    → Stock
                  </Button>
                </>
              )}


              {/* CLIENTS tab: actions */}
              {tabKey === "clients" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8 gap-1"
                  onClick={onCopyLink}
                >
                  <Link2 className="h-3.5 w-3.5" />
                  Lien Magique
                </Button>
              )}

              {/* Common actions */}
              <Button size="sm" variant="outline" className="text-xs h-8 gap-1" onClick={onCopyLink}>
                <Link2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Lien</span>
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-8 gap-1" onClick={onViewProfile}>
                <Eye className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Voir</span>
              </Button>
              {artisan.phone && (
                <Button size="sm" variant="outline" className="text-xs h-8 gap-1" onClick={onWhatsApp}>
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </Button>
              )}
              <Button size="sm" variant="outline" className="text-xs h-8 gap-1" onClick={onSendAccess}>
                <Send className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Accès</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminCommandant;
