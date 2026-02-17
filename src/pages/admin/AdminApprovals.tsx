import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/admin-dashboard/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Eye, Clock, MapPin, AlertCircle, Loader2, Briefcase, Euro, User, Store, ExternalLink, Pencil, Trash2, Users, ChevronLeft, ChevronRight, Search, Mail, Phone, Calendar, UserCheck, FileText, Download, File, RefreshCw, AlertTriangle, ImageDown, MessageCircle, Link2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import Navbar from "@/components/layout/Navbar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { DEFAULT_AVATAR } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { AdminEditArtisanDialog } from "@/components/admin-dashboard/AdminEditArtisanDialog";
import { AdminCandidatures, usePartnerCandidaciesCount } from "@/components/admin-dashboard/AdminCandidatures";
import { Crown } from "lucide-react";
import { useCategoriesHierarchy } from "@/hooks/useCategories";
const PROSPECTS_PER_PAGE = 50;
interface PendingArtisan {
  id: string;
  business_name: string;
  city: string;
  description: string | null;
  photo_url: string | null;
  siret: string | null;
  experience_years: number | null;
  portfolio_images: string[] | null;
  created_at: string;
  slug: string | null;
  category: {
    name: string;
  } | null;
  profile: {
    first_name: string | null;
    last_name: string | null;
    email: string;
    phone: string | null;
  } | null;
}
interface ProspectArtisan {
  id: string;
  business_name: string;
  city: string;
  email: string | null;
  phone: string | null;
  google_rating: number | null;
  source: string | null;
  category_id: string | null;
  description: string | null;
  photo_url: string | null;
  portfolio_images: string[] | null;
  created_at: string;
  slug: string | null;
  status: string;
  category: {
    name: string;
  } | null;
}
interface WaitingArtisan {
  id: string;
  business_name: string;
  city: string;
  email: string | null;
  phone: string | null;
  description: string | null;
  photo_url: string | null;
  created_at: string;
  activation_sent_at: string | null;
  reminder_count: number | null;
  reminder_sent_at: string | null;
  slug: string | null;
  category: {
    name: string;
  } | null;
}
interface ClaimedArtisan {
  id: string;
  business_name: string;
  city: string;
  email: string | null;
  phone: string | null;
  description: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
  slug: string | null;
  status: string;
  source: string | null;
  category: {
    name: string;
  } | null;
  profile: {
    first_name: string | null;
    last_name: string | null;
    email: string;
    phone: string | null;
    created_at: string;
  } | null;
  documents_count?: number;
  documents_pending?: number;
  documents_approved?: number;
}
interface SelfSignupArtisan {
  id: string;
  business_name: string;
  city: string;
  email: string | null;
  phone: string | null;
  description: string | null;
  photo_url: string | null;
  created_at: string;
  slug: string | null;
  category: {
    name: string;
  } | null;
  profile: {
    first_name: string | null;
    last_name: string | null;
    email: string;
    phone: string | null;
    created_at: string;
  } | null;
}
interface PendingMission {
  id: string;
  title: string;
  description: string | null;
  city: string;
  budget: number | null;
  created_at: string;
  photos?: string[] | null;
  category: {
    name: string;
  } | null;
  client: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
}
interface ArtisanDocument {
  id: string;
  artisan_id: string;
  name: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  status: string;
  expiry_date: string | null;
  created_at: string;
  updated_at: string;
}
// Union type for all editable artisan types
type EditableArtisan = ProspectArtisan | WaitingArtisan | ClaimedArtisan | SelfSignupArtisan | PendingArtisan;

