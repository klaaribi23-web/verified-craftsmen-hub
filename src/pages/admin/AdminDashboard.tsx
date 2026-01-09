import { useState } from "react";
import { AdminSidebar } from "@/components/admin-dashboard/AdminSidebar";
import { SEOHead } from "@/components/seo/SEOHead";
import { AdminStatsCard } from "@/components/admin-dashboard/AdminStatsCard";
import { AdminNotifications } from "@/components/admin-dashboard/AdminNotifications";
import { NewArtisansList } from "@/components/admin-dashboard/NewArtisansList";
import { TopArtisansList } from "@/components/admin-dashboard/TopArtisansList";
import { GeocodeMissingArtisans } from "@/components/admin-dashboard/GeocodeMissingArtisans";
import { Button } from "@/components/ui/button";
import { useAdminStats } from "@/hooks/useAdminData";
import { 
  Users, 
  UserCheck, 
  Briefcase, 
  TrendingUp,
  RefreshCw,
  Clock
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/layout/Navbar";

const AdminDashboard = () => {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();
  
  const { data: stats, isLoading } = useAdminStats();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    await queryClient.invalidateQueries({ queryKey: ["new-artisans"] });
    await queryClient.invalidateQueries({ queryKey: ["top-artisans"] });
    setLastUpdated(new Date());
    setIsRefreshing(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      <SEOHead 
        title="Administration" 
        description="Panneau d'administration Artisans Validés"
        noIndex={true}
      />
      <Navbar />
      <div className="flex min-h-screen bg-background pt-16 lg:pt-20">
        <AdminSidebar />
        
        <main className="flex-1 p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Tableau de bord</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">Bienvenue sur votre espace administrateur</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 md:gap-4">
            <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Mis à jour</span> {formatTime(lastUpdated)}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-full sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
          <AdminStatsCard
            title="Total Artisans"
            value={isLoading ? 0 : stats?.totalArtisans || 0}
            icon={Users}
            trend={{ value: 12, isPositive: true }}
            color="primary"
          />
          <AdminStatsCard
            title="Total Clients"
            value={isLoading ? 0 : stats?.totalClients || 0}
            icon={UserCheck}
            trend={{ value: 8, isPositive: true }}
            color="success"
          />
          <AdminStatsCard
            title="Missions actives"
            value={isLoading ? 0 : stats?.activeMissions || 0}
            icon={Briefcase}
            trend={{ value: 15, isPositive: true }}
            color="warning"
          />
          <AdminStatsCard
            title="Terminées"
            value={isLoading ? 0 : stats?.completedMissions || 0}
            icon={TrendingUp}
            trend={{ value: 23, isPositive: true }}
            color="primary"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          {/* Left Column - Notifications & New Artisans */}
          <div className="lg:col-span-2 space-y-4 md:space-y-8">
            <NewArtisansList />
            <TopArtisansList />
          </div>

          {/* Right Column - Notifications & Tools */}
          <div className="space-y-4 md:space-y-6">
            <AdminNotifications />
            <GeocodeMissingArtisans onComplete={handleRefresh} />
          </div>
        </div>
      </main>
      </div>
    </>
  );
};

export default AdminDashboard;
