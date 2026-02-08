import { AdminSidebar } from "@/components/admin-dashboard/AdminSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/seo/SEOHead";
import Navbar from "@/components/layout/Navbar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, TrendingUp, Users, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const useProjectRequestStats = () => {
  return useQuery({
    queryKey: ["admin-project-request-stats"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

      // Total requests last 30 days
      const { count: totalLast30 } = await supabase
        .from("project_requests")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo.toISOString());

      // Previous 30 days for trend
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      const { count: totalPrev30 } = await supabase
        .from("project_requests")
        .select("*", { count: "exact", head: true })
        .gte("created_at", sixtyDaysAgo.toISOString())
        .lt("created_at", thirtyDaysAgo.toISOString());

      // Artisan ranking with request counts
      const { data: allRequests } = await supabase
        .from("project_requests")
        .select("artisan_id, created_at");

      const { data: requestsThisMonth } = await supabase
        .from("project_requests")
        .select("artisan_id")
        .gte("created_at", startOfMonth.toISOString());

      // Get all artisans with their info
      const { data: artisans } = await supabase
        .from("artisans")
        .select("id, business_name, city, department, subscription_tier, photo_url")
        .in("status", ["active", "prospect"]);

      // Build ranking
      const artisanRequestCounts: Record<string, number> = {};
      const artisanRequestsThisMonth: Record<string, number> = {};

      allRequests?.forEach((r) => {
        artisanRequestCounts[r.artisan_id] = (artisanRequestCounts[r.artisan_id] || 0) + 1;
      });

      requestsThisMonth?.forEach((r) => {
        artisanRequestsThisMonth[r.artisan_id] = (artisanRequestsThisMonth[r.artisan_id] || 0) + 1;
      });

      const ranking = artisans
        ?.map((a) => ({
          ...a,
          totalRequests: artisanRequestCounts[a.id] || 0,
          requestsThisMonth: artisanRequestsThisMonth[a.id] || 0,
          isPremium: a.subscription_tier && a.subscription_tier !== "free",
        }))
        .sort((a, b) => b.totalRequests - a.totalRequests) || [];

      // Last 10 requests
      const { data: recentRequests } = await supabase
        .from("project_requests")
        .select("id, client_name, client_city, created_at, artisan_id, project_description")
        .order("created_at", { ascending: false })
        .limit(10);

      // Map artisan names to recent requests
      const artisanMap: Record<string, string> = {};
      artisans?.forEach((a) => {
        artisanMap[a.id] = a.business_name;
      });

      const recentWithNames = recentRequests?.map((r) => ({
        ...r,
        artisan_name: artisanMap[r.artisan_id] || "Inconnu",
      })) || [];

      // Unique artisans contacted
      const uniqueArtisans = new Set(allRequests?.map((r) => r.artisan_id)).size;

      // Trend calculation
      const current = totalLast30 || 0;
      const previous = totalPrev30 || 0;
      const trendPercent = previous === 0
        ? current > 0 ? 100 : 0
        : Math.round(((current - previous) / previous) * 100);

      return {
        totalLast30: current,
        trendPercent,
        trendPositive: trendPercent >= 0,
        ranking,
        recentRequests: recentWithNames,
        uniqueArtisans,
        premiumWithRequests: ranking.filter((a) => a.isPremium && a.requestsThisMonth > 0).length,
        premiumTotal: ranking.filter((a) => a.isPremium).length,
      };
    },
  });
};

