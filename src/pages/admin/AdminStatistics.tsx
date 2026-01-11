import { useState, useEffect } from "react";
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
  CheckCircle,
  XCircle,
  Star,
  FileText
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
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/layout/Navbar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";

// Hook for real dynamic stats
const useRealAdminStats = () => {
  return useQuery({
    queryKey: ["admin-real-stats"],
    queryFn: async () => {
      // Get artisans count
      const { count: artisansCount } = await supabase
        .from("artisans")
        .select("*", { count: "exact", head: true });

      // Get active artisans count
      const { count: activeArtisansCount } = await supabase
        .from("artisans")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Get verified artisans count
      const { count: verifiedArtisansCount } = await supabase
        .from("artisans")
        .select("*", { count: "exact", head: true })
        .eq("is_verified", true);

      // Get profiles count (clients)
      const { count: clientsCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Get missions counts by status
      const { data: missions } = await supabase
        .from("missions")
        .select("status, created_at");

      const activeMissions = missions?.filter((m) => m.status === "pending" || m.status === "assigned").length || 0;
      const completedMissions = missions?.filter((m) => m.status === "completed").length || 0;
      const cancelledMissions = missions?.filter((m) => m.status === "cancelled").length || 0;

      // Get quotes count
      const { count: quotesCount } = await supabase
        .from("quotes")
        .select("*", { count: "exact", head: true });

      // Get accepted quotes
      const { count: acceptedQuotesCount } = await supabase
        .from("quotes")
        .select("*", { count: "exact", head: true })
        .eq("status", "accepted");

      // Get reviews stats
      const { data: reviews } = await supabase
        .from("reviews")
        .select("rating");

      const totalReviews = reviews?.length || 0;
      const avgRating = totalReviews > 0 
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
        : "N/A";

      // Get artisans for rating calculation
      const { data: artisans } = await supabase
        .from("artisans")
        .select("rating, review_count, missions_completed")
        .eq("status", "active");

      const totalMissionsCompleted = artisans?.reduce((acc, a) => acc + (a.missions_completed || 0), 0) || 0;

      return {
        totalArtisans: artisansCount || 0,
        activeArtisans: activeArtisansCount || 0,
        verifiedArtisans: verifiedArtisansCount || 0,
        totalClients: clientsCount || 0,
        activeMissions,
        completedMissions,
        cancelledMissions,
        totalMissions: missions?.length || 0,
        totalQuotes: quotesCount || 0,
        acceptedQuotes: acceptedQuotesCount || 0,
        totalReviews,
        avgRating,
        totalMissionsCompleted,
      };
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });
};

// Hook for monthly trends (real data aggregated by month)
const useMonthlyTrends = () => {
  return useQuery({
    queryKey: ["admin-monthly-trends"],
    queryFn: async () => {
      const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
      const currentYear = new Date().getFullYear();
      
      // Get artisans by month
      const { data: artisans } = await supabase
        .from("artisans")
        .select("created_at");

      // Get clients by month
      const { data: profiles } = await supabase
        .from("profiles")
        .select("created_at");

      // Get missions by month
      const { data: missions } = await supabase
        .from("missions")
        .select("created_at, status");

      const monthlyData = months.map((month, index) => {
        const monthStart = new Date(currentYear, index, 1);
        const monthEnd = new Date(currentYear, index + 1, 0);

        const artisansInMonth = artisans?.filter(a => {
          const date = new Date(a.created_at);
          return date >= monthStart && date <= monthEnd;
        }).length || 0;

        const clientsInMonth = profiles?.filter(p => {
          const date = new Date(p.created_at);
          return date >= monthStart && date <= monthEnd;
        }).length || 0;

        const missionsInMonth = missions?.filter(m => {
          const date = new Date(m.created_at);
          return date >= monthStart && date <= monthEnd;
        }).length || 0;

        return {
          month,
          artisans: artisansInMonth,
          clients: clientsInMonth,
          missions: missionsInMonth,
        };
      });

      const missionStats = months.map((month, index) => {
        const monthStart = new Date(currentYear, index, 1);
        const monthEnd = new Date(currentYear, index + 1, 0);

        const completed = missions?.filter(m => {
          const date = new Date(m.created_at);
          return date >= monthStart && date <= monthEnd && m.status === "completed";
        }).length || 0;

        const cancelled = missions?.filter(m => {
          const date = new Date(m.created_at);
          return date >= monthStart && date <= monthEnd && m.status === "cancelled";
        }).length || 0;

        return { month, completed, cancelled };
      });

      return { monthlyData, missionStats };
    },
    refetchInterval: 60000, // Refresh every minute
  });
};

const AdminStatistics = () => {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [period, setPeriod] = useState("year");
  const queryClient = useQueryClient();

  const { data: stats, isLoading } = useRealAdminStats();
  const { data: trends } = useMonthlyTrends();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["admin-real-stats"] });
    await queryClient.invalidateQueries({ queryKey: ["admin-monthly-trends"] });
    setLastUpdated(new Date());
    setIsRefreshing(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  // Calculate conversion rate
  const conversionRate = stats && stats.totalMissions > 0 
    ? ((stats.completedMissions / stats.totalMissions) * 100).toFixed(1)
    : "0";

  const quoteConversionRate = stats && stats.totalQuotes > 0
    ? ((stats.acceptedQuotes / stats.totalQuotes) * 100).toFixed(1)
    : "0";

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-background pt-28 lg:pt-20">
        <AdminSidebar />
      
        <main className="flex-1">
          <DashboardHeader 
            title="Statistiques en temps réel" 
            subtitle="Données dynamiques de votre plateforme" 
          />

          <div className="p-4 md:p-8">
            {/* Actions Row */}
            <div className="flex flex-wrap items-center justify-end gap-2 md:gap-4 mb-6">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-32 md:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Aujourd'hui</SelectItem>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                  <SelectItem value="year">Cette année</SelectItem>
                </SelectContent>
              </Select>
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
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
                <span className="hidden sm:inline">Actualiser</span>
              </Button>
            </div>

          {/* Main Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4 mb-6 md:mb-8">
            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 rounded-lg bg-primary/10">
                    <Users className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg md:text-2xl font-bold text-foreground truncate">
                      {isLoading ? "..." : stats?.totalArtisans || 0}
                    </p>
                    <p className="text-[10px] md:text-xs text-muted-foreground truncate">Artisans</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 rounded-lg bg-green-500/10">
                    <UserCheck className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg md:text-2xl font-bold text-foreground truncate">
                      {isLoading ? "..." : stats?.totalClients || 0}
                    </p>
                    <p className="text-[10px] md:text-xs text-muted-foreground truncate">Clients</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 rounded-lg bg-yellow-500/10">
                    <Briefcase className="h-4 w-4 md:h-5 md:w-5 text-yellow-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg md:text-2xl font-bold text-foreground truncate">
                      {isLoading ? "..." : stats?.totalMissions || 0}
                    </p>
                    <p className="text-[10px] md:text-xs text-muted-foreground truncate">Missions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 rounded-lg bg-green-500/10">
                    <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg md:text-2xl font-bold text-foreground truncate">
                      {isLoading ? "..." : stats?.completedMissions || 0}
                    </p>
                    <p className="text-[10px] md:text-xs text-muted-foreground truncate">Terminées</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 rounded-lg bg-destructive/10">
                    <XCircle className="h-4 w-4 md:h-5 md:w-5 text-destructive" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg md:text-2xl font-bold text-foreground truncate">
                      {isLoading ? "..." : stats?.cancelledMissions || 0}
                    </p>
                    <p className="text-[10px] md:text-xs text-muted-foreground truncate">Annulées</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 rounded-lg bg-blue-500/10">
                    <FileText className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg md:text-2xl font-bold text-foreground truncate">
                      {isLoading ? "..." : stats?.totalQuotes || 0}
                    </p>
                    <p className="text-[10px] md:text-xs text-muted-foreground truncate">Devis</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
            {/* Inscriptions Chart */}
            <Card>
              <CardHeader className="pb-2 md:pb-4">
                <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                  <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  <span className="truncate">Inscriptions ({new Date().getFullYear()})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 md:p-6">
                <ResponsiveContainer width="100%" height={200} className="md:!h-[300px]">
                  <LineChart data={trends?.monthlyData || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                    <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} width={30} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px"
                      }} 
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
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
              <CardHeader className="pb-2 md:pb-4">
                <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                  <Briefcase className="h-4 w-4 md:h-5 md:w-5 text-yellow-500" />
                  <span className="truncate">Missions ({new Date().getFullYear()})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 md:p-6">
                <ResponsiveContainer width="100%" height={200} className="md:!h-[300px]">
                  <BarChart data={trends?.missionStats || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                    <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} width={30} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px"
                      }} 
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Bar dataKey="completed" fill="#22c55e" name="Terminées" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cancelled" fill="hsl(var(--destructive))" name="Annulées" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mt-6 md:mt-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm md:text-lg truncate">Conversion missions</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl md:text-4xl font-bold text-primary mb-1 md:mb-2">{conversionRate}%</div>
                <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">Missions terminées</p>
                <div className="flex items-center gap-1 mt-1 md:mt-2 text-green-500">
                  <TrendingUp className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="text-xs md:text-sm">Temps réel</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm md:text-lg truncate">Conversion devis</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl md:text-4xl font-bold text-primary mb-1 md:mb-2">{quoteConversionRate}%</div>
                <p className="text-xs md:text-sm text-muted-foreground">Devis acceptés</p>
                <div className="flex items-center gap-1 mt-1 md:mt-2 text-green-500">
                  <TrendingUp className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="text-xs md:text-sm">{stats?.acceptedQuotes || 0}/{stats?.totalQuotes || 0}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm md:text-lg truncate">Artisans actifs</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl md:text-4xl font-bold text-primary mb-1 md:mb-2">
                  {isLoading ? "..." : stats?.activeArtisans || 0}
                </div>
                <p className="text-xs md:text-sm text-muted-foreground">Sur la plateforme</p>
                <div className="flex items-center gap-1 mt-1 md:mt-2 text-green-500">
                  <TrendingUp className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="text-xs md:text-sm">{stats?.verifiedArtisans || 0} vérifiés</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm md:text-lg flex items-center gap-1">
                  <Star className="h-4 w-4 md:h-5 md:w-5 text-yellow-500" />
                  <span className="truncate">Note moyenne</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl md:text-4xl font-bold text-primary mb-1 md:mb-2">{stats?.avgRating || "N/A"}/5</div>
                <p className="text-xs md:text-sm text-muted-foreground">{stats?.totalReviews?.toLocaleString() || 0} avis</p>
                <div className="flex items-center gap-1 mt-1 md:mt-2 text-green-500">
                  <TrendingUp className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="text-xs md:text-sm">Temps réel</span>
                </div>
              </CardContent>
            </Card>
          </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminStatistics;