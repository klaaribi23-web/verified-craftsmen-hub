import { ClientSidebar } from "@/components/client-dashboard/ClientSidebar";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  FolderOpen,
  MessageSquare,
  Heart,
  FileText,
  Plus,
  ArrowRight,
  Shield,
  Clock,
} from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { DemoMessaging } from "@/components/demo/DemoMessaging";
import { DemoProjectShowcase } from "@/components/demo/DemoProjectShowcase";

const demoStats = {
  projects: 3,
  messages: 5,
  quotes: 2,
  favorites: 8,
};

const demoMessages = [
  {
    id: "1",
    artisan: "Durand Plomberie",
    message: "Bonjour, je vous confirme la date d'intervention pour le 06/78/XX/XX...",
    time: "Il y a 2h",
    unread: true,
  },
  {
    id: "2",
    artisan: "Martin Électricité",
    message: "Le devis a bien été mis à jour avec les modifications demandées.",
    time: "Hier",
    unread: false,
  },
  {
    id: "3",
    artisan: "Bernard Peinture",
    message: "Les travaux de peinture sont terminés. Contactez-moi au 06/XX/XX/XX pour...",
    time: "Il y a 3 jours",
    unread: false,
  },
];

// Mask phone/email in messages
const maskContactInfo = (text: string) => {
  return text
    .replace(/\b0[1-9][\s./]?\d{2}[\s./]?\d{2}[\s./]?\d{2}[\s./]?\d{2}\b/g, "📞 •••• •• •• ••")
    .replace(/[\w.-]+@[\w.-]+\.\w+/g, "📧 ••••@••••.••");
};

export const ClientDashboardNew = () => {
  const { user } = useAuth();
  const demoMode = !user;

  return (
    <>
      <SEOHead
        title="Mon Espace - Tableau de bord"
        description="Gérez vos projets et artisans favoris sur Artisans Validés"
        noIndex={true}
      />
      <Navbar />
        <div className="flex min-h-screen bg-background pt-28 lg:pt-20">
        <ClientSidebar />

        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-card/80 border-b border-primary/20 px-4 md:px-8 py-6">
            <h1 className="text-2xl font-bold text-foreground">
              Bienvenue{demoMode ? ", Marie" : ""} 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Suivez vos projets et échangez avec vos artisans en toute sérénité.
            </p>
          </div>

          <main className="flex-1 p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-6">

              {/* Projet Témoin */}
              <DemoProjectShowcase />

              {/* New Project CTA */}
              <Card className="border border-dashed border-primary/30 hover:shadow-gold transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Plus className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Lancer un nouveau projet</h3>
                        <p className="text-sm text-muted-foreground">
                          Décrivez vos travaux et recevez des devis d'artisans qualifiés
                        </p>
                      </div>
                    </div>
                    <Link to="/demande-devis" className="w-full sm:w-auto">
                      <Button className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white shadow-sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Nouveau projet
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: FolderOpen, label: "Projets", value: demoStats.projects, color: "text-teal-600 bg-teal-100" },
                  { icon: MessageSquare, label: "Messages", value: demoStats.messages, color: "text-sky-600 bg-sky-100" },
                  { icon: FileText, label: "Devis reçus", value: demoStats.quotes, color: "text-amber-600 bg-amber-100" },
                  { icon: Heart, label: "Favoris", value: demoStats.favorites, color: "text-rose-500 bg-rose-100" },
                ].map((stat) => (
                  <Card key={stat.label}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${stat.color}`}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xl font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Messagerie Démo - Simulation de mise en relation */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-teal-600" />
                  Messagerie — Rénovation Salle de Bain
                </h3>
                <DemoMessaging viewAs="client" />
              </div>

            </div>
          </main>
        </div>
      </div>
    </>
  );
};
