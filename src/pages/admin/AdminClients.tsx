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
  Users
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { useProfiles, useMissions } from "@/hooks/useAdminData";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-background pt-16 lg:pt-20">
        <AdminSidebar />
      
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Gestion des Clients</h1>
          <p className="text-muted-foreground mt-1">Consultez la liste des clients inscrits</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5" />
              Recherche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un client par nom ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={() => setSearchTerm("")}>
                Réinitialiser
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
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
                    <th className="text-left p-4 font-medium">Ville</th>
                    <th className="text-left p-4 font-medium">Inscrit le</th>
                    <th className="text-left p-4 font-medium">Missions postées</th>
                    <th className="text-left p-4 font-medium">Missions terminées</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="p-4"><Skeleton className="h-10 w-40" /></td>
                        <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="p-4"><Skeleton className="h-6 w-12" /></td>
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
                            <p className="text-sm text-muted-foreground">{client.email}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {client.city || "Non renseigné"}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {formatDate(client.created_at)}
                          </span>
                        </td>
                        <td className="p-4">
                          <Badge variant="secondary">{client.missionsPosted}</Badge>
                        </td>
                        <td className="p-4">
                          <Badge className="bg-green-500/10 text-green-500">{client.missionsCompleted}</Badge>
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