const AdminProjectStats = () => {
  const { data: stats, isLoading } = useProjectRequestStats();

  return (
    <>
      <SEOHead title="Demandes de projets" description="Statistiques des demandes" noIndex />
      <Navbar />
      <div className="flex min-h-screen bg-background pt-28 lg:pt-20">
        <AdminSidebar />
        <main className="flex-1">
          <DashboardHeader
            title="Demandes de projets"
            subtitle="Suivi des contacts re\u00e7us par vos artisans"
          />
          <div className="p-4 md:p-8 space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              <Card>
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Demandes (30j)</p>
                      <p className="text-3xl md:text-4xl font-bold mt-1">
                        {isLoading ? "..." : stats?.totalLast30}
                      </p>
                      {stats && (
                        <p className={`text-xs md:text-sm mt-1 font-medium ${stats.trendPositive ? "text-green-500" : "text-destructive"}`}>
                          {stats.trendPositive ? "+" : ""}{stats.trendPercent}% vs p\u00e9riode pr\u00e9c.
                        </p>
                      )}
                    </div>
                    <div className="p-3 rounded-xl bg-primary/10">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Artisans contact\u00e9s</p>
                      <p className="text-3xl md:text-4xl font-bold mt-1">
                        {isLoading ? "..." : stats?.uniqueArtisans}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-green-500/10">
                      <Users className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Packs actifs ce mois</p>
                      <p className="text-3xl md:text-4xl font-bold mt-1">
                        {isLoading ? "..." : `${stats?.premiumWithRequests}/${stats?.premiumTotal}`}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-yellow-500/10">
                      <CheckCircle className="h-6 w-6 text-yellow-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Moy. / artisan</p>
                      <p className="text-3xl md:text-4xl font-bold mt-1">
                        {isLoading || !stats?.uniqueArtisans ? "..." : (stats.totalLast30 / stats.uniqueArtisans).toFixed(1)}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-primary/10">
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              {/* Artisan Ranking */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base md:text-lg">Classement des artisans par contacts re\u00e7us</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="text-left p-3 font-medium text-muted-foreground">#</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">Artisan</th>
                          <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Ville</th>
                          <th className="text-center p-3 font-medium text-muted-foreground">Total</th>
                          <th className="text-center p-3 font-medium text-muted-foreground">Ce mois</th>
                          <th className="text-center p-3 font-medium text-muted-foreground">Pack</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoading ? (
                          <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Chargement...</td></tr>
                        ) : stats?.ranking.length === 0 ? (
                          <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Aucune donn\u00e9e</td></tr>
                        ) : (
                          stats?.ranking.slice(0, 20).map((artisan, i) => (
                            <tr key={artisan.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                              <td className="p-3 font-bold text-muted-foreground">{i + 1}</td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  {artisan.photo_url ? (
                                    <img src={artisan.photo_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                                  ) : (
                                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                      {artisan.business_name.charAt(0)}
                                    </div>
                                  )}
                                  <span className="font-medium truncate max-w-[140px] md:max-w-none">{artisan.business_name}</span>
                                </div>
                              </td>
                              <td className="p-3 text-muted-foreground hidden md:table-cell">
                                {artisan.city}{artisan.department ? ` (${artisan.department})` : ""}
                              </td>
                              <td className="p-3 text-center">
                                <span className="text-lg font-bold">{artisan.totalRequests}</span>
                              </td>
                              <td className="p-3 text-center">
                                <span className={`text-lg font-bold ${artisan.requestsThisMonth > 0 ? "text-green-500" : "text-muted-foreground"}`}>
                                  {artisan.requestsThisMonth}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                {artisan.isPremium ? (
                                  artisan.requestsThisMonth > 0 ? (
                                    <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-[10px] md:text-xs">
                                      Rentable
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-yellow-600 border-yellow-500/30 text-[10px] md:text-xs">
                                      En attente
                                    </Badge>
                                  )
                                ) : (
                                  <span className="text-xs text-muted-foreground">Gratuit</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Requests */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base md:text-lg">Derni\u00e8res demandes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isLoading ? (
                    <p className="text-muted-foreground text-sm">Chargement...</p>
                  ) : stats?.recentRequests.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Aucune demande</p>
                  ) : (
                    stats?.recentRequests.map((req) => (
                      <div key={req.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-2 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{req.artisan_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {req.client_name} \u00b7 <span className="font-semibold">{req.client_city}</span>
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {format(new Date(req.created_at), "d MMM yyyy '\u00e0' HH:mm", { locale: fr })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminProjectStats;
