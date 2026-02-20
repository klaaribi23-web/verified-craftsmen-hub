import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/admin-dashboard/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Search, 
  Eye, 
  MessageSquare, 
  Pencil, 
  UserX, 
  MapPin,
  Calendar,
  Star,
  Briefcase,
  Filter,
  CheckCircle,
  XCircle,
  ImageDown,
  Loader2,
  Trash2,
  Clock,
  ShieldCheck,
  UserCheck
} from "lucide-react";
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
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useArtisans, useCategories, useUpdateArtisanStatus, useToggleArtisanAudit } from "@/hooks/useAdminData";
import { Switch } from "@/components/ui/switch";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/layout/Navbar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { AdminEditArtisanDialog } from "@/components/admin-dashboard/AdminEditArtisanDialog";
import { supabase } from "@/integrations/supabase/client";

const AdminArtisans = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [selectedCity, setSelectedCity] = useState("Toutes");
  const [selectedStatus, setSelectedStatus] = useState("Tous");
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingArtisan, setDeletingArtisan] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedArtisan, setSelectedArtisan] = useState<any>(null);
  
  const queryClient = useQueryClient();

  const { data: artisans, isLoading: artisansLoading } = useArtisans();
  const { data: categories } = useCategories();
  const updateStatus = useUpdateArtisanStatus();
  const toggleAudit = useToggleArtisanAudit();

  // Get unique cities from artisans
  const cities = artisans 
    ? ["Toutes", ...new Set(artisans.map((a) => a.city))]
    : ["Toutes"];

  const categoryOptions = categories 
    ? ["Tous", ...categories.map((c) => c.name)]
    : ["Tous"];

  const filteredArtisans = artisans?.filter((artisan) => {
    const matchesSearch = artisan.business_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Tous" || artisan.category?.name === selectedCategory;
    const matchesCity = selectedCity === "Toutes" || artisan.city === selectedCity;
    const matchesStatus = selectedStatus === "Tous" || 
      (selectedStatus === "Validé" && artisan.status === "active") ||
      (selectedStatus === "En attente" && artisan.status === "suspended") ||
      (selectedStatus === "Disponible" && artisan.status === "disponible");
    return matchesSearch && matchesCategory && matchesCity && matchesStatus;
  }) || [];

  const handleRevoke = (artisan: any) => {
    setSelectedArtisan(artisan);
    setRevokeDialogOpen(true);
  };

  const handleQuickStatus = async (artisan: any, newStatus: "active" | "suspended" | "disponible") => {
    if (artisan.status === newStatus) return;
    try {
      await updateStatus.mutateAsync({ id: artisan.id, status: newStatus });
      await queryClient.refetchQueries({ queryKey: ["admin-artisans"] });
      const labels: Record<string, string> = { active: "Validé", suspended: "En attente", disponible: "Disponible" };
      toast({
        title: `Statut changé : ${labels[newStatus]}`,
        description: `${artisan.business_name} est maintenant "${labels[newStatus]}".`,
      });
    } catch (error) {
      toast({ title: "Erreur", description: "Le changement de statut a échoué.", variant: "destructive" });
    }
  };

  const confirmRevoke = async () => {
    if (!selectedArtisan) return;
    const newStatus = selectedArtisan.status === "suspended" ? "active" : "suspended";
    try {
      await updateStatus.mutateAsync({ id: selectedArtisan.id, status: newStatus });
      await queryClient.refetchQueries({ queryKey: ["admin-artisans"] });
      toast({
        title: newStatus === "active" ? "Artisan validé" : "Artisan en attente",
        description: `${selectedArtisan.business_name} a été mis à jour.`,
      });
    } catch (error) {
      toast({ title: "Erreur", description: "La mise à jour du statut a échoué.", variant: "destructive" });
    }
    setRevokeDialogOpen(false);
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleDelete = (artisan: any) => {
    setSelectedArtisan(artisan);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedArtisan) return;
    setDeletingArtisan(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-delete-waiting-artisan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ artisanId: selectedArtisan.id }),
        }
      );
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || "Échec");

      await queryClient.refetchQueries({ queryKey: ["admin-artisans"] });
      await queryClient.refetchQueries({ queryKey: ["admin-stats"] });

      toast({
        title: "Artisan supprimé",
        description: `${selectedArtisan.business_name} a été supprimé définitivement.`,
      });
    } catch (error: any) {
      console.error("[Admin] Delete error:", error);
      toast({
        title: "Erreur de suppression",
        description: error.message || "La suppression a échoué.",
        variant: "destructive",
      });
    } finally {
      setDeletingArtisan(false);
      setDeleteDialogOpen(false);
    }
  };

  const activeCount = artisans?.filter(a => a.status === "active").length || 0;
  const suspendedCount = artisans?.filter(a => a.status === "suspended").length || 0;
  const disponibleCount = artisans?.filter(a => a.status === "disponible").length || 0;

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "Validé";
      case "suspended": return "En attente";
      case "disponible": return "Disponible";
      default: return status;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active": return "secondary" as const;
      case "disponible": return "outline" as const;
      default: return "destructive" as const;
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
      
        <main className="flex-1">
          <DashboardHeader 
            title="Gestion des Artisans" 
            subtitle="Gérez tous les artisans de la plateforme" 
          />

          <div className="p-4 md:p-8">

        {/* Filters */}
        <Card className="mb-4 md:mb-6">
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Filter className="h-4 w-4 md:h-5 md:w-5" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
              <div className="relative sm:col-span-2 lg:col-span-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger>
                  <SelectValue placeholder="Ville" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tous">Tous les statuts</SelectItem>
                  <SelectItem value="Validé">Validé</SelectItem>
                  <SelectItem value="En attente">En attente</SelectItem>
                  <SelectItem value="Disponible">Disponible</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => { setSearchTerm(""); setSelectedCategory("Tous"); setSelectedCity("Toutes"); setSelectedStatus("Tous"); }} className="w-full">
                Réinitialiser
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
          <Card>
            <CardContent className="p-3 md:p-4 text-center">
              <p className="text-xl md:text-2xl font-bold text-foreground">{artisans?.length || 0}</p>
              <p className="text-xs md:text-sm text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 md:p-4 text-center">
              <p className="text-xl md:text-2xl font-bold text-primary">{activeCount}</p>
              <p className="text-xs md:text-sm text-muted-foreground">Validés</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 md:p-4 text-center">
              <p className="text-xl md:text-2xl font-bold text-accent-foreground">{disponibleCount}</p>
              <p className="text-xs md:text-sm text-muted-foreground">Disponibles</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 md:p-4 text-center">
              <p className="text-xl md:text-2xl font-bold text-destructive">{suspendedCount}</p>
              <p className="text-xs md:text-sm text-muted-foreground">En attente</p>
            </CardContent>
          </Card>
        </div>

        {/* Artisans List */}
        <Card>
          <CardContent className="p-0">
            {/* Mobile: cards */}
            <div className="md:hidden p-3 space-y-3">
              {artisansLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="rounded-lg border border-border bg-card p-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-4 gap-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                ))
              ) : filteredArtisans.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Aucun artisan trouvé
                </div>
              ) : (
                filteredArtisans.map((artisan) => (
                  <div key={artisan.id} className="rounded-lg border border-border bg-card p-3">
                    <div className="flex items-start gap-3">
                      <img
                        src={
                          artisan.photo_url ||
                          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
                        }
                        alt={artisan.business_name}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate flex items-center gap-1.5">
                              <span className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${artisan.status === "active" ? "bg-green-500" : artisan.status === "suspended" ? "bg-orange-500" : "bg-gray-400"}`} />
                              {artisan.business_name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {artisan.profile?.first_name} {artisan.profile?.last_name}
                            </p>
                          </div>
                          <Badge variant={getStatusVariant(artisan.status)}>
                            {getStatusLabel(artisan.status)}
                          </Badge>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="truncate">{artisan.city}</span>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {format(new Date(artisan.created_at), "dd/MM/yyyy", { locale: fr })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Audit toggle */}
                    <div className="mt-2 flex items-center justify-between px-1">
                      <span className="text-xs text-muted-foreground">Audité</span>
                      <Switch
                        checked={(artisan as any).is_audited || false}
                        onCheckedChange={(checked) => {
                          toggleAudit.mutate(
                            { id: artisan.id, is_audited: checked },
                            {
                              onSuccess: () => toast({ title: checked ? "Badge Audité activé" : "Badge Audité retiré" }),
                              onError: () => toast({ title: "Erreur", variant: "destructive" }),
                            }
                          );
                        }}
                      />
                    </div>

                    {/* Status quick actions */}
                    <div className="mt-2 flex items-center gap-1 px-1">
                      <span className="text-xs text-muted-foreground mr-auto">Statut :</span>
                      <Button
                        size="sm"
                        variant={artisan.status === "active" ? "default" : "outline"}
                        className={`h-7 px-2 text-xs ${artisan.status === "active" ? "bg-green-600 hover:bg-green-700 text-white border-green-600" : "hover:bg-green-50 hover:text-green-700 hover:border-green-400"}`}
                        onClick={() => handleQuickStatus(artisan, "active")}
                        disabled={updateStatus.isPending}
                      >
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        Validé
                      </Button>
                      <Button
                        size="sm"
                        variant={artisan.status === "suspended" ? "default" : "outline"}
                        className={`h-7 px-2 text-xs ${artisan.status === "suspended" ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500" : "hover:bg-orange-50 hover:text-orange-700 hover:border-orange-400"}`}
                        onClick={() => handleQuickStatus(artisan, "suspended")}
                        disabled={updateStatus.isPending}
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        Attente
                      </Button>
                      <Button
                        size="sm"
                        variant={artisan.status === "disponible" ? "default" : "outline"}
                        className={`h-7 px-2 text-xs ${artisan.status === "disponible" ? "bg-gray-500 hover:bg-gray-600 text-white border-gray-500" : "hover:bg-gray-100 hover:text-gray-700 hover:border-gray-400"}`}
                        onClick={() => handleQuickStatus(artisan, "disponible")}
                        disabled={updateStatus.isPending}
                      >
                        <UserCheck className="h-3 w-3 mr-1" />
                        Dispo
                      </Button>
                    </div>

                    <div className="mt-2 grid grid-cols-4 gap-2">
                      <Link to={`/artisan/${artisan.slug || artisan.id}`} className="w-full">
                        <Button size="icon" variant="outline" className="w-full" aria-label="Voir le profil">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        size="icon"
                        variant="outline"
                        className="w-full"
                        aria-label="Modifier"
                        onClick={() => {
                          setSelectedArtisan(artisan);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Link to={`/admin/messagerie?artisan=${artisan.profile_id}`} className="w-full">
                        <Button size="icon" variant="outline" className="w-full" aria-label="Messagerie">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="w-full"
                        onClick={() => handleDelete(artisan)}
                        aria-label="Supprimer définitivement"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs lg:text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-2 py-2.5 font-medium whitespace-nowrap">Artisan</th>
                    <th className="text-left px-2 py-2.5 font-medium whitespace-nowrap">Catégorie</th>
                    <th className="text-left px-2 py-2.5 font-medium whitespace-nowrap">Ville</th>
                    <th className="text-left px-2 py-2.5 font-medium whitespace-nowrap">Inscrit le</th>
                    <th className="text-left px-2 py-2.5 font-medium whitespace-nowrap">Statut</th>
                    <th className="text-center px-2 py-2.5 font-medium whitespace-nowrap">Audité</th>
                    <th className="text-left px-2 py-2.5 font-medium whitespace-nowrap sticky right-0 bg-muted/50 z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.1)]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {artisansLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                        </td>
                        <td className="p-4">
                          <Skeleton className="h-4 w-20" />
                        </td>
                        <td className="p-4">
                          <Skeleton className="h-4 w-20" />
                        </td>
                        <td className="p-4">
                          <Skeleton className="h-4 w-24" />
                        </td>
                        <td className="p-4">
                          <Skeleton className="h-4 w-16" />
                        </td>
                        <td className="p-4">
                          <Skeleton className="h-8 w-32" />
                        </td>
                      </tr>
                    ))
                  ) : (
                    filteredArtisans.map((artisan) => (
                      <tr key={artisan.id} className="border-t border-border hover:bg-muted/30">
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={artisan.photo_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"}
                              alt={artisan.business_name}
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                              loading="lazy"
                            />
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate max-w-[140px] flex items-center gap-1">
                                <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${artisan.status === "active" ? "bg-green-500" : artisan.status === "suspended" ? "bg-orange-500" : "bg-gray-400"}`} />
                                {artisan.business_name}
                              </p>
                              <p className="text-muted-foreground truncate max-w-[140px]">
                                {artisan.profile?.first_name} {artisan.profile?.last_name}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <Badge variant="secondary" className="text-[10px] lg:text-xs">{artisan.category?.name || "—"}</Badge>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {artisan.city}
                          </span>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-muted-foreground">
                          {format(new Date(artisan.created_at), "dd/MM/yy", { locale: fr })}
                        </td>
                        <td className="px-2 py-2">
                          <Badge variant={getStatusVariant(artisan.status)} className="text-[10px] lg:text-xs">
                            {getStatusLabel(artisan.status)}
                          </Badge>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <Switch
                            checked={(artisan as any).is_audited || false}
                            onCheckedChange={(checked) => {
                              toggleAudit.mutate(
                                { id: artisan.id, is_audited: checked },
                                {
                                  onSuccess: () => toast({ title: checked ? "Badge Audité activé" : "Badge Audité retiré" }),
                                  onError: () => toast({ title: "Erreur", variant: "destructive" }),
                                }
                              );
                            }}
                          />
                        </td>
                        <td className="px-2 py-2 sticky right-0 bg-card z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.1)]">
                          <div className="flex items-center gap-0.5">
                            <Button size="sm" variant={artisan.status === "active" ? "default" : "outline"} onClick={() => handleQuickStatus(artisan, "active")} title="Validé" disabled={updateStatus.isPending} className={`h-7 px-1.5 text-[10px] lg:text-xs ${artisan.status === "active" ? "bg-green-600 hover:bg-green-700 text-white border-green-600" : "hover:bg-green-50 hover:text-green-700 hover:border-green-400"}`}>
                              <ShieldCheck className="h-3 w-3 lg:mr-0.5" /><span className="hidden lg:inline">Validé</span>
                            </Button>
                            <Button size="sm" variant={artisan.status === "suspended" ? "default" : "outline"} onClick={() => handleQuickStatus(artisan, "suspended")} title="En attente" disabled={updateStatus.isPending} className={`h-7 px-1.5 text-[10px] lg:text-xs ${artisan.status === "suspended" ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500" : "hover:bg-orange-50 hover:text-orange-700 hover:border-orange-400"}`}>
                              <Clock className="h-3 w-3 lg:mr-0.5" /><span className="hidden lg:inline">Att.</span>
                            </Button>
                            <Button size="sm" variant={artisan.status === "disponible" ? "default" : "outline"} onClick={() => handleQuickStatus(artisan, "disponible")} title="Disponible" disabled={updateStatus.isPending} className={`h-7 px-1.5 text-[10px] lg:text-xs ${artisan.status === "disponible" ? "bg-gray-500 hover:bg-gray-600 text-white border-gray-500" : "hover:bg-gray-100 hover:text-gray-700 hover:border-gray-400"}`}>
                              <UserCheck className="h-3 w-3 lg:mr-0.5" /><span className="hidden lg:inline">Dispo</span>
                            </Button>
                            <span className="w-px h-5 bg-border mx-0.5" />
                            <Link to={`/artisan/${artisan.slug || artisan.id}`}>
                              <Button size="sm" variant="outline" title="Voir" className="h-7 px-1.5"><Eye className="h-3 w-3" /></Button>
                            </Link>
                            <Button size="sm" variant="outline" title="Modifier" className="h-7 px-1.5" onClick={() => { setSelectedArtisan(artisan); setEditDialogOpen(true); }}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(artisan)} title="Supprimer" className="h-7 px-1.5">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Revoke Dialog */}
        <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedArtisan?.status === "suspended" ? "Réactiver cet artisan ?" : "Révoquer cet artisan ?"}
              </DialogTitle>
              <DialogDescription>
                {selectedArtisan?.status === "suspended" 
                  ? `Êtes-vous sûr de vouloir réactiver ${selectedArtisan?.business_name} sur la plateforme ?`
                  : `Êtes-vous sûr de vouloir révoquer ${selectedArtisan?.business_name} de la plateforme ? Cette action suspendra son compte.`
                }
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setRevokeDialogOpen(false)}>
                Annuler
              </Button>
              <Button 
                variant={selectedArtisan?.status === "suspended" ? "default" : "destructive"} 
                onClick={confirmRevoke}
                disabled={updateStatus.isPending}
              >
                {selectedArtisan?.status === "suspended" ? "Réactiver" : "Révoquer"}
              </Button>
            </div>
            </DialogContent>
          </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer définitivement cet artisan ?</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer définitivement <strong>{selectedArtisan?.business_name}</strong> ? 
                Cette action est irréversible. Toutes les données associées (profil, documents, avis, candidatures) seront effacées.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deletingArtisan}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={deletingArtisan}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deletingArtisan ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Suppression...</>
                ) : (
                  "Supprimer définitivement"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Artisan Dialog */}
        <AdminEditArtisanDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          artisan={selectedArtisan}
        />
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminArtisans;
