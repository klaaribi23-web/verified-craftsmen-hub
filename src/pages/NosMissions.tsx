import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MapPin,
  Euro,
  Calendar,
  Users,
  Send,
  RotateCcw,
  Eye,
  CheckCircle2,
  LogIn,
  UserPlus,
  Search,
  ShieldCheck,
  ArrowRight,
  Briefcase,
  BadgeCheck,
  Lock,
  Radar,
  Flame,
  DollarSign,
} from "lucide-react";
import { CityAutocompleteAPI } from "@/components/location/CityAutocompleteAPI";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useDemoMissions } from "@/hooks/usePublicData";
import { useCategoriesHierarchy } from "@/hooks/useCategories";
import { CategorySelect } from "@/components/categories/CategorySelect";
import { CategoryIcon } from "@/components/categories/CategoryIcon";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import MissionDetailModal from "@/components/missions/MissionDetailModal";
import { calculateDistance } from "@/lib/geoDistance";
import { useCityCoordinatesCache } from "@/hooks/useCityCoordinatesCache";
import { useMissionApplicationLimit } from "@/hooks/useMissionApplicationLimit";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const ITEMS_PER_PAGE = 30;

// ── Demo missions displayed when DB is empty ──
const BADGES = ["Mission Auditée & Certifiée", "Validation Expertise Métier", "Algorithme de Confiance ✓"] as const;
const randomBadge = (i: number) => BADGES[i % BADGES.length];

// Deterministic time anchors (stable across reloads within the same day)
const _TODAY = new Date();
_TODAY.setHours(0, 0, 0, 0);
const ts = (hoursAgo: number, minOffset = 0) =>
  new Date(Date.now() - hoursAgo * 60 * 60 * 1000 - minOffset * 60 * 1000).toISOString();
const tsMorning = (h: number, m: number) => {
  const d = new Date(_TODAY); d.setHours(h, m, 0, 0); return d.toISOString();
};
const tsYesterday = (h: number, m: number) => {
  const d = new Date(_TODAY); d.setDate(d.getDate() - 1); d.setHours(h, m, 0, 0); return d.toISOString();
};
const tsDaysAgo = (days: number, h: number, m: number) => {
  const d = new Date(_TODAY); d.setDate(d.getDate() - days); d.setHours(h, m, 0, 0); return d.toISOString();
};

