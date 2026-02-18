import { useState } from "react";
import { AdminSidebar } from "@/components/admin-dashboard/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  MapPin,
  Calendar,
  Briefcase,
  Filter,
  Users,
  Download,
  Mail,
  Phone,
  Trash2,
  Loader2
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { useProfiles, useMissions } from "@/hooks/useAdminData";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
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

const AdminClients = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);
  const [clientToDelete, setClientToDelete] = useState<{id: string; name: string; email: string} | null>(null);
  const { data: profiles, isLoading: profilesLoading } = useProfiles();
  const { data: missions, isLoading: missionsLoading } = useMissions();
  const queryClient = useQueryClient();

  const isLoading = profilesLoading || missionsLoading;

  // Calculate missions per client
  const clientsWithMissions = profiles?.map(profile => {
    const clientMissions = missions?.filter(m => m.client_id === profile.id) || [];
    const missionsPosted = clientMissions.length;
    const missionsCompleted = clientMissions.filter(m => m.status === "completed").length;
    return {
      ...profile,
      missionsPosted,
      missionsCompleted,
    };
  }) || [];

  const filteredClients = clientsWithMissions.filter((client) => 
    (client.first_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (client.last_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalMissionsPosted = clientsWithMissions.reduce((acc, c) => acc + c.missionsPosted, 0);
  const totalMissionsCompleted = clientsWithMissions.reduce((acc, c) => acc + c.missionsCompleted, 0);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: fr });
  };

  const exportToCSV = () => {
    const headers = ["Prénom", "Nom", "Email", "Téléphone", "Ville", "Inscrit le", "Missions postées", "Missions terminées"];
    const rows = filteredClients.map(client => [
      client.first_name || "",
      client.last_name || "",
      client.email,
      client.phone || "",
      client.city || "",
      formatDate(client.created_at),
      client.missionsPosted.toString(),
      client.missionsCompleted.toString()
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(";"))
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `clients_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV téléchargé");
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    
    setDeletingClientId(clientToDelete.id);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Session expirée");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-delete-client`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ profileId: clientToDelete.id }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        // Si le profil n'existe plus, rafraîchir la liste quand même
        if (response.status === 404) {
          toast.info("Ce client a déjà été supprimé");
          queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
          return;
        }
        throw new Error(result.error || "Erreur lors de la suppression");
      }

      toast.success(`Client "${clientToDelete.name || clientToDelete.email}" supprimé définitivement`);
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      queryClient.invalidateQueries({ queryKey: ["admin-missions"] });
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la suppression");
    } finally {
      setDeletingClientId(null);
      setClientToDelete(null);
    }
  };

  const openDeleteDialog = (client: { id: string; first_name?: string | null; last_name?: string | null; email: string }) => {
    const name = [client.first_name, client.last_name].filter(Boolean).join(" ") || "Client";
    setClientToDelete({ id: client.id, name, email: client.email });
  };

  return (
    <>
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">⚠️ Suppression définitive</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Êtes-vous sûr de vouloir supprimer définitivement le client{" "}
                <strong>{clientToDelete?.name}</strong> ({clientToDelete?.email}) ?
              </p>
              <p className="text-destructive font-medium">
                Cette action est irréversible. Toutes les données seront supprimées :
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                <li>Compte utilisateur (AUTH)</li>
                <li>Profil et informations personnelles</li>
                <li>Toutes les missions créées</li>
                <li>Tous les messages envoyés/reçus</li>
                <li>Tous les devis</li>
                <li>Toutes les recommandations</li>
                <li>Tous les favoris</li>
                <li>Toutes les notifications</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingClientId}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteClient}
              disabled={!!deletingClientId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingClientId ? (
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

      <Navbar />
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
      
        <main className="flex-1">
          <DashboardHeader 
            title="Gestion des Clients" 
            subtitle="Consultez la liste des clients inscrits" 
          />

          <div className="p-4 md:p-8">

        {/* Filters */}
        <Card className="mb-4 md:mb-6">
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Filter className="h-4 w-4 md:h-5 md:w-5" />
              Recherche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={() => setSearchTerm("")} className="w-full sm:w-auto">
                Réinitialiser
              </Button>
              <Button onClick={exportToCSV} disabled={filteredClients.length === 0} className="w-full sm:w-auto">
                <Download className="h-4 w-4 mr-2" />
                Exporter CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">{clientsWithMissions.length}</p>
                  )}
                  <p className="text-sm text-muted-foreground">Total clients</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-yellow-500/10">
                  <Briefcase className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">{totalMissionsPosted}</p>
                  )}
                  <p className="text-sm text-muted-foreground">Missions postées</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <Briefcase className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">{totalMissionsCompleted}</p>
                  )}
                  <p className="text-sm text-muted-foreground">Missions terminées</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clients List */}
        <Card>
          <CardContent className="p-0">
            {/* Mobile: cards */}
            <div className="md:hidden p-3 space-y-3">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="rounded-lg border border-border bg-card p-3">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56 mt-2" />
                    <div className="mt-3 flex gap-2">
                      <Skeleton className="h-6 w-10" />
                      <Skeleton className="h-6 w-10" />
                    </div>
                  </div>
                ))
              ) : filteredClients.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Aucun client trouvé
                </div>
              ) : (
                filteredClients.map((client) => (
                  <div key={client.id} className="rounded-lg border border-border bg-card p-3">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {client.first_name || ""} {client.last_name || ""}
                        {!client.first_name && !client.last_name && "Client"}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 truncate mt-1">
                        <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </p>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1 min-w-0">
                        <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{client.phone || "Non renseigné"}</span>
                      </div>
                      <div className="flex items-center gap-1 min-w-0">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{client.city || "Non renseigné"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                        {formatDate(client.created_at)}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex gap-1">
                        <Badge variant="secondary" title="Postées">
                          {client.missionsPosted} postée{client.missionsPosted > 1 ? "s" : ""}
                        </Badge>
                        <Badge variant="secondary" title="Terminées">
                          {client.missionsCompleted} terminée{client.missionsCompleted > 1 ? "s" : ""}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(client)}
                        disabled={deletingClientId === client.id}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        {deletingClientId === client.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">Client</th>
                    <th className="text-left p-4 font-medium">Téléphone</th>
                    <th className="text-left p-4 font-medium hidden lg:table-cell">Ville</th>
                    <th className="text-left p-4 font-medium hidden lg:table-cell">Inscrit le</th>
                    <th className="text-left p-4 font-medium">Missions</th>
                    <th className="text-left p-4 font-medium w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="p-4"><Skeleton className="h-10 w-40" /></td>
                        <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="p-4 hidden lg:table-cell"><Skeleton className="h-4 w-24" /></td>
                        <td className="p-4 hidden lg:table-cell"><Skeleton className="h-4 w-24" /></td>
                        <td className="p-4"><Skeleton className="h-6 w-12" /></td>
                      </tr>
                    ))
                  ) : filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        Aucun client trouvé
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((client) => (
                      <tr key={client.id} className="border-t border-border hover:bg-muted/30">
                        <td className="p-4">
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {client.first_name || ""} {client.last_name || ""}
                              {!client.first_name && !client.last_name && "Client"}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 min-w-0">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{client.email}</span>
                            </p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            {client.phone || "Non renseigné"}
                          </span>
                        </td>
                        <td className="p-4 hidden lg:table-cell">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {client.city || "Non renseigné"}
                          </span>
                        </td>
                        <td className="p-4 hidden lg:table-cell">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {formatDate(client.created_at)}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-1">
                            <Badge variant="secondary" title="Postées">{client.missionsPosted}</Badge>
                            <Badge variant="secondary" title="Terminées">{client.missionsCompleted}</Badge>
                          </div>
                        </td>
                        <td className="p-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(client)}
                            disabled={deletingClientId === client.id}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            {deletingClientId === client.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminClients;