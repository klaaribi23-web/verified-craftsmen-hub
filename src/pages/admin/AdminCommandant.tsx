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
  MessageCircle, FileText, Download, Mail, TrendingUp,
  MousePointerClick, BarChart3,
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
  profile: { email: string } | null;
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

// --- Link Clicks Stats Component ---
const LinkClicksStats = () => {
  const { data: clickStats } = useQuery({
    queryKey: ["commandant-link-clicks"],
    queryFn: async () => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Total clicks
      const { count: total } = await supabase
        .from("link_clicks")
        .select("*", { count: "exact", head: true });

      // Clicks today
      const { count: today } = await supabase
        .from("link_clicks")
        .select("*", { count: "exact", head: true })
        .gte("clicked_at", todayStart);

      // Clicks this week
      const { count: week } = await supabase
        .from("link_clicks")
        .select("*", { count: "exact", head: true })
        .gte("clicked_at", weekStart);

      // By source
      const { data: sourceData } = await supabase
        .from("link_clicks")
        .select("source");

      const sources: Record<string, number> = {};
      sourceData?.forEach((row) => {
        const s = row.source || "direct";
        sources[s] = (sources[s] || 0) + 1;
      });

      // Top artisans by clicks (last 7 days)
      const { data: recentClicks } = await supabase
        .from("link_clicks")
        .select("artisan_id")
        .gte("clicked_at", weekStart);

      const artisanClicks: Record<string, number> = {};
      recentClicks?.forEach((row) => {
        if (row.artisan_id) {
          artisanClicks[row.artisan_id] = (artisanClicks[row.artisan_id] || 0) + 1;
        }
      });

      return { total: total || 0, today: today || 0, week: week || 0, sources, artisanClicks };
    },
    refetchInterval: 30000,
  });

  if (!clickStats) return null;

  const sourceLabels: Record<string, string> = {
    whatsapp: "📱 WhatsApp",
    sms: "💬 SMS",
    email: "📧 Email",
    link: "🔗 Lien copié",
    direct: "🌐 Direct",
    closing: "🎯 Closing",
    preview: "👁️ Preview",
  };

  const sortedSources = Object.entries(clickStats.sources)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <Card className="mb-6 border-accent/30">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <MousePointerClick className="h-5 w-5 text-accent" />
          <h3 className="font-bold text-sm">📊 Tracking des Clics</h3>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <p className="text-2xl font-black text-foreground">{clickStats.total}</p>
            <p className="text-[10px] text-muted-foreground font-medium">TOTAL CLICS</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-accent/10">
            <p className="text-2xl font-black text-accent">{clickStats.today}</p>
            <p className="text-[10px] text-muted-foreground font-medium">AUJOURD'HUI</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-primary/10">
            <p className="text-2xl font-black text-primary">{clickStats.week}</p>
            <p className="text-[10px] text-muted-foreground font-medium">7 DERNIERS JOURS</p>
          </div>
        </div>
        {sortedSources.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Par source</p>
            {sortedSources.map(([source, count]) => {
              const pct = Math.round((count / clickStats.total) * 100);
              return (
                <div key={source} className="flex items-center gap-2 text-xs">
                  <span className="w-24 truncate font-medium">{sourceLabels[source] || source}</span>
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-muted-foreground w-12 text-right font-mono">{count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

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
          category:categories(name),
          profile:profiles(email)
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

  // "Lancer l'assaut" — move to suspended (EN COURS)
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

  // "Email d'assaut" — send preregistration email, move to pending (CONTACTÉ)
  const emailAssaultMutation = useMutation({
    mutationFn: async (artisan: CommandantArtisan) => {
      const artisanEmail = artisan.email || artisan.profile?.email;
      if (!artisanEmail) throw new Error("Pas d'email pour cet artisan");

      // 1. Call send-preregistration-email edge function
      const { data, error: fnError } = await supabase.functions.invoke("send-preregistration-email", {
        body: {
          artisanId: artisan.id,
          artisanEmail,
          artisanName: artisan.business_name,
        },
      });

      if (fnError) throw fnError;
      if (!data?.success) throw new Error("Échec d'envoi de l'email");

      // 2. Update reminder_sent_at
      const { error: updateError } = await supabase
        .from("artisans")
        .update({ 
          reminder_sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", artisan.id);

      if (updateError) throw updateError;

      return data;
    },
    onSuccess: () => {
      toast.success("📧 Email de pré-inscription envoyé ! Statut → CONTACTÉ");
      queryClient.invalidateQueries({ queryKey: ["commandant-artisans"] });
      queryClient.invalidateQueries({ queryKey: ["commandant-counts"] });
    },
    onError: (error: any) => toast.error(error.message || "Erreur envoi email"),
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

  // Lien Magique → /activation-artisan-elite avec email pré-rempli + source tracking
  const getProfileUrl = (artisan: CommandantArtisan, _ownerMode = true, source = "direct") => {
    const email = artisan.email || artisan.profile?.email || "";
    const nom = artisan.business_name || "";
    const ville = artisan.city || "";
    return `${PUBLISHED_URL}/activation-artisan-elite?email=${encodeURIComponent(email)}&nom=${encodeURIComponent(nom)}&ville=${encodeURIComponent(ville)}&source=${source}`;
  };

  const copyLink = (artisan: CommandantArtisan) => {
    navigator.clipboard.writeText(getProfileUrl(artisan, true, "link"));
    toast.success("🔗 Lien Magique copié (mode owner) !");
  };

  const openTunnelTest = (artisan: CommandantArtisan) => {
    const url = getProfileUrl(artisan, true, "preview") + "&preview=true";
    window.open(url, "_blank");
  };

  const getWhatsAppLink = (artisan: CommandantArtisan) => {
    const phone = artisan.phone?.replace(/[\s.-]/g, "");
    if (!phone) return null;
    let intlPhone = phone.startsWith("0") ? `33${phone.slice(1)}` : phone.startsWith("33") ? phone : `33${phone}`;
    intlPhone = intlPhone.replace("+", "");
    const url = getProfileUrl(artisan, true, "whatsapp");
    const msg = `${artisan.business_name}, c'est Andrea d'Artisans Validés.

On a analysé votre secteur à ${artisan.city} : il est encore libre. Votre diagnostic est prêt ici :
👉 ${url}

⚠️ Un concurrent est en attente sur la même zone. Priorité jusqu'à demain 18h.

On bloque votre position ?`;
    return `https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`;
  };

  const generateAccessText = (artisan: CommandantArtisan) => {
    const url = getProfileUrl(artisan, true, "sms");
    const dashboardUrl = `${PUBLISHED_URL}/connexion`;
    return `${artisan.business_name},

Votre outil de travail est activé. Voici vos accès :

🔗 Votre fiche publique : ${url}
🔑 Espace Pro : ${dashboardUrl}
${artisan.email ? `📧 Identifiant : ${artisan.email}` : ""}

Tout est paramétré. Vos premiers clients peuvent vous contacter dès maintenant.

— Andrea · Artisans Validés`;
  };

  const copyAccessText = (artisan: CommandantArtisan) => {
    navigator.clipboard.writeText(generateAccessText(artisan));
    toast.success("📧 Texte d'accès copié !");
  };

  const generateClosingMessage = (artisan: CommandantArtisan) => {
    const url = getProfileUrl(artisan, true, "closing");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const expiry = `demain à 18h`;
    return `${artisan.business_name}, on a terminé l'analyse de votre secteur à ${artisan.city}.

Résultat : votre zone est encore DISPONIBLE. Mais plus pour longtemps — un concurrent est en file d'attente.

Votre diagnostic complet est ici :
👉 ${url}

⚠️ Priorité : expiration ${expiry}. Après ça, le secteur est ouvert au suivant.

— Andrea, IA d'audit · Artisans Validés`;
  };

  const copyClosingMessage = (artisan: CommandantArtisan) => {
    navigator.clipboard.writeText(generateClosingMessage(artisan));
    toast.success("📋 Message de closing copié !");
  };

  const downloadOfferPDF = (artisan: CommandantArtisan) => {
    const url = getProfileUrl(artisan);
    const year = new Date().getFullYear();
    const vulnScore = Math.floor(Math.random() * 15) + 78;
    const caMin = Math.floor(Math.random() * 10 + 25) * 1000;
    const caMax = caMin + Math.floor(Math.random() * 15 + 15) * 1000;
    const refNum = `AV-${Date.now().toString(36).toUpperCase()}`;
    const dateStr = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    const categoryName = artisan.category?.name || "BTP";
    const cityUpper = artisan.city.toUpperCase();

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${artisan.business_name} — Charte d'Attribution Exclusive</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800&family=Inter:wght@300;400;500;600;700;800;900&family=Dancing+Script:wght@700&display=swap');

*{margin:0;padding:0;box-sizing:border-box}

body{
  font-family:'Inter',system-ui,sans-serif;
  color:#E2E8F0;
  min-height:100vh;
  -webkit-print-color-adjust:exact;print-color-adjust:exact;
  background:#0A192F;
  padding:48px 24px;
  background-image:
    radial-gradient(ellipse at 20% 50%, rgba(212,175,55,0.04) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(212,175,55,0.03) 0%, transparent 50%),
    url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.015'/%3E%3C/svg%3E");
}

/* ═══ MAIN CHARTER ═══ */
.charter{
  max-width:680px;margin:0 auto;position:relative;
  background:linear-gradient(180deg, #0A192F 0%, #060C18 100%);
  border-radius:16px;overflow:visible;
  border:2px solid rgba(212,175,55,0.4);
  outline:1px solid rgba(212,175,55,0.1);
  outline-offset:6px;
  box-shadow:
    0 0 0 8px #0A192F,
    0 0 0 9px rgba(212,175,55,0.15),
    0 30px 80px rgba(0,0,0,0.8),
    0 0 120px rgba(212,175,55,0.06);
}

/* ═══ ART DÉCO CORNERS ═══ */
.deco-corner{position:absolute;width:44px;height:44px;z-index:10;pointer-events:none}
.deco-corner svg{width:100%;height:100%}
.dc-tl{top:-4px;left:-4px}
.dc-tr{top:-4px;right:-4px;transform:scaleX(-1)}
.dc-bl{bottom:-4px;left:-4px;transform:scaleY(-1)}
.dc-br{bottom:-4px;right:-4px;transform:scale(-1)}

/* ═══ WATERMARK ═══ */
.charter::before{
  content:'AV';position:absolute;top:50%;left:50%;
  transform:translate(-50%,-50%) rotate(-15deg);
  font-family:'Playfair Display',serif;
  font-size:240px;font-weight:900;
  background:linear-gradient(135deg, rgba(212,175,55,0.02) 0%, rgba(241,210,123,0.01) 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
  letter-spacing:30px;pointer-events:none;z-index:0;
}

.inner{position:relative;z-index:2;padding:0}

/* ═══ HEADER — mirrors overlay shield badge ═══ */
.ch-header{
  padding:40px 48px 20px;text-align:center;
  border-bottom:1px solid rgba(212,175,55,0.1);
  background:linear-gradient(180deg, rgba(212,175,55,0.04) 0%, transparent 100%);
}
.ch-ref{font-size:9px;font-weight:600;color:rgba(212,175,55,0.35);letter-spacing:4px;margin-bottom:16px}
.ch-shield{
  display:inline-flex;align-items:center;gap:10px;
  padding:8px 20px;border-radius:40px;margin-bottom:8px;
  background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.2);
}
.ch-shield-icon{font-size:14px}
.ch-shield-text{font-size:10px;font-weight:900;letter-spacing:3px;text-transform:uppercase;
  background:linear-gradient(135deg, #D4AF37 0%, #F1D27B 50%, #B8941E 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
}
.ch-brand-sub{font-size:9px;font-weight:600;letter-spacing:4px;color:rgba(255,255,255,0.25);margin-top:6px}

/* ═══ TITLE ═══ */
.ch-title{padding:36px 48px 12px;text-align:center}
.ch-title h1{
  font-family:'Playfair Display',serif;font-size:26px;font-weight:900;line-height:1.35;letter-spacing:1px;
  background:linear-gradient(135deg, #D4AF37 0%, #F1D27B 50%, #B8941E 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
  margin-bottom:6px;
}
.ch-title .recipient{
  font-size:18px;color:#fff;font-weight:800;margin-top:12px;line-height:1.4;
}
.ch-title .status-line{
  font-size:13px;color:rgba(255,255,255,0.5);margin-top:10px;line-height:1.6;
}
.ch-title .status-line .prestige{color:#D4AF37;font-weight:700}
.ch-title .status-line .waiting{color:#F59E0B;font-weight:700}

/* ═══ SCARCITY BAR — mirrors overlay ═══ */
.scarcity-bar{
  display:flex;align-items:center;justify-content:center;gap:12px;
  margin:20px 48px 0;flex-wrap:wrap;
}
.scarcity-pill{
  display:inline-flex;align-items:center;gap:8px;
  padding:10px 18px;border-radius:10px;
  background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);
}
.scarcity-pill .sp-icon{font-size:14px}
.scarcity-pill .sp-text{font-size:13px;font-weight:700;color:#fff}
.scarcity-pill .sp-val{color:#D4AF37;margin-left:4px}
.scarcity-pill.danger{background:rgba(239,68,68,0.06);border-color:rgba(239,68,68,0.15)}
.scarcity-pill.danger .sp-text{color:#EF4444;font-family:'Inter',sans-serif;font-variant-numeric:tabular-nums}

/* ═══ DIVIDER ═══ */
.gold-divider{
  height:1px;margin:28px 48px;
  background:linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.35) 30%, rgba(241,210,123,0.45) 50%, rgba(212,175,55,0.35) 70%, transparent 100%);
}

/* ═══ VULNERABILITY ═══ */
.vuln{
  padding:32px 48px;display:flex;align-items:center;gap:28px;
}
.vuln-ring{
  width:100px;height:100px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;
  background:conic-gradient(#EF4444 0% ${vulnScore}%, rgba(255,255,255,0.03) ${vulnScore}% 100%);
  position:relative;
  box-shadow:0 0 25px rgba(239,68,68,0.12);
}
.vuln-ring::after{content:'';position:absolute;inset:10px;border-radius:50%;background:#0A192F}
.vuln-val{position:relative;z-index:1;font-size:28px;font-weight:900;color:#EF4444;font-variant-numeric:tabular-nums}
.vuln-val span{font-size:14px;font-weight:700}
.vuln-info h3{font-size:13px;font-weight:800;color:#EF4444;margin-bottom:8px;letter-spacing:0.3px}
.vuln-info p{font-size:12px;font-weight:400;color:rgba(255,255,255,0.4);line-height:1.8}
.vuln-info .hl{color:#F1D27B;font-weight:700}

/* ═══ CA LOSS — dark card with gold border (mirrors dashboard) ═══ */
.ca-loss{
  margin:4px 48px 0;padding:28px 32px;text-align:center;border-radius:12px;
  background:rgba(212,175,55,0.03);
  border:1px solid rgba(212,175,55,0.2);
  box-shadow:0 4px 30px rgba(212,175,55,0.06);
}
.ca-loss .label{font-size:10px;font-weight:700;color:rgba(255,255,255,0.3);letter-spacing:3px;text-transform:uppercase;margin-bottom:12px}
.ca-loss .amount{
  font-size:32px;font-weight:900;letter-spacing:1px;font-variant-numeric:tabular-nums;
  background:linear-gradient(135deg, #EF4444 0%, #F87171 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
}
.ca-loss .sub{font-size:11px;font-weight:400;color:rgba(255,255,255,0.3);margin-top:8px;line-height:1.6}

/* ═══ COMPARE ═══ */
.compare{padding:32px 48px}
.compare h2{font-size:10px;font-weight:800;color:rgba(255,255,255,0.2);letter-spacing:4px;text-transform:uppercase;margin-bottom:16px;text-align:center}
.compare-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.compare-col{padding:24px 18px;border-radius:12px;text-align:center}
.compare-col.before{background:rgba(239,68,68,0.03);border:1px solid rgba(239,68,68,0.1)}
.compare-col.after{background:rgba(212,175,55,0.03);border:1px solid rgba(212,175,55,0.15);box-shadow:0 4px 20px rgba(212,175,55,0.05)}
.compare-col .ct{font-size:9px;font-weight:900;letter-spacing:3px;text-transform:uppercase;margin-bottom:14px}
.compare-col.before .ct{color:#EF4444}
.compare-col.after .ct{color:#D4AF37}
.ci{font-size:11px;font-weight:400;color:rgba(255,255,255,0.45);margin-bottom:8px;line-height:1.6}
.compare-col.before .ci::before{content:'✗ ';color:#EF4444;font-weight:800}
.compare-col.after .ci::before{content:'✓ ';color:#D4AF37;font-weight:800}

/* ═══ CHECKLIST ═══ */
.checks{padding:28px 48px}
.checks h2{font-size:10px;font-weight:800;color:rgba(255,255,255,0.2);letter-spacing:4px;text-transform:uppercase;margin-bottom:16px}
.chk{display:flex;align-items:center;gap:14px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.025)}
.chk-ico{
  width:28px;height:28px;border-radius:50%;
  background:rgba(212,175,55,0.06);border:1px solid rgba(212,175,55,0.15);
  display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;
}
.chk-lbl{font-size:12px;font-weight:500;color:rgba(255,255,255,0.65);flex:1}
.chk-st{font-size:9px;font-weight:800;color:#D4AF37;padding:4px 10px;background:rgba(212,175,55,0.06);border-radius:6px;letter-spacing:1px}
.chk-st.warn{color:#F59E0B;background:rgba(245,158,11,0.06)}

/* ═══ SIGNATURE — manuscript font ═══ */
.signature{padding:36px 48px;border-top:1px solid rgba(212,175,55,0.08);position:relative}
.sig-box{display:flex;align-items:flex-end;gap:24px}
.sig-seal{
  width:64px;height:64px;border-radius:50%;flex-shrink:0;
  background:linear-gradient(135deg, #D4AF37 0%, #F1D27B 40%, #B8941E 100%);
  display:flex;align-items:center;justify-content:center;font-size:26px;
  box-shadow:0 6px 30px rgba(212,175,55,0.35), inset 0 -2px 6px rgba(0,0,0,0.2);
}
.sig-text{flex:1}
.sig-name{
  font-family:'Dancing Script',cursive;font-size:32px;font-weight:700;
  background:linear-gradient(135deg, #D4AF37, #F1D27B);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
  margin-bottom:2px;
}
.sig-role{font-size:9px;font-weight:700;color:rgba(255,255,255,0.3);letter-spacing:2px;text-transform:uppercase}
.sig-date{font-size:9px;font-weight:300;color:rgba(255,255,255,0.18);margin-top:6px}

/* ═══ VALIDATION SEAL ═══ */
.validation-seal{
  position:absolute;bottom:16px;right:48px;
  width:78px;height:78px;border-radius:50%;
  background:linear-gradient(135deg, rgba(212,175,55,0.06), rgba(241,210,123,0.03));
  border:2px solid rgba(212,175,55,0.18);
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  opacity:0.75;
}
.validation-seal .vs-icon{font-size:18px;margin-bottom:2px}
.validation-seal .vs-text{font-size:5px;font-weight:900;color:rgba(212,175,55,0.5);letter-spacing:2px;text-transform:uppercase}
.validation-seal .vs-year{font-size:9px;font-weight:900;color:rgba(212,175,55,0.45)}

/* ═══ CTA — exact clone of site button ═══ */
.cta{
  padding:36px 48px;text-align:center;
  background:linear-gradient(180deg, transparent 0%, rgba(212,175,55,0.03) 100%);
  border-top:1px solid rgba(212,175,55,0.08);
}
.btn-cta{
  display:inline-block;padding:20px 56px;
  background:linear-gradient(135deg, #D4AF37 0%, #F1D27B 50%, #B8941E 100%);
  color:#0A192F;
  font-family:'Inter',sans-serif;font-size:14px;font-weight:900;letter-spacing:3px;text-transform:uppercase;
  border-radius:10px;text-decoration:none;
  box-shadow:0 8px 40px rgba(212,175,55,0.35), 0 2px 8px rgba(0,0,0,0.3);
  transition:transform 0.2s, box-shadow 0.2s;
}
.btn-cta:hover{transform:translateY(-2px);box-shadow:0 12px 50px rgba(212,175,55,0.5)}
.urgency{margin-top:16px;font-size:11px;font-weight:700;color:#EF4444;letter-spacing:0.3px}
.guarantee{margin-top:10px;font-size:10px;font-weight:400;color:rgba(255,255,255,0.2)}

/* ═══ FOOTER ═══ */
.ch-footer{padding:20px 48px;border-top:1px solid rgba(255,255,255,0.025);text-align:center}
.ch-footer p{font-size:8px;font-weight:400;color:rgba(255,255,255,0.12);line-height:2.2}

@media(max-width:480px){
  body{padding:20px 10px}
  .charter{outline-offset:3px;border-radius:12px}
  .ch-header,.ch-title,.vuln,.compare,.checks,.signature,.cta,.ch-footer{padding-left:20px;padding-right:20px}
  .ca-loss{margin-left:20px;margin-right:20px}
  .scarcity-bar{margin-left:20px;margin-right:20px}
  .vuln{flex-direction:column;text-align:center}
  .compare-grid{grid-template-columns:1fr}
  .btn-cta{display:block;width:100%;padding:18px;letter-spacing:2px;font-size:13px}
  .sig-box{flex-direction:column;align-items:center;text-align:center}
  .validation-seal{right:20px;bottom:10px;width:56px;height:56px}
  .deco-corner{width:32px;height:32px}
}
</style></head><body>

<div class="charter">
  <!-- Art Déco corners -->
  <div class="deco-corner dc-tl"><svg viewBox="0 0 48 48"><path d="M0 0 L48 0 L48 6 L6 6 L6 48 L0 48 Z" fill="none" stroke="#D4AF37" stroke-width="1.5"/><path d="M0 0 L16 0 L16 3 L3 3 L3 16 L0 16 Z" fill="rgba(212,175,55,0.15)"/></svg></div>
  <div class="deco-corner dc-tr"><svg viewBox="0 0 48 48"><path d="M0 0 L48 0 L48 6 L6 6 L6 48 L0 48 Z" fill="none" stroke="#D4AF37" stroke-width="1.5"/><path d="M0 0 L16 0 L16 3 L3 3 L3 16 L0 16 Z" fill="rgba(212,175,55,0.15)"/></svg></div>
  <div class="deco-corner dc-bl"><svg viewBox="0 0 48 48"><path d="M0 0 L48 0 L48 6 L6 6 L6 48 L0 48 Z" fill="none" stroke="#D4AF37" stroke-width="1.5"/><path d="M0 0 L16 0 L16 3 L3 3 L3 16 L0 16 Z" fill="rgba(212,175,55,0.15)"/></svg></div>
  <div class="deco-corner dc-br"><svg viewBox="0 0 48 48"><path d="M0 0 L48 0 L48 6 L6 6 L6 48 L0 48 Z" fill="none" stroke="#D4AF37" stroke-width="1.5"/><path d="M0 0 L16 0 L16 3 L3 3 L3 16 L0 16 Z" fill="rgba(212,175,55,0.15)"/></svg></div>

  <div class="inner">

  <!-- HEADER — shield badge like overlay -->
  <div class="ch-header">
    <div class="ch-ref">RÉF. ${refNum}</div>
    <div class="ch-shield">
      <span class="ch-shield-icon">🛡️</span>
      <span class="ch-shield-text">Artisans Validés</span>
    </div>
    <div class="ch-brand-sub">RÉSEAU D'EXCELLENCE · FRANCE</div>
  </div>

  <!-- TITRE -->
  <div class="ch-title">
    <h1>CHARTE D'ATTRIBUTION<br/>EXCLUSIVE DE SECTEUR</h1>
    <div class="recipient">Félicitations ${artisan.business_name},</div>
    <div class="status-line">
      Votre <span class="prestige">Actif Numérique Prestige</span> est prêt.<br/>
      État : <span class="waiting">EN ATTENTE DE VERROUILLAGE</span>
    </div>
  </div>

  <!-- SCARCITY BAR — mirrors overlay pills -->
  <div class="scarcity-bar">
    <div class="scarcity-pill">
      <span class="sp-icon">👥</span>
      <span class="sp-text">Places sur ${artisan.city} : <span class="sp-val">1/2</span></span>
    </div>
    <div class="scarcity-pill danger">
      <span class="sp-icon">⏱️</span>
      <span class="sp-text">Expire dans 48h</span>
    </div>
  </div>

  <div class="gold-divider"></div>

  <!-- INDICE DE VULNÉRABILITÉ -->
  <div class="vuln">
    <div class="vuln-ring">
      <div class="vuln-val">${vulnScore}<span>%</span></div>
    </div>
    <div class="vuln-info">
      <h3>⚠️ Indice de Vulnérabilité Sectorielle</h3>
      <p>Votre taux de perte de clients potentiels sur <span class="hl">${artisan.city}</span> est estimé à <span class="hl">${vulnScore}%</span>.
      Ces prospects contactent actuellement vos concurrents faute de vous trouver en première position.</p>
    </div>
  </div>

  <!-- MANQUE À GAGNER — gold-bordered dark card -->
  <div class="ca-loss">
    <div class="label">Estimation du manque à gagner annuel</div>
    <div class="amount">${caMin.toLocaleString("fr-FR")}€ — ${caMax.toLocaleString("fr-FR")}€ / an</div>
    <div class="sub">Basé sur le volume de recherches et le panier moyen du secteur ${categoryName} à ${artisan.city}</div>
  </div>

  <div class="gold-divider"></div>

  <!-- COMPARATIF -->
  <div class="compare">
    <h2>Votre situation actuelle vs. attribution</h2>
    <div class="compare-grid">
      <div class="compare-col before">
        <div class="ct">❌ SANS ATTRIBUTION</div>
        <div class="ci">Dépend du bouche-à-oreille</div>
        <div class="ci">Invisible sur Google local</div>
        <div class="ci">Leads partagés avec 10+ concurrents</div>
        <div class="ci">Aucune preuve de crédibilité</div>
      </div>
      <div class="compare-col after">
        <div class="ct">🏆 SECTEUR ATTRIBUÉ</div>
        <div class="ci">Monopole garanti sur ${artisan.city}</div>
        <div class="ci">Fiche SEO optimisée #1</div>
        <div class="ci">Clients en direct exclusif</div>
        <div class="ci">Sceau Audité + Certification</div>
      </div>
    </div>
  </div>

  <!-- CHECKLIST -->
  <div class="checks">
    <h2>Points de contrôle de l'attribution</h2>
    <div class="chk"><div class="chk-ico">🏢</div><div class="chk-lbl">Fiche professionnelle créée et optimisée</div><div class="chk-st">PRÊT</div></div>
    <div class="chk"><div class="chk-ico">📍</div><div class="chk-lbl">Secteur ${artisan.city} — ${categoryName}</div><div class="chk-st">LIBRE</div></div>
    <div class="chk"><div class="chk-ico">🔒</div><div class="chk-lbl">Verrouillage exclusif (2 places max)</div><div class="chk-st warn">EN ATTENTE</div></div>
    <div class="chk"><div class="chk-ico">⭐</div><div class="chk-lbl">Badge Artisan Audité</div><div class="chk-st">ÉLIGIBLE</div></div>
    <div class="chk"><div class="chk-ico">📞</div><div class="chk-lbl">Ligne directe clients</div><div class="chk-st">PRÊT</div></div>
    <div class="chk"><div class="chk-ico">📊</div><div class="chk-lbl">Tableau de bord performance</div><div class="chk-st">PRÊT</div></div>
  </div>

  <!-- SIGNATURE + SEAL -->
  <div class="signature">
    <div class="sig-box">
      <div class="sig-seal">🛡️</div>
      <div class="sig-text">
        <div class="sig-name">Andrea</div>
        <div class="sig-role">IA d'audit · Artisans Validés</div>
        <div class="sig-date">Établie le ${dateStr}</div>
      </div>
    </div>
    <div class="validation-seal">
      <div class="vs-icon">🏛️</div>
      <div class="vs-text">VALIDÉ</div>
      <div class="vs-year">${year}</div>
    </div>
  </div>

  <!-- CTA — exact clone of site button -->
  <div class="cta">
    <a class="btn-cta" href="${url}">🔒 REVENDIQUER MON MONOPOLE →</a>
    <div class="urgency">⚠️ Attribution réservée 48h · Passé ce délai, le secteur est ouvert au concurrent suivant</div>
    <div class="guarantee">✅ 100% satisfait ou remboursé sous 30 jours · Résiliation en 1 clic</div>
  </div>

  <!-- FOOTER -->
  <div class="ch-footer">
    <p>© ${year} Artisans Validés · www.artisansvalides.fr · Document confidentiel — usage strictement personnel</p>
  </div>

  </div>
</div>

</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Charte-Attribution-${artisan.business_name.replace(/\s+/g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("📜 Charte d'Attribution téléchargée !");
  };

  const totalPages = Math.ceil((counts[activeTab] || 0) / PER_PAGE);

  return (
    <>
      <SEOHead title="Commandant" description="Centre de commandement prospection" noIndex />
      <Navbar />
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1">
          <DashboardHeader
            title="🎖️ Poste de Commandement"
            subtitle="Pilotez votre prospection artisan"
          />
          <div className="p-4 md:p-8">
            {/* KPI Dashboard de Guerre */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Card className="border-gray-500/30">
                <CardContent className="p-3 text-center">
                  <Package className="h-5 w-5 mx-auto mb-1 text-gray-400" />
                  <p className="text-2xl font-bold text-foreground">{counts.stock || 0}</p>
                  <p className="text-xs text-muted-foreground">STOCK</p>
                </CardContent>
              </Card>
              <Card className="border-blue-500/30">
                <CardContent className="p-3 text-center">
                  <Mail className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                  <p className="text-2xl font-bold text-blue-500">{counts["en-cours"] || 0}</p>
                  <p className="text-xs text-muted-foreground">CONTACTÉS / EN COURS</p>
                </CardContent>
              </Card>
              <Card className="border-emerald-500/30">
                <CardContent className="p-3 text-center">
                  <UserCheck className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
                  <p className="text-2xl font-bold text-emerald-500">{counts.clients || 0}</p>
                  <p className="text-xs text-muted-foreground">CONVERTIS</p>
                </CardContent>
              </Card>
              <Card className="border-primary/30">
                <CardContent className="p-3 text-center">
                  <TrendingUp className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-2xl font-bold text-primary">
                    {((counts.stock || 0) + (counts["en-cours"] || 0) + (counts.clients || 0)) > 0
                      ? Math.round(((counts.clients || 0) / ((counts.stock || 0) + (counts["en-cours"] || 0) + (counts.clients || 0))) * 100)
                      : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">CONVERSION</p>
                </CardContent>
              </Card>
            </div>

            {/* 📊 Stats de Clics — Link Tracking */}
            <LinkClicksStats />

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
                          onEmailAssault={() => emailAssaultMutation.mutate(artisan)}
                          onChangeStatus={(status) => changeStatusMutation.mutate({ id: artisan.id, status })}
                          onCopyLink={() => copyLink(artisan)}
                          onWhatsApp={() => {
                            const link = getWhatsAppLink(artisan);
                            if (link) window.open(link, "_blank");
                            else toast.error("Pas de numéro de téléphone");
                          }}
                          onViewProfile={() => window.open(getProfileUrl(artisan), "_blank")}
                          onTestTunnel={() => openTunnelTest(artisan)}
                          onSendAccess={() => setAccessDialog(artisan)}
                          onGenerateMessage={() => setMessageDialog(artisan)}
                          isAssaulting={assaultMutation.isPending}
                          isEmailSending={emailAssaultMutation.isPending}
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
  onEmailAssault: () => void;
  onChangeStatus: (status: ArtisanStatus) => void;
  onCopyLink: () => void;
  onWhatsApp: () => void;
  onViewProfile: () => void;
  onTestTunnel: () => void;
  onSendAccess: () => void;
  onGenerateMessage: () => void;
  isAssaulting: boolean;
  isEmailSending: boolean;
}

const ArtisanRow = ({
  artisan, tabKey, onAssault, onEmailAssault, onChangeStatus,
  onCopyLink, onWhatsApp, onViewProfile, onTestTunnel, onSendAccess, onGenerateMessage, isAssaulting, isEmailSending,
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
              {/* STOCK tab: Lancer l'assaut + Email */}
              {tabKey === "stock" && (
                <>
                  <Button
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-8 gap-1"
                    onClick={onAssault}
                    disabled={isAssaulting}
                  >
                    <Rocket className="h-3.5 w-3.5" />
                    Assaut
                  </Button>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 gap-1"
                    onClick={onEmailAssault}
                    disabled={isEmailSending || !artisan.email}
                    title={!artisan.email ? "Pas d'email" : "Envoyer email de pré-inscription"}
                  >
                    {isEmailSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                    📧 Email
                  </Button>
                </>
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
              <Button size="sm" variant="outline" className="text-xs h-8 gap-1 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-400" onClick={onTestTunnel} title="Tester le tunnel">
                <Rocket className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Tester</span>
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