const DEMO_MISSIONS = [
  // ── 3 missions "Il y a ~45 min" ──
  { id: "demo-35", title: "Mise en sécurité électrique appartement ancien", description: "Appartement 1930, 70m². Remplacement tableau fusible, mise à la terre, protection différentielle. Reprise partielle câblage vétuste. Diagnostic avant-vente.", city: "Dunkerque (59)", budget: null, budget_range: "2 000€ – 4 000€", urgency: "Immédiatement", created_at: ts(0, 42), category: { id: "c6", name: "Électricité" }, client_name: "Client vérifié", applicants_count: 5, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0, is_urgent: false, fomo_badge: "En cours de sélection" },
  { id: "demo-30", title: "Pose porte d'entrée blindée + volets battants", description: "Remplacement porte d'entrée par porte blindée A2P BP3. Pose 6 volets battants alu sur mesure. Coloris RAL au choix. Serrure 5 points.", city: "Dunkerque (59)", budget: null, budget_range: "5 000€ – 9 000€", urgency: "Immédiatement", created_at: ts(0, 47), category: { id: "c14", name: "Menuiserie extérieure" }, client_name: "Client vérifié", applicants_count: 1, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0, is_urgent: false, fomo_badge: null },
  { id: "demo-22", title: "Centrale photovoltaïque 3kWc maison neuve", description: "Installation 8 panneaux PV monocristallins 375Wc sur maison RT2020. Micro-onduleurs Enphase. Monitoring application mobile. Déclaration préalable fournie.", city: "Lens (62)", budget: null, budget_range: "10 000€ – 14 000€", urgency: "Immédiatement", created_at: ts(0, 38), category: { id: "c9", name: "Panneaux solaires" }, client_name: "Client vérifié", applicants_count: 0, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0, is_urgent: false, fomo_badge: null },

  // ── 4 missions "Il y a ~3h" ──
  { id: "demo-4", title: "Installation PAC air-eau + plancher chauffant", description: "Remplacement chaudière fioul par PAC air-eau 12kW. Pose plancher chauffant basse température au RDC (80m²). Artisan RGE obligatoire pour dossier MaPrimeRénov'.", city: "Villeneuve-d'Ascq (59)", budget: null, budget_range: "15 000€ – 50 000€", urgency: "Immédiatement", created_at: ts(2, 48), category: { id: "c4", name: "PAC" }, client_name: "Client vérifié", applicants_count: 0, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0, is_urgent: true, fomo_badge: null },
  { id: "demo-12", title: "Remplacement chaudière gaz par PAC", description: "Dépose chaudière gaz murale, installation PAC air-eau monobloc 8kW. Raccordement sur circuit existant radiateurs. Artisan RGE QualiPAC exigé.", city: "Loos (59)", budget: null, budget_range: "10 000€ – 20 000€", urgency: "Immédiatement", created_at: ts(3, 12), category: { id: "c4", name: "PAC" }, client_name: "Client vérifié", applicants_count: 1, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0, is_urgent: true, fomo_badge: "3 pros déjà positionnés" },
  { id: "demo-27", title: "Remplacement PAC vétuste + plancher chauffant", description: "Dépose PAC air-eau 10 ans hors service. Nouvelle PAC 10kW Daikin. Vérification et purge circuit plancher chauffant existant. Mise en service complète.", city: "Lens (62)", budget: null, budget_range: "10 000€ – 14 000€", urgency: "Immédiatement", created_at: ts(3, 5), category: { id: "c4", name: "PAC" }, client_name: "Client vérifié", applicants_count: 0, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0, is_urgent: true, fomo_badge: null },
  { id: "demo-34", title: "Installation domotique + éclairage LED maison", description: "Passage en éclairage LED intégral (spots, bandeaux, appliques). Installation système domotique KNX : volets, chauffage, éclairage. Programmation scénarios.", city: "Lille (59)", budget: null, budget_range: "4 000€ – 7 000€", urgency: "Ce mois-ci", created_at: ts(2, 55), category: { id: "c6", name: "Électricité" }, client_name: "Client vérifié", applicants_count: 0, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0, is_urgent: false, fomo_badge: null },

  // ── 5 missions "Ce matin" ──
  { id: "demo-6", title: "Mise aux normes électriques NF C 15-100", description: "Appartement haussmannien 90m². Remplacement tableau électrique, mise à la terre, changement prises et interrupteurs. Passage consuel obligatoire après travaux.", city: "Lille (59)", budget: null, budget_range: "5 000€ – 15 000€", urgency: "Immédiatement", created_at: tsMorning(9, 24), category: { id: "c6", name: "Électricité" }, client_name: "Client vérifié", applicants_count: 6, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0, is_urgent: false, fomo_badge: "3 pros déjà positionnés" },
  { id: "demo-37", title: "Rénovation complète maison 1950 - 180m²", description: "Projet global : ITE 180m², menuiseries PVC 14 ouvrants, PAC air-eau 16kW, VMC double flux, isolation plancher bas. DPE F vers B. Budget MaPrimeRénov' Parcours Accompagné.", city: "Lens (62)", budget: null, budget_range: "60 000€ – 80 000€", urgency: "1 à 3 mois", created_at: tsMorning(8, 47), category: { id: "c1", name: "Rénovation Globale" }, client_name: "Client vérifié", applicants_count: 3, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0, is_urgent: true, fomo_badge: "En cours de sélection" },
  { id: "demo-10", title: "Isolation combles perdus 80m²", description: "Soufflage laine de roche en combles perdus. Surface 80m². R visé ≥ 7 m².K/W. Artisan RGE pour éligibilité CEE et MaPrimeRénov'.", city: "Hem (59)", budget: null, budget_range: "3 000€ – 8 000€", urgency: "Immédiatement", created_at: tsMorning(9, 8), category: { id: "c10", name: "Isolation" }, client_name: "Client vérifié", applicants_count: 0, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0, is_urgent: false, fomo_badge: null },
  { id: "demo-25", title: "PAC air-eau 14kW + ballon thermodynamique", description: "Remplacement chaudière fioul par PAC air-eau 14kW Atlantic. Ballon ECS thermodynamique 270L. Raccordement radiateurs basse température. Dossier MaPrimeRénov' Sérénité.", city: "Valenciennes (59)", budget: null, budget_range: "12 000€ – 15 000€", urgency: "Immédiatement", created_at: tsMorning(10, 15), category: { id: "c4", name: "PAC" }, client_name: "Client vérifié", applicants_count: 1, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0, is_urgent: true, fomo_badge: null },
  { id: "demo-29", title: "Remplacement 8 fenêtres PVC double vitrage", description: "Dépose anciennes fenêtres bois simple vitrage. Pose 8 fenêtres PVC blanc Uw ≤ 1.3 W/m²K. 2 baies vitrées coulissantes. Volets roulants motorisés. Artisan RGE.", city: "Roubaix (59)", budget: null, budget_range: "8 000€ – 12 000€", urgency: "1 à 3 mois", created_at: tsMorning(7, 52), category: { id: "c14", name: "Menuiserie extérieure" }, client_name: "Client vérifié", applicants_count: 4, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0, is_urgent: false, fomo_badge: null },

  // ── 4 missions "Hier soir" ──
  { id: "demo-1", title: "Rénovation énergétique appartement 65m²", description: "Rénovation d'un appartement de 65m² : isolation des murs par l'intérieur, remplacement des fenêtres double vitrage et installation d'une VMC double flux. DPE actuel : F, objectif : C.", city: "Lille (59)", budget: null, budget_range: "15 000€ – 50 000€", urgency: "1 à 3 mois", created_at: tsYesterday(20, 14), category: { id: "c1", name: "Rénovation Globale" }, client_name: "Client vérifié", applicants_count: 3, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0, is_urgent: true, fomo_badge: null },
  { id: "demo-21", title: "Installation solaire 9kWc + batterie de stockage", description: "Pose 20 panneaux photovoltaïques 450Wc sur toiture ardoise orientée sud-ouest. Batterie lithium 10kWh, onduleur hybride. Raccordement Enedis autoconsommation avec revente surplus. QualiPV RGE exigé.", city: "Arras (62)", budget: null, budget_range: "18 000€ – 25 000€", urgency: "1 à 3 mois", created_at: tsYesterday(19, 37), category: { id: "c9", name: "Panneaux solaires" }, client_name: "Client vérifié", applicants_count: 2, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0, is_urgent: true, fomo_badge: null },
  { id: "demo-39", title: "Rénovation appartement T4 85m² clé en main", description: "Rénovation intégrale : démolition cloisons, redistribution pièces, plomberie, électricité, sol, peinture. Cuisine et SDB neuves. Livraison clé en main souhaitée.", city: "Roubaix (59)", budget: null, budget_range: "35 000€ – 55 000€", urgency: "1 à 3 mois", created_at: tsYesterday(21, 3), category: { id: "c1", name: "Rénovation Globale" }, client_name: "Client vérifié", applicants_count: 0, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0, is_urgent: true, fomo_badge: null },
  { id: "demo-33", title: "Rénovation électrique complète maison 100m²", description: "Mise aux normes NF C 15-100 complète. Nouveau tableau 4 rangées, disjoncteur différentiel, terre aux normes. 45 points lumineux + prises. Passage consuel.", city: "Arras (62)", budget: null, budget_range: "5 000€ – 7 000€", urgency: "1 à 3 mois", created_at: tsYesterday(18, 45), category: { id: "c6", name: "Électricité" }, client_name: "Client vérifié", applicants_count: 2, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0, is_urgent: false, fomo_badge: null },

  // ── Reste : 2-3 derniers jours ──
  { id: "demo-2", title: "Peinture complète maison 120m²", description: "Peinture intérieure complète d'une maison de 120m² sur 2 niveaux. Lessivage, enduit de rebouchage, 2 couches acrylique mate. Plafonds et boiseries inclus.", city: "Tourcoing (59)", budget: null, budget_range: "5 000€ – 15 000€", urgency: "1 à 3 mois", created_at: tsDaysAgo(2, 14, 32), category: { id: "c2", name: "Ravalement" }, client_name: "Client vérifié", applicants_count: 5, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0, is_urgent: false, fomo_badge: null },
  { id: "demo-3", title: "Extension bois 25m² avec toit plat", description: "Construction d'une extension ossature bois de 25m² attenante à une maison existante. Toit plat végétalisé, baie vitrée 4m, isolation biosourcée. Permis de construire obtenu.", city: "Roubaix (59)", budget: null, budget_range: "Plus de 50 000€", urgency: "Plus de 3 mois", created_at: tsDaysAgo(2, 10, 17), category: { id: "c3", name: "Construction neuve" }, client_name: "Client vérifié", applicants_count: 2, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0, is_urgent: false, fomo_badge: null },
  { id: "demo-5", title: "Rénovation salle de bain complète 8m²", description: "Démolition existant, plomberie neuve, douche italienne avec receveur extra-plat, faïence grand format, meuble double vasque. Normes électriques NF C 15-100.", city: "Marcq-en-Barœul (59)", budget: null, budget_range: "5 000€ – 15 000€", urgency: "1 à 3 mois", created_at: tsDaysAgo(1, 16, 40), category: { id: "c5", name: "Salle de bain clé en main" }, client_name: "Client vérifié", applicants_count: 4, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0, is_urgent: false, fomo_badge: null },
  { id: "demo-7", title: "Ravalement façade immeuble R+3", description: "Copropriété 8 lots. Nettoyage haute pression, traitement fissures, enduit RPE teinté. Échafaudage à prévoir sur rue passante. Devis détaillé exigé.", city: "Lambersart (59)", budget: null, budget_range: "Plus de 50 000€", urgency: "Plus de 3 mois", created_at: tsDaysAgo(3, 11, 22), category: { id: "c7", name: "Ravalement" }, client_name: "Client vérifié", applicants_count: 1, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0, is_urgent: false, fomo_badge: null },
  { id: "demo-8", title: "Pose cuisine équipée + électroménager", description: "Cuisine ouverte 15m². Dépose ancienne cuisine, plomberie, électricité, pose meubles hauts et bas, plan de travail quartz, crédence carrelage métro.", city: "Wasquehal (59)", budget: null, budget_range: "5 000€ – 15 000€", urgency: "1 à 3 mois", created_at: tsDaysAgo(1, 15, 8), category: { id: "c8", name: "Pose de cuisine" }, client_name: "Client vérifié", applicants_count: 3, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0, is_urgent: false, fomo_badge: null },
  { id: "demo-9", title: "Installation panneaux solaires 6kWc", description: "Pose de panneaux photovoltaïques 6kWc en autoconsommation sur toiture orientée sud. Inclut onduleur, câblage et raccordement Enedis. Artisan QualiPV obligatoire.", city: "Croix (59)", budget: null, budget_range: "15 000€ – 50 000€", urgency: "1 à 3 mois", created_at: tsDaysAgo(2, 9, 44), category: { id: "c9", name: "Panneaux solaires" }, client_name: "Client vérifié", applicants_count: 1, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0, is_urgent: false, fomo_badge: null },
  { id: "demo-11", title: "Rénovation énergétique globale maison 150m²", description: "Projet complet : ITE polystyrène, remplacement menuiseries alu, PAC air-eau, VMC hygroréglable B. DPE G vers C. Dossier MaPrimeRénov' en cours.", city: "Ronchin (59)", budget: null, budget_range: "Plus de 50 000€", urgency: "1 à 3 mois", created_at: tsDaysAgo(1, 12, 30), category: { id: "c1", name: "Rénovation Globale" }, client_name: "Client vérifié", applicants_count: 2, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0, is_urgent: true, fomo_badge: null },
  { id: "demo-13", title: "Création terrasse composite 30m²", description: "Pose terrasse en lames composites sur lambourdes alu. Surface 30m². Plots réglables. Éclairage LED intégré. Accès jardin de plain-pied.", city: "Mons-en-Barœul (59)", budget: null, budget_range: "5 000€ – 12 000€", urgency: "Plus de 3 mois", created_at: tsDaysAgo(3, 16, 55), category: { id: "c11", name: "Terrasse" }, client_name: "Client vérifié", applicants_count: 0, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0, is_urgent: false, fomo_badge: null },
  { id: "demo-14", title: "Réfection toiture tuiles 100m²", description: "Dépose et repose tuiles mécaniques. Remplacement liteaux et écran sous-toiture HPV. Zinguerie complète : gouttières, descentes, noues.", city: "La Madeleine (59)", budget: null, budget_range: "15 000€ – 30 000€", urgency: "1 à 3 mois", created_at: tsDaysAgo(2, 8, 15), category: { id: "c12", name: "Toiture" }, client_name: "Client vérifié", applicants_count: 2, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0, is_urgent: false, fomo_badge: null },
  { id: "demo-15", title: "Plomberie complète appartement neuf", description: "Installation plomberie complète : alimentation et évacuations cuisine, SDB et WC. Chauffe-eau thermodynamique. Raccordement machine à laver et lave-vaisselle.", city: "Faches-Thumesnil (59)", budget: null, budget_range: "5 000€ – 10 000€", urgency: "1 à 3 mois", created_at: tsDaysAgo(1, 10, 5), category: { id: "c13", name: "Plomberie" }, client_name: "Client vérifié", applicants_count: 3, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0, is_urgent: false, fomo_badge: null },
  { id: "demo-16", title: "Portail motorisé + clôture aluminium", description: "Fourniture et pose portail coulissant alu 4m motorisé + clôture alu sur 25ml. Piliers béton. Automatisme solaire avec télécommande et digicode.", city: "Wattignies (59)", budget: null, budget_range: "5 000€ – 15 000€", urgency: "1 à 3 mois", created_at: tsDaysAgo(2, 17, 28), category: { id: "c14", name: "Menuiserie extérieure" }, client_name: "Client vérifié", applicants_count: 0, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0, is_urgent: false, fomo_badge: null },
  { id: "demo-17", title: "Aménagement combles 40m² habitable", description: "Aménagement combles perdus en 2 chambres + SDB. Plancher, isolation, cloisons, électricité, plomberie. Velux x4. Escalier quart tournant.", city: "Seclin (59)", budget: null, budget_range: "30 000€ – 60 000€", urgency: "Plus de 3 mois", created_at: tsDaysAgo(3, 9, 10), category: { id: "c1", name: "Rénovation Globale" }, client_name: "Client vérifié", applicants_count: 1, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0, is_urgent: false, fomo_badge: null },
  { id: "demo-18", title: "Dépannage urgent fuite toiture", description: "Infiltration d'eau suite à tempête. Tuiles cassées et solin décollé sur cheminée. Intervention rapide demandée pour bâchage + réparation définitive.", city: "Armentières (59)", budget: null, budget_range: "1 000€ – 3 000€", urgency: "Immédiatement", created_at: tsDaysAgo(1, 7, 35), category: { id: "c12", name: "Toiture" }, client_name: "Client vérifié", applicants_count: 0, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0, is_urgent: false, fomo_badge: null },
  { id: "demo-19", title: "Carrelage sol + murs salon 45m²", description: "Pose carrelage grand format 60x120 au sol. Ragréage inclus. Carrelage mural derrière poêle à bois. Joints époxy. Plinthe assortie.", city: "Haubourdin (59)", budget: null, budget_range: "4 000€ – 8 000€", urgency: "1 à 3 mois", created_at: tsDaysAgo(2, 13, 50), category: { id: "c15", name: "Carrelage" }, client_name: "Client vérifié", applicants_count: 2, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0, is_urgent: false, fomo_badge: null },
  { id: "demo-20", title: "Installation VMC double flux", description: "Pose VMC double flux haut rendement dans maison RT2012. Réseau gainé rigide. Bouches d'extraction et d'insufflation. Mise en service et équilibrage.", city: "Halluin (59)", budget: null, budget_range: "4 000€ – 8 000€", urgency: "1 à 3 mois", created_at: tsDaysAgo(3, 14, 20), category: { id: "c16", name: "Ventilation" }, client_name: "Client vérifié", applicants_count: 0, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0, is_urgent: false, fomo_badge: null },
  { id: "demo-23", title: "Solaire autoconsommation 6kWc + borne de recharge", description: "Pose panneaux solaires 6kWc couplée à borne de recharge véhicule électrique 7kW. Gestion intelligente de l'énergie. Toiture tuiles mécaniques, accès facile.", city: "Douai (59)", budget: null, budget_range: "15 000€ – 22 000€", urgency: "1 à 3 mois", created_at: tsDaysAgo(1, 14, 18), category: { id: "c9", name: "Panneaux solaires" }, client_name: "Client vérifié", applicants_count: 1, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0, is_urgent: true, fomo_badge: null },
  { id: "demo-24", title: "Extension installation solaire existante +3kWc", description: "Ajout de 8 panneaux sur installation existante de 3kWc. Remplacement onduleur string par onduleur hybride. Mise à jour déclaration Enedis.", city: "Dunkerque (59)", budget: null, budget_range: "10 000€ – 15 000€", urgency: "Ce mois-ci", created_at: tsDaysAgo(2, 11, 42), category: { id: "c9", name: "Panneaux solaires" }, client_name: "Client vérifié", applicants_count: 0, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0, is_urgent: false, fomo_badge: null },
  { id: "demo-26", title: "PAC air-air gainable 4 pièces", description: "Installation PAC air-air gainable pour maison 110m². 4 bouches de diffusion. Groupe extérieur silencieux. Pilotage wifi. Artisan RGE QualiPAC.", city: "Arras (62)", budget: null, budget_range: "8 000€ – 12 000€", urgency: "1 à 3 mois", created_at: tsDaysAgo(1, 17, 55), category: { id: "c4", name: "PAC" }, client_name: "Client vérifié", applicants_count: 3, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0, is_urgent: false, fomo_badge: null },
  { id: "demo-28", title: "PAC géothermique eau-eau forage", description: "Installation PAC géothermique 12kW avec forage 2x80m. Plancher chauffant-rafraîchissant. Projet éligible MaPrimeRénov' + CEE. Étude de sol réalisée.", city: "Tourcoing (59)", budget: null, budget_range: "15 000€ – 20 000€", urgency: "Plus de 3 mois", created_at: tsDaysAgo(3, 10, 8), category: { id: "c4", name: "PAC" }, client_name: "Client vérifié", applicants_count: 2, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0, is_urgent: false, fomo_badge: null },
  { id: "demo-31", title: "Menuiseries alu maison contemporaine 140m²", description: "Fourniture et pose complète menuiseries alu gris anthracite RAL 7016. 12 ouvrants + 2 baies 3m + 1 porte-fenêtre. Triple vitrage. Certification QualiBAT.", city: "Valenciennes (59)", budget: null, budget_range: "10 000€ – 15 000€", urgency: "1 à 3 mois", created_at: tsDaysAgo(2, 15, 33), category: { id: "c14", name: "Menuiserie extérieure" }, client_name: "Client vérifié", applicants_count: 0, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0, is_urgent: false, fomo_badge: null },
  { id: "demo-32", title: "Véranda aluminium 20m² toiture vitrée", description: "Construction véranda alu 20m² avec toiture vitrée feuilletée. Stores intégrés motorisés. Chauffage au sol prévu. Fondations et dalle incluses.", city: "Douai (59)", budget: null, budget_range: "12 000€ – 18 000€", urgency: "Plus de 3 mois", created_at: tsDaysAgo(3, 8, 47), category: { id: "c14", name: "Menuiserie extérieure" }, client_name: "Client vérifié", applicants_count: 1, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0, is_urgent: false, fomo_badge: null },
  { id: "demo-36", title: "Tableau électrique + borne recharge VE 22kW", description: "Remplacement tableau vétuste + installation borne de recharge véhicule électrique 22kW triphasé. Augmentation puissance compteur. IRVE qualifié.", city: "Valenciennes (59)", budget: null, budget_range: "3 000€ – 5 500€", urgency: "1 à 3 mois", created_at: tsDaysAgo(1, 11, 20), category: { id: "c6", name: "Électricité" }, client_name: "Client vérifié", applicants_count: 1, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0, is_urgent: false, fomo_badge: null },
  { id: "demo-38", title: "Réhabilitation corps de ferme 250m²", description: "Transformation corps de ferme en habitation. Gros œuvre, charpente, couverture, menuiseries, plomberie, électricité, chauffage. Permis accordé. Architecte mandaté.", city: "Douai (59)", budget: null, budget_range: "Plus de 80 000€", urgency: "Plus de 3 mois", created_at: tsDaysAgo(2, 16, 10), category: { id: "c1", name: "Rénovation Globale" }, client_name: "Client vérifié", applicants_count: 1, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0, is_urgent: false, fomo_badge: null },
  { id: "demo-40", title: "Surélévation maison + rénovation énergétique", description: "Surélévation R+1 ossature bois 60m². Isolation complète existant + extension. PAC, VMC, menuiseries neuves. Permis de construire obtenu. DPE visé : A.", city: "Tourcoing (59)", budget: null, budget_range: "70 000€ – 100 000€", urgency: "Plus de 3 mois", created_at: tsDaysAgo(3, 15, 30), category: { id: "c1", name: "Rénovation Globale" }, client_name: "Client vérifié", applicants_count: 2, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0, is_urgent: false, fomo_badge: null },
];

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 6) return `Il y a ${hours}h`;
  // Same day → "Ce matin à HH:MM" or "Aujourd'hui à HH:MM"
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  if (date >= todayStart) {
    const h = date.getHours();
    const m = date.getMinutes().toString().padStart(2, "0");
    return h < 12 ? `Ce matin à ${h}h${m}` : `Aujourd'hui à ${h}h${m}`;
  }
  // Yesterday
  const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  if (date >= yesterdayStart) {
    const h = date.getHours();
    return h >= 18 ? "Hier soir" : h >= 12 ? "Hier après-midi" : "Hier matin";
  }
  if (days <= 3) return `Il y a ${days} jours`;
  return `Il y a ${days} jours`;
};

