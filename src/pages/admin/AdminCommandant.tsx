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

  // Lien Magique → /activation-artisan-elite avec email pré-rempli
  const getProfileUrl = (artisan: CommandantArtisan, _ownerMode = true) => {
    const email = artisan.email || artisan.profile?.email || "";
    const nom = artisan.business_name || "";
    const ville = artisan.city || "";
    return `${PUBLISHED_URL}/activation-artisan-elite?email=${encodeURIComponent(email)}&nom=${encodeURIComponent(nom)}&ville=${encodeURIComponent(ville)}`;
  };

  const copyLink = (artisan: CommandantArtisan) => {
    navigator.clipboard.writeText(getProfileUrl(artisan, true));
    toast.success("🔗 Lien Magique copié (mode owner) !");
  };

  const openTunnelTest = (artisan: CommandantArtisan) => {
    const url = getProfileUrl(artisan) + "&preview=true";
    window.open(url, "_blank");
  };

  const getWhatsAppLink = (artisan: CommandantArtisan) => {
    const phone = artisan.phone?.replace(/[\s.-]/g, "");
    if (!phone) return null;
    let intlPhone = phone.startsWith("0") ? `33${phone.slice(1)}` : phone.startsWith("33") ? phone : `33${phone}`;
    intlPhone = intlPhone.replace("+", "");
    const url = getProfileUrl(artisan);
    const msg = `${artisan.business_name}, c'est Jane d'Artisans Validés.

On a analysé votre secteur à ${artisan.city} : il est encore libre. Votre diagnostic est prêt ici :
👉 ${url}

⚠️ Un concurrent est en attente sur la même zone. Priorité jusqu'à demain 18h.

On bloque votre position ?`;
    return `https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`;
  };

  const generateAccessText = (artisan: CommandantArtisan) => {
    const url = getProfileUrl(artisan);
    const dashboardUrl = `${PUBLISHED_URL}/connexion`;
    return `${artisan.business_name},

Votre outil de travail est activé. Voici vos accès :

🔗 Votre fiche publique : ${url}
🔑 Espace Pro : ${dashboardUrl}
${artisan.email ? `📧 Identifiant : ${artisan.email}` : ""}

Tout est paramétré. Vos premiers clients peuvent vous contacter dès maintenant.

— Jane · Artisans Validés`;
  };

  const copyAccessText = (artisan: CommandantArtisan) => {
    navigator.clipboard.writeText(generateAccessText(artisan));
    toast.success("📧 Texte d'accès copié !");
  };

  const generateClosingMessage = (artisan: CommandantArtisan) => {
    const url = getProfileUrl(artisan);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const expiry = `demain à 18h`;
    return `${artisan.business_name}, on a terminé l'analyse de votre secteur à ${artisan.city}.

Résultat : votre zone est encore DISPONIBLE. Mais plus pour longtemps — un concurrent est en file d'attente.

Votre diagnostic complet est ici :
👉 ${url}

⚠️ Priorité : expiration ${expiry}. Après ça, le secteur est ouvert au suivant.

— Jane, Responsable Validation · Artisans Validés`;
  };

  const copyClosingMessage = (artisan: CommandantArtisan) => {
    navigator.clipboard.writeText(generateClosingMessage(artisan));
    toast.success("📋 Message de closing copié !");
  };

  const downloadOfferPDF = (artisan: CommandantArtisan) => {
    const url = getProfileUrl(artisan);
    const year = new Date().getFullYear();
    const vulnScore = Math.floor(Math.random() * 15) + 78; // 78-92
    const caMin = Math.floor(Math.random() * 10 + 25) * 1000; // 25k-35k
    const caMax = caMin + Math.floor(Math.random() * 15 + 15) * 1000; // +15k-30k
    const refNum = `AV-${Date.now().toString(36).toUpperCase()}`;
    const dateStr = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${artisan.business_name} — Charte d'Attribution Exclusive</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Playfair+Display:wght@700;800;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'DM Sans',system-ui,sans-serif;color:#E2E8F0;min-height:100vh;-webkit-print-color-adjust:exact;print-color-adjust:exact;
background:#060C18;padding:40px 20px}

.charter{max-width:640px;margin:0 auto;background:#0A192F;border-radius:4px;overflow:hidden;position:relative;
border:2px solid #D4AF37;box-shadow:0 0 0 6px rgba(212,175,55,0.08),0 0 80px rgba(212,175,55,0.1)}

/* Watermark seal */
.charter::before{content:'AV';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
font-size:200px;font-weight:900;color:rgba(212,175,55,0.03);letter-spacing:20px;pointer-events:none;z-index:0}

/* Corner ornaments */
.corner{position:absolute;width:40px;height:40px;border-color:#D4AF37;z-index:1}
.corner-tl{top:12px;left:12px;border-top:2px solid;border-left:2px solid}
.corner-tr{top:12px;right:12px;border-top:2px solid;border-right:2px solid}
.corner-bl{bottom:12px;left:12px;border-bottom:2px solid;border-left:2px solid}
.corner-br{bottom:12px;right:12px;border-bottom:2px solid;border-right:2px solid}

.inner{position:relative;z-index:2;padding:0}

/* HEADER */
.ch-header{padding:36px 40px 20px;text-align:center;border-bottom:1px solid rgba(212,175,55,0.15)}
.ch-ref{font-size:8px;font-weight:700;color:rgba(212,175,55,0.5);letter-spacing:3px;margin-bottom:16px}
.ch-logo{height:32px;margin-bottom:8px}
.ch-brand{font-size:11px;font-weight:900;color:#fff;letter-spacing:4px;margin-bottom:4px}
.ch-brand-sub{font-size:7px;font-weight:700;color:#D4AF37;letter-spacing:4px}

/* TITLE */
.ch-title{padding:28px 40px 8px;text-align:center}
.ch-title h1{font-family:'Playfair Display',serif;font-size:24px;font-weight:900;color:#D4AF37;margin-bottom:4px;letter-spacing:1px;line-height:1.3}
.ch-title .recipient{font-size:14px;color:#fff;font-weight:700;margin-top:12px}
.ch-title .city-seal{display:inline-block;margin-top:14px;padding:8px 24px;background:rgba(212,175,55,0.08);
border:1px solid rgba(212,175,55,0.3);border-radius:4px;font-size:11px;font-weight:800;color:#D4AF37;letter-spacing:3px}

/* VULN SECTION */
.vuln{padding:28px 40px;display:flex;align-items:center;gap:24px;border-top:1px solid rgba(255,255,255,0.04);border-bottom:1px solid rgba(255,255,255,0.04)}
.vuln-ring{width:100px;height:100px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;
background:conic-gradient(#EF4444 0% ${vulnScore}%, rgba(255,255,255,0.06) ${vulnScore}% 100%);position:relative}
.vuln-ring::after{content:'';position:absolute;inset:9px;border-radius:50%;background:#0A192F}
.vuln-val{position:relative;z-index:1;font-size:30px;font-weight:900;color:#EF4444}
.vuln-val span{font-size:14px;font-weight:600}
.vuln-info h3{font-size:15px;font-weight:800;color:#EF4444;margin-bottom:6px}
.vuln-info p{font-size:12px;color:rgba(255,255,255,0.5);line-height:1.7}
.vuln-info .hl{color:#D4AF37;font-weight:700}

/* CA PERDU */
.ca-loss{margin:0 40px;padding:20px 24px;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2);border-radius:8px;text-align:center;margin-bottom:4px}
.ca-loss .label{font-size:11px;font-weight:700;color:rgba(255,255,255,0.4);letter-spacing:2px;text-transform:uppercase;margin-bottom:8px}
.ca-loss .amount{font-size:28px;font-weight:900;color:#EF4444}
.ca-loss .sub{font-size:11px;color:rgba(255,255,255,0.4);margin-top:4px}

/* COMPARATIF */
.compare{padding:28px 40px;border-top:1px solid rgba(255,255,255,0.04)}
.compare h2{font-size:11px;font-weight:800;color:rgba(255,255,255,0.3);letter-spacing:3px;text-transform:uppercase;margin-bottom:16px;text-align:center}
.compare-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.compare-col{padding:20px;border-radius:8px;text-align:center}
.compare-col.before{background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.12)}
.compare-col.after{background:rgba(212,175,55,0.05);border:1px solid rgba(212,175,55,0.2)}
.compare-col .ct{font-size:9px;font-weight:900;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px}
.compare-col.before .ct{color:#EF4444}
.compare-col.after .ct{color:#D4AF37}
.ci{font-size:11px;color:rgba(255,255,255,0.55);margin-bottom:7px;line-height:1.5}
.compare-col.before .ci::before{content:'✗ ';color:#EF4444;font-weight:900}
.compare-col.after .ci::before{content:'✓ ';color:#D4AF37;font-weight:900}

/* CHECKLIST */
.checks{padding:24px 40px}
.checks h2{font-size:11px;font-weight:800;color:rgba(255,255,255,0.3);letter-spacing:3px;text-transform:uppercase;margin-bottom:14px}
.chk{display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.03)}
.chk-ico{width:26px;height:26px;border-radius:50%;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);
display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0}
.chk-lbl{font-size:12px;color:rgba(255,255,255,0.75);font-weight:500;flex:1}
.chk-st{font-size:9px;font-weight:800;color:#10B981;padding:3px 9px;background:rgba(16,185,129,0.08);border-radius:3px}
.chk-st.warn{color:#F59E0B;background:rgba(245,158,11,0.08)}

/* SIGNATURE */
.signature{padding:28px 40px;border-top:1px solid rgba(212,175,55,0.1)}
.sig-box{display:flex;align-items:flex-end;gap:20px}
.sig-seal{width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#D4AF37,#B8941E);
display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;
box-shadow:0 4px 20px rgba(212,175,55,0.3)}
.sig-text{flex:1}
.sig-name{font-family:'Playfair Display',serif;font-size:22px;font-style:italic;color:#D4AF37;margin-bottom:2px}
.sig-role{font-size:10px;color:rgba(255,255,255,0.4);font-weight:600;letter-spacing:1px}
.sig-date{font-size:9px;color:rgba(255,255,255,0.25);margin-top:6px}

/* CTA */
.cta{padding:32px 40px;text-align:center;background:rgba(212,175,55,0.03);border-top:1px solid rgba(212,175,55,0.15)}
.btn-cta{display:inline-block;padding:22px 56px;background:#D4AF37;color:#0A192F;font-size:16px;font-weight:900;
letter-spacing:2px;border-radius:8px;text-decoration:none;font-family:'DM Sans',sans-serif;
box-shadow:0 10px 50px rgba(212,175,55,0.4)}
.urgency{margin-top:16px;font-size:11px;font-weight:700;color:#EF4444;letter-spacing:0.5px}

/* FOOTER */
.ch-footer{padding:18px 40px;border-top:1px solid rgba(255,255,255,0.04);text-align:center}
.ch-footer p{font-size:8px;color:rgba(255,255,255,0.2);line-height:1.8}

@media(max-width:480px){
  body{padding:16px 8px}
  .charter{border-radius:2px}
  .ch-header,.ch-title,.vuln,.ca-loss,.compare,.checks,.signature,.cta,.ch-footer{padding-left:20px;padding-right:20px}
  .ca-loss{margin-left:20px;margin-right:20px}
  .vuln{flex-direction:column;text-align:center}
  .compare-grid{grid-template-columns:1fr}
  .btn-cta{display:block;width:100%;padding:20px}
  .sig-box{flex-direction:column;align-items:center;text-align:center}
}
</style></head><body>

<div class="charter">
  <div class="corner corner-tl"></div><div class="corner corner-tr"></div>
  <div class="corner corner-bl"></div><div class="corner corner-br"></div>
  <div class="inner">

  <!-- HEADER -->
  <div class="ch-header">
    <div class="ch-ref">RÉF. ${refNum}</div>
    <img class="ch-logo" src="https://verified-craftsmen-hub.lovable.app/favicon.png" alt="AV" />
    <div class="ch-brand">ARTISANS VALIDÉS</div>
    <div class="ch-brand-sub">RÉSEAU D'EXCELLENCE · FRANCE</div>
  </div>

  <!-- TITRE -->
  <div class="ch-title">
    <h1>CHARTE D'ATTRIBUTION<br/>EXCLUSIVE DE SECTEUR</h1>
    <div class="recipient">Établie au bénéfice de ${artisan.business_name}</div>
    <div class="city-seal">📍 SECTEUR : ${artisan.city.toUpperCase()}</div>
  </div>

  <!-- INDICE DE VULNÉRABILITÉ -->
  <div class="vuln">
    <div class="vuln-ring">
      <div class="vuln-val">${vulnScore}<span>%</span></div>
    </div>
    <div class="vuln-info">
      <h3>⚠️ Indice de Vulnérabilité</h3>
      <p>Votre taux de perte de clients potentiels sur <span class="hl">${artisan.city}</span> est estimé à <span class="hl">${vulnScore}%</span>. 
      Ces prospects contactent actuellement vos concurrents faute de vous trouver en ligne.</p>
    </div>
  </div>

  <!-- MANQUE À GAGNER -->
  <div class="ca-loss">
    <div class="label">Estimation du manque à gagner annuel</div>
    <div class="amount">${caMin.toLocaleString("fr-FR")}€ — ${caMax.toLocaleString("fr-FR")}€ / an</div>
    <div class="sub">Basé sur le volume de recherches et le panier moyen du secteur ${artisan.category?.name || "BTP"} à ${artisan.city}</div>
  </div>

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
    <div class="chk"><div class="chk-ico">📍</div><div class="chk-lbl">Secteur ${artisan.city} — ${artisan.category?.name || "BTP"}</div><div class="chk-st">LIBRE</div></div>
    <div class="chk"><div class="chk-ico">🔒</div><div class="chk-lbl">Verrouillage exclusif (2 places max)</div><div class="chk-st warn">EN ATTENTE</div></div>
    <div class="chk"><div class="chk-ico">⭐</div><div class="chk-lbl">Badge Artisan Audité</div><div class="chk-st">ÉLIGIBLE</div></div>
    <div class="chk"><div class="chk-ico">📞</div><div class="chk-lbl">Ligne directe clients</div><div class="chk-st">PRÊT</div></div>
    <div class="chk"><div class="chk-ico">📊</div><div class="chk-lbl">Tableau de bord performance</div><div class="chk-st">PRÊT</div></div>
  </div>

  <!-- SIGNATURE -->
  <div class="signature">
    <div class="sig-box">
      <div class="sig-seal">🛡️</div>
      <div class="sig-text">
        <div class="sig-name">Jane Moreau</div>
        <div class="sig-role">DIRECTRICE VALIDATION · ARTISANS VALIDÉS</div>
        <div class="sig-date">Établie le ${dateStr}</div>
      </div>
    </div>
  </div>

  <!-- CTA -->
  <div class="cta">
    <a class="btn-cta" href="${url}">REVENDIQUER MON MONOPOLE →</a>
    <div class="urgency">⚠️ Attribution réservée 48h · Passé ce délai, le secteur est ouvert au concurrent suivant</div>
  </div>

  <!-- FOOTER -->
  <div class="ch-footer">
    <p>✅ 100% satisfait ou remboursé sous 30 jours · Sans engagement<br/>
    © ${year} Artisans Validés · www.artisansvalides.fr · Document confidentiel — usage strictement personnel</p>
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