const AdminApprovals = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("missions");
  const [selectedArtisan, setSelectedArtisan] = useState<PendingArtisan | null>(null);
  const [selectedMission, setSelectedMission] = useState<PendingMission | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showMissionRejectDialog, setShowMissionRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [prospectToDelete, setProspectToDelete] = useState<ProspectArtisan | null>(null);
  const [editArtisan, setEditArtisan] = useState<EditableArtisan | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Documents dialog state
  const [showDocumentsDialog, setShowDocumentsDialog] = useState(false);
  const [documentsArtisan, setDocumentsArtisan] = useState<PendingArtisan | null>(null);
  const [artisanDocuments, setArtisanDocuments] = useState<ArtisanDocument[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);

  // Document rejection dialog state
  const [showDocumentRejectDialog, setShowDocumentRejectDialog] = useState(false);
  const [documentToReject, setDocumentToReject] = useState<ArtisanDocument | null>(null);
  const [documentRejectReason, setDocumentRejectReason] = useState("");

  // Pre-registration confirmation dialog state
  const [showPreregistrationDialog, setShowPreregistrationDialog] = useState(false);
  const [preregistrationProspect, setPreregistrationProspect] = useState<{
    prospect: ProspectArtisan;
    email: string;
  } | null>(null);
  const [isSendingPreregistration, setIsSendingPreregistration] = useState(false);

  // Reminder dialog state for waiting artisans
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [reminderArtisan, setReminderArtisan] = useState<WaitingArtisan | null>(null);
  const [isSendingReminder, setIsSendingReminder] = useState(false);

  // Delete waiting artisan dialog state
  const [showDeleteWaitingDialog, setShowDeleteWaitingDialog] = useState(false);
  const [waitingArtisanToDelete, setWaitingArtisanToDelete] = useState<WaitingArtisan | null>(null);
  const [isDeletingWaiting, setIsDeletingWaiting] = useState(false);

  // Delete self-signup artisan dialog state
  const [showDeleteSelfSignupDialog, setShowDeleteSelfSignupDialog] = useState(false);
  const [selfSignupToDelete, setSelfSignupToDelete] = useState<SelfSignupArtisan | null>(null);
  const [isDeletingSelfSignup, setIsDeletingSelfSignup] = useState(false);

  // Delete claimed artisan dialog state (Vitrines confirmées)
  const [showDeleteClaimedDialog, setShowDeleteClaimedDialog] = useState(false);
  const [claimedArtisanToDelete, setClaimedArtisanToDelete] = useState<ClaimedArtisan | null>(null);
  const [isDeletingClaimed, setIsDeletingClaimed] = useState(false);

  // Delete pending artisan dialog state (Documents en attente)
  const [showDeletePendingDialog, setShowDeletePendingDialog] = useState(false);
  const [pendingArtisanToDelete, setPendingArtisanToDelete] = useState<PendingArtisan | null>(null);
  const [isDeletingPending, setIsDeletingPending] = useState(false);

  // Media sync state
  const [syncingArtisanId, setSyncingArtisanId] = useState<string | null>(null);

  // Pagination state for prospects
  const [prospectPage, setProspectPage] = useState(0);
  const [prospectsPerPage, setProspectsPerPage] = useState(PROSPECTS_PER_PAGE);
  const [prospectSearch, setProspectSearch] = useState("");

  // Sub-tab state for vitrines
  const [vitrineSubTab, setVitrineSubTab] = useState("actives");

  // Unified search for "À publier" tab
  const [pubSearch, setPubSearch] = useState("");

  // Sub-tab state for artisans
  const [artisanSubTab, setArtisanSubTab] = useState("nouvelles-inscriptions");

  // Pagination state for waiting artisans (email sent, no account)
  const [waitingPage, setWaitingPage] = useState(0);
  const [waitingPerPage, setWaitingPerPage] = useState(50);
  const [waitingSearch, setWaitingSearch] = useState("");

  // Pagination state for claimed artisans
  const [claimedPage, setClaimedPage] = useState(0);
  const [claimedPerPage, setClaimedPerPage] = useState(50);
  const [claimedSearch, setClaimedSearch] = useState("");

  // Pagination state for self-signup artisans (nouvelles inscriptions)
  const [selfSignupPage, setSelfSignupPage] = useState(0);
  const [selfSignupPerPage, setSelfSignupPerPage] = useState(50);
  const [selfSignupSearch, setSelfSignupSearch] = useState("");

  // Partner candidacies count
  const { data: candidaciesCount = 0 } = usePartnerCandidaciesCount();

  // Categories for filtering
  const { data: categoriesHierarchy = [] } = useCategoriesHierarchy();

  // Realtime subscription for instant updates on admin dashboard
  useEffect(() => {
    const channel = supabase
      .channel('admin-approvals-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'artisans'
      }, (payload) => {
        console.log("[Realtime Admin Approvals] Artisan changed:", payload);
        queryClient.invalidateQueries({ queryKey: ["pending-artisans"] });
        queryClient.invalidateQueries({ queryKey: ["prospect-artisans"] });
        queryClient.invalidateQueries({ queryKey: ["prospect-artisans-count"] });
        queryClient.invalidateQueries({ queryKey: ["waiting-artisans"] });
        queryClient.invalidateQueries({ queryKey: ["waiting-artisans-count"] });
        queryClient.invalidateQueries({ queryKey: ["claimed-artisans"] });
        queryClient.invalidateQueries({ queryKey: ["claimed-artisans-count"] });
        queryClient.invalidateQueries({ queryKey: ["self-signup-artisans"] });
        queryClient.invalidateQueries({ queryKey: ["self-signup-artisans-count"] });
        queryClient.invalidateQueries({ queryKey: ["pending-publication-artisans"] });
        queryClient.invalidateQueries({ queryKey: ["pending-publication-count"] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'artisan_documents'
      }, (payload) => {
        console.log("[Realtime Admin Approvals] Document changed:", payload);
        queryClient.invalidateQueries({ queryKey: ["pending-artisans"] });
        queryClient.invalidateQueries({ queryKey: ["claimed-artisans"] });
        queryClient.invalidateQueries({ queryKey: ["claimed-artisans-count"] });
        queryClient.invalidateQueries({ queryKey: ["self-signup-artisans"] });
        queryClient.invalidateQueries({ queryKey: ["self-signup-artisans-count"] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'missions'
      }, (payload) => {
        console.log("[Realtime Admin Approvals] Mission changed:", payload);
        queryClient.invalidateQueries({ queryKey: ["pending-missions"] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'partner_candidacies'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["partner-candidacies-pending"] });
        queryClient.invalidateQueries({ queryKey: ["partner-candidacies-count"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Fetch pending artisans (only those with ALL 4 mandatory documents)
  const MANDATORY_DOC_IDS = ["rc_pro", "decennale", "kbis"];
  
  const {
    data: pendingArtisans = [],
    isLoading: isLoadingArtisans
  } = useQuery({
    queryKey: ["pending-artisans"],
    queryFn: async () => {
      // First, get all documents and count mandatory docs per artisan
      const {
        data: allDocs,
        error: docsError
      } = await supabase.from("artisan_documents").select("artisan_id, name");
      if (docsError) throw docsError;
      
      // Count mandatory documents per artisan
      const mandatoryDocCountByArtisan: Record<string, Set<string>> = {};
      allDocs?.forEach(doc => {
        if (MANDATORY_DOC_IDS.includes(doc.name)) {
          if (!mandatoryDocCountByArtisan[doc.artisan_id]) {
            mandatoryDocCountByArtisan[doc.artisan_id] = new Set();
          }
          mandatoryDocCountByArtisan[doc.artisan_id].add(doc.name);
        }
      });

      // Get artisan IDs with ALL 4 mandatory documents
      const artisanIdsWithAllDocs = Object.entries(mandatoryDocCountByArtisan)
        .filter(([_, docs]) => docs.size >= MANDATORY_DOC_IDS.length)
        .map(([id]) => id);
      
      if (artisanIdsWithAllDocs.length === 0) {
        return [] as PendingArtisan[];
      }

      // Then fetch pending artisans who have ALL 4 mandatory documents
      const {
        data,
        error
      } = await supabase.from("artisans").select(`
          id,
          business_name,
          city,
          description,
          photo_url,
          siret,
          experience_years,
          portfolio_images,
          created_at,
          slug,
          category:categories(name),
          profile:profiles!artisans_profile_id_fkey(first_name, last_name, email, phone)
        `).eq("status", "pending").in("id", artisanIdsWithAllDocs).order("created_at", {
        ascending: false
      });
      if (error) throw error;
      return data as PendingArtisan[];
    }
  });

  // Fetch total count of prospect artisans
  const {
    data: totalProspects = 0
  } = useQuery({
    queryKey: ["prospect-artisans-count", prospectSearch],
    queryFn: async () => {
      let query = supabase.from("artisans").select("*", {
        count: "exact",
        head: true
      }).in("status", ["prospect", "active", "suspended", "disponible"]).is("user_id", null);
      if (prospectSearch.trim()) {
        query = query.or(`business_name.ilike.%${prospectSearch}%,city.ilike.%${prospectSearch}%`);
      }
      const {
        count,
        error
      } = await query;
      if (error) throw error;
      return count || 0;
    }
  });

  // Fetch prospect artisans (vitrines) with pagination
  const {
    data: prospectArtisans = [],
    isLoading: isLoadingProspects
  } = useQuery({
    queryKey: ["prospect-artisans", prospectPage, prospectsPerPage, prospectSearch],
    queryFn: async () => {
      let query = supabase.from("artisans").select(`
          id,
          business_name,
          city,
          email,
          phone,
          google_rating,
          source,
          category_id,
          description,
          photo_url,
          portfolio_images,
          created_at,
          slug,
          status,
          category:categories(name)
        `).in("status", ["prospect", "active", "suspended", "disponible"]).is("user_id", null);
      if (prospectSearch.trim()) {
        query = query.or(`business_name.ilike.%${prospectSearch}%,city.ilike.%${prospectSearch}%`);
      }
      const {
        data,
        error
      } = await query.order("created_at", {
        ascending: false
      }).range(prospectPage * prospectsPerPage, (prospectPage + 1) * prospectsPerPage - 1);
      if (error) throw error;
      return data as ProspectArtisan[];
    }
  });

  // Fetch exclusivity counts (artisans per city/category for prospect status)
  const { data: exclusivityMap = {} } = useQuery({
    queryKey: ["exclusivity-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artisans")
        .select("city, category_id")
        .in("status", ["active", "prospect"]);
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach(a => {
        if (a.category_id) {
          const key = `${a.city.toLowerCase().trim()}|${a.category_id}`;
          counts[key] = (counts[key] || 0) + 1;
        }
      });
      return counts;
    },
  });

  // Helper: Generate WhatsApp link with pre-filled message
  const getWhatsAppLink = (prospect: ProspectArtisan) => {
    const phone = prospect.phone?.replace(/[\s.-]/g, "");
    if (!phone) return null;
    // Convert to international format
    let intlPhone = phone;
    if (phone.startsWith("0")) {
      intlPhone = `33${phone.slice(1)}`;
    } else if (!phone.startsWith("33") && !phone.startsWith("+")) {
      intlPhone = `33${phone}`;
    }
    intlPhone = intlPhone.replace("+", "");
    
    const metier = prospect.category?.name || "votre secteur";
    const ville = prospect.city;
    const lienVitrine = `https://verified-craftsmen-hub.lovable.app/artisan/${prospect.slug}`;
    const message = `Bonjour, j'ai sélectionné votre entreprise pour représenter le secteur ${metier} sur la ville de ${ville} sur notre plateforme Artisans Validés. Votre vitrine est déjà prête ici : ${lienVitrine}. Il ne reste qu'une place disponible sur votre secteur. On l'active ?`;
    return `https://wa.me/${intlPhone}?text=${encodeURIComponent(message)}`;
  };

  // Fetch count of artisans pending publication (imported, set to pending for review)
  const { data: totalPendingPublication = 0 } = useQuery({
    queryKey: ["pending-publication-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("artisans")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")
        .like("source", "import%")
        .is("user_id", null);
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch artisans pending publication
  const { data: pendingPublicationArtisans = [], isLoading: isLoadingPendingPublication } = useQuery({
    queryKey: ["pending-publication-artisans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artisans")
        .select(`
          id, business_name, city, email, phone, description, photo_url, 
          portfolio_images, created_at, slug, source, category_id,
          portfolio_images, created_at, slug, source,
          category:categories(name)
        `)
        .eq("status", "pending")
        .like("source", "import%")
        .is("user_id", null)
        .order("business_name", { ascending: true })
        .limit(500);
      if (error) throw error;
      return data;
    },
  });

  // Reset publication search when switching away from "a-publier" sub-tab
  useEffect(() => {
    if (vitrineSubTab !== "a-publier") {
      setPubSearch("");
    }
  }, [vitrineSubTab]);

  // Filtered list of pending publication artisans (unified search: name, city, category)
  const filteredPendingPublication = useMemo(() => {
    if (!pubSearch.trim()) return pendingPublicationArtisans;
    const search = pubSearch.toLowerCase().trim();
    return pendingPublicationArtisans.filter(a => 
      a.business_name?.toLowerCase().includes(search) ||
      a.city?.toLowerCase().includes(search) ||
      a.category?.name?.toLowerCase().includes(search)
    );
  }, [pendingPublicationArtisans, pubSearch]);


  const publishArtisanMutation = useMutation({
    mutationFn: async (artisanId: string) => {
      const { error } = await supabase
        .from("artisans")
        .update({ status: "active" })
        .eq("id", artisanId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vitrine publiée avec succès !");
      queryClient.invalidateQueries({ queryKey: ["pending-publication-artisans"] });
      queryClient.invalidateQueries({ queryKey: ["pending-publication-count"] });
      queryClient.invalidateQueries({ queryKey: ["public-artisans"] });
    },
    onError: () => {
      toast.error("Erreur lors de la publication");
    },
  });

  // Mutation to unpublish (set active → pending)
  const unpublishArtisanMutation = useMutation({
    mutationFn: async (artisanId: string) => {
      const { error } = await supabase
        .from("artisans")
        .update({ status: "pending" })
        .eq("id", artisanId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vitrine mise hors ligne");
      queryClient.invalidateQueries({ queryKey: ["prospect-artisans"] });
      queryClient.invalidateQueries({ queryKey: ["prospect-artisans-count"] });
      queryClient.invalidateQueries({ queryKey: ["pending-publication-artisans"] });
      queryClient.invalidateQueries({ queryKey: ["pending-publication-count"] });
      queryClient.invalidateQueries({ queryKey: ["public-artisans"] });
    },
    onError: () => {
      toast.error("Erreur lors de la mise hors ligne");
    },
  });

  // Mutation to publish prospect to active
  const publishProspectMutation = useMutation({
    mutationFn: async (artisanId: string) => {
      const { error } = await supabase
        .from("artisans")
        .update({ status: "active" })
        .eq("id", artisanId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vitrine mise en ligne !");
      queryClient.invalidateQueries({ queryKey: ["prospect-artisans"] });
      queryClient.invalidateQueries({ queryKey: ["prospect-artisans-count"] });
      queryClient.invalidateQueries({ queryKey: ["public-artisans"] });
    },
    onError: () => {
      toast.error("Erreur lors de la publication");
    },
  });

  // Quick status change mutation for tri-status buttons
  const quickStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "suspended" | "disponible" }) => {
      const { error } = await supabase
        .from("artisans")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      const labels: Record<string, string> = { active: "VALIDÉ", suspended: "EN ATTENTE", disponible: "DISPONIBLE" };
      toast.success(`Statut changé : ${labels[variables.status]}`);
      queryClient.invalidateQueries({ queryKey: ["prospect-artisans"] });
      queryClient.invalidateQueries({ queryKey: ["prospect-artisans-count"] });
      queryClient.invalidateQueries({ queryKey: ["pending-publication-artisans"] });
      queryClient.invalidateQueries({ queryKey: ["pending-publication-count"] });
      queryClient.invalidateQueries({ queryKey: ["public-artisans"] });
      queryClient.invalidateQueries({ queryKey: ["admin-artisans"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: () => {
      toast.error("Erreur lors du changement de statut");
    },
  });

  // Mutation to delete an artisan from pending publication
  const deletePendingPublicationMutation = useMutation({
    mutationFn: async (artisanId: string) => {
      const { error } = await supabase
        .from("artisans")
        .delete()
        .eq("id", artisanId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vitrine supprimée");
      queryClient.invalidateQueries({ queryKey: ["pending-publication-artisans"] });
      queryClient.invalidateQueries({ queryKey: ["pending-publication-count"] });
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });


  // Fetch total count of WAITING artisans (email sent, no account yet)
  const {
    data: totalWaiting = 0
  } = useQuery({
    queryKey: ["waiting-artisans-count", waitingSearch],
    queryFn: async () => {
      let query = supabase.from("artisans").select("*", {
        count: "exact",
        head: true
      }).eq("status", "pending").is("user_id", null).not("activation_sent_at", "is", null);
      if (waitingSearch.trim()) {
        query = query.or(`business_name.ilike.%${waitingSearch}%,city.ilike.%${waitingSearch}%,email.ilike.%${waitingSearch}%`);
      }
      const {
        count,
        error
      } = await query;
      if (error) throw error;
      return count || 0;
    }
  });

  // Fetch WAITING artisans (email sent, account not created yet)
  const {
    data: waitingArtisans = [],
    isLoading: isLoadingWaiting
  } = useQuery({
    queryKey: ["waiting-artisans", waitingPage, waitingPerPage, waitingSearch],
    queryFn: async () => {
      let query = supabase.from("artisans").select(`
          id,
          business_name,
          city,
          email,
          phone,
          description,
          photo_url,
          created_at,
          activation_sent_at,
          reminder_count,
          reminder_sent_at,
          slug,
          category:categories(name)
        `).eq("status", "pending").is("user_id", null).not("activation_sent_at", "is", null);
      if (waitingSearch.trim()) {
        query = query.or(`business_name.ilike.%${waitingSearch}%,city.ilike.%${waitingSearch}%,email.ilike.%${waitingSearch}%`);
      }
      const {
        data,
        error
      } = await query.order("activation_sent_at", {
        ascending: false
      }).range(waitingPage * waitingPerPage, (waitingPage + 1) * waitingPerPage - 1);
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch total count of claimed artisans WITHOUT documents (they move to Approbation Artisans once they upload docs)
  const {
    data: totalClaimed = 0
  } = useQuery({
    queryKey: ["claimed-artisans-count", claimedSearch],
    queryFn: async () => {
      // 1. Get all artisan IDs that have documents
      const {
        data: artisansWithDocs
      } = await supabase.from("artisan_documents").select("artisan_id");
      const artisanIdsWithDocs = [...new Set(artisansWithDocs?.map(d => d.artisan_id) || [])];

      // 2. Count pending artisans with user_id but WITHOUT documents (ONLY imported, NOT self_signup)
      let query = supabase.from("artisans").select("*", {
        count: "exact",
        head: true
      }).not("user_id", "is", null).eq("status", "pending").or("source.is.null,source.eq.import");

      // Exclude those who have documents
      if (artisanIdsWithDocs.length > 0) {
        query = query.not("id", "in", `(${artisanIdsWithDocs.join(",")})`);
      }
      if (claimedSearch.trim()) {
        query = query.or(`business_name.ilike.%${claimedSearch}%,city.ilike.%${claimedSearch}%,email.ilike.%${claimedSearch}%`);
      }
      const {
        count,
        error
      } = await query;
      if (error) throw error;
      return count || 0;
    }
  });

  // Fetch claimed artisans WITHOUT documents (once they upload docs, they go to Approbation Artisans)
  const {
    data: claimedArtisans = [],
    isLoading: isLoadingClaimed
  } = useQuery({
    queryKey: ["claimed-artisans", claimedPage, claimedPerPage, claimedSearch],
    queryFn: async () => {
      // 1. Get all artisan IDs that have documents
      const {
        data: artisansWithDocs
      } = await supabase.from("artisan_documents").select("artisan_id");
      const artisanIdsWithDocs = [...new Set(artisansWithDocs?.map(d => d.artisan_id) || [])];

      // 2. Fetch pending artisans with user_id but WITHOUT documents (ONLY imported, NOT self_signup)
      let query = supabase.from("artisans").select(`
          id,
          business_name,
          city,
          email,
          phone,
          description,
          photo_url,
          created_at,
          updated_at,
          slug,
          status,
          source,
          category:categories(name),
          profile:profiles!artisans_profile_id_fkey(first_name, last_name, email, phone, created_at)
        `).not("user_id", "is", null).eq("status", "pending").or("source.is.null,source.eq.import");

      // Exclude those who have documents
      if (artisanIdsWithDocs.length > 0) {
        query = query.not("id", "in", `(${artisanIdsWithDocs.join(",")})`);
      }
      if (claimedSearch.trim()) {
        query = query.or(`business_name.ilike.%${claimedSearch}%,city.ilike.%${claimedSearch}%,email.ilike.%${claimedSearch}%`);
      }
      const {
        data,
        error
      } = await query.order("updated_at", {
        ascending: false
      }).range(claimedPage * claimedPerPage, (claimedPage + 1) * claimedPerPage - 1);
      if (error) throw error;
      if (!data || data.length === 0) return [] as ClaimedArtisan[];

      // No documents for these artisans by definition, but keep structure for consistency
      const enrichedData = data?.map(artisan => ({
        ...artisan,
        documents_count: 0,
        documents_pending: 0,
        documents_approved: 0
      })) as ClaimedArtisan[];
      return enrichedData;
    }
  });

  // Count pending approval (claimed but waiting)
  const {
    data: pendingApprovalCount = 0
  } = useQuery({
    queryKey: ["pending-approval-count"],
    queryFn: async () => {
      const {
        count,
        error
      } = await supabase.from("artisans").select("*", {
        count: "exact",
        head: true
      }).eq("status", "pending").not("user_id", "is", null);
      if (error) throw error;
      return count || 0;
    }
  });

  // Fetch total count of SELF-SIGNUP artisans (inscriptions directes SANS documents)
  const {
    data: totalSelfSignup = 0
  } = useQuery({
    queryKey: ["self-signup-artisans-count", selfSignupSearch],
    queryFn: async () => {
      // 1. Get artisan IDs that have documents
      const { data: artisansWithDocs } = await supabase.from("artisan_documents").select("artisan_id");
      const artisanIdsWithDocs = [...new Set(artisansWithDocs?.map(d => d.artisan_id) || [])];

      // 2. Count self-signup artisans WITHOUT documents
      let query = supabase.from("artisans").select("*", {
        count: "exact",
        head: true
      })
        .eq("status", "pending")
        .eq("source", "self_signup")
        .not("user_id", "is", null);

      // Exclude those who have documents
      if (artisanIdsWithDocs.length > 0) {
        query = query.not("id", "in", `(${artisanIdsWithDocs.join(",")})`);
      }

      if (selfSignupSearch.trim()) {
        query = query.or(`business_name.ilike.%${selfSignupSearch}%,city.ilike.%${selfSignupSearch}%,email.ilike.%${selfSignupSearch}%`);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    }
  });

  // Fetch SELF-SIGNUP artisans (inscriptions directes SANS documents)
  const {
    data: selfSignupArtisans = [],
    isLoading: isLoadingSelfSignup
  } = useQuery({
    queryKey: ["self-signup-artisans", selfSignupPage, selfSignupPerPage, selfSignupSearch],
    queryFn: async () => {
      // 1. Get artisan IDs that have documents
      const { data: artisansWithDocs } = await supabase.from("artisan_documents").select("artisan_id");
      const artisanIdsWithDocs = [...new Set(artisansWithDocs?.map(d => d.artisan_id) || [])];

      // 2. Fetch self-signup artisans WITHOUT documents
      let query = supabase.from("artisans").select(`
          id,
          business_name,
          city,
          email,
          phone,
          description,
          photo_url,
          created_at,
          slug,
          category:categories(name),
          profile:profiles!artisans_profile_id_fkey(first_name, last_name, email, phone, created_at)
        `)
        .eq("status", "pending")
        .eq("source", "self_signup")
        .not("user_id", "is", null);

      // Exclude those who have documents
      if (artisanIdsWithDocs.length > 0) {
        query = query.not("id", "in", `(${artisanIdsWithDocs.join(",")})`);
      }

      if (selfSignupSearch.trim()) {
        query = query.or(`business_name.ilike.%${selfSignupSearch}%,city.ilike.%${selfSignupSearch}%,email.ilike.%${selfSignupSearch}%`);
      }

      const { data, error } = await query
        .order("created_at", { ascending: false })
        .range(selfSignupPage * selfSignupPerPage, (selfSignupPage + 1) * selfSignupPerPage - 1);

      if (error) throw error;
      return data as SelfSignupArtisan[];
    }
  });


  const {
    data: pendingMissions = [],
    isLoading: isLoadingMissions
  } = useQuery({
    queryKey: ["pending-missions"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("missions").select(`
          id,
          title,
          description,
          city,
          budget,
          photos,
          created_at,
          category:categories(name),
          client:profiles!missions_client_id_fkey(first_name, last_name, email)
        `).eq("status", "pending_approval").order("created_at", {
        ascending: false
      });
      if (error) throw error;
      return data as PendingMission[];
    }
  });

  // Helper: Get artisan user_id
  const getArtisanUserId = async (artisanId: string): Promise<string | null> => {
    const { data } = await supabase
      .from("artisans")
      .select("user_id")
      .eq("id", artisanId)
      .single();
    return data?.user_id || null;
  };

  // Helper: Get document label in French
  const getDocumentLabel = (name: string): string => {
    const labels: Record<string, string> = {
      rc_pro: "RC Professionnelle",
      decennale: "Assurance Décennale",
      kbis: "Extrait KBIS"
    };
    return labels[name] || name;
  };

  // Helper: Check if all 4 mandatory documents are verified
  const checkAllDocumentsVerified = async (artisanId: string) => {
    const { data: docs } = await supabase
      .from("artisan_documents")
      .select("name, status")
      .eq("artisan_id", artisanId);
    
    const verifiedDocs = docs?.filter(d => d.status === "verified").map(d => d.name) || [];
    const allMandatoryVerified = MANDATORY_DOC_IDS.every(doc => verifiedDocs.includes(doc));
    
    if (allMandatoryVerified) {
      // Activate artisan automatically
      await supabase
        .from("artisans")
        .update({ status: "active", is_verified: true })
        .eq("id", artisanId);
      
      // Get user_id for notification
      const userId = await getArtisanUserId(artisanId);
      if (userId) {
        await supabase.rpc("create_notification", {
          p_user_id: userId,
          p_type: "approval",
          p_title: "Profil activé !",
          p_message: "Tous vos documents ont été validés. Votre profil est maintenant visible publiquement !",
          p_related_id: null
        });

        // Send activation email
        const artisan = documentsArtisan;
        if (artisan?.profile?.email) {
          await supabase.functions.invoke("send-notification-email", {
            body: {
              type: "artisan_approved",
              recipientEmail: artisan.profile.email,
              recipientFirstName: artisan.profile.first_name || "Artisan",
              senderName: "Artisans Validés"
            }
          });
        }
      }
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["pending-artisans"] });
      toast.success("Tous les documents validés - Profil activé !");
    }
  };

  // Refresh documents list
  const refreshDocuments = async () => {
    if (!documentsArtisan) return;
    const { data } = await supabase
      .from("artisan_documents")
      .select("*")
      .eq("artisan_id", documentsArtisan.id)
      .order("created_at", { ascending: false });
    setArtisanDocuments(data || []);
  };

  // Approve individual document mutation
  const approveDocumentMutation = useMutation({
    mutationFn: async ({ documentId, artisanId, documentName }: { 
      documentId: string; 
      artisanId: string; 
      documentName: string;
    }) => {
      // 1. Update document status to "verified"
      const { error } = await supabase
        .from("artisan_documents")
        .update({ status: "verified", updated_at: new Date().toISOString() })
        .eq("id", documentId);
      if (error) throw error;

      // 2. Send notification to artisan
      const userId = await getArtisanUserId(artisanId);
      if (userId) {
        await supabase.rpc("create_notification", {
          p_user_id: userId,
          p_type: "document_verified",
          p_title: "Document validé",
          p_message: `Votre document "${documentName}" a été vérifié et approuvé.`,
          p_related_id: documentId
        });
      }

      // 3. Check if all 4 mandatory documents are now verified
      await checkAllDocumentsVerified(artisanId);
    },
    onSuccess: () => {
      refreshDocuments();
      queryClient.invalidateQueries({ queryKey: ["artisan-documents"] });
      toast.success("Document approuvé");
    },
    onError: () => {
      toast.error("Erreur lors de l'approbation du document");
    }
  });

  // Reject individual document mutation
  const rejectDocumentMutation = useMutation({
    mutationFn: async ({ documentId, artisanId, documentName, reason }: {
      documentId: string;
      artisanId: string;
      documentName: string;
      reason: string;
    }) => {
      // 1. Update document status to "rejected"
      const { error } = await supabase
        .from("artisan_documents")
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .eq("id", documentId);
      if (error) throw error;

      // 2. Send notification to artisan
      const userId = await getArtisanUserId(artisanId);
      if (userId) {
        await supabase.rpc("create_notification", {
          p_user_id: userId,
          p_type: "document_rejected",
          p_title: "Document refusé",
          p_message: `Votre document "${documentName}" a été refusé. Raison : ${reason}. Veuillez soumettre un nouveau document.`,
          p_related_id: documentId
        });
      }
    },
    onSuccess: () => {
      refreshDocuments();
      queryClient.invalidateQueries({ queryKey: ["artisan-documents"] });
      toast.success("Document refusé - Notification envoyée");
      setShowDocumentRejectDialog(false);
      setDocumentToReject(null);
      setDocumentRejectReason("");
    },
    onError: () => {
      toast.error("Erreur lors du refus du document");
    }
  });

  // Approve artisan mutation (kept for backward compatibility)
  const approveArtisanMutation = useMutation({
    mutationFn: async (artisanId: string) => {
      // 1. Update artisan status
      const { error } = await supabase.from("artisans").update({
        status: "active",
        is_verified: true
      }).eq("id", artisanId);
      if (error) throw error;

      // 2. Update all pending documents to verified
      const { error: docsError } = await supabase
        .from("artisan_documents")
        .update({ status: "verified", updated_at: new Date().toISOString() })
        .eq("artisan_id", artisanId)
        .eq("status", "pending");
      
      if (docsError) {
        console.error("Erreur mise à jour documents:", docsError);
      }

      // 3. Send notification to artisan
      const artisan = pendingArtisans?.find(a => a.id === artisanId);
      if (artisan?.profile) {
        const { data: userData } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("email", artisan.profile.email)
          .single();
        if (userData) {
          await supabase.rpc("create_notification", {
            p_user_id: userData.user_id,
            p_type: "approval",
            p_title: "Profil approuvé !",
            p_message: "Félicitations ! Votre profil a été approuvé et est maintenant visible publiquement.",
            p_related_id: null
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["pending-artisans"]
      });
      queryClient.invalidateQueries({
        queryKey: ["artisan-documents"]
      });
      toast.success("Artisan approuvé avec succès");
      setSelectedArtisan(null);
    },
    onError: () => {
      toast.error("Erreur lors de l'approbation");
    }
  });

  // Reject artisan mutation
  const rejectArtisanMutation = useMutation({
    mutationFn: async ({
      artisanId,
      reason
    }: {
      artisanId: string;
      reason: string;
    }) => {
      const artisan = pendingArtisans?.find(a => a.id === artisanId);
      if (artisan?.profile) {
        const {
          data: userData
        } = await supabase.from("profiles").select("user_id").eq("email", artisan.profile.email).single();
        if (userData) {
          await supabase.rpc("create_notification", {
            p_user_id: userData.user_id,
            p_type: "rejection",
            p_title: "Profil non approuvé",
            p_message: `Votre demande d'approbation a été refusée. Raison : ${reason}. Veuillez corriger les éléments mentionnés et soumettre à nouveau votre demande.`,
            p_related_id: null
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["pending-artisans"]
      });
      toast.success("Notification de refus envoyée");
      setShowRejectDialog(false);
      setSelectedArtisan(null);
      setRejectReason("");
    },
    onError: () => {
      toast.error("Erreur lors de l'envoi de la notification");
    }
  });

  // Approve mission mutation
  const approveMissionMutation = useMutation({
    mutationFn: async (missionId: string) => {
      const {
        error
      } = await supabase.from("missions").update({
        status: "published"
      }).eq("id", missionId);
      if (error) throw error;
      const mission = pendingMissions?.find(m => m.id === missionId);
      if (mission?.client) {
        const {
          data: userData
        } = await supabase.from("profiles").select("user_id").eq("email", mission.client.email).single();
        if (userData) {
          await supabase.rpc("create_notification", {
            p_user_id: userData.user_id,
            p_type: "mission_approved",
            p_title: "Mission approuvée !",
            p_message: `Votre mission "${mission.title}" a été approuvée et est maintenant publiée. Les artisans peuvent désormais postuler.`,
            p_related_id: missionId
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["pending-missions"]
      });
      toast.success("Mission approuvée et publiée");
      setSelectedMission(null);
    },
    onError: () => {
      toast.error("Erreur lors de l'approbation");
    }
  });

  // Reject mission mutation
  const rejectMissionMutation = useMutation({
    mutationFn: async ({
      missionId,
      reason
    }: {
      missionId: string;
      reason: string;
    }) => {
      const {
        error
      } = await supabase.from("missions").update({
        status: "rejected",
        rejection_reason: reason
      }).eq("id", missionId);
      if (error) throw error;
      const mission = pendingMissions?.find(m => m.id === missionId);
      if (mission?.client) {
        const {
          data: userData
        } = await supabase.from("profiles").select("user_id").eq("email", mission.client.email).single();
        if (userData) {
          await supabase.rpc("create_notification", {
            p_user_id: userData.user_id,
            p_type: "mission_rejected",
            p_title: "Mission refusée",
            p_message: `Votre mission "${mission.title}" a été refusée. Raison : ${reason}. Vous pouvez modifier votre annonce et la resoumettre.`,
            p_related_id: missionId
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["pending-missions"]
      });
      toast.success("Mission refusée");
      setShowMissionRejectDialog(false);
      setSelectedMission(null);
      setRejectReason("");
    },
    onError: () => {
      toast.error("Erreur lors du refus");
    }
  });

  // Delete prospect mutation
  const deleteProspectMutation = useMutation({
    mutationFn: async (prospectId: string) => {
      const {
        error
      } = await supabase.from("artisans").delete().eq("id", prospectId).eq("status", "prospect");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["prospect-artisans"]
      });
      queryClient.invalidateQueries({
        queryKey: ["prospect-artisans-count"]
      });
      toast.success("Fiche vitrine supprimée");
      setProspectToDelete(null);
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    }
  });

  // Pagination helpers for prospects
  const totalProspectPages = Math.ceil(totalProspects / prospectsPerPage);
  const startIndex = prospectPage * prospectsPerPage + 1;
  const endIndex = Math.min((prospectPage + 1) * prospectsPerPage, totalProspects);

  // Pagination helpers for claimed (confirmées)
  const totalClaimedPages = Math.ceil(totalClaimed / claimedPerPage);
  const claimedStartIndex = claimedPage * claimedPerPage + 1;
  const claimedEndIndex = Math.min((claimedPage + 1) * claimedPerPage, totalClaimed);

  // Pagination helpers for waiting (en attente)
  const totalWaitingPages = Math.ceil(totalWaiting / waitingPerPage);
  const waitingStartIndex = waitingPage * waitingPerPage + 1;
  const waitingEndIndex = Math.min((waitingPage + 1) * waitingPerPage, totalWaiting);
  const handleProspectSearchChange = (value: string) => {
    setProspectSearch(value);
    setProspectPage(0); // Reset to first page on search
  };
  const handlePerPageChange = (value: string) => {
    setProspectsPerPage(parseInt(value));
    setProspectPage(0); // Reset to first page
  };
  const handleClaimedSearchChange = (value: string) => {
    setClaimedSearch(value);
    setClaimedPage(0);
  };
  const handleClaimedPerPageChange = (value: string) => {
    setClaimedPerPage(parseInt(value));
    setClaimedPage(0);
  };
  const handleWaitingSearchChange = (value: string) => {
    setWaitingSearch(value);
    setWaitingPage(0);
  };
  const handleWaitingPerPageChange = (value: string) => {
    setWaitingPerPage(parseInt(value));
    setWaitingPage(0);
  };
  const handleSelfSignupSearchChange = (value: string) => {
    setSelfSignupSearch(value);
    setSelfSignupPage(0);
  };
  const handleSelfSignupPerPageChange = (value: string) => {
    setSelfSignupPerPage(parseInt(value));
    setSelfSignupPage(0);
  };
  // Pagination helpers for self-signup (nouvelles inscriptions)
  const totalSelfSignupPages = Math.ceil(totalSelfSignup / selfSignupPerPage);
  const selfSignupStartIndex = selfSignupPage * selfSignupPerPage + 1;
  const selfSignupEndIndex = Math.min((selfSignupPage + 1) * selfSignupPerPage, totalSelfSignup);
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const getProfileCompleteness = (artisan: PendingArtisan) => {
    let score = 0;
    let total = 6;
    if (artisan.photo_url) score++;
    if (artisan.description && artisan.description.length > 50) score++;
    if (artisan.siret) score++;
    if (artisan.portfolio_images && artisan.portfolio_images.length >= 3) score++;
    if (artisan.experience_years && artisan.experience_years > 0) score++;
    if (artisan.city && artisan.city !== "Non renseigné") score++;
    return {
      score,
      total,
      percentage: Math.round(score / total * 100)
    };
  };

  // Load documents for an artisan
  const loadArtisanDocuments = async (artisan: PendingArtisan) => {
    setIsLoadingDocuments(true);
    setDocumentsArtisan(artisan);
    setShowDocumentsDialog(true);
    try {
      const {
        data,
        error
      } = await supabase.from("artisan_documents").select("*").eq("artisan_id", artisan.id).order("created_at", {
        ascending: false
      });
      if (error) throw error;
      setArtisanDocuments(data || []);
    } catch (error) {
      console.error("Error loading documents:", error);
      toast.error("Erreur lors du chargement des documents");
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  // Get signed URL for document download
  const getDocumentUrl = async (filePath: string) => {
    const {
      data,
      error
    } = await supabase.storage.from("artisan-documents").createSignedUrl(filePath, 3600);
    if (error) {
      toast.error("Erreur lors de l'accès au document");
      return null;
    }
    return data.signedUrl;
  };

  // Approve artisan with email notification
  const handleApproveArtisan = async (artisan: PendingArtisan) => {
    try {
      await approveArtisanMutation.mutateAsync(artisan.id);

      // Send approval email
      if (artisan.profile?.email) {
        await supabase.functions.invoke("send-notification-email", {
          body: {
            type: "artisan_approved",
            recipientEmail: artisan.profile.email,
            recipientFirstName: artisan.profile.first_name || "Artisan",
            senderName: "Artisans Validés"
          }
        });
      }
    } catch (error) {
      console.error("Error approving artisan:", error);
    }
  };

  // Reject artisan with email notification
  const handleRejectArtisan = async (artisan: PendingArtisan, reason: string) => {
    try {
      await rejectArtisanMutation.mutateAsync({
        artisanId: artisan.id,
        reason
      });

      // Send rejection email
      if (artisan.profile?.email) {
        await supabase.functions.invoke("send-notification-email", {
          body: {
            type: "artisan_rejected",
            recipientEmail: artisan.profile.email,
            recipientFirstName: artisan.profile.first_name || "Artisan",
            senderName: "Artisans Validés",
            rejectionReason: reason
          }
        });
      }
    } catch (error) {
      console.error("Error rejecting artisan:", error);
    }
  };
  return <>
      <Navbar />
      <div className="flex min-h-screen bg-background pt-28 lg:pt-20">
        <AdminSidebar />
      
        <main className="flex-1">
          <DashboardHeader 
            title="Demandes d'approbation" 
            subtitle="Vérifiez et approuvez les profils artisans et les missions" 
          />

          <div className="p-4 md:p-8">

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
            <TabsList className="w-full flex h-auto gap-1 p-1">
              <TabsTrigger value="missions" className="flex-1 gap-1.5 text-xs sm:text-sm px-2 sm:px-4 py-2">
                <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Missions</span>
                <span className="xs:hidden">Miss.</span>
                <Badge variant="secondary" className="ml-1 text-xs h-5 px-1.5">{pendingMissions.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="artisans" className="flex-1 gap-1.5 text-xs sm:text-sm px-2 sm:px-4 py-2">
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Artisans</span>
                <span className="xs:hidden">Art.</span>
                <Badge variant="secondary" className="ml-1 text-xs h-5 px-1.5">{totalSelfSignup + pendingArtisans.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="vitrines" className="flex-1 gap-1.5 text-xs sm:text-sm px-2 sm:px-4 py-2">
                <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Vitrines</span>
                <span className="xs:hidden">Vitr.</span>
                <Badge variant="secondary" className="ml-1 text-xs h-5 px-1.5">{totalProspects.toLocaleString('fr-FR')}</Badge>
              </TabsTrigger>
              <TabsTrigger value="candidatures" className="flex-1 gap-1.5 text-xs sm:text-sm px-2 sm:px-4 py-2">
                <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Candidatures</span>
                <span className="xs:hidden">Cand.</span>
                {candidaciesCount > 0 && (
                  <Badge variant="destructive" className="ml-1 text-xs h-5 px-1.5">{candidaciesCount}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* MISSIONS TAB */}
            <TabsContent value="missions">
              {isLoadingMissions ? <div className="flex items-center justify-center py-12 md:py-20">
                  <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" />
                </div> : pendingMissions.length > 0 ? <div className="grid gap-3 md:gap-6">
                  {pendingMissions.map(mission => <Card key={mission.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-3 md:p-6">
                        <div className="flex flex-col gap-3 md:gap-4">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base md:text-xl font-bold truncate">{mission.title}</h3>
                              <div className="flex flex-wrap items-center gap-1.5 md:gap-2 text-muted-foreground text-xs md:text-sm mt-1">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 md:h-4 md:w-4 shrink-0" />
                                  <span className="truncate max-w-[100px] md:max-w-none">{mission.city}</span>
                                </span>
                                {mission.category && <Badge variant="secondary" className="text-xs px-1.5 py-0">{mission.category.name}</Badge>}
                                {mission.budget && <span className="flex items-center gap-0.5 text-gold font-medium">
                                    <Euro className="h-3 w-3" />
                                    {mission.budget} €
                                  </span>}
                              </div>
                            </div>
                            <Badge variant="outline" className="gap-1 text-xs shrink-0">
                              <Clock className="h-2.5 w-2.5 md:h-3 md:w-3" />
                              <span className="hidden sm:inline">En attente</span>
                            </Badge>
                          </div>

                          {mission.description && <p className="text-muted-foreground text-xs md:text-sm line-clamp-2">
                              {mission.description}
                            </p>}

                          <div className="text-xs md:text-sm text-muted-foreground">
                            <span className="font-medium">Client : </span>
                            <span className="truncate">{mission.client?.first_name} {mission.client?.last_name}</span>
                            <span className="hidden md:inline"> ({mission.client?.email})</span>
                          </div>

                          {/* Actions - Mobile optimized */}
                          <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" className="flex-1 min-w-[80px] text-xs md:text-sm h-8 md:h-9" onClick={() => setSelectedMission(mission)}>
                              <Eye className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                              Détails
                            </Button>
                            <Button size="sm" className="flex-1 min-w-[80px] text-xs md:text-sm h-8 md:h-9" onClick={() => approveMissionMutation.mutate(mission.id)} disabled={approveMissionMutation.isPending}>
                              <CheckCircle2 className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                              <span className="hidden sm:inline">Approuver</span>
                              <span className="sm:hidden">OK</span>
                            </Button>
                            <Button variant="destructive" size="sm" className="flex-1 min-w-[80px] text-xs md:text-sm h-8 md:h-9" onClick={() => {
                        setSelectedMission(mission);
                        setShowMissionRejectDialog(true);
                      }}>
                              <XCircle className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                              Refuser
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>)}
                </div> : <Card>
                  <CardContent className="py-12 md:py-20 text-center">
                    <CheckCircle2 className="h-12 w-12 md:h-16 md:w-16 text-emerald-500 mx-auto mb-3 md:mb-4" />
                    <h3 className="text-lg md:text-xl font-semibold mb-2">Aucune mission en attente</h3>
                    <p className="text-muted-foreground text-sm md:text-base">
                      Toutes les missions ont été traitées.
                    </p>
                  </CardContent>
                </Card>}
            </TabsContent>

            {/* ARTISANS TAB */}
            <TabsContent value="artisans">
              {/* Sub-tabs for Artisans */}
              <div className="bg-card/50 p-4 md:p-6 border border-primary/20 rounded backdrop-blur-xl">
                <Tabs value={artisanSubTab} onValueChange={setArtisanSubTab}>
                  <TabsList className="mb-4 flex-wrap bg-background/80 shadow-sm">
                    <TabsTrigger value="nouvelles-inscriptions" className="gap-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                      <UserCheck className="h-4 w-4" />
                      <span className="hidden sm:inline">Nouvelles</span> Inscriptions
                      <Badge variant="secondary" className="ml-1 text-xs">{totalSelfSignup}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="en-attente" className="gap-1.5 data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                      <FileText className="h-4 w-4" />
                      <span className="hidden sm:inline">Documents</span> En attente
                      <Badge variant="secondary" className="ml-1 text-xs">{pendingArtisans.length}</Badge>
                    </TabsTrigger>
                  </TabsList>

                  {/* NOUVELLES INSCRIPTIONS SUB-TAB */}
                  <TabsContent value="nouvelles-inscriptions">
                    {/* Search and pagination controls */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Rechercher par nom, ville ou email..." value={selfSignupSearch} onChange={e => handleSelfSignupSearchChange(e.target.value)} className="pl-9" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground whitespace-nowrap">Par page:</span>
                        <Select value={selfSignupPerPage.toString()} onValueChange={handleSelfSignupPerPageChange}>
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Pagination info */}
                    {totalSelfSignup > 0 && <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 text-sm text-muted-foreground">
                        <span>
                          Affichage {selfSignupStartIndex} - {selfSignupEndIndex} sur {totalSelfSignup} inscriptions directes
                        </span>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setSelfSignupPage(p => Math.max(0, p - 1))} disabled={selfSignupPage === 0}>
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Précédent
                          </Button>
                          <span className="text-sm font-medium px-2">
                            Page {selfSignupPage + 1} / {totalSelfSignupPages || 1}
                          </span>
                          <Button variant="outline" size="sm" onClick={() => setSelfSignupPage(p => Math.min(totalSelfSignupPages - 1, p + 1))} disabled={selfSignupPage >= totalSelfSignupPages - 1}>
                            Suivant
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>}

                    {isLoadingSelfSignup ? <div className="flex items-center justify-center py-12 md:py-20">
                        <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" />
                      </div> : selfSignupArtisans.length > 0 ? <>
                        <div className="grid gap-3 md:gap-4">
                          {selfSignupArtisans.map(artisan => <Card key={artisan.id} className="hover:shadow-lg transition-shadow overflow-hidden border-l-4 border-l-blue-500">
                              <CardContent className="p-3 md:p-6">
                                <div className="flex flex-col sm:flex-row gap-3 md:gap-6">
                                  <Avatar className="h-14 w-14 md:h-20 md:w-20 ring-2 ring-blue-200 shrink-0 self-start">
                                    <AvatarImage src={artisan.photo_url || DEFAULT_AVATAR} />
                                    <AvatarFallback className="text-lg md:text-xl bg-blue-500 text-white">
                                      {artisan.business_name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>

                                  <div className="flex-1 min-w-0 overflow-hidden">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                                      <div className="min-w-0 flex-1">
                                        <h3 className="text-base md:text-xl font-bold truncate">{artisan.business_name}</h3>
                                        <div className="flex flex-wrap items-center gap-1.5 text-muted-foreground text-xs md:text-sm mt-1">
                                          <span className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3 md:h-4 md:w-4 shrink-0" />
                                            <span className="truncate">{artisan.city}</span>
                                          </span>
                                          {artisan.category && <Badge variant="secondary" className="text-xs px-1.5 py-0 shrink-0">{artisan.category.name}</Badge>}
                                        </div>
                                      </div>
                                      <Badge variant="outline" className="gap-1 text-xs shrink-0 self-start bg-blue-500/10 text-blue-600 border-blue-500/30">
                                        <UserCheck className="h-2.5 w-2.5" />
                                        Inscription directe
                                      </Badge>
                                    </div>

                                    {/* Contact info */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs md:text-sm text-muted-foreground mb-3">
                                      {artisan.profile?.email && <span className="flex items-center gap-1 truncate">
                                          <Mail className="h-3 w-3 shrink-0" />
                                          {artisan.profile.email}
                                        </span>}
                                      {artisan.profile?.phone && <span className="flex items-center gap-1">
                                          <Phone className="h-3 w-3 shrink-0" />
                                          {artisan.profile.phone}
                                        </span>}
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3 shrink-0" />
                                        Inscrit le {new Date(artisan.created_at).toLocaleDateString('fr-FR')}
                                      </span>
                                    </div>

                                    {/* Info message */}
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 text-xs md:text-sm text-amber-700">
                                      <div className="flex items-start gap-2">
                                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                        <span>Cet artisan s'est inscrit directement. Il doit encore uploader ses documents pour être validé.</span>
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="text-xs md:text-sm h-8 md:h-9 px-2 md:px-3"
                                        onClick={() => window.open(`/artisan/${artisan.slug}`, '_blank')}
                                        disabled={!artisan.slug}
                                      >
                                        <ExternalLink className="h-3.5 w-3.5 md:h-4 md:w-4 sm:mr-1" />
                                        <span className="hidden sm:inline">Voir</span>
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="text-xs md:text-sm h-8 md:h-9 px-2 md:px-3"
                                        onClick={() => {
                                          setEditArtisan(artisan);
                                          setEditDialogOpen(true);
                                        }}
                                      >
                                        <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4 sm:mr-1" />
                                        <span className="hidden sm:inline">Modifier</span>
                                      </Button>
                                      <Button 
                                        variant="destructive" 
                                        size="sm" 
                                        className="text-xs md:text-sm h-8 md:h-9 px-2 md:px-3"
                                        onClick={() => {
                                          setSelfSignupToDelete(artisan);
                                          setShowDeleteSelfSignupDialog(true);
                                        }}
                                      >
                                        <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4 sm:mr-1" />
                                        <span className="hidden sm:inline">Supprimer</span>
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>)}
                        </div>

                        {/* Bottom pagination */}
                        {totalSelfSignupPages > 1 && <div className="flex items-center justify-center gap-2 mt-6">
                            <Button variant="outline" size="sm" onClick={() => setSelfSignupPage(p => Math.max(0, p - 1))} disabled={selfSignupPage === 0}>
                              <ChevronLeft className="h-4 w-4 mr-1" />
                              Précédent
                            </Button>
                            <span className="text-sm font-medium px-4">
                              Page {selfSignupPage + 1} / {totalSelfSignupPages}
                            </span>
                            <Button variant="outline" size="sm" onClick={() => setSelfSignupPage(p => Math.min(totalSelfSignupPages - 1, p + 1))} disabled={selfSignupPage >= totalSelfSignupPages - 1}>
                              Suivant
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>}
                      </> : <Card>
                        <CardContent className="py-12 md:py-20 text-center">
                          <UserCheck className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground/50 mx-auto mb-3 md:mb-4" />
                          <h3 className="text-lg md:text-xl font-semibold mb-2">
                            {selfSignupSearch ? "Aucun résultat" : "Aucune nouvelle inscription"}
                          </h3>
                          <p className="text-muted-foreground text-sm md:text-base mb-4">
                            {selfSignupSearch ? `Aucun artisan trouvé pour "${selfSignupSearch}"` : "Aucun artisan ne s'est inscrit directement récemment."}
                          </p>
                          {selfSignupSearch && <Button variant="outline" onClick={() => setSelfSignupSearch("")}>
                              Effacer la recherche
                            </Button>}
                        </CardContent>
                      </Card>}
                  </TabsContent>

                  {/* EN ATTENTE D'APPROBATION SUB-TAB (tous ceux avec documents) */}
                  <TabsContent value="en-attente">
                    {isLoadingArtisans ? <div className="flex items-center justify-center py-12 md:py-20">
                        <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" />
                      </div> : pendingArtisans.length > 0 ? <div className="grid gap-3 md:gap-6">
                        {pendingArtisans.map(artisan => {
                      const completeness = getProfileCompleteness(artisan);
                      return <Card key={artisan.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-amber-500">
                              <CardContent className="p-3 md:p-6">
                                <div className="flex gap-3 md:gap-6">
                                  {/* Avatar - Smaller on mobile */}
                                  <Avatar className="h-14 w-14 md:h-24 md:w-24 ring-2 md:ring-4 ring-muted shrink-0">
                                    <AvatarImage src={artisan.photo_url || DEFAULT_AVATAR} />
                                    <AvatarFallback className="text-lg md:text-2xl bg-primary text-primary-foreground">
                                      <img src={DEFAULT_AVATAR} alt="Avatar" className="w-full h-full object-cover" />
                                    </AvatarFallback>
                                  </Avatar>

                                  <div className="flex-1 min-w-0">
                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <div className="min-w-0">
                                        <h3 className="text-base md:text-xl font-bold truncate">{artisan.business_name}</h3>
                                        <div className="flex flex-wrap items-center gap-1.5 text-muted-foreground text-xs md:text-sm">
                                          <span className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3 md:h-4 md:w-4" />
                                            <span className="truncate max-w-[80px] md:max-w-none">{artisan.city}</span>
                                          </span>
                                          {artisan.category && <Badge variant="secondary" className="text-xs px-1.5 py-0">{artisan.category.name}</Badge>}
                                        </div>
                                      </div>
                                      <Badge variant="outline" className="gap-1 text-xs shrink-0 hidden sm:flex bg-amber-500/10 text-amber-600 border-amber-500/30">
                                        <Clock className="h-2.5 w-2.5" />
                                        Documents à vérifier
                                      </Badge>
                                    </div>

                                    {artisan.description && <p className="text-muted-foreground text-xs md:text-sm line-clamp-2 mb-2 md:mb-4">
                                        {artisan.description}
                                      </p>}

                                    {/* Badges - Compact on mobile */}
                                    <div className="flex flex-wrap gap-1 md:gap-2 mb-2 md:mb-4">
                                      <Badge variant={artisan.photo_url ? "default" : "secondary"} className="gap-0.5 text-xs px-1.5 py-0">
                                        {artisan.photo_url ? <CheckCircle2 className="h-2.5 w-2.5" /> : <AlertCircle className="h-2.5 w-2.5" />}
                                        <span className="hidden sm:inline">Photo</span>
                                      </Badge>
                                      <Badge variant={artisan.siret ? "default" : "secondary"} className="gap-0.5 text-xs px-1.5 py-0">
                                        {artisan.siret ? <CheckCircle2 className="h-2.5 w-2.5" /> : <AlertCircle className="h-2.5 w-2.5" />}
                                        SIRET
                                      </Badge>
                                      <Badge variant={artisan.portfolio_images && artisan.portfolio_images.length >= 3 ? "default" : "secondary"} className="gap-0.5 text-xs px-1.5 py-0">
                                        {artisan.portfolio_images && artisan.portfolio_images.length >= 3 ? <CheckCircle2 className="h-2.5 w-2.5" /> : <AlertCircle className="h-2.5 w-2.5" />}
                                        {artisan.portfolio_images?.length || 0}/3
                                      </Badge>
                                    </div>

                                    {/* Progress bar - Compact on mobile */}
                                    <div className="mb-2 md:mb-4">
                                      <div className="flex justify-between text-xs mb-1">
                                        <span className="text-muted-foreground">Profil</span>
                                        <span className="font-medium">{completeness.percentage}%</span>
                                      </div>
                                      <div className="h-1.5 md:h-2 bg-muted rounded-full overflow-hidden">
                                        <div className={`h-full transition-all ${completeness.percentage >= 80 ? 'bg-emerald-500' : completeness.percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{
                                    width: `${completeness.percentage}%`
                                  }} />
                                      </div>
                                    </div>

                                    {/* Actions - Mobile optimized */}
                                    <div className="flex flex-wrap gap-1.5 md:gap-2">
                                      <Button variant="outline" size="sm" className="text-xs md:text-sm h-8 md:h-9 px-2 md:px-3" onClick={() => setSelectedArtisan(artisan)}>
                                        <Eye className="h-3.5 w-3.5 md:h-4 md:w-4 mr-0.5 md:mr-1" />
                                        <span className="hidden sm:inline">Profil</span>
                                      </Button>
                                      <Button variant="outline" size="sm" className="text-xs md:text-sm h-8 md:h-9 px-2 md:px-3" onClick={() => loadArtisanDocuments(artisan)}>
                                        <FileText className="h-3.5 w-3.5 md:h-4 md:w-4 mr-0.5 md:mr-1" />
                                        <span className="hidden sm:inline">Documents</span>
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="text-xs md:text-sm h-8 md:h-9 px-2 md:px-3"
                                        onClick={() => {
                                          setEditArtisan(artisan);
                                          setEditDialogOpen(true);
                                        }}
                                      >
                                        <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4 mr-0.5 md:mr-1" />
                                        <span className="hidden sm:inline">Modifier</span>
                                      </Button>
                                      <Button size="sm" className="text-xs md:text-sm h-8 md:h-9 px-2 md:px-3" onClick={() => handleApproveArtisan(artisan)} disabled={approveArtisanMutation.isPending}>
                                        <CheckCircle2 className="h-3.5 w-3.5 md:h-4 md:w-4 mr-0.5 md:mr-1" />
                                        <span className="hidden sm:inline">Accepter</span>
                                      </Button>
                                      <Button variant="destructive" size="sm" className="text-xs md:text-sm h-8 md:h-9 px-2 md:px-3" onClick={() => {
                                        setPendingArtisanToDelete(artisan);
                                        setShowDeletePendingDialog(true);
                                      }}>
                                        <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4 mr-0.5 md:mr-1" />
                                        <span className="hidden sm:inline">Supprimer</span>
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>;
                    })}
                      </div> : <Card>
                        <CardContent className="py-12 md:py-20 text-center">
                          <CheckCircle2 className="h-12 w-12 md:h-16 md:w-16 text-emerald-500 mx-auto mb-3 md:mb-4" />
                          <h3 className="text-lg md:text-xl font-semibold mb-2">Aucun document en attente</h3>
                          <p className="text-muted-foreground text-sm md:text-base">
                            Tous les artisans avec documents ont été traités.
                          </p>
                        </CardContent>
                      </Card>}
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>

            {/* VITRINES TAB */}
            <TabsContent value="vitrines">
              {/* Sub-tabs for Vitrines */}
              <div className="bg-card/50 p-4 md:p-6 border border-primary/20 rounded backdrop-blur-xl">
                <Tabs value={vitrineSubTab} onValueChange={setVitrineSubTab}>
                  <TabsList className="mb-4 flex-wrap bg-background/80 shadow-sm">
                    <TabsTrigger value="actives" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <Store className="h-4 w-4" />
                      <span className="hidden sm:inline">Vitrines</span> actives
                      <Badge variant="secondary" className="ml-1 text-xs">{totalProspects.toLocaleString('fr-FR')}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="en-attente" className="gap-1.5 data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                      <Mail className="h-4 w-4" />
                      <span className="hidden sm:inline">Vitrines</span> en attente
                      <Badge variant="secondary" className="ml-1 text-xs">{totalWaiting}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="confirmees" className="gap-1.5 data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                      <UserCheck className="h-4 w-4" />
                      <span className="hidden sm:inline">Vitrines</span> confirmées
                      <Badge variant="secondary" className="ml-1 text-xs">{totalClaimed}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="a-publier" className="gap-1.5 data-[state=active]:bg-gold data-[state=active]:text-navy-dark">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="hidden sm:inline">À</span> publier
                      {totalPendingPublication > 0 && <Badge variant="destructive" className="ml-1 text-xs">{totalPendingPublication}</Badge>}
                    </TabsTrigger>
                  </TabsList>

                {/* VITRINES ACTIVES SUB-TAB */}
                <TabsContent value="actives">
                  {/* Search and pagination controls */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Rechercher par nom ou ville..." value={prospectSearch} onChange={e => handleProspectSearchChange(e.target.value)} className="pl-9" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">Par page:</span>
                      <Select value={prospectsPerPage.toString()} onValueChange={handlePerPageChange}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Pagination info */}
                  {totalProspects > 0 && <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 text-sm text-muted-foreground">
                      <span>
                        Affichage {startIndex} - {endIndex} sur {totalProspects.toLocaleString('fr-FR')} vitrines
                      </span>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setProspectPage(p => Math.max(0, p - 1))} disabled={prospectPage === 0}>
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Précédent
                        </Button>
                        <span className="text-sm font-medium px-2">
                          Page {prospectPage + 1} / {totalProspectPages || 1}
                        </span>
                        <Button variant="outline" size="sm" onClick={() => setProspectPage(p => Math.min(totalProspectPages - 1, p + 1))} disabled={prospectPage >= totalProspectPages - 1}>
                          Suivant
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>}

                  {isLoadingProspects ? <div className="flex items-center justify-center py-12 md:py-20">
                      <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" />
                    </div> : prospectArtisans.length > 0 ? <>
                      <div className="grid gap-3 md:gap-6">
                        {prospectArtisans.map(prospect => <Card key={prospect.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                            <CardContent className="p-3 md:p-6">
                              <div className="flex flex-col sm:flex-row gap-3 md:gap-6">
                                <Avatar className="h-14 w-14 md:h-20 md:w-20 ring-2 ring-muted shrink-0 self-start">
                                  <AvatarImage src={prospect.photo_url || DEFAULT_AVATAR} />
                                  <AvatarFallback className="text-lg md:text-xl bg-primary text-primary-foreground">
                                    {prospect.business_name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>

                                <div className="flex-1 min-w-0 overflow-hidden">
                                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                          prospect.status === "active" ? "bg-green-500" :
                                          prospect.status === "suspended" ? "bg-orange-500" : "bg-gray-400"
                                        }`} />
                                        <h3 className="text-base md:text-xl font-bold truncate">{prospect.business_name}</h3>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-1.5 text-muted-foreground text-xs md:text-sm">
                                        <span className="flex items-center gap-1">
                                          <MapPin className="h-3 w-3 md:h-4 md:w-4 shrink-0" />
                                          <span className="truncate">{prospect.city}</span>
                                        </span>
                                        {prospect.category && <Badge variant="secondary" className="text-xs px-1.5 py-0 shrink-0">{prospect.category.name}</Badge>}
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 self-start">
                                      <Badge variant="outline" className="gap-1 text-xs shrink-0 bg-amber-500/10 text-amber-600 border-amber-500/30">
                                        <Store className="h-2.5 w-2.5" />
                                        À contacter
                                      </Badge>
                                      {prospect.google_rating && prospect.google_rating >= 4.5 && (
                                        <Badge variant="outline" className="gap-1 text-xs shrink-0 bg-yellow-500/10 text-yellow-700 border-yellow-500/30">
                                          ⭐ {prospect.google_rating}
                                        </Badge>
                                      )}
                                      {prospect.category_id && (() => {
                                        const key = `${prospect.city.toLowerCase().trim()}|${prospect.category_id}`;
                                        const count = exclusivityMap[key] || 0;
                                        return (
                                          <Badge variant="outline" className={`gap-1 text-xs shrink-0 ${count >= 2 ? 'bg-destructive/10 text-destructive border-destructive/30' : 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'}`}>
                                            <Users className="h-2.5 w-2.5" />
                                            {count}/2
                                          </Badge>
                                        );
                                      })()}
                                    </div>
                                  </div>

                                  {prospect.description && <p className="text-muted-foreground text-xs md:text-sm line-clamp-2 mb-2 md:mb-3">
                                      {prospect.description}
                                    </p>}

                                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-3">
                                    <span>Créée le {new Date(prospect.created_at).toLocaleDateString('fr-FR')}</span>
                                    {prospect.portfolio_images && prospect.portfolio_images.length > 0 && <span>• {prospect.portfolio_images.length} photo(s)</span>}
                                    {prospect.phone && <span className="flex items-center gap-1">• <Phone className="h-3 w-3" /> {prospect.phone}</span>}
                                  </div>

                                  {/* Tri-status buttons */}
                                  <div className="flex items-center gap-2 mb-2">
                                    <Button
                                      size="sm"
                                      className={`text-xs h-7 px-2.5 ${prospect.status === "active" ? "bg-green-600 hover:bg-green-700 text-white ring-2 ring-green-300" : "bg-green-100 hover:bg-green-200 text-green-800 border border-green-300"}`}
                                      onClick={() => quickStatusMutation.mutate({ id: prospect.id, status: "active" })}
                                      disabled={quickStatusMutation.isPending}
                                    >
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      VALIDÉ
                                    </Button>
                                    <Button
                                      size="sm"
                                      className={`text-xs h-7 px-2.5 ${prospect.status === "suspended" ? "bg-orange-500 hover:bg-orange-600 text-white ring-2 ring-orange-300" : "bg-orange-100 hover:bg-orange-200 text-orange-800 border border-orange-300"}`}
                                      onClick={() => quickStatusMutation.mutate({ id: prospect.id, status: "suspended" })}
                                      disabled={quickStatusMutation.isPending}
                                    >
                                      <Clock className="h-3 w-3 mr-1" />
                                      EN ATTENTE
                                    </Button>
                                    <Button
                                      size="sm"
                                      className={`text-xs h-7 px-2.5 ${prospect.status === "disponible" ? "bg-gray-700 hover:bg-gray-800 text-white ring-2 ring-gray-400" : "bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300"}`}
                                      onClick={() => quickStatusMutation.mutate({ id: prospect.id, status: "disponible" })}
                                      disabled={quickStatusMutation.isPending}
                                    >
                                      <User className="h-3 w-3 mr-1" />
                                      DISPONIBLE
                                    </Button>
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                                    {/* WhatsApp Button */}
                                    {(() => {
                                      const waLink = getWhatsAppLink(prospect);
                                      return waLink ? (
                                        <a href={waLink} target="_blank" rel="noopener noreferrer">
                                        <Button size="sm" className="text-xs md:text-sm h-8 md:h-9 px-2 md:px-3 bg-[#25D366] hover:bg-[#1da851] text-white" type="button">
                                          <MessageCircle className="h-3.5 w-3.5 md:h-4 md:w-4 sm:mr-1" />
                                          <span className="hidden sm:inline">WhatsApp</span>
                                        </Button>
                                        </a>
                                      ) : (
                                        <Button size="sm" className="text-xs md:text-sm h-8 md:h-9 px-2 md:px-3" variant="outline" disabled title="Pas de numéro de téléphone">
                                          <MessageCircle className="h-3.5 w-3.5 md:h-4 md:w-4 sm:mr-1 opacity-40" />
                                          <span className="hidden sm:inline opacity-40">WhatsApp</span>
                                        </Button>
                                      );
                                    })()}
                                    <Button variant="outline" size="sm" className="text-xs md:text-sm h-8 md:h-9 px-2 md:px-3" onClick={() => window.open(`/artisan/${prospect.slug}`, '_blank')}>
                                      <ExternalLink className="h-3.5 w-3.5 md:h-4 md:w-4 sm:mr-1" />
                                      <span className="hidden sm:inline">Voir</span>
                                    </Button>
                                    <Button variant="outline" size="sm" className="text-xs md:text-sm h-8 md:h-9 px-2 md:px-3" onClick={() => {
                                  setEditArtisan(prospect);
                                  setEditDialogOpen(true);
                                }}>
                                      <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4 sm:mr-1" />
                                      <span className="hidden sm:inline">Modifier</span>
                                    </Button>
                                    <Button variant="default" size="sm" className="text-xs md:text-sm h-8 md:h-9 px-2 md:px-3 bg-amber-500 hover:bg-amber-600" onClick={async () => {
                                  // Get artisan email first
                                  const {
                                    data: artisanData
                                  } = await supabase.from('artisans').select('email').eq('id', prospect.id).single();
                                  if (!artisanData?.email) {
                                    toast.error("Cet artisan n'a pas d'email. Ajoutez un email avant d'envoyer l'invitation.");
                                    return;
                                  }

                                  // Show confirmation dialog instead of native confirm()
                                  setPreregistrationProspect({
                                    prospect,
                                    email: artisanData.email
                                  });
                                  setShowPreregistrationDialog(true);
                                }}>
                                      <Mail className="h-3.5 w-3.5 md:h-4 md:w-4 sm:mr-1" />
                                      <span className="hidden sm:inline">Pré-inscription</span>
                                    </Button>
                                    <Button variant="destructive" size="sm" className="text-xs md:text-sm h-8 md:h-9 px-2 md:px-3" onClick={() => setProspectToDelete(prospect)}>
                                      <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4 sm:mr-1" />
                                      <span className="hidden sm:inline">Supprimer</span>
                                    </Button>
                                    <Button variant="outline" size="sm" className="text-xs md:text-sm h-8 md:h-9 px-2 md:px-3 text-purple-600 border-purple-300 hover:bg-purple-50" disabled={syncingArtisanId === prospect.id} onClick={async () => {
                                      setSyncingArtisanId(prospect.id);
                                      try {
                                        const { data, error } = await supabase.functions.invoke("sync-artisan-media", {
                                          body: { artisanId: prospect.id }
                                        });
                                        if (error) throw error;
                                        if (data?.error && !data?.success) {
                                          toast.error(data.error);
                                        } else {
                                          const parts = [];
                                          if (data.photos_added > 0) parts.push(`${data.photos_added} photo(s)`);
                                          if (data.videos_added > 0) parts.push(`${data.videos_added} vidéo(s)`);
                                          if (data.description_generated) parts.push("description SEO");
                                          if (parts.length > 0) {
                                            toast.success(`Sync réussie : ${parts.join(", ")} ajouté(s)`);
                                          } else {
                                            toast.info("Aucun nouveau média trouvé sur le site");
                                          }
                                          queryClient.invalidateQueries({ queryKey: ["prospect-artisans"] });
                                        }
                                      } catch (err) {
                                        console.error("Sync error:", err);
                                        toast.error("Erreur lors de la synchronisation");
                                      } finally {
                                        setSyncingArtisanId(null);
                                      }
                                    }}>
                                      {syncingArtisanId === prospect.id ? (
                                        <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 animate-spin sm:mr-1" />
                                      ) : (
                                        <ImageDown className="h-3.5 w-3.5 md:h-4 md:w-4 sm:mr-1" />
                                      )}
                                      <span className="hidden sm:inline">Sync</span>
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>)}
                      </div>

                      {/* Bottom pagination */}
                      {totalProspectPages > 1 && <div className="flex items-center justify-center gap-2 mt-6">
                          <Button variant="outline" size="sm" onClick={() => setProspectPage(p => Math.max(0, p - 1))} disabled={prospectPage === 0}>
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Précédent
                          </Button>
                          <span className="text-sm font-medium px-4">
                            Page {prospectPage + 1} / {totalProspectPages}
                          </span>
                          <Button variant="outline" size="sm" onClick={() => setProspectPage(p => Math.min(totalProspectPages - 1, p + 1))} disabled={prospectPage >= totalProspectPages - 1}>
                            Suivant
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>}
                    </> : <Card>
                      <CardContent className="py-12 md:py-20 text-center">
                        <Store className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground/50 mx-auto mb-3 md:mb-4" />
                        <h3 className="text-lg md:text-xl font-semibold mb-2">
                          {prospectSearch ? "Aucun résultat" : "Aucune fiche vitrine"}
                        </h3>
                        <p className="text-muted-foreground text-sm md:text-base mb-4">
                          {prospectSearch ? `Aucune vitrine trouvée pour "${prospectSearch}"` : "Créez des fiches vitrines pour attirer de nouveaux artisans."}
                        </p>
                        {prospectSearch ? <Button variant="outline" onClick={() => setProspectSearch("")}>
                            Effacer la recherche
                          </Button> : <Button onClick={() => navigate("/admin/ajouter-artisan")}>
                            Créer une fiche vitrine
                          </Button>}
                      </CardContent>
                    </Card>}
                </TabsContent>

                {/* VITRINES EN ATTENTE SUB-TAB (email envoyé, compte pas créé) */}
                <TabsContent value="en-attente">
                  {/* Search and pagination controls */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Rechercher par nom, ville ou email..." value={waitingSearch} onChange={e => handleWaitingSearchChange(e.target.value)} className="pl-9" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">Par page:</span>
                      <Select value={waitingPerPage.toString()} onValueChange={handleWaitingPerPageChange}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Pagination info */}
                  {totalWaiting > 0 && <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 text-sm text-muted-foreground">
                      <span>
                        Affichage {waitingStartIndex} - {waitingEndIndex} sur {totalWaiting.toLocaleString('fr-FR')} artisans en attente
                      </span>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setWaitingPage(p => Math.max(0, p - 1))} disabled={waitingPage === 0}>
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Précédent
                        </Button>
                        <span className="text-sm font-medium px-2">
                          Page {waitingPage + 1} / {totalWaitingPages || 1}
                        </span>
                        <Button variant="outline" size="sm" onClick={() => setWaitingPage(p => Math.min(totalWaitingPages - 1, p + 1))} disabled={waitingPage >= totalWaitingPages - 1}>
                          Suivant
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>}

                  {isLoadingWaiting ? <div className="flex items-center justify-center py-12 md:py-20">
                      <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" />
                    </div> : waitingArtisans.length > 0 ? <>
                      <div className="grid gap-3 md:gap-4">
                        {waitingArtisans.map(artisan => <Card key={artisan.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                            <CardContent className="p-3 md:p-6">
                              <div className="flex flex-col sm:flex-row gap-3 md:gap-6">
                                <Avatar className="h-14 w-14 md:h-20 md:w-20 ring-2 ring-muted shrink-0 self-start">
                                  <AvatarImage src={artisan.photo_url || DEFAULT_AVATAR} />
                                  <AvatarFallback className="text-lg md:text-xl bg-primary text-primary-foreground">
                                    {artisan.business_name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>

                                <div className="flex-1 min-w-0 overflow-hidden">
                                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                                    <div className="min-w-0 flex-1">
                                      <h3 className="text-base md:text-xl font-bold truncate">{artisan.business_name}</h3>
                                      <div className="flex flex-wrap items-center gap-1.5 text-muted-foreground text-xs md:text-sm mt-1">
                                        <span className="flex items-center gap-1">
                                          <MapPin className="h-3 w-3 md:h-4 md:w-4 shrink-0" />
                                          <span className="truncate">{artisan.city}</span>
                                        </span>
                                        {artisan.category && <Badge variant="secondary" className="text-xs px-1.5 py-0 shrink-0">{artisan.category.name}</Badge>}
                                      </div>
                                    </div>
                                    <Badge variant="outline" className="gap-1 text-xs shrink-0 self-start bg-amber-500/10 text-amber-600 border-amber-500/30">
                                      <Mail className="h-2.5 w-2.5" />
                                      Email envoyé
                                    </Badge>
                                  </div>

                                  {/* Artisan contact info */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3 text-xs md:text-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <Mail className="h-3.5 w-3.5 shrink-0" />
                                      <span className="truncate">{artisan.email || 'Non renseigné'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <Phone className="h-3.5 w-3.5 shrink-0" />
                                      <span>{artisan.phone || 'Non renseigné'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                                      <span>Email envoyé le {artisan.activation_sent_at ? formatDate(artisan.activation_sent_at) : 'N/A'}</span>
                                    </div>
                                  </div>

                                  {artisan.description && <p className="text-muted-foreground text-xs md:text-sm line-clamp-2 mb-3">
                                      {artisan.description}
                                    </p>}

                                  <div className="flex flex-wrap gap-2">
                                    {/* WhatsApp button for waiting artisan */}
                                    {artisan.phone && (() => {
                                      let intlPhone = artisan.phone.replace(/[\s.-]/g, "");
                                      if (intlPhone.startsWith("0")) intlPhone = `33${intlPhone.slice(1)}`;
                                      else if (!intlPhone.startsWith("33") && !intlPhone.startsWith("+")) intlPhone = `33${intlPhone}`;
                                      intlPhone = intlPhone.replace("+", "");
                                      const msg = `Bonjour, j'ai sélectionné votre entreprise pour représenter le secteur ${artisan.category?.name || "votre métier"} sur la ville de ${artisan.city} sur notre plateforme Artisans Validés. Votre vitrine est déjà prête ici : https://verified-craftsmen-hub.lovable.app/artisan/${artisan.slug}. Il ne reste qu'une place disponible sur votre secteur. On l'active ?`;
                                      return (
                                        <a href={`https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer">
                                          <Button size="sm" className="text-xs md:text-sm h-8 md:h-9 px-3 bg-[#25D366] hover:bg-[#1da851] text-white" type="button">
                                            <MessageCircle className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5" />
                                            WhatsApp
                                          </Button>
                                        </a>
                                      );
                                    })()}
                                    <Button variant="outline" size="sm" className="text-xs md:text-sm h-8 md:h-9 px-3" onClick={() => window.open(`/artisan/${artisan.slug}`, '_blank')}>
                                      <ExternalLink className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5" />
                                      Voir la fiche
                                    </Button>
                                      <Button 
                                      variant="default" 
                                      size="sm" 
                                      className="text-xs md:text-sm h-8 md:h-9 px-3 bg-amber-500 hover:bg-amber-600"
                                      onClick={() => {
                                        setReminderArtisan(artisan);
                                        setShowReminderDialog(true);
                                      }}
                                    >
                                      <RefreshCw className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5" />
                                      Relancer
                                    </Button>
                                      <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="text-xs md:text-sm h-8 md:h-9 px-3"
                                      onClick={() => {
                                        setEditArtisan(artisan);
                                        setEditDialogOpen(true);
                                      }}
                                    >
                                      <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5" />
                                      Modifier
                                    </Button>
                                    <Button 
                                      variant="destructive" 
                                      size="sm" 
                                      className="text-xs md:text-sm h-8 md:h-9 px-3"
                                      onClick={() => {
                                        setWaitingArtisanToDelete(artisan);
                                        setShowDeleteWaitingDialog(true);
                                      }}
                                    >
                                      <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5" />
                                      Supprimer
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>)}
                      </div>

                      {/* Bottom pagination */}
                      {totalWaitingPages > 1 && <div className="flex items-center justify-center gap-2 mt-6">
                          <Button variant="outline" size="sm" onClick={() => setWaitingPage(p => Math.max(0, p - 1))} disabled={waitingPage === 0}>
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Précédent
                          </Button>
                          <span className="text-sm font-medium px-4">
                            Page {waitingPage + 1} / {totalWaitingPages}
                          </span>
                          <Button variant="outline" size="sm" onClick={() => setWaitingPage(p => Math.min(totalWaitingPages - 1, p + 1))} disabled={waitingPage >= totalWaitingPages - 1}>
                            Suivant
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>}
                    </> : <Card>
                      <CardContent className="py-12 md:py-20 text-center">
                        <Mail className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground/50 mx-auto mb-3 md:mb-4" />
                        <h3 className="text-lg md:text-xl font-semibold mb-2">
                          {waitingSearch ? "Aucun résultat" : "Aucun artisan en attente"}
                        </h3>
                        <p className="text-muted-foreground text-sm md:text-base mb-4">
                          {waitingSearch ? `Aucun artisan trouvé pour "${waitingSearch}"` : "Tous les artisans prospectés ont créé leur compte."}
                        </p>
                        {waitingSearch && <Button variant="outline" onClick={() => setWaitingSearch("")}>
                            Effacer la recherche
                          </Button>}
                      </CardContent>
                    </Card>}
                </TabsContent>

                {/* VITRINES CONFIRMÉES SUB-TAB (compte créé, pas de documents) */}
                <TabsContent value="confirmees">
                  {/* Search and pagination controls */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Rechercher par nom, ville ou email..." value={claimedSearch} onChange={e => handleClaimedSearchChange(e.target.value)} className="pl-9" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">Par page:</span>
                      <Select value={claimedPerPage.toString()} onValueChange={handleClaimedPerPageChange}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Pagination info */}
                  {totalClaimed > 0 && <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 text-sm text-muted-foreground">
                      <span>
                        Affichage {claimedStartIndex} - {claimedEndIndex} sur {totalClaimed.toLocaleString('fr-FR')} artisans confirmés
                      </span>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setClaimedPage(p => Math.max(0, p - 1))} disabled={claimedPage === 0}>
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Précédent
                        </Button>
                        <span className="text-sm font-medium px-2">
                          Page {claimedPage + 1} / {totalClaimedPages || 1}
                        </span>
                        <Button variant="outline" size="sm" onClick={() => setClaimedPage(p => Math.min(totalClaimedPages - 1, p + 1))} disabled={claimedPage >= totalClaimedPages - 1}>
                          Suivant
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>}

                  {isLoadingClaimed ? <div className="flex items-center justify-center py-12 md:py-20">
                      <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" />
                    </div> : claimedArtisans.length > 0 ? <>
                      <div className="grid gap-3 md:gap-4">
                        {claimedArtisans.map(artisan => <Card key={artisan.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                            <CardContent className="p-3 md:p-6">
                              <div className="flex flex-col sm:flex-row gap-3 md:gap-6">
                                <Avatar className="h-14 w-14 md:h-20 md:w-20 ring-2 ring-muted shrink-0 self-start">
                                  <AvatarImage src={artisan.photo_url || DEFAULT_AVATAR} />
                                  <AvatarFallback className="text-lg md:text-xl bg-primary text-primary-foreground">
                                    {artisan.business_name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>

                                <div className="flex-1 min-w-0 overflow-hidden">
                                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                                    <div className="min-w-0 flex-1">
                                      <h3 className="text-base md:text-xl font-bold truncate">{artisan.business_name}</h3>
                                      <div className="flex flex-wrap items-center gap-1.5 text-muted-foreground text-xs md:text-sm mt-1">
                                        <span className="flex items-center gap-1">
                                          <MapPin className="h-3 w-3 md:h-4 md:w-4 shrink-0" />
                                          <span className="truncate">{artisan.city}</span>
                                        </span>
                                        {artisan.category && <Badge variant="secondary" className="text-xs px-1.5 py-0 shrink-0">{artisan.category.name}</Badge>}
                                      </div>
                                    </div>
                                    <Badge variant="outline" className="gap-1 text-xs shrink-0 self-start bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                                      <UserCheck className="h-2.5 w-2.5" />
                                      Compte créé
                                    </Badge>
                                  </div>

                                  {/* Artisan contact info */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3 text-xs md:text-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <User className="h-3.5 w-3.5 shrink-0" />
                                      <span className="truncate">
                                        {artisan.profile?.first_name || artisan.profile?.last_name ? `${artisan.profile?.first_name || ''} ${artisan.profile?.last_name || ''}`.trim() : 'Non renseigné'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <Mail className="h-3.5 w-3.5 shrink-0" />
                                      <span className="truncate">{artisan.profile?.email || artisan.email || 'Non renseigné'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <Phone className="h-3.5 w-3.5 shrink-0" />
                                      <span>{artisan.profile?.phone || artisan.phone || 'Non renseigné'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                                      <span>Compte créé le {artisan.profile?.created_at ? formatDate(artisan.profile.created_at) : formatDate(artisan.updated_at)}</span>
                                    </div>
                                  </div>
                                  
                                  {/* Documents status - always 0 for this tab */}
                                  <div className="mb-3">
                                    <Badge variant="outline" className="gap-1.5 text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
                                      <FileText className="h-3 w-3" />
                                      0 document - En attente d'upload
                                    </Badge>
                                  </div>

                                  {artisan.description && <p className="text-muted-foreground text-xs md:text-sm line-clamp-2 mb-3">
                                      {artisan.description}
                                    </p>}

                                  <div className="flex flex-wrap gap-2">
                                    <Button variant="outline" size="sm" className="text-xs md:text-sm h-8 md:h-9 px-3" onClick={() => window.open(`/artisan/${artisan.slug}`, '_blank')}>
                                      <ExternalLink className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5" />
                                      Voir le profil
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="text-xs md:text-sm h-8 md:h-9 px-3"
                                      onClick={() => {
                                        setEditArtisan(artisan);
                                        setEditDialogOpen(true);
                                      }}
                                    >
                                      <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5" />
                                      Modifier
                                    </Button>
                                    <Button 
                                      variant="destructive" 
                                      size="sm" 
                                      className="text-xs md:text-sm h-8 md:h-9 px-3"
                                      onClick={() => {
                                        setClaimedArtisanToDelete(artisan);
                                        setShowDeleteClaimedDialog(true);
                                      }}
                                    >
                                      <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5" />
                                      Supprimer
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>)}
                      </div>

                      {/* Bottom pagination */}
                      {totalClaimedPages > 1 && <div className="flex items-center justify-center gap-2 mt-6">
                          <Button variant="outline" size="sm" onClick={() => setClaimedPage(p => Math.max(0, p - 1))} disabled={claimedPage === 0}>
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Précédent
                          </Button>
                          <span className="text-sm font-medium px-4">
                            Page {claimedPage + 1} / {totalClaimedPages}
                          </span>
                          <Button variant="outline" size="sm" onClick={() => setClaimedPage(p => Math.min(totalClaimedPages - 1, p + 1))} disabled={claimedPage >= totalClaimedPages - 1}>
                            Suivant
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>}
                    </> : <Card>
                      <CardContent className="py-12 md:py-20 text-center">
                        <UserCheck className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground/50 mx-auto mb-3 md:mb-4" />
                        <h3 className="text-lg md:text-xl font-semibold mb-2">
                          {claimedSearch ? "Aucun résultat" : "Aucun artisan confirmé"}
                        </h3>
                        <p className="text-muted-foreground text-sm md:text-base mb-4">
                          {claimedSearch ? `Aucun artisan trouvé pour "${claimedSearch}"` : "Aucun artisan n'a encore créé son compte depuis l'email de pré-inscription."}
                        </p>
                        {claimedSearch && <Button variant="outline" onClick={() => setClaimedSearch("")}>
                            Effacer la recherche
                          </Button>}
                      </CardContent>
                    </Card>}
                </TabsContent>

                {/* VITRINES À PUBLIER SUB-TAB */}
                <TabsContent value="a-publier">
                  {/* Unified search bar */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder="Rechercher par nom, métier ou ville..."
                      value={pubSearch}
                      onChange={e => setPubSearch(e.target.value)}
                      className="pl-11 h-12 text-base rounded-xl shadow-sm border-border"
                      autoFocus
                    />
                    {pubSearch && (
                      <button
                        onClick={() => setPubSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {isLoadingPendingPublication ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : filteredPendingPublication.length > 0 ? (
                    <>
                       <div className="mb-4 text-sm text-muted-foreground">
                        {filteredPendingPublication.length} vitrine{filteredPendingPublication.length > 1 ? "s" : ""} sur {pendingPublicationArtisans.length} {pubSearch ? "— filtrées" : "en attente de publication"}
                      </div>
                      <div className="grid gap-3">
                        {filteredPendingPublication.map(artisan => (
                          <Card key={artisan.id} className="hover:shadow-lg transition-shadow">
                            <CardContent className="p-3 md:p-5">
                              <div className="flex items-start gap-3 md:gap-4">
                                <Avatar className="h-12 w-12 ring-2 ring-muted shrink-0">
                                  <AvatarImage src={artisan.photo_url || DEFAULT_AVATAR} />
                                  <AvatarFallback className="bg-primary text-primary-foreground">
                                    {artisan.business_name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-sm md:text-base truncate">{artisan.business_name}</h3>
                                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                    <MapPin className="h-3 w-3 shrink-0" />
                                    <span>{artisan.city}</span>
                                    {artisan.category && (
                                      <Badge variant="secondary" className="text-xs px-1.5 py-0">{artisan.category.name}</Badge>
                                    )}
                                  </div>
                                  {artisan.description && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{artisan.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border">
                                  {/* Online/Offline Toggle */}
                                  <div className="flex items-center gap-2 mr-auto">
                                    <Switch
                                      checked={false}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          publishArtisanMutation.mutate(artisan.id);
                                        }
                                      }}
                                    />
                                    <span className="text-xs text-muted-foreground">En ligne</span>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditArtisan(artisan as any);
                                      setEditDialogOpen(true);
                                    }}
                                  >
                                    <Pencil className="h-4 w-4 sm:mr-1" />
                                    <span className="hidden sm:inline">Modifier</span>
                                  </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const previewUrl = `${window.location.origin}/artisan/${artisan.slug || artisan.id}?preview=true`;
                                        navigator.clipboard.writeText(previewUrl);
                                        toast.success("Lien de présentation copié !");
                                      }}
                                    >
                                      <Link2 className="h-4 w-4 sm:mr-1" />
                                      <span className="hidden sm:inline">Copier lien</span>
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => navigate(`/artisan/${artisan.slug || artisan.id}?preview=true`)}
                                    >
                                      <Eye className="h-4 w-4 sm:mr-1" />
                                      <span className="hidden sm:inline">Voir</span>
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => deletePendingPublicationMutation.mutate(artisan.id)}
                                    disabled={deletePendingPublicationMutation.isPending}
                                  >
                                    <Trash2 className="h-4 w-4 sm:mr-1" />
                                    <span className="hidden sm:inline">Supprimer</span>
                                  </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </>
                  ) : (
                    <Card>
                      <CardContent className="p-8 text-center">
                        {pubSearch ? (
                          <>
                            <Search className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                            <p className="font-medium">Aucun résultat</p>
                            <p className="text-sm text-muted-foreground mt-1">Aucune vitrine ne correspond à votre recherche.</p>
                            <Button variant="outline" className="mt-3" onClick={() => setPubSearch("")}>
                              Réinitialiser la recherche
                            </Button>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                            <p className="font-medium">Toutes les vitrines sont publiées</p>
                            <p className="text-sm text-muted-foreground mt-1">Aucune vitrine en attente de publication.</p>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
              </div>
            </TabsContent>

            {/* CANDIDATURES TAB */}
            <TabsContent value="candidatures">
              <div className="bg-card/50 p-4 md:p-6 border border-gold/20 rounded backdrop-blur-xl">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Crown className="h-5 w-5 text-gold" />
                  Nouvelles candidatures artisans
                </h2>
                <AdminCandidatures />
              </div>
            </TabsContent>
          </Tabs>

          {/* Reject Artisan Dialog */}
          <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Refuser la demande artisan</DialogTitle>
                <DialogDescription>
                  Expliquez à l'artisan pourquoi sa demande est refusée.
                </DialogDescription>
              </DialogHeader>
              <Textarea placeholder="Raison du refus..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={4} />
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Annuler</Button>
                <Button variant="destructive" onClick={() => {
                if (selectedArtisan && rejectReason.trim()) {
                  rejectArtisanMutation.mutate({
                    artisanId: selectedArtisan.id,
                    reason: rejectReason
                  });
                }
              }} disabled={!rejectReason.trim() || rejectArtisanMutation.isPending}>
                  {rejectArtisanMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Envoyer le refus
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Reject Mission Dialog */}
          <Dialog open={showMissionRejectDialog} onOpenChange={setShowMissionRejectDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Refuser la mission</DialogTitle>
                <DialogDescription>
                  Expliquez au client pourquoi sa mission est refusée.
                </DialogDescription>
              </DialogHeader>
              <Textarea placeholder="Raison du refus (ex: Description incomplète, budget irréaliste...)" value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={4} />
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowMissionRejectDialog(false)}>Annuler</Button>
                <Button variant="destructive" onClick={() => {
                if (selectedMission && rejectReason.trim()) {
                  rejectMissionMutation.mutate({
                    missionId: selectedMission.id,
                    reason: rejectReason
                  });
                }
              }} disabled={!rejectReason.trim() || rejectMissionMutation.isPending}>
                  {rejectMissionMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Refuser la mission
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* View Artisan Profile Dialog */}
          <Dialog open={!!selectedArtisan && !showRejectDialog} onOpenChange={() => setSelectedArtisan(null)}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto mx-2 md:mx-auto">
              {selectedArtisan && <>
                  <DialogHeader>
                    <DialogTitle className="text-lg md:text-xl">Profil de {selectedArtisan.business_name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 md:space-y-6">
                    <div className="grid grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm">
                      <div>
                        <p className="text-muted-foreground">Email</p>
                        <p className="font-medium truncate">{selectedArtisan.profile?.email || "Non renseigné"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Téléphone</p>
                        <p className="font-medium">{selectedArtisan.profile?.phone || "Non renseigné"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">SIRET</p>
                        <p className="font-medium">{selectedArtisan.siret || "Non renseigné"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Expérience</p>
                        <p className="font-medium">{selectedArtisan.experience_years || 0} ans</p>
                      </div>
                    </div>

                    {selectedArtisan.description && <div>
                        <p className="text-muted-foreground text-xs md:text-sm mb-1">Description</p>
                        <p className="text-xs md:text-sm">{selectedArtisan.description}</p>
                      </div>}

                    {selectedArtisan.portfolio_images && selectedArtisan.portfolio_images.length > 0 && <div>
                        <p className="text-muted-foreground text-xs md:text-sm mb-2">Portfolio</p>
                        <div className="grid grid-cols-3 gap-1.5 md:gap-2">
                          {selectedArtisan.portfolio_images.map((img, i) => <img key={i} src={img} alt={`Portfolio ${i + 1}`} className="aspect-square object-cover rounded-lg" />)}
                        </div>
                      </div>}

                    <div className="flex gap-2 pt-3 md:pt-4 border-t">
                      <Button className="flex-1 h-9 md:h-10 text-sm" onClick={() => approveArtisanMutation.mutate(selectedArtisan.id)} disabled={approveArtisanMutation.isPending}>
                        <CheckCircle2 className="h-4 w-4 mr-1 md:mr-2" />
                        Approuver
                      </Button>
                      <Button variant="destructive" className="flex-1 h-9 md:h-10 text-sm" onClick={() => setShowRejectDialog(true)}>
                        <XCircle className="h-4 w-4 mr-1 md:mr-2" />
                        Refuser
                      </Button>
                    </div>
                  </div>
                </>}
            </DialogContent>
          </Dialog>

          {/* View Mission Details Dialog */}
          <Dialog open={!!selectedMission && !showMissionRejectDialog} onOpenChange={() => setSelectedMission(null)}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto mx-2 md:mx-auto">
              {selectedMission && <>
                  <DialogHeader>
                    <DialogTitle className="text-lg md:text-xl">{selectedMission.title}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 md:space-y-4">
                    <div className="grid grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm">
                      <div>
                        <p className="text-muted-foreground">Client</p>
                        <p className="font-medium">{selectedMission.client?.first_name} {selectedMission.client?.last_name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Email</p>
                        <p className="font-medium truncate">{selectedMission.client?.email}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Ville</p>
                        <p className="font-medium">{selectedMission.city}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Budget</p>
                        <p className="font-medium">{selectedMission.budget ? `${selectedMission.budget} €` : "Non spécifié"}</p>
                      </div>
                    </div>

                    {selectedMission.description && <div>
                        <p className="text-muted-foreground text-xs md:text-sm mb-1">Description</p>
                        <p className="text-xs md:text-sm whitespace-pre-wrap">{selectedMission.description}</p>
                      </div>}

                    {selectedMission.photos && selectedMission.photos.length > 0 && <div>
                        <p className="text-muted-foreground text-xs md:text-sm mb-2">Photos ({selectedMission.photos.length})</p>
                        <div className="grid grid-cols-3 gap-1.5 md:gap-2">
                          {selectedMission.photos.map((photo, i) => <img key={i} src={photo} alt={`Photo ${i + 1}`} className="aspect-square object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(photo, '_blank')} />)}
                        </div>
                      </div>}

                    <div className="flex gap-2 pt-3 md:pt-4 border-t">
                      <Button className="flex-1 h-9 md:h-10 text-sm" onClick={() => approveMissionMutation.mutate(selectedMission.id)} disabled={approveMissionMutation.isPending}>
                        <CheckCircle2 className="h-4 w-4 mr-1 md:mr-2" />
                        <span className="hidden sm:inline">Approuver et Publier</span>
                        <span className="sm:hidden">Approuver</span>
                      </Button>
                      <Button variant="destructive" className="flex-1 h-9 md:h-10 text-sm" onClick={() => setShowMissionRejectDialog(true)}>
                        <XCircle className="h-4 w-4 mr-1 md:mr-2" />
                        Refuser
                      </Button>
                    </div>
                  </div>
                </>}
            </DialogContent>
          </Dialog>

          {/* Delete Prospect Confirmation Dialog */}
          <AlertDialog open={!!prospectToDelete} onOpenChange={() => setProspectToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer la fiche vitrine ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir supprimer la fiche vitrine "{prospectToDelete?.business_name}" ? 
                  Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => {
                if (prospectToDelete) {
                  deleteProspectMutation.mutate(prospectToDelete.id);
                }
              }} disabled={deleteProspectMutation.isPending}>
                  {deleteProspectMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Edit Artisan Dialog */}
          <AdminEditArtisanDialog open={editDialogOpen} onOpenChange={open => {
          setEditDialogOpen(open);
          if (!open) {
            setEditArtisan(null);
            queryClient.invalidateQueries({ queryKey: ["prospect-artisans"] });
            queryClient.invalidateQueries({ queryKey: ["waiting-artisans"] });
            queryClient.invalidateQueries({ queryKey: ["claimed-artisans"] });
            queryClient.invalidateQueries({ queryKey: ["self-signup-artisans"] });
            queryClient.invalidateQueries({ queryKey: ["pending-artisans"] });
          }
        }} artisan={editArtisan as any} />

          {/* Documents Dialog */}
          <Dialog open={showDocumentsDialog} onOpenChange={setShowDocumentsDialog}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Documents de {documentsArtisan?.business_name}</DialogTitle>
                <DialogDescription>
                  Vérifiez et validez chaque document individuellement. L'artisan sera notifié pour chaque décision.
                </DialogDescription>
              </DialogHeader>
              
              {isLoadingDocuments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : artisanDocuments.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">Aucun document soumis</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {artisanDocuments.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded">
                          <File className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{getDocumentLabel(doc.name)}</p>
                          <p className="text-xs text-muted-foreground">{doc.file_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant={doc.status === 'verified' ? 'default' : doc.status === 'rejected' ? 'destructive' : 'secondary'} 
                              className="text-xs"
                            >
                              {doc.status === 'verified' ? 'Vérifié' : doc.status === 'rejected' ? 'Refusé' : 'En attente'}
                            </Badge>
                            {doc.expiry_date && (
                              <span className="text-xs text-muted-foreground">
                                Expire: {new Date(doc.expiry_date).toLocaleDateString('fr-FR')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* View document button */}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={async () => {
                            const url = await getDocumentUrl(doc.file_path);
                            if (url) window.open(url, '_blank');
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {/* Approve/Reject buttons - only for pending documents */}
                        {doc.status === 'pending' && documentsArtisan && (
                          <>
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              disabled={approveDocumentMutation.isPending}
                              onClick={() => approveDocumentMutation.mutate({
                                documentId: doc.id,
                                artisanId: documentsArtisan.id,
                                documentName: getDocumentLabel(doc.name)
                              })}
                            >
                              {approveDocumentMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              disabled={rejectDocumentMutation.isPending}
                              onClick={() => {
                                setDocumentToReject(doc);
                                setShowDocumentRejectDialog(true);
                              }}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setShowDocumentsDialog(false)}>
                  Fermer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Document Reject Dialog */}
          <Dialog open={showDocumentRejectDialog} onOpenChange={setShowDocumentRejectDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-destructive" />
                  Refuser le document
                </DialogTitle>
                <DialogDescription>
                  Indiquez la raison du refus pour "{documentToReject ? getDocumentLabel(documentToReject.name) : ''}"
                </DialogDescription>
              </DialogHeader>
              <Textarea 
                placeholder="Ex: Document illisible, date d'expiration dépassée, mauvais type de document..."
                value={documentRejectReason}
                onChange={(e) => setDocumentRejectReason(e.target.value)}
                className="min-h-[100px]"
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setShowDocumentRejectDialog(false);
                  setDocumentToReject(null);
                  setDocumentRejectReason("");
                }}>
                  Annuler
                </Button>
                <Button 
                  variant="destructive" 
                  disabled={!documentRejectReason.trim() || rejectDocumentMutation.isPending || !documentToReject || !documentsArtisan}
                  onClick={() => {
                    if (documentToReject && documentsArtisan) {
                      rejectDocumentMutation.mutate({
                        documentId: documentToReject.id,
                        artisanId: documentsArtisan.id,
                        documentName: getDocumentLabel(documentToReject.name),
                        reason: documentRejectReason
                      });
                    }
                  }}
                >
                  {rejectDocumentMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    "Confirmer le refus"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Pre-registration Confirmation AlertDialog */}
          <AlertDialog open={showPreregistrationDialog} onOpenChange={setShowPreregistrationDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-amber-500" />
                  Confirmer l'envoi de pré-inscription
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>
                    Vous allez envoyer un email de pré-inscription à <strong>{preregistrationProspect?.prospect.business_name}</strong> ({preregistrationProspect?.email}).
                  </p>
                  <p className="text-amber-600 font-medium">
                    Cette action passera la vitrine en "Vitrine en attente".
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isSendingPreregistration}>
                  Annuler
                </AlertDialogCancel>
                <AlertDialogAction className="bg-amber-500 hover:bg-amber-600" disabled={isSendingPreregistration} onClick={async e => {
                e.preventDefault();
                if (!preregistrationProspect) return;
                setIsSendingPreregistration(true);
                try {
                  const {
                    error
                  } = await supabase.functions.invoke('send-preregistration-email', {
                    body: {
                      artisanId: preregistrationProspect.prospect.id,
                      artisanEmail: preregistrationProspect.email,
                      artisanName: preregistrationProspect.prospect.business_name
                    }
                  });
                  if (error) throw error;
                  toast.success(`Email de pré-inscription envoyé à ${preregistrationProspect.prospect.business_name}`);
                  queryClient.invalidateQueries({
                    queryKey: ["prospect-artisans"]
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["prospect-artisans-count"]
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["claimed-artisans"]
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["claimed-artisans-count"]
                  });
                  setShowPreregistrationDialog(false);
                  setPreregistrationProspect(null);
                } catch (err: any) {
                  console.error('Error sending pre-registration email:', err);
                  toast.error("Erreur lors de l'envoi de l'email");
                } finally {
                  setIsSendingPreregistration(false);
                }
              }}>
                  {isSendingPreregistration ? <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </> : <>
                      <Mail className="h-4 w-4 mr-2" />
                      Envoyer l'email
                    </>}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Reminder Confirmation AlertDialog for Waiting Artisans */}
          <AlertDialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-amber-500" />
                  Relancer l'artisan
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>
                    Vous allez renvoyer un email d'activation à <strong>{reminderArtisan?.business_name}</strong> ({reminderArtisan?.email}).
                  </p>
                  {reminderArtisan?.reminder_count && reminderArtisan.reminder_count > 0 && (
                    <p className="text-muted-foreground text-sm">
                      Cet artisan a déjà été relancé {reminderArtisan.reminder_count} fois.
                      {reminderArtisan.reminder_sent_at && (
                        <> Dernière relance: {formatDate(reminderArtisan.reminder_sent_at)}</>
                      )}
                    </p>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isSendingReminder}>
                  Annuler
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-amber-500 hover:bg-amber-600"
                  disabled={isSendingReminder}
                  onClick={async (e) => {
                    e.preventDefault();
                    if (!reminderArtisan?.email) return;
                    
                    setIsSendingReminder(true);
                    try {
                      // Resend the pre-registration email
                      const { error: emailError } = await supabase.functions.invoke('send-preregistration-email', {
                        body: {
                          artisanId: reminderArtisan.id,
                          artisanEmail: reminderArtisan.email,
                          artisanName: reminderArtisan.business_name,
                        },
                      });
                      
                      if (emailError) throw emailError;
                      
                      // Update reminder count and timestamp
                      const { error: updateError } = await supabase
                        .from('artisans')
                        .update({
                          reminder_count: (reminderArtisan.reminder_count || 0) + 1,
                          reminder_sent_at: new Date().toISOString(),
                        })
                        .eq('id', reminderArtisan.id);
                      
                      if (updateError) {
                        console.error('Error updating reminder count:', updateError);
                      }
                      
                      toast.success(`Email de relance envoyé à ${reminderArtisan.business_name}`);
                      queryClient.invalidateQueries({ queryKey: ["waiting-artisans"] });
                      queryClient.invalidateQueries({ queryKey: ["waiting-artisans-count"] });
                      setShowReminderDialog(false);
                      setReminderArtisan(null);
                    } catch (err: any) {
                      console.error('Error sending reminder email:', err);
                      toast.error("Erreur lors de l'envoi de l'email de relance");
                    } finally {
                      setIsSendingReminder(false);
                    }
                  }}
                >
                  {isSendingReminder ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Envoyer la relance
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Delete Waiting Artisan Confirmation AlertDialog */}
          <AlertDialog open={showDeleteWaitingDialog} onOpenChange={setShowDeleteWaitingDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Supprimer définitivement cet artisan ?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>
                    Vous êtes sur le point de supprimer <strong>{waitingArtisanToDelete?.business_name}</strong> de façon permanente.
                  </p>
                  <p className="text-destructive font-medium">
                    Cette action est irréversible. Toutes les données associées seront supprimées :
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    <li>Fiche artisan</li>
                    <li>Photos et portfolio</li>
                    <li>Catégories et services</li>
                    <li>Avis et recommandations</li>
                  </ul>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeletingWaiting}>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async (e) => {
                    e.preventDefault();
                    if (!waitingArtisanToDelete) return;
                    
                    setIsDeletingWaiting(true);
                    try {
                      const { data, error } = await supabase.functions.invoke('admin-delete-waiting-artisan', {
                        body: { artisanId: waitingArtisanToDelete.id }
                      });
                      
                      if (error) throw error;
                      if (data?.error) throw new Error(data.error);
                      
                      const deletedUser = data?.deletedUser ? " et le compte utilisateur associé" : "";
                      toast.success(`Artisan supprimé définitivement${deletedUser}`);
                      queryClient.invalidateQueries({ queryKey: ["waiting-artisans"] });
                      queryClient.invalidateQueries({ queryKey: ["waiting-artisans-count"] });
                      queryClient.invalidateQueries({ queryKey: ["approval-counts"] });
                    } catch (error: any) {
                      console.error("Error deleting artisan:", error);
                      toast.error("Erreur lors de la suppression : " + (error.message || "Erreur inconnue"));
                    } finally {
                      setIsDeletingWaiting(false);
                      setShowDeleteWaitingDialog(false);
                      setWaitingArtisanToDelete(null);
                    }
                  }}
                  disabled={isDeletingWaiting}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {isDeletingWaiting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer définitivement
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {/* Delete Self-Signup Artisan Confirmation Dialog */}
          <AlertDialog open={showDeleteSelfSignupDialog} onOpenChange={setShowDeleteSelfSignupDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Supprimer cette inscription ?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>
                    Vous êtes sur le point de supprimer l'inscription de <strong>{selfSignupToDelete?.business_name}</strong>.
                  </p>
                  <p className="text-sm mt-2">Cette action va :</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    <li>Supprimer le profil temporaire et le compte utilisateur</li>
                    <li>Supprimer tous les documents éventuels</li>
                    <li>Permettre à l'artisan de se réinscrire avec le même email</li>
                  </ul>
                  <p className="text-destructive font-medium mt-2">
                    Cette action est irréversible.
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeletingSelfSignup}>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async (e) => {
                    e.preventDefault();
                    if (!selfSignupToDelete) return;
                    
                    setIsDeletingSelfSignup(true);
                    try {
                      const { data, error } = await supabase.functions.invoke('admin-delete-waiting-artisan', {
                        body: { artisanId: selfSignupToDelete.id }
                      });
                      
                      if (error) throw error;
                      if (data?.error) throw new Error(data.error);
                      
                      toast.success("Inscription supprimée. L'artisan peut se réinscrire avec le même email.");
                      queryClient.invalidateQueries({ queryKey: ["self-signup-artisans"] });
                      queryClient.invalidateQueries({ queryKey: ["self-signup-artisans-count"] });
                      queryClient.invalidateQueries({ queryKey: ["approval-counts"] });
                    } catch (error: any) {
                      console.error("Error deleting self-signup artisan:", error);
                      toast.error("Erreur lors de la suppression : " + (error.message || "Erreur inconnue"));
                    } finally {
                      setIsDeletingSelfSignup(false);
                      setShowDeleteSelfSignupDialog(false);
                      setSelfSignupToDelete(null);
                    }
                  }}
                  disabled={isDeletingSelfSignup}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {isDeletingSelfSignup ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer définitivement
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Delete Claimed Artisan Confirmation AlertDialog */}
          <AlertDialog open={showDeleteClaimedDialog} onOpenChange={setShowDeleteClaimedDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Supprimer définitivement cet artisan ?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>
                    Vous êtes sur le point de supprimer <strong>{claimedArtisanToDelete?.business_name}</strong> de façon permanente.
                  </p>
                  <p className="text-destructive font-medium">
                    Cette action est irréversible. Toutes les données associées seront supprimées :
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    <li>Fiche artisan et compte utilisateur</li>
                    <li>Photos et portfolio</li>
                    <li>Catégories et services</li>
                    <li>Avis et recommandations</li>
                  </ul>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeletingClaimed}>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async (e) => {
                    e.preventDefault();
                    if (!claimedArtisanToDelete) return;
                    
                    setIsDeletingClaimed(true);
                    try {
                      const { data, error } = await supabase.functions.invoke('admin-delete-waiting-artisan', {
                        body: { artisanId: claimedArtisanToDelete.id }
                      });
                      
                      if (error) throw error;
                      if (data?.error) throw new Error(data.error);
                      
                      const deletedUser = data?.deletedUser ? " et le compte utilisateur associé" : "";
                      toast.success(`Artisan supprimé définitivement${deletedUser}`);
                      queryClient.invalidateQueries({ queryKey: ["claimed-artisans"] });
                      queryClient.invalidateQueries({ queryKey: ["claimed-artisans-count"] });
                      queryClient.invalidateQueries({ queryKey: ["approval-counts"] });
                    } catch (error: any) {
                      console.error("Error deleting artisan:", error);
                      toast.error("Erreur lors de la suppression : " + (error.message || "Erreur inconnue"));
                    } finally {
                      setIsDeletingClaimed(false);
                      setShowDeleteClaimedDialog(false);
                      setClaimedArtisanToDelete(null);
                    }
                  }}
                  disabled={isDeletingClaimed}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {isDeletingClaimed ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer définitivement
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Delete Pending Artisan (Documents en attente) Confirmation AlertDialog */}
          <AlertDialog open={showDeletePendingDialog} onOpenChange={setShowDeletePendingDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Supprimer définitivement cet artisan ?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>
                    Vous êtes sur le point de supprimer <strong>{pendingArtisanToDelete?.business_name}</strong> et tous ses documents de façon permanente.
                  </p>
                  <p className="text-destructive font-medium">
                    Cette action est irréversible. Toutes les données associées seront supprimées :
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    <li>Fiche artisan et compte utilisateur</li>
                    <li>Documents uploadés</li>
                    <li>Photos et portfolio</li>
                    <li>Catégories et services</li>
                  </ul>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeletingPending}>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async (e) => {
                    e.preventDefault();
                    if (!pendingArtisanToDelete) return;
                    
                    setIsDeletingPending(true);
                    try {
                      const { data, error } = await supabase.functions.invoke('admin-delete-waiting-artisan', {
                        body: { artisanId: pendingArtisanToDelete.id }
                      });
                      
                      if (error) throw error;
                      if (data?.error) throw new Error(data.error);
                      
                      const deletedUser = data?.deletedUser ? " et le compte utilisateur associé" : "";
                      toast.success(`Artisan supprimé définitivement${deletedUser}`);
                      queryClient.invalidateQueries({ queryKey: ["pending-artisans"] });
                      queryClient.invalidateQueries({ queryKey: ["approval-counts"] });
                    } catch (error: any) {
                      console.error("Error deleting artisan:", error);
                      toast.error("Erreur lors de la suppression : " + (error.message || "Erreur inconnue"));
                    } finally {
                      setIsDeletingPending(false);
                      setShowDeletePendingDialog(false);
                      setPendingArtisanToDelete(null);
                    }
                  }}
                  disabled={isDeletingPending}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {isDeletingPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer définitivement
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          </div>
        </main>
      </div>
    </>;
};
export default AdminApprovals;