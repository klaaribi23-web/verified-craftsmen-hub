import { useState } from "react";
import { AdminSidebar } from "@/components/admin-dashboard/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Mail,
  Send,
  Users,
  Search
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Artisan {
  id: string;
  name: string;
  email: string;
  category: string;
  photo: string;
}

const artisans: Artisan[] = [
  { id: "1", name: "Jean Dupont", email: "jean.dupont@email.com", category: "Plombier", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
  { id: "2", name: "Pierre Martin", email: "pierre.martin@email.com", category: "Électricien", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" },
  { id: "3", name: "Marie Bernard", email: "marie.bernard@email.com", category: "Peintre", photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" },
  { id: "4", name: "Luc Petit", email: "luc.petit@email.com", category: "Menuisier", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" },
  { id: "5", name: "Sophie Durant", email: "sophie.durant@email.com", category: "Carreleur", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
];

const AdminEmails = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArtisans, setSelectedArtisans] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sendToAll, setSendToAll] = useState(false);

  const filteredArtisans = artisans.filter((artisan) =>
    artisan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    artisan.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectArtisan = (artisanId: string) => {
    setSelectedArtisans((prev) =>
      prev.includes(artisanId)
        ? prev.filter((id) => id !== artisanId)
        : [...prev, artisanId]
    );
    setSendToAll(false);
  };

  const handleSelectAll = () => {
    if (sendToAll) {
      setSelectedArtisans([]);
      setSendToAll(false);
    } else {
      setSelectedArtisans(artisans.map((a) => a.id));
      setSendToAll(true);
    }
  };

  const handleSendEmail = () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir l'objet et le message.",
        variant: "destructive",
      });
      return;
    }

    if (selectedArtisans.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins un artisan.",
        variant: "destructive",
      });
      return;
    }

    // In real app, send email via backend
    toast({
      title: "Email envoyé",
      description: `Email envoyé à ${selectedArtisans.length} artisan(s).`,
    });

    // Reset form
    setSubject("");
    setMessage("");
    setSelectedArtisans([]);
    setSendToAll(false);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Envoyer des emails</h1>
          <p className="text-muted-foreground mt-1">Envoyez des emails aux artisans de la plateforme</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Artisans Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Sélectionner les destinataires
                </CardTitle>
                <Badge variant="secondary">
                  {selectedArtisans.length} sélectionné(s)
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un artisan..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Checkbox
                    id="selectAll"
                    checked={sendToAll}
                    onCheckedChange={handleSelectAll}
                  />
                  <label htmlFor="selectAll" className="text-sm font-medium cursor-pointer">
                    Envoyer à tous les artisans ({artisans.length})
                  </label>
                </div>

                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {filteredArtisans.map((artisan) => (
                      <div
                        key={artisan.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedArtisans.includes(artisan.id)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted"
                        }`}
                        onClick={() => handleSelectArtisan(artisan.id)}
                      >
                        <Checkbox
                          checked={selectedArtisans.includes(artisan.id)}
                          onCheckedChange={() => handleSelectArtisan(artisan.id)}
                        />
                        <img
                          src={artisan.photo}
                          alt={artisan.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">{artisan.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{artisan.email}</p>
                        </div>
                        <Badge variant="secondary">{artisan.category}</Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>

          {/* Email Composition */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Composer l'email
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Objet du mail
                  </label>
                  <Input
                    placeholder="Entrez l'objet du mail..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Message
                  </label>
                  <Textarea
                    placeholder="Écrivez votre message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[300px] resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    {selectedArtisans.length > 0
                      ? `${selectedArtisans.length} destinataire(s) sélectionné(s)`
                      : "Aucun destinataire sélectionné"}
                  </p>
                  <Button 
                    onClick={handleSendEmail}
                    disabled={selectedArtisans.length === 0 || !subject.trim() || !message.trim()}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Envoyer l'email
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminEmails;
