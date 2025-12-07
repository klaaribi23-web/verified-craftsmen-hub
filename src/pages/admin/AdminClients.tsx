import { useState } from "react";
import { AdminSidebar } from "@/components/admin-dashboard/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Search, 
  MapPin,
  Calendar,
  Briefcase,
  Filter,
  Users
} from "lucide-react";

interface Client {
  id: string;
  name: string;
  email: string;
  city: string;
  registeredAt: string;
  missionsPosted: number;
  missionsCompleted: number;
}

const clients: Client[] = [
  { id: "1", name: "Marie Dupont", email: "marie.dupont@email.com", city: "Paris", registeredAt: "10/01/2024", missionsPosted: 5, missionsCompleted: 4 },
  { id: "2", name: "Thomas Martin", email: "thomas.martin@email.com", city: "Lyon", registeredAt: "15/02/2024", missionsPosted: 3, missionsCompleted: 2 },
  { id: "3", name: "Claire Bernard", email: "claire.bernard@email.com", city: "Marseille", registeredAt: "20/03/2024", missionsPosted: 8, missionsCompleted: 7 },
  { id: "4", name: "Paul Petit", email: "paul.petit@email.com", city: "Bordeaux", registeredAt: "05/04/2024", missionsPosted: 2, missionsCompleted: 1 },
  { id: "5", name: "Sophie Laurent", email: "sophie.laurent@email.com", city: "Toulouse", registeredAt: "12/05/2024", missionsPosted: 6, missionsCompleted: 5 },
  { id: "6", name: "Lucas Moreau", email: "lucas.moreau@email.com", city: "Nantes", registeredAt: "18/06/2024", missionsPosted: 4, missionsCompleted: 3 },
];

const AdminClients = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredClients = clients.filter((client) => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-background">
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
                  <p className="text-2xl font-bold text-foreground">{clients.length}</p>
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
                  <p className="text-2xl font-bold text-foreground">{clients.reduce((acc, c) => acc + c.missionsPosted, 0)}</p>
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
                  <p className="text-2xl font-bold text-foreground">{clients.reduce((acc, c) => acc + c.missionsCompleted, 0)}</p>
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
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="border-t border-border hover:bg-muted/30">
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-foreground">{client.name}</p>
                          <p className="text-sm text-muted-foreground">{client.email}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {client.city}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {client.registeredAt}
                        </span>
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary">{client.missionsPosted}</Badge>
                      </td>
                      <td className="p-4">
                        <Badge className="bg-green-500/10 text-green-500">{client.missionsCompleted}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminClients;
