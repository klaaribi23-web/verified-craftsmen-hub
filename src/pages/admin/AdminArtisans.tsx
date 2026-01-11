import { useState } from "react";
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
  XCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useArtisans, useCategories, useUpdateArtisanStatus } from "@/hooks/useAdminData";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/layout/Navbar";
import { AdminEditArtisanDialog } from "@/components/admin-dashboard/AdminEditArtisanDialog";

const AdminArtisans = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [selectedCity, setSelectedCity] = useState("Toutes");
  const [selectedStatus, setSelectedStatus] = useState("Tous");
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedArtisan, setSelectedArtisan] = useState<any>(null);

  const { data: artisans, isLoading: artisansLoading } = useArtisans();
  const { data: categories } = useCategories();
  const updateStatus = useUpdateArtisanStatus();

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
      (selectedStatus === "Actif" && artisan.status === "active") ||
      (selectedStatus === "Suspendu" && artisan.status === "suspended");
    return matchesSearch && matchesCategory && matchesCity && matchesStatus;
  }) || [];

  const handleRevoke = (artisan: any) => {
    setSelectedArtisan(artisan);
    setRevokeDialogOpen(true);
  };

  const confirmRevoke = async () => {
    if (!selectedArtisan) return;
    
    try {
      await updateStatus.mutateAsync({
        id: selectedArtisan.id,
        status: selectedArtisan.status === "suspended" ? "active" : "suspended"
      });
      
      toast({
        title: selectedArtisan.status === "suspended" ? "Artisan réactivé" : "Artisan révoqué",
        description: `${selectedArtisan.business_name} a été ${selectedArtisan.status === "suspended" ? "réactivé" : "suspendu"}.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    }
    setRevokeDialogOpen(false);
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const activeCount = artisans?.filter(a => a.status === "active").length || 0;
  const suspendedCount = artisans?.filter(a => a.status === "suspended").length || 0;

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-background pt-16 lg:pt-20">
        <AdminSidebar />
      
      <main className="flex-1 p-4 md:p-8">
        <div className="mb-4 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Gestion des Artisans</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">Gérez tous les artisans de la plateforme</p>
        </div>

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
                  <SelectItem value="Actif">Actif</SelectItem>
                  <SelectItem value="Suspendu">Suspendu</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => { setSearchTerm(""); setSelectedCategory("Tous"); setSelectedCity("Toutes"); setSelectedStatus("Tous"); }} className="w-full">
                Réinitialiser
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
          <Card>
            <CardContent className="p-3 md:p-4 text-center">
              <p className="text-xl md:text-2xl font-bold text-foreground">{artisans?.length || 0}</p>
              <p className="text-xs md:text-sm text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 md:p-4 text-center">
              <p className="text-xl md:text-2xl font-bold text-green-500">{activeCount}</p>
              <p className="text-xs md:text-sm text-muted-foreground">Actifs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 md:p-4 text-center">
              <p className="text-xl md:text-2xl font-bold text-destructive">{suspendedCount}</p>
              <p className="text-xs md:text-sm text-muted-foreground">Suspendus</p>
            </CardContent>
          </Card>
        </div>

        {/* Artisans List */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">Artisan</th>
                    <th className="text-left p-4 font-medium">Catégorie</th>
                    <th className="text-left p-4 font-medium">Ville</th>
                    <th className="text-left p-4 font-medium">Inscrit le</th>
                    <th className="text-left p-4 font-medium">Statut</th>
                    <th className="text-left p-4 font-medium">Actions</th>
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
                        <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                        <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                        <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="p-4"><Skeleton className="h-4 w-16" /></td>
                        <td className="p-4"><Skeleton className="h-8 w-32" /></td>
                      </tr>
                    ))
                  ) : (
                    filteredArtisans.map((artisan) => (
                      <tr key={artisan.id} className="border-t border-border hover:bg-muted/30">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={artisan.photo_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"} 
                              alt={artisan.business_name} 
                              className="w-10 h-10 rounded-full object-cover" 
                            />
                            <div>
                              <p className="font-medium text-foreground">{artisan.business_name}</p>
                              <p className="text-sm text-muted-foreground">{artisan.siret || "SIRET non renseigné"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="secondary">{artisan.category?.name || "Non catégorisé"}</Badge>
                        </td>
                        <td className="p-4">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {artisan.city}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(artisan.created_at), "dd/MM/yyyy", { locale: fr })}
                          </span>
                        </td>
                        <td className="p-4">
                          <Badge className={
                            artisan.status === "active" 
                              ? "bg-green-500/10 text-green-500" 
                              : "bg-destructive/10 text-destructive"
                          }>
                            {artisan.status === "active" ? "Actif" : "Suspendu"}
                          </Badge>
                          {artisan.is_verified && (
                            <CheckCircle className="h-4 w-4 text-green-500 ml-2 inline" />
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Link to={`/artisan/${artisan.slug || artisan.id}`}>
                              <Button size="sm" variant="outline" title="Voir le profil">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button 
                              size="sm" 
                              variant="outline"
                              title="Modifier"
                              onClick={() => {
                                setSelectedArtisan(artisan);
                                setEditDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Link to={`/admin/messagerie?artisan=${artisan.profile_id}`}>
                              <Button size="sm" variant="outline" title="Messagerie">
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button 
                              size="sm" 
                              variant={artisan.status === "suspended" ? "default" : "destructive"} 
                              onClick={() => handleRevoke(artisan)}
                              title={artisan.status === "suspended" ? "Réactiver" : "Suspendre"}
                            >
                              {artisan.status === "suspended" ? <CheckCircle className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
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

        {/* Edit Artisan Dialog */}
        <AdminEditArtisanDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          artisan={selectedArtisan}
        />
        </main>
      </div>
    </>
  );
};

export default AdminArtisans;
