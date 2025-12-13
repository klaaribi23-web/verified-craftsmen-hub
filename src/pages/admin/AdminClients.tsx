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
  Phone
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { useProfiles, useMissions } from "@/hooks/useAdminData";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

const AdminClients = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: profiles, isLoading: profilesLoading } = useProfiles();
  const { data: missions, isLoading: missionsLoading } = useMissions();

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

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-background pt-16 lg:pt-20">
        <AdminSidebar />
      
      <main className="flex-1 p-4 md:p-8">
        <div className="mb-4 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Gestion des Clients</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">Consultez la liste des clients inscrits</p>
        </div>

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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">Client</th>
                    <th className="text-left p-4 font-medium hidden md:table-cell">Téléphone</th>
                    <th className="text-left p-4 font-medium hidden lg:table-cell">Ville</th>
                    <th className="text-left p-4 font-medium hidden lg:table-cell">Inscrit le</th>
                    <th className="text-left p-4 font-medium">Missions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="p-4"><Skeleton className="h-10 w-40" /></td>
                        <td className="p-4 hidden md:table-cell"><Skeleton className="h-4 w-24" /></td>
                        <td className="p-4 hidden lg:table-cell"><Skeleton className="h-4 w-24" /></td>
                        <td className="p-4 hidden lg:table-cell"><Skeleton className="h-4 w-24" /></td>
                        <td className="p-4"><Skeleton className="h-6 w-12" /></td>
                      </tr>
                    ))
                  ) : filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        Aucun client trouvé
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((client) => (
                      <tr key={client.id} className="border-t border-border hover:bg-muted/30">
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-foreground">
                              {client.first_name || ""} {client.last_name || ""}
                              {!client.first_name && !client.last_name && "Client"}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {client.email}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 md:hidden">
                              <Phone className="h-3 w-3" />
                              {client.phone || "Non renseigné"}
                            </p>
                          </div>
                        </td>
                        <td className="p-4 hidden md:table-cell">
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
                            <Badge className="bg-green-500/10 text-green-500" title="Terminées">{client.missionsCompleted}</Badge>
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
        </main>
      </div>
    </>
  );
};

export default AdminClients;