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
    const date = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    const refNum = `AV-${Date.now().toString(36).toUpperCase()}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(url)}&color=0A192F&bgcolor=FFFFFF`;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Exclusivité — ${artisan.business_name}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
@page{size:A4;margin:0}
body{font-family:'Inter',system-ui,sans-serif;color:#1A2B48;background:#FFFFFF;line-height:1.6;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{max-width:794px;margin:0 auto;background:#FFFFFF;min-height:100vh;overflow:hidden}

/* ── Hero Banner ── */
.hero{background:linear-gradient(135deg,#0A192F 0%,#1A3A5C 60%,#0A192F 100%);padding:44px 48px 40px;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(-55deg,transparent,transparent 12px,rgba(255,215,0,0.06) 12px,rgba(255,215,0,0.06) 13px);pointer-events:none}
.hero::after{content:'';position:absolute;bottom:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#FFD700,#FFC107,#FFD700)}
.hero-top{display:flex;align-items:center;justify-content:space-between;position:relative;z-index:1;margin-bottom:28px}
.hero-brand{font-size:9px;font-weight:900;letter-spacing:5px;text-transform:uppercase;color:#FFD700}
.hero-ref{font-size:7px;color:rgba(255,255,255,0.35);letter-spacing:2px;text-transform:uppercase;text-align:right;line-height:1.8;font-weight:600}
.hero-title{position:relative;z-index:1;text-align:center}
.hero-title h1{font-size:28px;font-weight:900;color:#FFD700;letter-spacing:3px;text-transform:uppercase;line-height:1.2;text-shadow:0 2px 20px rgba(255,215,0,0.2)}
.hero-title p{font-size:11px;color:rgba(255,255,255,0.5);font-weight:600;letter-spacing:2px;margin-top:10px;text-transform:uppercase}
.hero-badges{display:flex;gap:10px;justify-content:center;margin-top:16px;position:relative;z-index:1}
.hero-badge{display:inline-flex;align-items:center;gap:5px;background:rgba(255,215,0,0.1);border:1px solid rgba(255,215,0,0.25);border-radius:20px;padding:5px 14px;font-size:7.5px;font-weight:700;color:#FFD700;letter-spacing:1.5px;text-transform:uppercase}

/* ── Artisan Card ── */
.artisan-card{margin:32px 48px 0;background:#FFFFFF;border-radius:10px;border-left:5px solid #FFD700;box-shadow:0 4px 24px rgba(26,43,72,0.08);padding:28px 32px;position:relative}
.artisan-name{font-size:28px;font-weight:900;color:#0A192F;letter-spacing:1px;line-height:1.2}
.artisan-zone{margin-top:8px;font-size:13px;font-weight:600;color:#6B7280;letter-spacing:1px}
.artisan-zone strong{color:#FFD700;font-weight:800}
.card-badge{position:absolute;top:20px;right:24px;display:flex;align-items:center;gap:6px;background:#0A192F;border-radius:6px;padding:6px 14px}
.card-badge span{font-size:7px;font-weight:800;color:#FFD700;letter-spacing:2px;text-transform:uppercase}

/* ── Arguments Grid ── */
.args{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:28px 48px 0}
.arg{background:#F8FAFC;border:1px solid #E5E7EB;border-radius:10px;padding:20px;display:flex;gap:14px;align-items:flex-start}
.arg-icon{width:40px;height:40px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:18px}
.arg-icon.gold{background:linear-gradient(135deg,#FFD700,#FFC107);color:#0A192F}
.arg-icon.navy{background:#0A192F;color:#FFD700}
.arg-title{font-size:12px;font-weight:800;color:#0A192F;letter-spacing:0.5px;margin-bottom:3px}
.arg-desc{font-size:10px;color:#6B7280;font-weight:500;line-height:1.5}

/* ── KPI Bar ── */
.kpi-row{display:flex;gap:12px;margin:24px 48px 0}
.kpi{flex:1;background:#0A192F;border-radius:10px;padding:18px 14px;text-align:center}
.kpi-label{font-size:7px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:10px}
.kpi-bar{height:5px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;margin-bottom:8px}
.kpi-fill{height:100%;background:linear-gradient(90deg,#FFD700,#FFC107);border-radius:3px;width:100%}
.kpi-value{font-size:16px;font-weight:900;color:#FFD700;letter-spacing:1px}
.kpi-status{font-size:7px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-top:2px}

/* ── CTAs ── */
.cta-section{margin:28px 48px 0;display:flex;gap:12px}
.btn{flex:1;display:block;padding:16px 20px;text-align:center;text-decoration:none;font-weight:800;letter-spacing:2px;text-transform:uppercase;font-size:10px;font-family:'Inter',sans-serif;border-radius:8px}
.btn-outline{background:#FFFFFF;color:#0A192F;border:2px solid #0A192F}
.btn-solid{background:linear-gradient(135deg,#FFD700 0%,#FFC107 100%);color:#0A192F;border:2px solid #FFD700;font-size:11px;box-shadow:0 4px 18px rgba(255,215,0,0.3)}

/* ── QR ── */
.qr-section{display:flex;align-items:center;gap:14px;margin:24px 48px 0;padding:14px 18px;background:#F8FAFC;border-radius:8px;border:1px solid #E5E7EB}
.qr-section img{width:52px;height:52px;border-radius:6px;border:1px solid #E5E7EB}
.qr-text{font-size:8px;color:#6B7280;line-height:1.7;font-weight:500}
.qr-text strong{color:#0A192F;font-weight:700;font-size:8.5px;display:block;margin-bottom:2px;letter-spacing:1.5px;text-transform:uppercase}

/* ── Urgency Banner ── */
.urgency-banner{margin:28px 0 0;background:linear-gradient(135deg,#F59E0B,#D97706);padding:16px 48px;display:flex;align-items:center;justify-content:center;gap:10px}
.urgency-banner span{font-size:11px;font-weight:800;color:#FFFFFF;letter-spacing:2px;text-transform:uppercase;text-shadow:0 1px 2px rgba(0,0,0,0.2)}

/* ── Footer ── */
.footer{padding:16px 48px 24px;background:#0A192F}
.footer-sig{text-align:center;font-weight:900;color:#FFD700;font-size:8px;letter-spacing:4px;text-transform:uppercase;margin-bottom:8px}
.footer-legal{text-align:justify;font-size:6px;color:rgba(255,255,255,0.25);line-height:1.8;font-weight:500}
</style></head><body>
<div class="page">

<div class="hero">
  <div class="hero-top">
    <div class="hero-brand">ARTISANS VALIDÉS</div>
    <div class="hero-ref">CONFIDENTIEL<br/>N° ${refNum}<br/>${date}</div>
  </div>
  <div class="hero-title">
    <h1>VOTRE EXCLUSIVITÉ EST PRÊTE</h1>
    <p>Une place réservée sur votre secteur — Activation immédiate</p>
  </div>
  <div class="hero-badges">
    <div class="hero-badge">✓ Audité</div>
    <div class="hero-badge">✓ Certifié</div>
    <div class="hero-badge">✓ Exclusif</div>
  </div>
</div>

<div class="artisan-card">
  <div class="artisan-name">${artisan.business_name}</div>
  <div class="artisan-zone">Secteur réservé : <strong>${artisan.city}</strong></div>
  <div class="card-badge"><span>⚜ Dossier prioritaire</span></div>
</div>

<div class="args">
  <div class="arg">
    <div class="arg-icon gold">📞</div>
    <div><div class="arg-title">Appels illimités</div><div class="arg-desc">Recevez les demandes de votre zone directement, sans intermédiaire.</div></div>
  </div>
  <div class="arg">
    <div class="arg-icon navy">🛡️</div>
    <div><div class="arg-title">Zéro commission</div><div class="arg-desc">Aucun pourcentage prélevé sur vos chantiers. Le client est à vous.</div></div>
  </div>
  <div class="arg">
    <div class="arg-icon gold">📍</div>
    <div><div class="arg-title">Exclusivité territoriale</div><div class="arg-desc">Maximum 2 professionnels par métier et par ville. Votre zone, votre marché.</div></div>
  </div>
  <div class="arg">
    <div class="arg-icon navy">⭐</div>
    <div><div class="arg-title">Vitrine certifiée</div><div class="arg-desc">Un profil vérifié qui inspire confiance et génère des contacts qualifiés.</div></div>
  </div>
</div>

<div class="kpi-row">
  <div class="kpi">
    <div class="kpi-label">Protection sectorielle</div>
    <div class="kpi-bar"><div class="kpi-fill"></div></div>
    <div class="kpi-value">100%</div>
    <div class="kpi-status">Verrouillée</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">Visibilité Google</div>
    <div class="kpi-bar"><div class="kpi-fill"></div></div>
    <div class="kpi-value">MAX</div>
    <div class="kpi-status">Activée</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">Flux de prospects</div>
    <div class="kpi-bar"><div class="kpi-fill"></div></div>
    <div class="kpi-value">DIRECT</div>
    <div class="kpi-status">Ouvert</div>
  </div>
</div>

<div class="cta-section">
  <a class="btn btn-outline" href="${url}">👀 PRÉVISUALISER MA VITRINE</a>
  <a class="btn btn-solid" href="${url}">⚡ ACTIVER MON EXCLUSIVITÉ</a>
</div>

<div class="qr-section">
  <img src="${qrUrl}" alt="QR Code"/>
  <div class="qr-text">
    <strong>Vérification d'authenticité</strong>
    Scannez pour accéder au dossier de ${artisan.business_name} et vérifier la validité de cette attestation. Réf. ${refNum}.
  </div>
</div>

<div class="urgency-banner">
  <span>⏳ RÉSERVATION TEMPORAIRE : 24H RESTANTES AVANT RÉOUVERTURE DU SECTEUR</span>
</div>

<div class="footer">
  <div class="footer-sig">ARTISANS VALIDÉS — L'EXCELLENCE N'ATTEND PAS</div>
  <div class="footer-legal">Ce document est émis par Artisans Validés et certifie la réservation temporaire d'une zone d'exclusivité sectorielle. La présente attestation ne constitue pas un engagement contractuel définitif mais une pré-réservation d'accès prioritaire, soumise à validation dans un délai de 24 heures ouvrées. Passé ce délai, la zone sera automatiquement libérée et proposée à un autre professionnel qualifié. Paiement sécurisé par Stripe. © ${new Date().getFullYear()} Artisans Validés — Tous droits réservés.</div>
</div>

</div>
</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Attestation-${artisan.business_name.replace(/\s+/g, "-")}.html`;
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
