import { useState } from "react";
import { AdminSidebar } from "@/components/admin-dashboard/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  RefreshCw,
  Clock,
  Users,
  UserCheck,
  Briefcase,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from "recharts";

const monthlyData = [
  { month: "Jan", artisans: 45, clients: 120, missions: 85 },
  { month: "Fév", artisans: 52, clients: 145, missions: 92 },
  { month: "Mar", artisans: 61, clients: 178, missions: 110 },
  { month: "Avr", artisans: 78, clients: 210, missions: 135 },
  { month: "Mai", artisans: 89, clients: 256, missions: 162 },
  { month: "Juin", artisans: 102, clients: 298, missions: 189 },
  { month: "Juil", artisans: 118, clients: 342, missions: 215 },
  { month: "Août", artisans: 125, clients: 378, missions: 238 },
  { month: "Sep", artisans: 138, clients: 412, missions: 267 },
  { month: "Oct", artisans: 152, clients: 458, missions: 298 },
  { month: "Nov", artisans: 168, clients: 502, missions: 332 },
  { month: "Déc", artisans: 185, clients: 548, missions: 365 },
];

const missionStats = [
  { month: "Jan", completed: 72, cancelled: 13 },
  { month: "Fév", completed: 78, cancelled: 14 },
  { month: "Mar", completed: 95, cancelled: 15 },
  { month: "Avr", completed: 118, cancelled: 17 },
  { month: "Mai", completed: 142, cancelled: 20 },
  { month: "Juin", completed: 165, cancelled: 24 },
  { month: "Juil", completed: 188, cancelled: 27 },
  { month: "Août", completed: 205, cancelled: 33 },
  { month: "Sep", completed: 232, cancelled: 35 },
  { month: "Oct", completed: 258, cancelled: 40 },
  { month: "Nov", completed: 285, cancelled: 47 },
  { month: "Déc", completed: 312, cancelled: 53 },
];

const AdminStatistics = () => {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [period, setPeriod] = useState("year");

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastUpdated(new Date());
      setIsRefreshing(false);
    }, 1000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  const totalArtisans = 1247;
  const totalClients = 3892;
  const totalMissions = 2456;
  const completedMissions = 2134;
  const cancelledMissions = 322;

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Statistiques</h1>
            <p className="text-muted-foreground mt-1">Analyse détaillée de votre plateforme</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Aujourd'hui</SelectItem>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
                <SelectItem value="year">Cette année</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Mis à jour à {formatTime(lastUpdated)}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalArtisans}</p>
                  <p className="text-xs text-muted-foreground">Artisans</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <UserCheck className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalClients}</p>
                  <p className="text-xs text-muted-foreground">Clients</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Briefcase className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalMissions}</p>
                  <p className="text-xs text-muted-foreground">Missions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{completedMissions}</p>
                  <p className="text-xs text-muted-foreground">Terminées</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{cancelledMissions}</p>
                  <p className="text-xs text-muted-foreground">Annulées</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Inscriptions Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Évolution des inscriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }} 
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="artisans" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Artisans"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="clients" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    name="Clients"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Missions Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-yellow-500" />
                Missions par mois
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={missionStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="completed" fill="#22c55e" name="Terminées" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cancelled" fill="hsl(var(--destructive))" name="Annulées" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Taux de conversion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary mb-2">86.9%</div>
              <p className="text-sm text-muted-foreground">Missions terminées avec succès</p>
              <div className="flex items-center gap-1 mt-2 text-green-500">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">+2.3% vs mois dernier</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Temps moyen de réponse</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary mb-2">2.4h</div>
              <p className="text-sm text-muted-foreground">Délai avant première candidature</p>
              <div className="flex items-center gap-1 mt-2 text-green-500">
                <TrendingDown className="h-4 w-4" />
                <span className="text-sm">-15min vs mois dernier</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Note moyenne artisans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary mb-2">4.7/5</div>
              <p className="text-sm text-muted-foreground">Basée sur 8,542 avis</p>
              <div className="flex items-center gap-1 mt-2 text-green-500">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">+0.1 vs mois dernier</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminStatistics;
