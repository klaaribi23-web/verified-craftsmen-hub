import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/admin-dashboard/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  MapPin,
  AlertCircle,
  Loader2,
  Briefcase,
  Euro,
  User,
  Store,
  ExternalLink,
  Pencil,
  Trash2,
  TrendingUp,
  Users,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Search,
  Mail,
  Phone,
  Calendar,
  UserCheck,
  FileText,
  Download,
  File,
  
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { DEFAULT_AVATAR } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { AdminEditArtisanDialog } from "@/components/admin-dashboard/AdminEditArtisanDialog";


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
  category: { name: string } | null;
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
  description: string | null;
  photo_url: string | null;
  portfolio_images: string[] | null;
  created_at: string;
  slug: string | null;
  category: { name: string } | null;
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
  category: { name: string } | null;
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
  category: { name: string } | null;
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

interface PendingMission {
  id: string;
  title: string;
  description: string | null;
  city: string;
  budget: number | null;
  created_at: string;
  photos?: string[] | null;
  category: { name: string } | null;
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
  const [editProspect, setEditProspect] = useState<ProspectArtisan | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Documents dialog state
  const [showDocumentsDialog, setShowDocumentsDialog] = useState(false);
  const [documentsArtisan, setDocumentsArtisan] = useState<PendingArtisan | null>(null);
  const [artisanDocuments, setArtisanDocuments] = useState<ArtisanDocument[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  
  // Pre-registration confirmation dialog state
  const [showPreregistrationDialog, setShowPreregistrationDialog] = useState(false);
  const [preregistrationProspect, setPreregistrationProspect] = useState<{ prospect: ProspectArtisan; email: string } | null>(null);
  const [isSendingPreregistration, setIsSendingPreregistration] = useState(false);
  
  
  // Pagination state for prospects
  const [prospectPage, setProspectPage] = useState(0);
  const [prospectsPerPage, setProspectsPerPage] = useState(PROSPECTS_PER_PAGE);
  const [prospectSearch, setProspectSearch] = useState("");
  
  // Sub-tab state for vitrines
  const [vitrineSubTab, setVitrineSubTab] = useState("actives");
  
  // Pagination state for waiting artisans (email sent, no account)
  const [waitingPage, setWaitingPage] = useState(0);
  const [waitingPerPage, setWaitingPerPage] = useState(50);
  const [waitingSearch, setWaitingSearch] = useState("");
  
  // Pagination state for claimed artisans
  const [claimedPage, setClaimedPage] = useState(0);
  const [claimedPerPage, setClaimedPerPage] = useState(50);
  const [claimedSearch, setClaimedSearch] = useState("");

  // Fetch pending artisans (only those with at least 1 document)
  const { data: pendingArtisans = [], isLoading: isLoadingArtisans } = useQuery({
    queryKey: ["pending-artisans"],
    queryFn: async () => {
      // First, get artisan IDs that have at least one document
      const { data: artisansWithDocs, error: docsError } = await supabase
        .from("artisan_documents")
        .select("artisan_id");
      
      if (docsError) throw docsError;
      
      const artisanIdsWithDocs = [...new Set(artisansWithDocs?.map(d => d.artisan_id) || [])];
      
      if (artisanIdsWithDocs.length === 0) {
        return [] as PendingArtisan[];
      }
      
      // Then fetch pending artisans who have documents
      const { data, error } = await supabase
        .from("artisans")
        .select(`
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
        `)
        .eq("status", "pending")
        .in("id", artisanIdsWithDocs)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PendingArtisan[];
    }
  });

  // Fetch total count of prospect artisans
  const { data: totalProspects = 0 } = useQuery({
    queryKey: ["prospect-artisans-count", prospectSearch],
    queryFn: async () => {
      let query = supabase
        .from("artisans")
        .select("*", { count: "exact", head: true })
        .eq("status", "prospect")
        .is("user_id", null);
      
      if (prospectSearch.trim()) {
        query = query.or(`business_name.ilike.%${prospectSearch}%,city.ilike.%${prospectSearch}%`);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    }
  });

  // Fetch prospect artisans (vitrines) with pagination
  const { data: prospectArtisans = [], isLoading: isLoadingProspects } = useQuery({
    queryKey: ["prospect-artisans", prospectPage, prospectsPerPage, prospectSearch],
    queryFn: async () => {
      let query = supabase
        .from("artisans")
        .select(`
          id,
          business_name,
          city,
          description,
          photo_url,
          portfolio_images,
          created_at,
          slug,
          category:categories(name)
        `)
        .eq("status", "prospect")
        .is("user_id", null);
      
      if (prospectSearch.trim()) {
        query = query.or(`business_name.ilike.%${prospectSearch}%,city.ilike.%${prospectSearch}%`);
      }
      
      const { data, error } = await query
        .order("created_at", { ascending: false })
        .range(prospectPage * prospectsPerPage, (prospectPage + 1) * prospectsPerPage - 1);

      if (error) throw error;
      return data as ProspectArtisan[];
    }
  });

  // Fetch total count of WAITING artisans (email sent, no account yet)
  const { data: totalWaiting = 0 } = useQuery({
    queryKey: ["waiting-artisans-count", waitingSearch],
    queryFn: async () => {
      let query = supabase
        .from("artisans")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")
        .is("user_id", null)
        .not("activation_sent_at", "is", null);
      
      if (waitingSearch.trim()) {
        query = query.or(`business_name.ilike.%${waitingSearch}%,city.ilike.%${waitingSearch}%,email.ilike.%${waitingSearch}%`);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    }
  });

  // Fetch WAITING artisans (email sent, account not created yet)
  const { data: waitingArtisans = [], isLoading: isLoadingWaiting } = useQuery({
    queryKey: ["waiting-artisans", waitingPage, waitingPerPage, waitingSearch],
    queryFn: async () => {
      let query = supabase
        .from("artisans")
        .select(`
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
        `)
        .eq("status", "pending")
        .is("user_id", null)
        .not("activation_sent_at", "is", null);
      
      if (waitingSearch.trim()) {
        query = query.or(`business_name.ilike.%${waitingSearch}%,city.ilike.%${waitingSearch}%,email.ilike.%${waitingSearch}%`);
      }
      
      const { data, error } = await query
        .order("activation_sent_at", { ascending: false })
        .range(waitingPage * waitingPerPage, (waitingPage + 1) * waitingPerPage - 1);

      if (error) throw error;
      return data || [];
    }
  });

  // Count recently claimed (prospects that became pending this month)
  const { data: claimedThisMonth = 0 } = useQuery({
    queryKey: ["claimed-this-month"],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { count, error } = await supabase
        .from("artisans")
        .select("*", { count: "exact", head: true })
        .not("user_id", "is", null)
        .gte("updated_at", startOfMonth.toISOString());

      if (error) throw error;
      return count || 0;
    }
  });

  // Fetch total count of claimed artisans WITHOUT documents (they move to Approbation Artisans once they upload docs)
  const { data: totalClaimed = 0 } = useQuery({
    queryKey: ["claimed-artisans-count", claimedSearch],
    queryFn: async () => {
      // 1. Get all artisan IDs that have documents
      const { data: artisansWithDocs } = await supabase
        .from("artisan_documents")
        .select("artisan_id");
      
      const artisanIdsWithDocs = [...new Set(artisansWithDocs?.map(d => d.artisan_id) || [])];
      
      // 2. Count pending artisans with user_id but WITHOUT documents
      let query = supabase
        .from("artisans")
        .select("*", { count: "exact", head: true })
        .not("user_id", "is", null)
        .eq("status", "pending");
      
      // Exclude those who have documents
      if (artisanIdsWithDocs.length > 0) {
        query = query.not("id", "in", `(${artisanIdsWithDocs.join(",")})`);
      }
      
      if (claimedSearch.trim()) {
        query = query.or(`business_name.ilike.%${claimedSearch}%,city.ilike.%${claimedSearch}%,email.ilike.%${claimedSearch}%`);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    }
  });

  // Fetch claimed artisans WITHOUT documents (once they upload docs, they go to Approbation Artisans)
  const { data: claimedArtisans = [], isLoading: isLoadingClaimed } = useQuery({
    queryKey: ["claimed-artisans", claimedPage, claimedPerPage, claimedSearch],
    queryFn: async () => {
      // 1. Get all artisan IDs that have documents
      const { data: artisansWithDocs } = await supabase
        .from("artisan_documents")
        .select("artisan_id");
      
      const artisanIdsWithDocs = [...new Set(artisansWithDocs?.map(d => d.artisan_id) || [])];
      
      // 2. Fetch pending artisans with user_id but WITHOUT documents
      let query = supabase
        .from("artisans")
        .select(`
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
          category:categories(name),
          profile:profiles!artisans_profile_id_fkey(first_name, last_name, email, phone, created_at)
        `)
        .not("user_id", "is", null)
        .eq("status", "pending");
      
      // Exclude those who have documents
      if (artisanIdsWithDocs.length > 0) {
        query = query.not("id", "in", `(${artisanIdsWithDocs.join(",")})`);
      }
      
      if (claimedSearch.trim()) {
        query = query.or(`business_name.ilike.%${claimedSearch}%,city.ilike.%${claimedSearch}%,email.ilike.%${claimedSearch}%`);
      }
      
      const { data, error } = await query
        .order("updated_at", { ascending: false })
        .range(claimedPage * claimedPerPage, (claimedPage + 1) * claimedPerPage - 1);

      if (error) throw error;
      
      if (!data || data.length === 0) return [] as ClaimedArtisan[];
      
      // No documents for these artisans by definition, but keep structure for consistency
      const enrichedData = data?.map(artisan => ({
        ...artisan,
        documents_count: 0,
        documents_pending: 0,
        documents_approved: 0,
      })) as ClaimedArtisan[];
      
      return enrichedData;
    }
  });

  // Count pending approval (claimed but waiting)
  const { data: pendingApprovalCount = 0 } = useQuery({
    queryKey: ["pending-approval-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("artisans")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")
        .not("user_id", "is", null);

      if (error) throw error;
      return count || 0;
    }
  });

  // Count pending claimed artisans without documents
  const { data: claimedWithoutDocsCount = 0 } = useQuery({
    queryKey: ["claimed-without-docs-count"],
    queryFn: async () => {
      // Get all pending claimed artisans
      const { data: claimedArtisans } = await supabase
        .from("artisans")
        .select("id")
        .eq("status", "pending")
        .not("user_id", "is", null);
      
      if (!claimedArtisans || claimedArtisans.length === 0) return 0;
      
      // Get artisans that have documents
      const { data: artisansWithDocs } = await supabase
        .from("artisan_documents")
        .select("artisan_id");
      
      const artisanIdsWithDocs = new Set(artisansWithDocs?.map(d => d.artisan_id) || []);
      
      // Count pending claimed artisans without documents
      return claimedArtisans.filter(a => !artisanIdsWithDocs.has(a.id)).length;
    }
  });

  // Count claimed artisans with documents
  const { data: claimedWithDocsCount = 0 } = useQuery({
    queryKey: ["claimed-with-docs-count"],
    queryFn: async () => {
      // Get all pending artisans with user_id
      const { data: pendingArtisans } = await supabase
        .from("artisans")
        .select("id")
        .eq("status", "pending")
        .not("user_id", "is", null);
      
      if (!pendingArtisans || pendingArtisans.length === 0) return 0;
      
      // Get artisans that have documents
      const { data: artisansWithDocs } = await supabase
        .from("artisan_documents")
        .select("artisan_id");
      
      const artisanIdsWithDocs = new Set(artisansWithDocs?.map(d => d.artisan_id) || []);
      
      // Count pending artisans with documents
      return pendingArtisans.filter(a => artisanIdsWithDocs.has(a.id)).length;
    }
  });

  // Fetch pending missions
  const { data: pendingMissions = [], isLoading: isLoadingMissions } = useQuery({
    queryKey: ["pending-missions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("missions")
        .select(`
          id,
          title,
          description,
          city,
          budget,
          photos,
          created_at,
          category:categories(name),
          client:profiles!missions_client_id_fkey(first_name, last_name, email)
        `)
        .eq("status", "pending_approval")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PendingMission[];
    }
  });

  // Approve artisan mutation
  const approveArtisanMutation = useMutation({
    mutationFn: async (artisanId: string) => {
      const { error } = await supabase
        .from("artisans")
        .update({ status: "active", is_verified: true })
        .eq("id", artisanId);

      if (error) throw error;

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
      queryClient.invalidateQueries({ queryKey: ["pending-artisans"] });
      toast.success("Artisan approuvé avec succès");
      setSelectedArtisan(null);
    },
    onError: () => {
      toast.error("Erreur lors de l'approbation");
    }
  });

  // Reject artisan mutation
  const rejectArtisanMutation = useMutation({
    mutationFn: async ({ artisanId, reason }: { artisanId: string; reason: string }) => {
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
            p_type: "rejection",
            p_title: "Profil non approuvé",
            p_message: `Votre demande d'approbation a été refusée. Raison : ${reason}. Veuillez corriger les éléments mentionnés et soumettre à nouveau votre demande.`,
            p_related_id: null
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-artisans"] });
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
      const { error } = await supabase
        .from("missions")
        .update({ status: "published" })
        .eq("id", missionId);

      if (error) throw error;

      const mission = pendingMissions?.find(m => m.id === missionId);
      if (mission?.client) {
        const { data: userData } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("email", mission.client.email)
          .single();

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
      queryClient.invalidateQueries({ queryKey: ["pending-missions"] });
      toast.success("Mission approuvée et publiée");
      setSelectedMission(null);
    },
    onError: () => {
      toast.error("Erreur lors de l'approbation");
    }
  });

  // Reject mission mutation
  const rejectMissionMutation = useMutation({
    mutationFn: async ({ missionId, reason }: { missionId: string; reason: string }) => {
      const { error } = await supabase
        .from("missions")
        .update({ status: "rejected", rejection_reason: reason })
        .eq("id", missionId);

      if (error) throw error;

      const mission = pendingMissions?.find(m => m.id === missionId);
      if (mission?.client) {
        const { data: userData } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("email", mission.client.email)
          .single();

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
      queryClient.invalidateQueries({ queryKey: ["pending-missions"] });
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
      const { error } = await supabase
        .from("artisans")
        .delete()
        .eq("id", prospectId)
        .eq("status", "prospect");

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospect-artisans"] });
      queryClient.invalidateQueries({ queryKey: ["prospect-artisans-count"] });
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

    return { score, total, percentage: Math.round((score / total) * 100) };
  };

  // Load documents for an artisan
  const loadArtisanDocuments = async (artisan: PendingArtisan) => {
    setIsLoadingDocuments(true);
    setDocumentsArtisan(artisan);
    setShowDocumentsDialog(true);
    
    try {
      const { data, error } = await supabase
        .from("artisan_documents")
        .select("*")
        .eq("artisan_id", artisan.id)
        .order("created_at", { ascending: false });
      
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
    const { data, error } = await supabase.storage
      .from("artisan-documents")
      .createSignedUrl(filePath, 3600);
    
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
            senderName: "Artisans Validés",
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
      await rejectArtisanMutation.mutateAsync({ artisanId: artisan.id, reason });
      
      // Send rejection email
      if (artisan.profile?.email) {
        await supabase.functions.invoke("send-notification-email", {
          body: {
            type: "artisan_rejected",
            recipientEmail: artisan.profile.email,
            recipientFirstName: artisan.profile.first_name || "Artisan",
            senderName: "Artisans Validés",
            rejectionReason: reason,
          }
        });
      }
    } catch (error) {
      console.error("Error rejecting artisan:", error);
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-background pt-16 lg:pt-20">
        <AdminSidebar />
      
        <main className="flex-1 p-4 md:p-8">
          <div className="mb-4 md:mb-8">
            <h1 className="text-xl md:text-3xl font-bold text-foreground">Demandes d'approbation</h1>
            <p className="text-muted-foreground text-sm md:text-base mt-1">
              Vérifiez et approuvez les profils artisans et les missions
            </p>
          </div>

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
                <Badge variant="secondary" className="ml-1 text-xs h-5 px-1.5">{pendingArtisans.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="vitrines" className="flex-1 gap-1.5 text-xs sm:text-sm px-2 sm:px-4 py-2">
                <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Vitrines</span>
                <span className="xs:hidden">Vitr.</span>
                <Badge variant="secondary" className="ml-1 text-xs h-5 px-1.5">{totalProspects.toLocaleString('fr-FR')}</Badge>
              </TabsTrigger>
            </TabsList>

            {/* MISSIONS TAB */}
            <TabsContent value="missions">
              {isLoadingMissions ? (
                <div className="flex items-center justify-center py-12 md:py-20">
                  <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" />
                </div>
              ) : pendingMissions.length > 0 ? (
                <div className="grid gap-3 md:gap-6">
                  {pendingMissions.map((mission) => (
                    <Card key={mission.id} className="hover:shadow-lg transition-shadow">
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
                                {mission.category && (
                                  <Badge variant="secondary" className="text-xs px-1.5 py-0">{mission.category.name}</Badge>
                                )}
                                {mission.budget && (
                                  <span className="flex items-center gap-0.5 text-gold font-medium">
                                    <Euro className="h-3 w-3" />
                                    {mission.budget} €
                                  </span>
                                )}
                              </div>
                            </div>
                            <Badge variant="outline" className="gap-1 text-xs shrink-0">
                              <Clock className="h-2.5 w-2.5 md:h-3 md:w-3" />
                              <span className="hidden sm:inline">En attente</span>
                            </Badge>
                          </div>

                          {mission.description && (
                            <p className="text-muted-foreground text-xs md:text-sm line-clamp-2">
                              {mission.description}
                            </p>
                          )}

                          <div className="text-xs md:text-sm text-muted-foreground">
                            <span className="font-medium">Client : </span>
                            <span className="truncate">{mission.client?.first_name} {mission.client?.last_name}</span>
                            <span className="hidden md:inline"> ({mission.client?.email})</span>
                          </div>

                          {/* Actions - Mobile optimized */}
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 min-w-[80px] text-xs md:text-sm h-8 md:h-9"
                              onClick={() => setSelectedMission(mission)}
                            >
                              <Eye className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                              Détails
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 min-w-[80px] text-xs md:text-sm h-8 md:h-9"
                              onClick={() => approveMissionMutation.mutate(mission.id)}
                              disabled={approveMissionMutation.isPending}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                              <span className="hidden sm:inline">Approuver</span>
                              <span className="sm:hidden">OK</span>
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="flex-1 min-w-[80px] text-xs md:text-sm h-8 md:h-9"
                              onClick={() => {
                                setSelectedMission(mission);
                                setShowMissionRejectDialog(true);
                              }}
                            >
                              <XCircle className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                              Refuser
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 md:py-20 text-center">
                    <CheckCircle2 className="h-12 w-12 md:h-16 md:w-16 text-emerald-500 mx-auto mb-3 md:mb-4" />
                    <h3 className="text-lg md:text-xl font-semibold mb-2">Aucune mission en attente</h3>
                    <p className="text-muted-foreground text-sm md:text-base">
                      Toutes les missions ont été traitées.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ARTISANS TAB */}
            <TabsContent value="artisans">
              {isLoadingArtisans ? (
                <div className="flex items-center justify-center py-12 md:py-20">
                  <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" />
                </div>
              ) : pendingArtisans.length > 0 ? (
                <div className="grid gap-3 md:gap-6">
                  {pendingArtisans.map((artisan) => {
                    const completeness = getProfileCompleteness(artisan);
                    return (
                      <Card key={artisan.id} className="hover:shadow-lg transition-shadow">
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
                                    {artisan.category && (
                                      <Badge variant="secondary" className="text-xs px-1.5 py-0">{artisan.category.name}</Badge>
                                    )}
                                  </div>
                                </div>
                                <Badge variant="outline" className="gap-1 text-xs shrink-0 hidden sm:flex">
                                  <Clock className="h-2.5 w-2.5" />
                                  En attente
                                </Badge>
                              </div>

                              {artisan.description && (
                                <p className="text-muted-foreground text-xs md:text-sm line-clamp-2 mb-2 md:mb-4">
                                  {artisan.description}
                                </p>
                              )}

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
                                  <div 
                                    className={`h-full transition-all ${
                                      completeness.percentage >= 80 ? 'bg-emerald-500' : 
                                      completeness.percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${completeness.percentage}%` }}
                                  />
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
                                <Button size="sm" className="text-xs md:text-sm h-8 md:h-9 px-2 md:px-3" onClick={() => handleApproveArtisan(artisan)} disabled={approveArtisanMutation.isPending}>
                                  <CheckCircle2 className="h-3.5 w-3.5 md:h-4 md:w-4 mr-0.5 md:mr-1" />
                                  <span className="hidden sm:inline">Accepter</span>
                                </Button>
                                <Button variant="destructive" size="sm" className="text-xs md:text-sm h-8 md:h-9 px-2 md:px-3" onClick={() => { setSelectedArtisan(artisan); setShowRejectDialog(true); }}>
                                  <XCircle className="h-3.5 w-3.5 md:h-4 md:w-4 mr-0.5 md:mr-1" />
                                  <span className="hidden sm:inline">Refuser</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 md:py-20 text-center">
                    <CheckCircle2 className="h-12 w-12 md:h-16 md:w-16 text-emerald-500 mx-auto mb-3 md:mb-4" />
                    <h3 className="text-lg md:text-xl font-semibold mb-2">Aucune demande en attente</h3>
                    <p className="text-muted-foreground text-sm md:text-base">
                      Toutes les demandes d'approbation ont été traitées.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* VITRINES TAB */}
            <TabsContent value="vitrines">
              {/* Sub-tabs for Vitrines */}
              <Tabs value={vitrineSubTab} onValueChange={setVitrineSubTab} className="mt-4">
                <TabsList className="mb-4 flex-wrap">
                  <TabsTrigger value="actives" className="gap-1.5">
                    <Store className="h-4 w-4" />
                    <span className="hidden sm:inline">Vitrines</span> actives
                    <Badge variant="secondary" className="ml-1 text-xs">{totalProspects.toLocaleString('fr-FR')}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="en-attente" className="gap-1.5">
                    <Mail className="h-4 w-4" />
                    <span className="hidden sm:inline">Vitrines</span> en attente
                    <Badge variant="secondary" className="ml-1 text-xs">{totalWaiting}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="confirmees" className="gap-1.5">
                    <UserCheck className="h-4 w-4" />
                    <span className="hidden sm:inline">Vitrines</span> confirmées
                    <Badge variant="secondary" className="ml-1 text-xs">{totalClaimed}</Badge>
                  </TabsTrigger>
                </TabsList>

                {/* VITRINES ACTIVES SUB-TAB */}
                <TabsContent value="actives">
                  {/* Search and pagination controls */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher par nom ou ville..."
                        value={prospectSearch}
                        onChange={(e) => handleProspectSearchChange(e.target.value)}
                        className="pl-9"
                      />
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
                  {totalProspects > 0 && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 text-sm text-muted-foreground">
                      <span>
                        Affichage {startIndex} - {endIndex} sur {totalProspects.toLocaleString('fr-FR')} vitrines
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setProspectPage(p => Math.max(0, p - 1))}
                          disabled={prospectPage === 0}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Précédent
                        </Button>
                        <span className="text-sm font-medium px-2">
                          Page {prospectPage + 1} / {totalProspectPages || 1}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setProspectPage(p => Math.min(totalProspectPages - 1, p + 1))}
                          disabled={prospectPage >= totalProspectPages - 1}
                        >
                          Suivant
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {isLoadingProspects ? (
                    <div className="flex items-center justify-center py-12 md:py-20">
                      <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" />
                    </div>
                  ) : prospectArtisans.length > 0 ? (
                    <>
                      <div className="grid gap-3 md:gap-6">
                        {prospectArtisans.map((prospect) => (
                          <Card key={prospect.id} className="hover:shadow-lg transition-shadow overflow-hidden">
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
                                      <h3 className="text-base md:text-xl font-bold truncate">{prospect.business_name}</h3>
                                      <div className="flex flex-wrap items-center gap-1.5 text-muted-foreground text-xs md:text-sm">
                                        <span className="flex items-center gap-1">
                                          <MapPin className="h-3 w-3 md:h-4 md:w-4 shrink-0" />
                                          <span className="truncate">{prospect.city}</span>
                                        </span>
                                        {prospect.category && (
                                          <Badge variant="secondary" className="text-xs px-1.5 py-0 shrink-0">{prospect.category.name}</Badge>
                                        )}
                                      </div>
                                    </div>
                                    <Badge variant="outline" className="gap-1 text-xs shrink-0 bg-amber-500/10 text-amber-600 border-amber-500/30 self-start">
                                      <Store className="h-2.5 w-2.5" />
                                      Vitrine
                                    </Badge>
                                  </div>

                                  {prospect.description && (
                                    <p className="text-muted-foreground text-xs md:text-sm line-clamp-2 mb-2 md:mb-3">
                                      {prospect.description}
                                    </p>
                                  )}

                                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-3">
                                    <span>Créée le {new Date(prospect.created_at).toLocaleDateString('fr-FR')}</span>
                                    {prospect.portfolio_images && prospect.portfolio_images.length > 0 && (
                                      <span>• {prospect.portfolio_images.length} photo(s)</span>
                                    )}
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="text-xs md:text-sm h-8 md:h-9 px-2 md:px-3"
                                      onClick={() => window.open(`/artisan/${prospect.slug}`, '_blank')}
                                    >
                                      <ExternalLink className="h-3.5 w-3.5 md:h-4 md:w-4 sm:mr-1" />
                                      <span className="hidden sm:inline">Voir</span>
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="text-xs md:text-sm h-8 md:h-9 px-2 md:px-3"
                                      onClick={() => {
                                        setEditProspect(prospect);
                                        setEditDialogOpen(true);
                                      }}
                                    >
                                      <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4 sm:mr-1" />
                                      <span className="hidden sm:inline">Modifier</span>
                                    </Button>
                                    <Button
                                      variant="default" 
                                      size="sm" 
                                      className="text-xs md:text-sm h-8 md:h-9 px-2 md:px-3 bg-amber-500 hover:bg-amber-600"
                                      onClick={async () => {
                                        // Get artisan email first
                                        const { data: artisanData } = await supabase
                                          .from('artisans')
                                          .select('email')
                                          .eq('id', prospect.id)
                                          .single();
                                        
                                        if (!artisanData?.email) {
                                          toast.error("Cet artisan n'a pas d'email. Ajoutez un email avant d'envoyer l'invitation.");
                                          return;
                                        }
                                        
                                        // Show confirmation dialog instead of native confirm()
                                        setPreregistrationProspect({ prospect, email: artisanData.email });
                                        setShowPreregistrationDialog(true);
                                      }}
                                    >
                                      <Mail className="h-3.5 w-3.5 md:h-4 md:w-4 sm:mr-1" />
                                      <span className="hidden sm:inline">Pré-inscription</span>
                                    </Button>
                                    <Button
                                      variant="destructive" 
                                      size="sm" 
                                      className="text-xs md:text-sm h-8 md:h-9 px-2 md:px-3"
                                      onClick={() => setProspectToDelete(prospect)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4 sm:mr-1" />
                                      <span className="hidden sm:inline">Supprimer</span>
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Bottom pagination */}
                      {totalProspectPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setProspectPage(p => Math.max(0, p - 1))}
                            disabled={prospectPage === 0}
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Précédent
                          </Button>
                          <span className="text-sm font-medium px-4">
                            Page {prospectPage + 1} / {totalProspectPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setProspectPage(p => Math.min(totalProspectPages - 1, p + 1))}
                            disabled={prospectPage >= totalProspectPages - 1}
                          >
                            Suivant
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <Card>
                      <CardContent className="py-12 md:py-20 text-center">
                        <Store className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground/50 mx-auto mb-3 md:mb-4" />
                        <h3 className="text-lg md:text-xl font-semibold mb-2">
                          {prospectSearch ? "Aucun résultat" : "Aucune fiche vitrine"}
                        </h3>
                        <p className="text-muted-foreground text-sm md:text-base mb-4">
                          {prospectSearch 
                            ? `Aucune vitrine trouvée pour "${prospectSearch}"`
                            : "Créez des fiches vitrines pour attirer de nouveaux artisans."}
                        </p>
                        {prospectSearch ? (
                          <Button variant="outline" onClick={() => setProspectSearch("")}>
                            Effacer la recherche
                          </Button>
                        ) : (
                          <Button onClick={() => navigate("/admin/ajouter-artisan")}>
                            Créer une fiche vitrine
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* VITRINES EN ATTENTE SUB-TAB (email envoyé, compte pas créé) */}
                <TabsContent value="en-attente">
                  {/* Search and pagination controls */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher par nom, ville ou email..."
                        value={waitingSearch}
                        onChange={(e) => handleWaitingSearchChange(e.target.value)}
                        className="pl-9"
                      />
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
                  {totalWaiting > 0 && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 text-sm text-muted-foreground">
                      <span>
                        Affichage {waitingStartIndex} - {waitingEndIndex} sur {totalWaiting.toLocaleString('fr-FR')} artisans en attente
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setWaitingPage(p => Math.max(0, p - 1))}
                          disabled={waitingPage === 0}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Précédent
                        </Button>
                        <span className="text-sm font-medium px-2">
                          Page {waitingPage + 1} / {totalWaitingPages || 1}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setWaitingPage(p => Math.min(totalWaitingPages - 1, p + 1))}
                          disabled={waitingPage >= totalWaitingPages - 1}
                        >
                          Suivant
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {isLoadingWaiting ? (
                    <div className="flex items-center justify-center py-12 md:py-20">
                      <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" />
                    </div>
                  ) : waitingArtisans.length > 0 ? (
                    <>
                      <div className="grid gap-3 md:gap-4">
                        {waitingArtisans.map((artisan) => (
                          <Card key={artisan.id} className="hover:shadow-lg transition-shadow overflow-hidden">
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
                                        {artisan.category && (
                                          <Badge variant="secondary" className="text-xs px-1.5 py-0 shrink-0">{artisan.category.name}</Badge>
                                        )}
                                      </div>
                                    </div>
                                    <Badge 
                                      variant="outline" 
                                      className="gap-1 text-xs shrink-0 self-start bg-amber-500/10 text-amber-600 border-amber-500/30"
                                    >
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

                                  {artisan.description && (
                                    <p className="text-muted-foreground text-xs md:text-sm line-clamp-2 mb-3">
                                      {artisan.description}
                                    </p>
                                  )}

                                  <div className="flex flex-wrap gap-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="text-xs md:text-sm h-8 md:h-9 px-3"
                                      onClick={() => window.open(`/artisan/${artisan.slug}`, '_blank')}
                                    >
                                      <ExternalLink className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5" />
                                      Voir la fiche
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Bottom pagination */}
                      {totalWaitingPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setWaitingPage(p => Math.max(0, p - 1))}
                            disabled={waitingPage === 0}
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Précédent
                          </Button>
                          <span className="text-sm font-medium px-4">
                            Page {waitingPage + 1} / {totalWaitingPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setWaitingPage(p => Math.min(totalWaitingPages - 1, p + 1))}
                            disabled={waitingPage >= totalWaitingPages - 1}
                          >
                            Suivant
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <Card>
                      <CardContent className="py-12 md:py-20 text-center">
                        <Mail className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground/50 mx-auto mb-3 md:mb-4" />
                        <h3 className="text-lg md:text-xl font-semibold mb-2">
                          {waitingSearch ? "Aucun résultat" : "Aucun artisan en attente"}
                        </h3>
                        <p className="text-muted-foreground text-sm md:text-base mb-4">
                          {waitingSearch 
                            ? `Aucun artisan trouvé pour "${waitingSearch}"`
                            : "Tous les artisans prospectés ont créé leur compte."}
                        </p>
                        {waitingSearch && (
                          <Button variant="outline" onClick={() => setWaitingSearch("")}>
                            Effacer la recherche
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* VITRINES CONFIRMÉES SUB-TAB (compte créé, pas de documents) */}
                <TabsContent value="confirmees">
                  {/* Search and pagination controls */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher par nom, ville ou email..."
                        value={claimedSearch}
                        onChange={(e) => handleClaimedSearchChange(e.target.value)}
                        className="pl-9"
                      />
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
                  {totalClaimed > 0 && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 text-sm text-muted-foreground">
                      <span>
                        Affichage {claimedStartIndex} - {claimedEndIndex} sur {totalClaimed.toLocaleString('fr-FR')} artisans confirmés
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setClaimedPage(p => Math.max(0, p - 1))}
                          disabled={claimedPage === 0}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Précédent
                        </Button>
                        <span className="text-sm font-medium px-2">
                          Page {claimedPage + 1} / {totalClaimedPages || 1}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setClaimedPage(p => Math.min(totalClaimedPages - 1, p + 1))}
                          disabled={claimedPage >= totalClaimedPages - 1}
                        >
                          Suivant
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {isLoadingClaimed ? (
                    <div className="flex items-center justify-center py-12 md:py-20">
                      <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" />
                    </div>
                  ) : claimedArtisans.length > 0 ? (
                    <>
                      <div className="grid gap-3 md:gap-4">
                        {claimedArtisans.map((artisan) => (
                          <Card key={artisan.id} className="hover:shadow-lg transition-shadow overflow-hidden">
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
                                        {artisan.category && (
                                          <Badge variant="secondary" className="text-xs px-1.5 py-0 shrink-0">{artisan.category.name}</Badge>
                                        )}
                                      </div>
                                    </div>
                                    <Badge 
                                      variant="outline" 
                                      className="gap-1 text-xs shrink-0 self-start bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                    >
                                      <UserCheck className="h-2.5 w-2.5" />
                                      Compte créé
                                    </Badge>
                                  </div>

                                  {/* Artisan contact info */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3 text-xs md:text-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <User className="h-3.5 w-3.5 shrink-0" />
                                      <span className="truncate">
                                        {artisan.profile?.first_name || artisan.profile?.last_name 
                                          ? `${artisan.profile?.first_name || ''} ${artisan.profile?.last_name || ''}`.trim()
                                          : 'Non renseigné'}
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
                                    <Badge 
                                      variant="outline"
                                      className="gap-1.5 text-xs bg-amber-500/10 text-amber-600 border-amber-500/30"
                                    >
                                      <FileText className="h-3 w-3" />
                                      0 document - En attente d'upload
                                    </Badge>
                                  </div>

                                  {artisan.description && (
                                    <p className="text-muted-foreground text-xs md:text-sm line-clamp-2 mb-3">
                                      {artisan.description}
                                    </p>
                                  )}

                                  <div className="flex flex-wrap gap-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="text-xs md:text-sm h-8 md:h-9 px-3"
                                      onClick={() => window.open(`/artisan/${artisan.slug}`, '_blank')}
                                    >
                                      <ExternalLink className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5" />
                                      Voir le profil
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Bottom pagination */}
                      {totalClaimedPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setClaimedPage(p => Math.max(0, p - 1))}
                            disabled={claimedPage === 0}
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Précédent
                          </Button>
                          <span className="text-sm font-medium px-4">
                            Page {claimedPage + 1} / {totalClaimedPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setClaimedPage(p => Math.min(totalClaimedPages - 1, p + 1))}
                            disabled={claimedPage >= totalClaimedPages - 1}
                          >
                            Suivant
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <Card>
                      <CardContent className="py-12 md:py-20 text-center">
                        <UserCheck className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground/50 mx-auto mb-3 md:mb-4" />
                        <h3 className="text-lg md:text-xl font-semibold mb-2">
                          {claimedSearch ? "Aucun résultat" : "Aucun artisan confirmé"}
                        </h3>
                        <p className="text-muted-foreground text-sm md:text-base mb-4">
                          {claimedSearch 
                            ? `Aucun artisan trouvé pour "${claimedSearch}"`
                            : "Aucun artisan n'a encore créé son compte depuis l'email de pré-inscription."}
                        </p>
                        {claimedSearch && (
                          <Button variant="outline" onClick={() => setClaimedSearch("")}>
                            Effacer la recherche
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
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
              <Textarea
                placeholder="Raison du refus..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Annuler</Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (selectedArtisan && rejectReason.trim()) {
                      rejectArtisanMutation.mutate({ artisanId: selectedArtisan.id, reason: rejectReason });
                    }
                  }}
                  disabled={!rejectReason.trim() || rejectArtisanMutation.isPending}
                >
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
              <Textarea
                placeholder="Raison du refus (ex: Description incomplète, budget irréaliste...)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowMissionRejectDialog(false)}>Annuler</Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (selectedMission && rejectReason.trim()) {
                      rejectMissionMutation.mutate({ missionId: selectedMission.id, reason: rejectReason });
                    }
                  }}
                  disabled={!rejectReason.trim() || rejectMissionMutation.isPending}
                >
                  {rejectMissionMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Refuser la mission
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* View Artisan Profile Dialog */}
          <Dialog open={!!selectedArtisan && !showRejectDialog} onOpenChange={() => setSelectedArtisan(null)}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto mx-2 md:mx-auto">
              {selectedArtisan && (
                <>
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

                    {selectedArtisan.description && (
                      <div>
                        <p className="text-muted-foreground text-xs md:text-sm mb-1">Description</p>
                        <p className="text-xs md:text-sm">{selectedArtisan.description}</p>
                      </div>
                    )}

                    {selectedArtisan.portfolio_images && selectedArtisan.portfolio_images.length > 0 && (
                      <div>
                        <p className="text-muted-foreground text-xs md:text-sm mb-2">Portfolio</p>
                        <div className="grid grid-cols-3 gap-1.5 md:gap-2">
                          {selectedArtisan.portfolio_images.map((img, i) => (
                            <img key={i} src={img} alt={`Portfolio ${i + 1}`} className="aspect-square object-cover rounded-lg" />
                          ))}
                        </div>
                      </div>
                    )}

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
                </>
              )}
            </DialogContent>
          </Dialog>

          {/* View Mission Details Dialog */}
          <Dialog open={!!selectedMission && !showMissionRejectDialog} onOpenChange={() => setSelectedMission(null)}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto mx-2 md:mx-auto">
              {selectedMission && (
                <>
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

                    {selectedMission.description && (
                      <div>
                        <p className="text-muted-foreground text-xs md:text-sm mb-1">Description</p>
                        <p className="text-xs md:text-sm whitespace-pre-wrap">{selectedMission.description}</p>
                      </div>
                    )}

                    {selectedMission.photos && selectedMission.photos.length > 0 && (
                      <div>
                        <p className="text-muted-foreground text-xs md:text-sm mb-2">Photos ({selectedMission.photos.length})</p>
                        <div className="grid grid-cols-3 gap-1.5 md:gap-2">
                          {selectedMission.photos.map((photo, i) => (
                            <img 
                              key={i} 
                              src={photo} 
                              alt={`Photo ${i + 1}`} 
                              className="aspect-square object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(photo, '_blank')}
                            />
                          ))}
                        </div>
                      </div>
                    )}

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
                </>
              )}
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
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => {
                    if (prospectToDelete) {
                      deleteProspectMutation.mutate(prospectToDelete.id);
                    }
                  }}
                  disabled={deleteProspectMutation.isPending}
                >
                  {deleteProspectMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Edit Prospect Dialog */}
          <AdminEditArtisanDialog
            open={editDialogOpen}
            onOpenChange={(open) => {
              setEditDialogOpen(open);
              if (!open) {
                setEditProspect(null);
                queryClient.invalidateQueries({ queryKey: ["prospect-artisans"] });
              }
            }}
            artisan={editProspect as any}
          />

          {/* Documents Dialog */}
          <Dialog open={showDocumentsDialog} onOpenChange={setShowDocumentsDialog}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Documents de {documentsArtisan?.business_name}</DialogTitle>
                <DialogDescription>
                  Vérifiez les documents soumis par l'artisan
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
                  {artisanDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded">
                          <File className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{doc.file_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={doc.status === 'approved' ? 'default' : doc.status === 'rejected' ? 'destructive' : 'secondary'} className="text-xs">
                              {doc.status === 'approved' ? 'Approuvé' : doc.status === 'rejected' ? 'Refusé' : 'En attente'}
                            </Badge>
                            {doc.expiry_date && (
                              <span className="text-xs text-muted-foreground">
                                Expire: {new Date(doc.expiry_date).toLocaleDateString('fr-FR')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const url = await getDocumentUrl(doc.file_path);
                          if (url) window.open(url, '_blank');
                        }}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Voir
                      </Button>
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
                <AlertDialogAction
                  className="bg-amber-500 hover:bg-amber-600"
                  disabled={isSendingPreregistration}
                  onClick={async (e) => {
                    e.preventDefault();
                    if (!preregistrationProspect) return;
                    
                    setIsSendingPreregistration(true);
                    try {
                      const { error } = await supabase.functions.invoke('send-preregistration-email', {
                        body: {
                          artisanId: preregistrationProspect.prospect.id,
                          artisanEmail: preregistrationProspect.email,
                          artisanName: preregistrationProspect.prospect.business_name,
                        }
                      });
                      
                      if (error) throw error;
                      
                      toast.success(`Email de pré-inscription envoyé à ${preregistrationProspect.prospect.business_name}`);
                      queryClient.invalidateQueries({ queryKey: ["prospect-artisans"] });
                      queryClient.invalidateQueries({ queryKey: ["prospect-artisans-count"] });
                      queryClient.invalidateQueries({ queryKey: ["claimed-artisans"] });
                      queryClient.invalidateQueries({ queryKey: ["claimed-artisans-count"] });
                      setShowPreregistrationDialog(false);
                      setPreregistrationProspect(null);
                    } catch (err: any) {
                      console.error('Error sending pre-registration email:', err);
                      toast.error("Erreur lors de l'envoi de l'email");
                    } finally {
                      setIsSendingPreregistration(false);
                    }
                  }}
                >
                  {isSendingPreregistration ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Envoyer l'email
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

        </main>
      </div>
    </>
  );
};

export default AdminApprovals;