const NosMissions = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, role, isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [radiusFilter, setRadiusFilter] = useState(0);
  const [selectedMission, setSelectedMission] = useState<any>(null);
  const [detailMission, setDetailMission] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showTeasingModal, setShowTeasingModal] = useState(false);

  const { 
    canApply: canApplyLimit, 
    appliedThisMonth, 
    limit: missionLimit, 
    incrementApplicationCount,
    isLoading: limitLoading 
  } = useMissionApplicationLimit();

  const { data: artisanProfile } = useQuery({
    queryKey: ["artisan-profile-full", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("artisans")
        .select("id, business_name")
        .eq("user_id", user.id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!user?.id && role === "artisan",
  });

  const [searchCoordinates, setSearchCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const { data: dbMissions, isLoading: missionsLoading } = useDemoMissions(user?.id, role);
  const { data: categories } = useCategoriesHierarchy();

  // Parse structured metadata from description
  const parseStructuredInfo = (desc: string | null) => {
    if (!desc) return {};
    const parts = desc.split('--- Infos structurées ---');
    if (parts.length < 2) return {};
    const info: Record<string, string> = {};
    parts[1].split('\n').forEach(line => {
      const match = line.match(/^(.+?)\s*:\s*(.+)$/);
      if (match) info[match[1].trim()] = match[2].trim();
    });
    return info;
  };

  // Always show demo missions combined with DB missions for volume — sorted newest first
  const missions = useMemo(() => {
    const enrichedDb = (dbMissions || []).map((m: any) => {
      const info = parseStructuredInfo(m.description);
      return { ...m, budget_range: info['Budget'] || null, urgency: info['Délai souhaité'] || null };
    });
    const dbIds = new Set(enrichedDb.map((m: any) => m.id));
    const demos = DEMO_MISSIONS.filter(d => !dbIds.has(d.id));
    const all = [...enrichedDb, ...demos] as any[];
    all.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return all;
  }, [dbMissions]);

  const missionCities = useMemo(() => {
    return missions?.map(m => m.city).filter(Boolean) || [];
  }, [missions]);

  const { getCoordinates, isLoading: coordinatesLoading } = useCityCoordinatesCache(missionCities);

  const normalizeCity = (city: string): string => {
    return city
      .split("(")[0]
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const { filteredMissions, missionDistances } = useMemo(() => {
    if (!missions) return { filteredMissions: [], missionDistances: new Map<string, number>() };
    
    const distances = new Map<string, number>();
    
    const filtered = missions.filter(mission => {
      if (categoryFilter && categoryFilter !== "all" && mission.category?.name !== categoryFilter) {
        return false;
      }
      
      const missionCity = mission.city || "";
      
      if (selectedCity && searchCoordinates) {
        const missionCoords = getCoordinates(missionCity);
        
        if (radiusFilter === 0) {
          const normalizedMissionCity = normalizeCity(missionCity);
          const normalizedSelectedCity = normalizeCity(selectedCity);
          
          if (normalizedMissionCity !== normalizedSelectedCity) {
            return false;
          }
          
          if (missionCoords) {
            const distance = calculateDistance(
              searchCoordinates.lat, searchCoordinates.lng,
              missionCoords.lat, missionCoords.lng
            );
            distances.set(mission.id, distance);
          }
        } else {
          if (!missionCoords) return false;
          
          const distance = calculateDistance(
            searchCoordinates.lat, searchCoordinates.lng,
            missionCoords.lat, missionCoords.lng
          );
          distances.set(mission.id, distance);
          
          if (distance > radiusFilter) return false;
        }
      } else if (locationFilter && locationFilter.length >= 2 && !selectedCity) {
        const normalizedMissionCity = normalizeCity(missionCity);
        const normalizedFilter = normalizeCity(locationFilter);
        
        if (!normalizedMissionCity.includes(normalizedFilter)) return false;
      }
      
      return true;
    });
    
    return { filteredMissions: filtered, missionDistances: distances };
  }, [missions, categoryFilter, selectedCity, searchCoordinates, radiusFilter, getCoordinates, locationFilter]);

  const totalPages = Math.ceil(filteredMissions.length / ITEMS_PER_PAGE);
  const paginatedMissions = filteredMissions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getAutoMessage = () => {
    const artisanName = artisanProfile?.business_name || "un artisan qualifié";
    return `Bonjour, je suis ${artisanName}.\nVotre mission m'intéresse, je suis disponible pour en discuter.`;
  };

  const handleApply = async (mission: any) => {
    if (!isAuthenticated) {
      toast({ title: "Connexion requise", description: "Vous devez être connecté pour postuler.", variant: "destructive" });
      return;
    }
    if (role !== "artisan") {
      toast({ title: "Accès réservé", description: "Seuls les artisans peuvent postuler aux missions.", variant: "destructive" });
      return;
    }
    if (!artisanProfile?.id) {
      toast({ title: "Profil artisan introuvable", description: "Veuillez compléter votre profil artisan avant de postuler.", variant: "destructive" });
      return;
    }
    if (!canApplyLimit) {
      toast({ title: "Limite atteinte", description: `Vous avez atteint votre limite de ${missionLimit} mission(s) ce mois-ci.`, variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const autoMessage = getAutoMessage();
      const { error } = await supabase
        .from("mission_applications")
        .insert({
          mission_id: mission.id,
          artisan_id: artisanProfile.id,
          motivation_message: autoMessage,
          status: "pending",
        });

      if (error) {
        if (error.code === "23505") {
          toast({ title: "Candidature existante", description: "Vous avez déjà postulé à cette mission.", variant: "destructive" });
          return;
        }
        throw error;
      }

      await incrementApplicationCount();

      if (mission.client_id) {
        await supabase.rpc("create_notification", {
          p_user_id: mission.client_id,
          p_type: "new_application",
          p_title: "Nouvelle candidature",
          p_message: `Un artisan a postulé à votre mission "${mission.title}"`,
          p_related_id: mission.id
        });
      }

      toast({ title: "Candidature envoyée !", description: `Votre candidature pour "${mission.title}" a été envoyée avec succès.` });
      setSelectedMission(null);
      setDetailMission(null);
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message || "Impossible d'envoyer votre candidature.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFilters = () => {
    setCategoryFilter("");
    setLocationFilter("");
    setSelectedCity("");
    setSearchCoordinates(null);
    setRadiusFilter(0);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy", { locale: fr });
  };

  const canApply = isAuthenticated && role === "artisan" && !!artisanProfile?.id && canApplyLimit;
  const showLimitWarning = isAuthenticated && role === "artisan" && artisanProfile?.id && !canApplyLimit;
  const showLimitCounter = isAuthenticated && role === "artisan" && artisanProfile?.id && missionLimit !== "unlimited";

  // Handle "Voir la mission" click - teasing for non-authenticated
  const handleViewMission = (mission: any) => {
    if (!isAuthenticated) {
      setShowTeasingModal(true);
    } else {
      setDetailMission(mission);
    }
  };

  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // Show floating filter button on mobile when scrolled past hero
  useEffect(() => {
    const handleScroll = () => {
      setShowMobileFilter(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Periodic toast notification for social proof
  useEffect(() => {
    const TOAST_MESSAGES = [
      "Un nouveau projet de toiture vient d'être validé à Arras",
      "Un chantier de rénovation a été attribué à Tourcoing",
      "Nouveau projet PAC air-eau qualifié à Roubaix",
      "Un artisan vient de décrocher un chantier à Marcq-en-Barœul",
    ];
    const timeout = setTimeout(() => {
      const msg = TOAST_MESSAGES[Math.floor(Math.random() * TOAST_MESSAGES.length)];
      toast({ title: "🔔 Activité en temps réel", description: msg });
    }, 8000);
    const interval = setInterval(() => {
      const msg = TOAST_MESSAGES[Math.floor(Math.random() * TOAST_MESSAGES.length)];
      toast({ title: "🔔 Activité en temps réel", description: msg });
    }, 45000);
    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, []);

  const scrollToFilters = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Missions disponibles pour artisans - Trouvez vos chantiers"
        description="Des chantiers vérifiés et des clients qualifiés vous attendent. Consultez les missions disponibles et postulez directement."
        canonical="https://artisansvalides.fr/nos-missions"
      />
      <Navbar />
      
      <main>
        {/* ── Hero Section — pt accounts for fixed banner+navbar ── */}
        <section className="bg-navy relative overflow-hidden pt-8 md:pt-12 pb-8 md:pb-12">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-gold/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto mb-6"
            >
              {/* Animated radar badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 bg-gold/20 border border-gold/40 text-gold-light rounded-full px-5 py-2 mb-6 text-sm font-bold"
              >
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Radar className="w-4 h-4" />
                </motion.span>
                📡 SCAN EN COURS : {filteredMissions.length} missions disponibles autour de vous
              </motion.div>

              <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                Trouvez votre prochaine <span className="text-gradient-gold">opportunité</span>
              </h1>
              <p className="text-lg text-white/70">
                Des chantiers vérifiés et des clients qualifiés vous attendent.
              </p>
            </motion.div>

            {/* ── Inline Search Bar ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 md:p-6">
                <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-end">
                  {/* Category filter */}
                  <div className="flex-1 w-full">
                    <Label className="text-white/80 text-sm mb-2 block">Quel métier ?</Label>
                    <CategorySelect 
                      value={categoryFilter === "all" ? "" : categoryFilter}
                      onValueChange={(id, name) => { 
                        setCategoryFilter(name || "all"); 
                        setCurrentPage(1); 
                      }} 
                      placeholder="Toutes les catégories"
                      allowParentSelection={true}
                    />
                  </div>

                  {/* City filter */}
                  <div className="flex-1 w-full">
                    <Label className="text-white/80 text-sm mb-2 block">Quelle ville ?</Label>
                    <CityAutocompleteAPI
                      value={locationFilter}
                      onChange={(value, coordinates) => {
                        setLocationFilter(value);
                        if (coordinates) {
                          setSelectedCity(value);
                          setSearchCoordinates(coordinates);
                        } else {
                          setSelectedCity("");
                          setSearchCoordinates(null);
                          setRadiusFilter(0);
                        }
                        setCurrentPage(1);
                      }}
                      placeholder="Rechercher une ville..."
                    />
                  </div>

                  {/* Search button */}
                  <Button 
                    variant="gold" 
                    size="lg" 
                    className="w-full md:w-auto gap-2 shrink-0"
                    onClick={() => setCurrentPage(1)}
                  >
                    <Radar className="w-5 h-5" />
                    Scanner
                  </Button>
                </div>

                {/* Quick filter tags */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {[
                    { label: "Urgences 🚨", filter: () => { setCategoryFilter(""); setCurrentPage(1); /* Scroll to urgent missions */ } },
                    { label: "Gros Chantiers 💰", filter: () => { setCategoryFilter("Rénovation Globale"); setCurrentPage(1); } },
                    { label: "Moins de 15km 📍", filter: () => { if (searchCoordinates) { setRadiusFilter(15); setCurrentPage(1); } else { toast({ title: "Sélectionnez une ville", description: "Entrez votre ville pour activer le filtre distance." }); } } },
                  ].map((tag) => (
                    <button
                      key={tag.label}
                      onClick={tag.filter}
                      className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-gold/40 text-white text-xs md:text-sm font-semibold rounded-full px-4 py-2 transition-all hover:scale-105 active:scale-95"
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>

                {/* Active filters + reset */}
                {(categoryFilter || locationFilter) && (
                  <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-white/10">
                    <span className="text-white/50 text-sm">Filtres :</span>
                    {categoryFilter && categoryFilter !== "all" && (
                      <Badge className="bg-white/20 text-white hover:bg-white/30 cursor-pointer" onClick={() => { setCategoryFilter(""); setCurrentPage(1); }}>
                        {categoryFilter} ×
                      </Badge>
                    )}
                    {locationFilter && (
                      <Badge className="bg-white/20 text-white hover:bg-white/30 cursor-pointer" onClick={() => { setLocationFilter(""); setSelectedCity(""); setSearchCoordinates(null); setRadiusFilter(0); setCurrentPage(1); }}>
                        {locationFilter} ×
                      </Badge>
                    )}
                    <button onClick={resetFilters} className="text-white/50 hover:text-white text-sm ml-auto flex items-center gap-1 transition-colors">
                      <RotateCcw className="w-3 h-3" />
                      Tout effacer
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Andrea Performance Banner ── */}
        <div className="bg-gold/10 border-b border-gold/20">
          <div className="container mx-auto px-4 lg:px-8 py-3 flex items-center justify-center gap-3 text-sm">
            <ShieldCheck className="w-5 h-5 text-gold-dark shrink-0" />
            <p className="text-foreground font-semibold">
              Missions pré-qualifiées par Andrea : <span className="text-gold-dark">92% de taux de transformation constaté</span>
            </p>
          </div>
        </div>

        {/* ── Missions Catalogue ── */}
        <section className="py-8 md:py-16 bg-muted/30">
          <div className="container mx-auto px-3 md:px-4 lg:px-8">
            {/* Section header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">
                  Nos chantiers en cours
                </h2>
                <p className="text-muted-foreground mt-1">
                  {filteredMissions.length} mission{filteredMissions.length > 1 ? "s" : ""} disponible{filteredMissions.length > 1 ? "s" : ""}
                </p>
              </div>

              {showLimitCounter && !limitLoading && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    Candidatures : {appliedThisMonth}/{missionLimit}
                  </Badge>
                  {!canApplyLimit && (
                    <Badge variant="destructive" className="text-sm px-3 py-1">Limite atteinte</Badge>
                  )}
                </div>
              )}
            </div>

            {showLimitWarning && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Vous avez atteint votre limite de {missionLimit} candidature(s) ce mois-ci. 
                  <a href="/artisan/abonnement" className="underline ml-1 font-medium">Passez à un abonnement supérieur</a> pour postuler à plus de missions.
                </AlertDescription>
              </Alert>
            )}

            {/* Reassurance banner */}
            <div className="flex items-start gap-3 bg-card border border-border rounded-xl p-4 mb-8">
              <span className="text-xl shrink-0">🛡️</span>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Chaque demande publiée ici fait l'objet d'une analyse de faisabilité technique. <span className="font-medium text-foreground">Vos données ne sont jamais vendues</span> : vous gardez le contrôle total sur qui peut vous contacter.
              </p>
            </div>

            {/* ── Mission Cards Grid ── */}
            {missionsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {Array.from({ length: 9 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6 space-y-4">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : paginatedMissions.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                  {paginatedMissions.map((mission, index) => {
                    const urgency = (mission as any).urgency;
                    const budgetRange = (mission as any).budget_range;
                    
                    return (
                    <motion.div
                      key={mission.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Card className="h-full group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-gold/20 hover:border-gold/40 overflow-hidden glow-gold-hover">
                        <CardContent className="p-0 flex flex-col h-full">
                          {/* Top colored bar */}
                          <div className="h-1.5 bg-gradient-to-r from-gold to-gold-light" />
                          
                          <div className="p-5 md:p-6 flex flex-col h-full">
                            {/* Top row: category + verified badge */}
                            <div className="flex items-center justify-between mb-3 gap-2">
                              <Badge className="bg-secondary text-foreground hover:bg-secondary/80 gap-1 font-medium text-xs">
                                <Briefcase className="w-3 h-3" />
                                {mission.category?.name || "Autre"}
                              </Badge>
                              <Badge className="bg-success/10 text-success border-success/30 gap-1 text-xs font-semibold">
                                <BadgeCheck className="w-3.5 h-3.5" />
                                Vérifié
                              </Badge>
                            </div>

                            {/* Title */}
                            <h3 className="font-bold text-base md:text-lg text-foreground mb-3 line-clamp-2 group-hover:text-gold transition-colors">
                              {mission.title}
                            </h3>

                            {/* Location */}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <MapPin className="w-4 h-4 text-gold shrink-0" />
                              <span>{mission.city}</span>
                              {missionDistances.get(mission.id) !== undefined && selectedCity && (
                                <span className="text-xs font-medium bg-gold/10 text-gold-dark px-2 py-0.5 rounded-full">
                                  {Math.round(missionDistances.get(mission.id)!)} km
                                </span>
                              )}
                            </div>

                            {/* Budget */}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <Euro className="w-4 h-4 text-gold shrink-0" />
                              <span>Budget : <strong className="text-foreground">
                                {budgetRange || (mission.budget ? `${mission.budget?.toLocaleString('fr-FR')} €` : "Sur devis")}
                              </strong></span>
                            </div>

                            {/* Urgency */}
                            {urgency && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                <Calendar className="w-4 h-4 text-gold shrink-0" />
                                <span>Délai : <strong className={cn(
                                  "text-foreground",
                                  urgency === "Immédiatement" && "text-destructive"
                                )}>{urgency}</strong></span>
                              </div>
                            )}

                            {/* Description excerpt */}
                            {mission.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                                {mission.description.split('--- Infos structurées ---')[0].trim()}
                              </p>
                            )}

                            {/* Date + availability badge */}
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                              <span>{formatTimeAgo(mission.created_at)}</span>
                              {(mission as any).fomo_badge ? (
                                <Badge className="bg-amber-50 text-amber-800 border-amber-300 text-xs font-bold">
                                  ⚡ {(mission as any).fomo_badge}
                                </Badge>
                              ) : (mission as any).is_urgent ? (
                                <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs font-bold animate-pulse">
                                  🔴 Dernière place disponible
                                </Badge>
                              ) : (mission.applicants_count || 0) === 0 ? (
                                <Badge className="bg-gold/10 text-gold-dark border-gold/30 text-xs font-semibold">
                                  Soyez le premier artisan sur ce projet
                                </Badge>
                              ) : (mission.applicants_count || 0) >= 2 ? (
                                <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs font-semibold">
                                  Dernière place disponible
                                </Badge>
                              ) : (
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold">
                                  Place disponible : 1/2
                                </Badge>
                              )}
                            </div>

                            {/* Spacer */}
                            <div className="flex-1" />

                            {/* Photo / Validation badge */}
                            <div className="mb-3">
                              {(mission.photos && mission.photos.length > 0 && mission.photos.some((p: string) => p && p.length > 0)) ? (
                                <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-medium gap-1">
                                  📸 Photos du chantier incluses
                                </Badge>
                              ) : (
                                <Badge className="bg-muted text-muted-foreground border-border text-xs font-medium gap-1">
                                  📞 Projet validé par nos experts
                                </Badge>
                              )}
                            </div>

                            {/* Reassurance line */}
                            <p className="text-xs text-muted-foreground mb-3 italic">
                              Dossier client complet : Budget confirmé et photos disponibles.
                            </p>

                            {/* Security notice */}
                            <div className="flex items-start gap-2 bg-muted/50 border border-border rounded-lg p-3 mb-4">
                              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                Accès à la mise en relation sécurisée dès validation de votre profil
                              </p>
                            </div>

                            {/* Applied badge or CTA */}
                            {mission.has_applied ? (
                              <Badge className="bg-success/10 text-success gap-1 w-full justify-center py-2.5 text-sm">
                                <CheckCircle2 className="w-4 h-4" />
                                Candidature envoyée
                              </Badge>
                            ) : (
                              <Button 
                                variant="gold"
                                className="w-full gap-2 h-12 text-sm font-bold"
                                onClick={() => {
                                  if (!isAuthenticated) {
                                    navigate(`/landing-mission?titre=${encodeURIComponent(mission.title)}&ville=${encodeURIComponent(mission.city)}${mission.budget ? `&budget=${encodeURIComponent(mission.budget_range || mission.budget + '€')}` : ''}`);
                                  } else {
                                    navigate("/artisan/abonnement");
                                  }
                                }}
                              >
                                <Lock className="w-4 h-4" />
                                {isAuthenticated ? "Activer ma licence Pro" : "Débloquer cette mission"}
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                  })}
                </div>

                {/* CTA Banner for non-authenticated users */}
                {!isAuthenticated && paginatedMissions.length > 3 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="my-8 bg-gradient-to-r from-navy to-navy-dark rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-4 md:gap-6 border border-gold/20"
                  >
                    <div className="flex-1 text-center md:text-left">
                      <p className="text-gold font-bold text-lg mb-1">
                        Ne ratez plus ces chantiers.
                      </p>
                      <p className="text-white/80 text-sm">
                        Recevez les alertes de votre secteur et décrochez des missions qualifiées avant les autres.
                      </p>
                    </div>
                    <Button variant="gold" size="lg" className="shrink-0 gap-2 font-bold" asChild>
                      <Link to="/devenir-artisan">
                        <Radar className="w-5 h-5" />
                        Activer mes alertes
                      </Link>
                    </Button>
                  </motion.div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-10">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        {Array.from({ length: totalPages }).map((_, i) => (
                          <PaginationItem key={i}>
                            <PaginationLink
                              onClick={() => setCurrentPage(i + 1)}
                              isActive={currentPage === i + 1}
                              className="cursor-pointer"
                            >
                              {i + 1}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                {selectedCity && radiusFilter === 0 ? (
                  <>
                    <p className="text-muted-foreground text-lg mb-2">
                      Aucune mission trouvée à <strong>{selectedCity.split("(")[0].trim()}</strong>
                    </p>
                    <p className="text-muted-foreground text-sm mb-4">
                      Essayez d'élargir votre recherche avec le rayon d'intervention
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button variant="outline" onClick={() => { setRadiusFilter(30); setCurrentPage(1); }}>Élargir à 30 km</Button>
                      <Button variant="outline" onClick={() => { setRadiusFilter(50); setCurrentPage(1); }}>Élargir à 50 km</Button>
                    </div>
                  </>
                ) : selectedCity && radiusFilter > 0 ? (
                  <>
                    <p className="text-muted-foreground text-lg mb-2">
                      Aucune mission trouvée dans un rayon de {radiusFilter} km autour de <strong>{selectedCity.split("(")[0].trim()}</strong>
                    </p>
                    <div className="flex gap-2 justify-center mt-4">
                      <Button variant="outline" onClick={() => { setRadiusFilter(Math.min(200, radiusFilter + 50)); setCurrentPage(1); }}>Augmenter le rayon</Button>
                      <Button variant="outline" onClick={resetFilters}>Réinitialiser les filtres</Button>
                    </div>
                  </>
                ) : locationFilter && !selectedCity ? (
                  <>
                    <p className="text-muted-foreground text-lg mb-2">Aucune mission ne correspond à "{locationFilter}"</p>
                    <p className="text-muted-foreground text-sm mb-4">Sélectionnez une ville dans la liste pour activer la recherche géographique</p>
                    <Button variant="outline" onClick={resetFilters}>Réinitialiser les filtres</Button>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground text-lg">Aucune mission trouvée avec ces critères</p>
                    <Button variant="outline" onClick={resetFilters} className="mt-4">Réinitialiser les filtres</Button>
                  </>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── Conversion Banner ── */}
        <section className="bg-navy py-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <BadgeCheck className="w-12 h-12 text-gold mx-auto mb-4" />
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                La technologie au service du terrain
              </h2>
              <p className="text-lg text-white/70 mb-4 max-w-xl mx-auto">
                Nous utilisons la technologie pour éliminer les mauvais payeurs et les mauvais poseurs. Pas de blabla, juste des chantiers vérifiés et des pros certifiés.
              </p>
              <p className="text-sm text-white/50 mb-8 max-w-lg mx-auto">
                Notre algorithme de confiance, combiné à 20 ans de savoir-faire terrain, sélectionne les meilleurs artisans de France.
              </p>
              <Link to="/devenir-artisan">
                <Button variant="gold" size="xl" className="gap-2">
                  Rejoindre le réseau certifié
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Floating Mobile Filter Button ── */}
      {showMobileFilter && (
        <button
          onClick={scrollToFilters}
          className="md:hidden fixed bottom-24 right-4 z-50 bg-gold text-navy-dark font-bold px-5 py-3 rounded-full shadow-lg flex items-center gap-2 active:scale-95 transition-transform"
        >
          <MapPin className="w-4 h-4" />
          Filtrer par ville
        </button>
      )}

      <Footer />

      {/* ── Mission Detail Modal ── */}
      <MissionDetailModal
        mission={detailMission}
        open={!!detailMission}
        onClose={() => setDetailMission(null)}
        onApply={() => {
          if (detailMission) handleApply(detailMission);
        }}
        canApply={canApply}
      />

      {/* ── Application Confirmation Modal ── */}
      <Dialog open={!!selectedMission} onOpenChange={() => setSelectedMission(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Postuler à cette mission</DialogTitle>
            <DialogDescription>{selectedMission?.title}</DialogDescription>
          </DialogHeader>
          
          {!isAuthenticated ? (
            <div className="py-6 text-center">
              <p className="text-muted-foreground mb-4">Vous devez être connecté en tant qu'artisan pour postuler.</p>
              <Link to="/auth"><Button>Se connecter</Button></Link>
            </div>
          ) : role !== "artisan" ? (
            <div className="py-6 text-center">
              <p className="text-muted-foreground mb-4">Seuls les artisans peuvent postuler aux missions.</p>
              <Link to="/devenir-artisan"><Button variant="outline">Devenir partenaire</Button></Link>
            </div>
          ) : !canApplyLimit ? (
            <div className="py-6 text-center">
              <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <p className="text-foreground font-medium mb-2">Limite de candidatures atteinte</p>
              <p className="text-muted-foreground mb-4">Vous avez utilisé vos {missionLimit} candidature(s) ce mois-ci.</p>
              <Link to="/artisan/abonnement"><Button>Passer à un abonnement supérieur</Button></Link>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium text-foreground mb-2">Votre message de candidature :</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{getAutoMessage()}</p>
                </div>
                <p className="text-xs text-muted-foreground">Ce message sera envoyé automatiquement au client avec votre candidature.</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedMission(null)}>Annuler</Button>
                <Button onClick={() => handleApply(selectedMission)} disabled={isSubmitting}>
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? "Envoi..." : "Confirmer ma candidature"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Teasing Modal (non-authenticated / non-artisan) ── */}
      <Dialog open={showTeasingModal} onOpenChange={setShowTeasingModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <ShieldCheck className="w-6 h-6 text-gold" />
              Accès réservé au réseau national
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-6 space-y-4">
            <div className="bg-navy/5 border border-navy/10 rounded-xl p-6 text-center">
              <p className="text-foreground font-medium text-lg mb-3">
                Cet accès est réservé aux membres du réseau national Artisans Validés.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Votre profil doit être audité (Assurances & Expertise) avant toute mise en relation. Notre processus de certification garantit la qualité pour les deux parties.
              </p>
            </div>
            
            <div className="flex flex-col gap-3">
              <Link to="/devenir-artisan" className="w-full" onClick={() => setShowTeasingModal(false)}>
                <Button variant="gold" className="w-full gap-2" size="lg">
                  <UserPlus className="w-5 h-5" />
                  Devenir Membre
                </Button>
              </Link>
              <Link to="/auth" className="w-full" onClick={() => setShowTeasingModal(false)}>
                <Button variant="outline" className="w-full gap-2">
                  <LogIn className="w-4 h-4" />
                  J'ai déjà un compte
                </Button>
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Auth Modal (legacy) ── */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="w-5 h-5" />
              Accès réservé aux artisans
            </DialogTitle>
            <DialogDescription>
              Pour consulter les détails des missions et postuler, vous devez être connecté en tant qu'artisan.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <p className="text-center text-muted-foreground">
              Vous avez déjà un compte ? Connectez-vous. Sinon, créez votre profil artisan gratuitement.
            </p>
            <div className="flex flex-col gap-3">
              <Link to="/auth" className="w-full" onClick={() => setShowAuthModal(false)}>
                <Button className="w-full gap-2"><LogIn className="w-4 h-4" />Se connecter</Button>
              </Link>
              <Link to="/devenir-artisan" className="w-full" onClick={() => setShowAuthModal(false)}>
                <Button variant="outline" className="w-full gap-2"><UserPlus className="w-4 h-4" />Devenir partenaire</Button>
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NosMissions;
