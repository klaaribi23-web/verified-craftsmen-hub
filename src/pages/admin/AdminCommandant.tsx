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
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Offre Exclusive — ${artisan.business_name}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Arial,sans-serif;color:#1A2B48;background:#fff;line-height:1.6}
.header{background:linear-gradient(135deg,#1A2B48 0%,#0f1c30 100%);color:#fff;padding:40px 48px 32px;position:relative;overflow:hidden}
.header::after{content:'';position:absolute;top:0;right:0;width:200px;height:100%;background:linear-gradient(135deg,transparent 50%,rgba(234,88,12,0.15) 100%)}
.logo{font-size:26px;font-weight:800;letter-spacing:-0.5px}.logo span{color:#ea580c}
.subtitle{font-size:13px;color:rgba(255,255,255,0.6);margin-top:4px;letter-spacing:1px;text-transform:uppercase}
.banner{background:#ea580c;color:#fff;text-align:center;padding:14px 24px;font-weight:700;font-size:14px;letter-spacing:0.5px}
.content{padding:40px 48px}
.meta{display:flex;gap:32px;margin-bottom:36px;padding-bottom:24px;border-bottom:2px solid #f0f0f0}
.meta-item{font-size:14px;color:#64748b}.meta-item strong{display:block;font-size:16px;color:#1A2B48;margin-top:2px}
.section-title{font-size:18px;font-weight:700;color:#1A2B48;margin-bottom:20px;display:flex;align-items:center;gap:10px}
.section-title::before{content:'';width:4px;height:24px;background:#ea580c;border-radius:2px;display:inline-block}
.cards{display:flex;gap:16px;margin-bottom:40px}
.card{flex:1;border:1px solid #e8ecf0;border-radius:12px;padding:24px 20px;position:relative;overflow:hidden}
.card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px}
.card:nth-child(1)::before{background:#ea580c}
.card:nth-child(2)::before{background:#1A2B48}
.card:nth-child(3)::before{background:#D4AF37}
.card-icon{width:44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:14px}
.card:nth-child(1) .card-icon{background:#fff7ed;color:#ea580c}
.card:nth-child(2) .card-icon{background:#f0f4f8;color:#1A2B48}
.card:nth-child(3) .card-icon{background:#fefce8;color:#D4AF37}
.card h3{font-size:15px;font-weight:700;color:#1A2B48;margin-bottom:8px}
.card p{font-size:13px;color:#64748b;line-height:1.5}
.faq{margin-bottom:40px}
.faq-item{border:1px solid #e8ecf0;border-radius:10px;padding:18px 22px;margin-bottom:10px}
.faq-q{font-weight:700;font-size:14px;color:#1A2B48;margin-bottom:6px;display:flex;align-items:center;gap:8px}
.faq-q::before{content:'Q';display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:#ea580c;color:#fff;border-radius:6px;font-size:11px;font-weight:800;flex-shrink:0}
.faq-a{font-size:13px;color:#475569;padding-left:30px}
.cta-box{background:linear-gradient(135deg,#1A2B48 0%,#0f1c30 100%);border-radius:14px;padding:32px 36px;text-align:center;margin-bottom:32px}
.cta-box h2{color:#fff;font-size:18px;font-weight:700;margin-bottom:8px}
.cta-box p{color:rgba(255,255,255,0.7);font-size:13px;margin-bottom:20px}
.cta-btn{display:inline-block;background:#ea580c;color:#fff;padding:14px 40px;border-radius:10px;font-size:16px;font-weight:800;text-decoration:none;letter-spacing:0.3px;text-transform:uppercase}
.cta-btn:hover{background:#c2410c}
.link-box{background:#f8fafc;border:1px dashed #cbd5e1;border-radius:10px;padding:14px 20px;margin-bottom:32px;word-break:break-all;font-size:13px;color:#64748b}
.link-box a{color:#ea580c;font-weight:600}
.footer{text-align:center;padding:24px 48px;border-top:1px solid #e8ecf0;font-size:11px;color:#94a3b8}
</style></head><body>

<div class="header">
<div class="logo">ARTISANS <span>VALIDÉS</span></div>
<div class="subtitle">Alliance des Professionnels Certifiés</div>
</div>

<div class="banner">⚠️ RÉSERVATION PRIORITAIRE — CETTE PLACE EXPIRE DEMAIN À 18H00</div>

<div class="content">

<div class="meta">
<div class="meta-item">Artisan<strong>${artisan.business_name}</strong></div>
<div class="meta-item">Zone<strong>${artisan.city}</strong></div>
<div class="meta-item">Date<strong>${date}</strong></div>
</div>

<div class="section-title">Votre offre en 3 points</div>
<div class="cards">
<div class="card">
<div class="card-icon">🔒</div>
<h3>Exclusivité Géographique</h3>
<p>Vous êtes le seul professionnel référencé dans votre zone. Aucun concurrent ne peut apparaître à côté de vous. Votre territoire est verrouillé.</p>
</div>
<div class="card">
<div class="card-icon">📲</div>
<h3>Flux Direct de Clients</h3>
<p>Les particuliers vous contactent directement via votre fiche. Zéro intermédiaire, zéro commission. Chaque demande arrive dans votre espace.</p>
</div>
<div class="card">
<div class="card-icon">📈</div>
<h3>Visibilité Prioritaire</h3>
<p>Votre profil est optimisé pour le référencement local (SEO). Vous apparaissez en tête des résultats pour votre métier et votre ville.</p>
</div>
</div>

<div class="section-title">Questions fréquentes</div>
<div class="faq">
<div class="faq-item">
<div class="faq-q">Combien ça coûte ?</div>
<div class="faq-a">L'accès démarre à partir de 49€/mois HT. C'est un investissement, pas une dépense : un seul client obtenu via la plateforme rembourse plusieurs mois d'abonnement.</div>
</div>
<div class="faq-item">
<div class="faq-q">L'exclusivité est-elle vraiment garantie ?</div>
<div class="faq-a">Oui. Maximum 2 professionnels par métier et par ville. Une fois votre zone validée, aucun concurrent direct ne pourra être référencé à côté de vous.</div>
</div>
<div class="faq-item">
<div class="faq-q">Quelle différence avec Google ou les annuaires ?</div>
<div class="faq-a">Sur Google, vous êtes noyé parmi des dizaines de résultats et de publicités. Ici, vous êtes LE professionnel recommandé pour votre zone. Chaque fiche est auditée et certifiée, ce qui inspire confiance aux clients.</div>
</div>
<div class="faq-item">
<div class="faq-q">Puis-je annuler à tout moment ?</div>
<div class="faq-a">Oui, sans engagement de durée. Mais attention : si vous libérez votre zone, elle sera proposée à un autre professionnel.</div>
</div>
</div>

<div class="cta-box">
<h2>POUR VALIDER VOTRE ZONE</h2>
<p>Rendez-vous sur votre fiche et cliquez sur le bouton orange</p>
<a class="cta-btn" href="${url}">CLIQUEZ SUR LE BOUTON ORANGE DE VOTRE FICHE</a>
</div>

<div class="link-box">
🔗 Votre vitrine : <a href="${url}">${url}</a>
</div>

</div>

<div class="footer">
Document confidentiel généré par Artisans Validés — ${date}<br/>
Moins de blabla, plus de résultats.
</div>

</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Offre-${artisan.business_name.replace(/\s+/g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("📄 Récapitulatif téléchargé ! Ouvrez-le et imprimez en PDF.");
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
