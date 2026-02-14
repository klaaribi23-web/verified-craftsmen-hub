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
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Attestation d'Exclusivité — ${artisan.business_name}</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
@page{size:A4;margin:0}
body{font-family:'Montserrat',sans-serif;color:#1A2B48;background:#f5f5f0;line-height:1.6;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{max-width:794px;margin:0 auto;background:#FDFBF7;position:relative;min-height:100vh;border:3px solid #1A2B48;outline:1px solid #D4AF37;outline-offset:4px}
.page::before{content:'';position:absolute;top:8px;left:8px;right:8px;bottom:8px;border:1px solid rgba(212,175,55,0.3);pointer-events:none;z-index:1}
/* Corner ornaments */
.corner{position:absolute;width:28px;height:28px;z-index:2}
.corner::before,.corner::after{content:'';position:absolute;background:#D4AF37}
.corner-tl{top:14px;left:14px}.corner-tl::before{top:0;left:0;width:28px;height:2px}.corner-tl::after{top:0;left:0;width:2px;height:28px}
.corner-tr{top:14px;right:14px}.corner-tr::before{top:0;right:0;width:28px;height:2px}.corner-tr::after{top:0;right:0;width:2px;height:28px}
.corner-bl{bottom:14px;left:14px}.corner-bl::before{bottom:0;left:0;width:28px;height:2px}.corner-bl::after{bottom:0;left:0;width:2px;height:28px}
.corner-br{bottom:14px;right:14px}.corner-br::before{bottom:0;right:0;width:28px;height:2px}.corner-br::after{bottom:0;right:0;width:2px;height:28px}
/* Header */
.top-bar{display:flex;justify-content:space-between;align-items:flex-start;padding:36px 48px 20px}
.logo-block .logo{font-size:22px;font-weight:900;letter-spacing:-0.5px;color:#1A2B48}
.logo-block .logo span{color:#ea580c}
.logo-block .tagline{font-size:9px;text-transform:uppercase;letter-spacing:3px;color:#94a3b8;margin-top:2px}
.stamp{border:3px solid #dc2626;border-radius:4px;padding:8px 16px;text-align:center;transform:rotate(-3deg);position:relative}
.stamp::before{content:'';position:absolute;inset:-1px;border:1px dashed #dc2626;border-radius:4px;opacity:0.4}
.stamp-text{font-size:10px;font-weight:800;color:#dc2626;letter-spacing:1.5px;text-transform:uppercase;line-height:1.3}
.stamp-ref{font-size:8px;color:#dc2626;opacity:0.7;margin-top:2px}
/* Gold separator */
.gold-line{height:2px;background:linear-gradient(90deg,transparent,#D4AF37,transparent);margin:0 48px}
/* Title section */
.title-section{text-align:center;padding:28px 48px 24px}
.doc-type{font-size:10px;text-transform:uppercase;letter-spacing:4px;color:#D4AF37;font-weight:700;margin-bottom:8px}
.doc-title{font-size:24px;font-weight:900;color:#1A2B48;letter-spacing:-0.5px}
/* Artisan card */
.artisan-card{margin:0 48px 28px;background:linear-gradient(135deg,#1A2B48 0%,#0f1c30 100%);border-radius:10px;padding:24px 32px;display:flex;justify-content:space-between;align-items:center;position:relative;overflow:hidden}
.artisan-card::after{content:'';position:absolute;top:0;right:0;width:120px;height:100%;background:linear-gradient(135deg,transparent 40%,rgba(212,175,55,0.1) 100%)}
.artisan-info h2{color:#fff;font-size:20px;font-weight:800;margin-bottom:4px}
.artisan-info .city{color:#D4AF37;font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px}
.artisan-meta{text-align:right;color:rgba(255,255,255,0.6);font-size:11px}
.artisan-meta strong{display:block;color:#fff;font-size:13px}
/* 3 columns */
.pillars{display:flex;gap:14px;margin:0 48px 28px}
.pillar{flex:1;border:1px solid #e8ecf0;border-radius:10px;padding:22px 18px;text-align:center;background:#fff;position:relative;overflow:hidden;transition:box-shadow .2s}
.pillar::before{content:'';position:absolute;top:0;left:0;right:0;height:3px}
.pillar:nth-child(1)::before{background:#ea580c}
.pillar:nth-child(2)::before{background:#D4AF37}
.pillar:nth-child(3)::before{background:#1A2B48}
.pillar-icon{width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;margin:0 auto 12px}
.pillar:nth-child(1) .pillar-icon{background:linear-gradient(135deg,#fff7ed,#fed7aa);color:#ea580c}
.pillar:nth-child(2) .pillar-icon{background:linear-gradient(135deg,#fefce8,#fde68a);color:#D4AF37}
.pillar:nth-child(3) .pillar-icon{background:linear-gradient(135deg,#f0f4f8,#cbd5e1);color:#1A2B48}
.pillar h3{font-size:13px;font-weight:800;color:#1A2B48;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.3px}
.pillar p{font-size:11.5px;color:#64748b;line-height:1.5}
/* FAQ */
.faq-section{margin:0 48px 28px;background:#f0f4f8;border-radius:10px;padding:24px 28px}
.faq-title{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:#1A2B48;margin-bottom:16px;display:flex;align-items:center;gap:8px}
.faq-title::before{content:'';width:18px;height:3px;background:#ea580c;border-radius:2px}
.faq-item{margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid rgba(26,43,72,0.08)}
.faq-item:last-child{margin-bottom:0;padding-bottom:0;border-bottom:none}
.faq-q{font-size:13px;font-weight:700;color:#1A2B48;margin-bottom:4px}
.faq-a{font-size:11.5px;color:#475569;line-height:1.6}
/* CTA */
.cta-section{margin:0 48px 24px;text-align:center}
.cta-btn{display:inline-block;background:linear-gradient(135deg,#ea580c 0%,#c2410c 100%);color:#fff;padding:18px 56px;border-radius:10px;font-size:15px;font-weight:900;text-decoration:none;letter-spacing:0.8px;text-transform:uppercase;box-shadow:0 6px 20px rgba(234,88,12,0.35)}
.cta-sub{font-size:11px;color:#94a3b8;margin-top:10px}
/* Link */
.link-row{margin:0 48px 24px;background:#fff;border:1px dashed #cbd5e1;border-radius:8px;padding:12px 18px;font-size:11px;color:#64748b;word-break:break-all}
.link-row a{color:#ea580c;font-weight:700}
/* Footer */
.footer{text-align:center;padding:20px 48px;font-size:9px;color:#94a3b8;letter-spacing:0.5px}
.footer .sig{font-weight:700;color:#1A2B48;font-size:10px;margin-bottom:4px}
</style></head><body>
<div class="page">
<div class="corner corner-tl"></div><div class="corner corner-tr"></div>
<div class="corner corner-bl"></div><div class="corner corner-br"></div>

<div class="top-bar">
  <div class="logo-block">
    <div class="logo">ARTISANS <span>VALIDÉS</span></div>
    <div class="tagline">Alliance des Professionnels Certifiés</div>
  </div>
  <div class="stamp">
    <div class="stamp-text">Document<br/>Prioritaire</div>
    <div class="stamp-ref">Réf. ${refNum}</div>
  </div>
</div>

<div class="gold-line"></div>

<div class="title-section">
  <div class="doc-type">Attestation Officielle</div>
  <div class="doc-title">Certificat d'Exclusivité Territoriale</div>
</div>

<div class="artisan-card">
  <div class="artisan-info">
    <h2>${artisan.business_name}</h2>
    <div class="city">📍 Zone exclusive : ${artisan.city}</div>
  </div>
  <div class="artisan-meta">
    Émis le<strong>${date}</strong>
  </div>
</div>

<div class="pillars">
  <div class="pillar">
    <div class="pillar-icon">🔒</div>
    <h3>Exclusivité</h3>
    <p>Zone verrouillée : vous êtes le seul professionnel référencé dans votre secteur. Aucun concurrent autorisé.</p>
  </div>
  <div class="pillar">
    <div class="pillar-icon">⚡</div>
    <h3>Visibilité</h3>
    <p>Référencement SEO prioritaire. Votre fiche apparaît en tête pour votre métier et votre ville.</p>
  </div>
  <div class="pillar">
    <div class="pillar-icon">📱</div>
    <h3>Flux Direct</h3>
    <p>Les clients vous contactent sans intermédiaire. Zéro commission sur les demandes reçues.</p>
  </div>
</div>

<div class="faq-section">
  <div class="faq-title">Questions Fréquentes</div>
  <div class="faq-item">
    <div class="faq-q">💰 Quel est le tarif ?</div>
    <div class="faq-a">L'accès démarre à 49€/mois HT. Un seul client obtenu via la plateforme rembourse plusieurs mois d'abonnement. C'est un investissement, pas une dépense.</div>
  </div>
  <div class="faq-item">
    <div class="faq-q">🏆 Comment se différencier de la concurrence ?</div>
    <div class="faq-a">Maximum 2 professionnels par métier et par ville. Votre zone est contractuellement protégée dès validation. L'exclusivité est garantie.</div>
  </div>
  <div class="faq-item">
    <div class="faq-q">🔍 Pourquoi pas simplement Google ?</div>
    <div class="faq-a">Sur Google, vous êtes noyé parmi des dizaines de résultats et publicités. Ici, vous êtes LE professionnel recommandé, avec une fiche auditée qui inspire confiance.</div>
  </div>
</div>

<div class="cta-section">
  <a class="cta-btn" href="${url}">ACTIVER MON EXCLUSIVITÉ MAINTENANT</a>
  <div class="cta-sub">Rendez-vous sur votre fiche et cliquez sur le bouton orange pour finaliser</div>
</div>

<div class="link-row">
  🔗 Votre vitrine exclusive : <a href="${url}">${url}</a>
</div>

<div class="footer">
  <div class="sig">Moins de blabla, plus de résultats.</div>
  Document confidentiel — Artisans Validés — ${date}
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
