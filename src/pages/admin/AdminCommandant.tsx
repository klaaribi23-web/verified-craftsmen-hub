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
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${artisan.business_name} — Récapitulatif Exclusif</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',system-ui,sans-serif;color:#1A2B48;background:#FFFFFF;-webkit-print-color-adjust:exact;print-color-adjust:exact}

/* ── SECTION 1 : HERO (Navy) ── */
.hero{background:#0A192F;padding:0}
.hero-nav{display:flex;align-items:center;justify-content:space-between;padding:18px 40px;border-bottom:1px solid rgba(255,255,255,0.08)}
.nav-brand{display:flex;align-items:center;gap:10px}
.nav-logo{width:36px;height:36px;background:rgba(255,184,0,0.15);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:#FFB800;letter-spacing:1px}
.nav-brand-text span:first-child{font-size:14px;font-weight:800;color:#FFFFFF;display:block;letter-spacing:1.5px;line-height:1}
.nav-brand-text span:last-child{font-size:8px;font-weight:700;color:#FFB800;display:block;letter-spacing:2px;margin-top:2px}
.hero-badge{display:inline-flex;align-items:center;gap:6px;padding:6px 16px;border-radius:20px;background:rgba(255,184,0,0.1);border:1px solid rgba(255,184,0,0.3)}
.hero-badge span{font-size:11px;font-weight:600;color:#FFB800;letter-spacing:0.3px}
.hero-body{padding:48px 40px 56px;text-align:center}
.hero-body h1{font-size:28px;font-weight:900;color:#FFB800;line-height:1.3;letter-spacing:0.5px;margin-bottom:14px}
.hero-body .hero-sub{font-size:14px;color:rgba(255,255,255,0.6);font-weight:500}
.hero-body .hero-sub strong{color:#FFFFFF;font-weight:700}

/* ── SECTION 2 : LES 3 PILIERS ── */
.piliers{background:#F8F9FA;padding:48px 40px}
.piliers-title{text-align:center;font-size:13px;font-weight:800;color:#0A192F;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:32px}
.piliers-grid{display:flex;gap:20px}
.pilier-card{flex:1;background:#FFFFFF;border-radius:14px;padding:28px 22px;box-shadow:0 4px 24px rgba(10,25,47,0.07);border:1px solid #F0F1F3;text-align:center}
.pilier-icon{width:50px;height:50px;background:rgba(255,184,0,0.1);border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:22px}
.pilier-card h3{font-size:12px;font-weight:800;color:#0A192F;letter-spacing:0.5px;margin-bottom:10px;text-transform:uppercase}
.pilier-card p{font-size:11px;color:#6B7280;line-height:1.7;font-weight:400}

/* ── SECTION 3 : FAQ DYNAMIQUE ── */
.faq-section{padding:48px 40px;background:#FFFFFF}
.faq-title{text-align:center;font-size:13px;font-weight:800;color:#0A192F;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:32px}
.faq-item{display:flex;gap:16px;margin-bottom:20px;padding:20px 24px;background:#FAFBFC;border-radius:12px;border-left:4px solid #FFB800}
.faq-item .faq-q{font-size:13px;font-weight:700;color:#0A192F;margin-bottom:8px}
.faq-item .faq-a{font-size:11px;color:#6B7280;line-height:1.8;font-weight:400}

/* ── SECTION 4 : URGENCE & CLOSING ── */
.urgency-section{padding:40px 40px 48px;background:#FFFFFF}
.fomo-banner{background:linear-gradient(135deg,#DC2626,#EA580C);border-radius:12px;padding:18px 24px;text-align:center;color:#FFFFFF;font-size:15px;font-weight:800;letter-spacing:0.5px;margin-bottom:28px}
.cta-stack{display:flex;flex-direction:column;gap:12px;max-width:480px;margin:0 auto}
.btn{display:flex;align-items:center;justify-content:center;gap:8px;padding:20px 24px;text-decoration:none;font-weight:800;letter-spacing:0.8px;font-size:15px;font-family:'Inter',sans-serif;border-radius:12px;transition:transform 0.2s}
.btn-primary{background:#FFB800;color:#0A192F;box-shadow:0 6px 20px rgba(255,184,0,0.35)}
.btn-secondary{background:#FFFFFF;color:#0A192F;border:2px solid #0A192F}
.access-note{text-align:center;margin-top:16px;font-size:10px;color:#9CA3AF;font-weight:500}

/* ── SECTION 5 : FOOTER ── */
.site-footer{background:#0A192F;padding:40px 40px 24px}
.footer-top{display:flex;gap:28px;margin-bottom:28px}
.footer-col{flex:1}
.footer-col-brand{flex:1.4}
.footer-col-title{font-size:10px;font-weight:700;color:#FFFFFF;letter-spacing:1px;margin-bottom:12px;text-transform:uppercase}
.footer-col a,.footer-col span{display:block;font-size:9px;color:rgba(255,255,255,0.5);text-decoration:none;margin-bottom:6px;font-weight:400}
.footer-brand{display:flex;align-items:center;gap:8px;margin-bottom:14px}
.footer-brand-logo{width:30px;height:30px;background:rgba(255,255,255,0.08);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;color:#FFB800}
.footer-brand-text span:first-child{font-size:12px;font-weight:800;color:#FFFFFF;display:block;line-height:1}
.footer-brand-text span:last-child{font-size:7px;font-weight:700;color:#FFB800;display:block;margin-top:1px}
.footer-brand-desc{font-size:8.5px;color:rgba(255,255,255,0.4);line-height:1.7;max-width:200px}
.footer-slogan{margin-top:14px;font-size:9px;font-weight:800;color:#FFB800;letter-spacing:2px;text-transform:uppercase}
.footer-contact{margin-top:12px}
.footer-contact span{display:block;font-size:8px;color:rgba(255,255,255,0.45);margin-bottom:4px}
.footer-bottom{border-top:1px solid rgba(255,255,255,0.08);padding-top:16px;text-align:center;font-size:7.5px;color:rgba(255,255,255,0.3)}
</style></head><body>

<!-- ═══════════════════════════════════════════ -->
<!-- SECTION 1 : HERO (Impact immédiat)        -->
<!-- ═══════════════════════════════════════════ -->
<div class="hero">
  <div class="hero-nav">
    <div class="nav-brand">
      <div class="nav-logo">AV</div>
      <div class="nav-brand-text"><span>ARTISANS</span><span>VALIDÉS</span></div>
    </div>
    <div class="hero-badge"><span>🕒 Publiée récemment</span></div>
  </div>
  <div class="hero-body">
    <h1>VOTRE RÉCAPITULATIF : ${artisan.business_name}</h1>
    <div class="hero-sub">📍 <strong>${artisan.city}</strong>${artisan.category?.name ? ` · 🔧 ${artisan.category.name}` : ''}</div>
  </div>
</div>

<!-- ═══════════════════════════════════════════ -->
<!-- SECTION 2 : LES 3 PILIERS                 -->
<!-- ═══════════════════════════════════════════ -->
<div class="piliers">
  <div class="piliers-title">Vos 3 actifs stratégiques</div>
  <div class="piliers-grid">
    <div class="pilier-card">
      <div class="pilier-icon">📍</div>
      <h3>Exclusivité Géographique</h3>
      <p>Zéro concurrence directe. Vous êtes le seul référencé sur votre zone. Aucun concurrent ne peut apparaître à côté de vous.</p>
    </div>
    <div class="pilier-card">
      <div class="pilier-icon">🔑</div>
      <h3>Vitrine Clé en Main</h3>
      <p>Votre fiche est déjà en ligne avec vos informations, photos et coordonnées. Les clients vous contactent directement.</p>
    </div>
    <div class="pilier-card">
      <div class="pilier-icon">🚀</div>
      <h3>SEO Local — N°1 sur Google</h3>
      <p>Votre profil est optimisé pour le référencement local. Vous apparaissez en tête des résultats pour votre métier et votre ville.</p>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════════ -->
<!-- SECTION 3 : FAQ DYNAMIQUE                 -->
<!-- ═══════════════════════════════════════════ -->
<div class="faq-section">
  <div class="faq-title">Questions / Réponses</div>
  <div class="faq-item">
    <div>
      <div class="faq-q">Pourquoi suis-je le seul artisan sur ma zone ?</div>
      <div class="faq-a">Nous appliquons une politique d'exclusivité stricte : maximum 2 artisans par métier et par ville. Cela vous garantit zéro concurrence directe sur la plateforme et un flux de demandes clients non partagé.</div>
    </div>
  </div>
  <div class="faq-item">
    <div>
      <div class="faq-q">Que contient ma vitrine professionnelle ?</div>
      <div class="faq-a">Votre fiche inclut vos coordonnées complètes, votre description, vos photos de réalisations, vos certifications et un formulaire de contact direct. Elle est accessible 24h/24 par les particuliers qui recherchent un professionnel dans votre secteur.</div>
    </div>
  </div>
  <div class="faq-item">
    <div>
      <div class="faq-q">Comment fonctionne la visibilité SEO ?</div>
      <div class="faq-a">Votre profil est indexé sur Google pour les recherches de type « ${artisan.category?.name || 'artisan'} ${artisan.city} ». Grâce à notre optimisation technique, vous apparaissez naturellement dans les premiers résultats sans frais publicitaires supplémentaires.</div>
    </div>
  </div>
  <div class="faq-item">
    <div>
      <div class="faq-q">Que se passe-t-il si je n'active pas mon accès ?</div>
      <div class="faq-a">Votre place sera libérée et proposée au prochain professionnel qualifié de votre secteur. L'exclusivité géographique ne peut pas être réservée indéfiniment.</div>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════════ -->
<!-- SECTION 4 : URGENCE & CLOSING             -->
<!-- ═══════════════════════════════════════════ -->
<div class="urgency-section">
  <div class="fomo-banner">⚠️ EXPIRATION DEMAIN À 18H00</div>
  <div class="cta-stack">
    <a class="btn btn-primary" href="${url}">🔒 DÉBLOQUER MON EXCLUSIVITÉ</a>
    <a class="btn btn-secondary" href="${url}">👁️ VOIR MA VITRINE PROFESSIONNELLE</a>
  </div>
  <div class="access-note">🔒 Accès limité à 2 artisans par métier et par ville</div>
</div>

<!-- ═══════════════════════════════════════════ -->
<!-- SECTION 5 : FOOTER INSTITUTIONNEL         -->
<!-- ═══════════════════════════════════════════ -->
<div class="site-footer">
  <div class="footer-top">
    <div class="footer-col footer-col-brand">
      <div class="footer-brand">
        <div class="footer-brand-logo">AV</div>
        <div class="footer-brand-text"><span>ARTISANS</span><span>VALIDÉS</span></div>
      </div>
      <div class="footer-brand-desc">La plateforme de confiance qui vous connecte avec des artisans vérifiés et qualifiés dans toute la France.</div>
      <div class="footer-slogan">MOINS DE BLABLA, PLUS DE RÉSULTATS.</div>
      <div class="footer-contact">
        <span>📞 03 53 63 29 99</span>
        <span>📧 contact@artisansvalides.fr</span>
        <span>📍 77 rue de la Monnaie, 59800 Lille</span>
      </div>
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
