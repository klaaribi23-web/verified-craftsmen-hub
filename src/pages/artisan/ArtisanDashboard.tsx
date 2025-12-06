import { ArtisanSidebar } from "@/components/artisan-dashboard/ArtisanSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { StatsCard } from "@/components/artisan-dashboard/StatsCard";
import { 
  Briefcase, 
  MessageSquare, 
  Star, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const recentRequests = [
  {
    id: 1,
    client: "Marie Martin",
    type: "Fuite d'eau",
    location: "Paris 15e",
    date: "Aujourd'hui",
    status: "new",
    urgent: true,
  },
  {
    id: 2,
    client: "Pierre Durand",
    type: "Installation chauffe-eau",
    location: "Paris 12e",
    date: "Hier",
    status: "pending",
    urgent: false,
  },
  {
    id: 3,
    client: "Sophie Bernard",
    type: "Débouchage canalisation",
    location: "Paris 11e",
    date: "Il y a 2 jours",
    status: "accepted",
    urgent: false,
  },
];

const upcomingJobs = [
  {
    id: 1,
    client: "Laurent Petit",
    type: "Rénovation salle de bain",
    date: "Demain, 9h00",
    address: "45 rue de la Paix, Paris 2e",
  },
  {
    id: 2,
    client: "Claire Moreau",
    type: "Remplacement robinetterie",
    date: "Jeudi, 14h00",
    address: "12 avenue Victor Hugo, Paris 16e",
  },
];

export const ArtisanDashboard = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <ArtisanSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader 
          title="Tableau de bord" 
          subtitle="Bienvenue, Jean ! Voici un aperçu de votre activité."
        />

        <main className="flex-1 p-6 overflow-auto">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Demandes reçues"
              value={12}
              icon={Briefcase}
              trend={{ value: 15, isPositive: true }}
            />
            <StatsCard
              title="Chantiers en cours"
              value={3}
              icon={Clock}
              variant="gold"
            />
            <StatsCard
              title="Chantiers terminés"
              value={47}
              icon={CheckCircle}
              variant="success"
              trend={{ value: 8, isPositive: true }}
            />
            <StatsCard
              title="Note moyenne"
              value="4.8"
              icon={Star}
              trend={{ value: 2, isPositive: true }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Requests */}
            <div className="bg-card rounded-xl border border-border shadow-soft">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Dernières demandes</h2>
                <Button variant="ghost" size="sm" className="text-accent hover:text-accent">
                  Voir tout <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <div className="divide-y divide-border">
                {recentRequests.map((request) => (
                  <div key={request.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{request.client}</span>
                          {request.urgent && (
                            <Badge variant="destructive" className="text-xs">Urgent</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{request.type}</p>
                      </div>
                      <Badge 
                        variant={
                          request.status === "new" ? "default" : 
                          request.status === "pending" ? "secondary" : 
                          "outline"
                        }
                        className={request.status === "new" ? "bg-accent text-accent-foreground" : ""}
                      >
                        {request.status === "new" ? "Nouveau" : 
                         request.status === "pending" ? "En attente" : 
                         "Accepté"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{request.location}</span>
                      <span className="text-muted-foreground">{request.date}</span>
                    </div>
                    {request.status === "new" && (
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="gold" className="flex-1">
                          <CheckCircle className="w-4 h-4 mr-1" /> Accepter
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <XCircle className="w-4 h-4 mr-1" /> Refuser
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Jobs */}
            <div className="bg-card rounded-xl border border-border shadow-soft">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Prochains chantiers</h2>
                <Button variant="ghost" size="sm" className="text-accent hover:text-accent">
                  Planning complet <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <div className="divide-y divide-border">
                {upcomingJobs.map((job) => (
                  <div key={job.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="font-medium text-foreground">{job.type}</span>
                        <p className="text-sm text-muted-foreground">{job.client}</p>
                      </div>
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                        {job.date}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {job.address}
                    </p>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-border">
                <Button variant="outline" className="w-full">
                  Gérer mon planning
                </Button>
              </div>
            </div>
          </div>

          {/* Performance Chart Placeholder */}
          <div className="mt-6 bg-card rounded-xl border border-border shadow-soft p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Performance mensuelle</h2>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">7 jours</Button>
                <Button variant="secondary" size="sm">30 jours</Button>
                <Button variant="ghost" size="sm">90 jours</Button>
              </div>
            </div>
            <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Graphique de performance</p>
                <p className="text-sm text-muted-foreground/70">Sera disponible avec les données réelles</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
