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
  Phone, 
  UserX, 
  MapPin,
  Calendar,
  Star,
  Briefcase,
  Filter
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface Artisan {
  id: string;
  name: string;
  category: string;
  city: string;
  registeredAt: string;
  photo: string;
  rating: number;
  missionsCompleted: number;
  phone: string;
  email: string;
  status: "active" | "suspended";
}

const artisans: Artisan[] = [
  { id: "1", name: "Jean Dupont", category: "Plombier", city: "Paris", registeredAt: "15/01/2024", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop", rating: 4.8, missionsCompleted: 45, phone: "0612345678", email: "jean@example.com", status: "active" },
  { id: "2", name: "Pierre Martin", category: "Électricien", city: "Lyon", registeredAt: "20/02/2024", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop", rating: 4.6, missionsCompleted: 32, phone: "0623456789", email: "pierre@example.com", status: "active" },
  { id: "3", name: "Marie Bernard", category: "Peintre", city: "Marseille", registeredAt: "05/03/2024", photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop", rating: 4.9, missionsCompleted: 67, phone: "0634567890", email: "marie@example.com", status: "active" },
  { id: "4", name: "Luc Petit", category: "Menuisier", city: "Bordeaux", registeredAt: "10/04/2024", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop", rating: 4.7, missionsCompleted: 28, phone: "0645678901", email: "luc@example.com", status: "suspended" },
  { id: "5", name: "Sophie Durant", category: "Carreleur", city: "Toulouse", registeredAt: "22/05/2024", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop", rating: 4.5, missionsCompleted: 19, phone: "0656789012", email: "sophie@example.com", status: "active" },
];

const categories = [
  "Tous", "Plombier", "Électricien", "Peintre", "Menuisier", "Carreleur", "Maçon", "Couvreur"
];

const cities = [
  "Toutes", "Paris", "Lyon", "Marseille", "Bordeaux", "Toulouse", "Nantes", "Lille"
];

const AdminArtisans = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [selectedCity, setSelectedCity] = useState("Toutes");
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [selectedArtisan, setSelectedArtisan] = useState<Artisan | null>(null);

  const filteredArtisans = artisans.filter((artisan) => {
    const matchesSearch = artisan.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Tous" || artisan.category === selectedCategory;
    const matchesCity = selectedCity === "Toutes" || artisan.city === selectedCity;
    return matchesSearch && matchesCategory && matchesCity;
  });

  const handleRevoke = (artisan: Artisan) => {
    setSelectedArtisan(artisan);
    setRevokeDialogOpen(true);
  };

  const confirmRevoke = () => {
    toast({
      title: "Artisan révoqué",
      description: `${selectedArtisan?.name} a été révoqué de la plateforme.`,
    });
    setRevokeDialogOpen(false);
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Gestion des Artisans</h1>
          <p className="text-muted-foreground mt-1">Gérez tous les artisans de la plateforme</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un artisan..."
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
                  {categories.map((cat) => (
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
              <Button variant="outline" onClick={() => { setSearchTerm(""); setSelectedCategory("Tous"); setSelectedCity("Toutes"); }}>
                Réinitialiser
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{artisans.length}</p>
              <p className="text-sm text-muted-foreground">Total artisans</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-500">{artisans.filter(a => a.status === "active").length}</p>
              <p className="text-sm text-muted-foreground">Actifs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-destructive">{artisans.filter(a => a.status === "suspended").length}</p>
              <p className="text-sm text-muted-foreground">Suspendus</p>
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
                    <th className="text-left p-4 font-medium">Stats</th>
                    <th className="text-left p-4 font-medium">Statut</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredArtisans.map((artisan) => (
                    <tr key={artisan.id} className="border-t border-border hover:bg-muted/30">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={artisan.photo} alt={artisan.name} className="w-10 h-10 rounded-full object-cover" />
                          <div>
                            <p className="font-medium text-foreground">{artisan.name}</p>
                            <p className="text-sm text-muted-foreground">{artisan.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary">{artisan.category}</Badge>
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
                          {artisan.registeredAt}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                            {artisan.rating}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Briefcase className="h-3 w-3" />
                            {artisan.missionsCompleted} missions
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={artisan.status === "active" ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"}>
                          {artisan.status === "active" ? "Actif" : "Suspendu"}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Link to={`/artisan/${artisan.id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link to="/admin/messagerie">
                            <Button size="sm" variant="outline">
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button size="sm" variant="outline" onClick={() => handleCall(artisan.phone)}>
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleRevoke(artisan)}>
                            <UserX className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Revoke Dialog */}
        <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Révoquer cet artisan ?</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir révoquer {selectedArtisan?.name} de la plateforme ? Cette action suspendra son compte.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setRevokeDialogOpen(false)}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={confirmRevoke}>
                Révoquer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminArtisans;
