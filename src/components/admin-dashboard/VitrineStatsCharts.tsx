import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MapPin, Tag, Calendar, ChevronDown, ChevronUp, BarChart3 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface CityStats {
  city: string;
  count: number;
}

interface CategoryStats {
  category_id: string;
  category_name: string;
  count: number;
}

interface MonthStats {
  month: string;
  count: number;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7c43",
];

export function VitrineStatsCharts() {
  const [showStats, setShowStats] = useState(false);

  // Fetch city distribution
  const { data: cityStats = [], isLoading: isLoadingCities } = useQuery({
    queryKey: ["vitrine-city-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artisans")
        .select("city")
        .eq("status", "prospect")
        .is("user_id", null);

      if (error) throw error;

      // Aggregate by city
      const cityMap: Record<string, number> = {};
      data?.forEach((item) => {
        const city = item.city || "Non renseigné";
        cityMap[city] = (cityMap[city] || 0) + 1;
      });

      // Convert to array and sort by count
      const stats: CityStats[] = Object.entries(cityMap)
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10 cities

      return stats;
    },
    enabled: showStats,
  });

  // Fetch category distribution
  const { data: categoryStats = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ["vitrine-category-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artisans")
        .select(`
          category_id,
          category:categories(name)
        `)
        .eq("status", "prospect")
        .is("user_id", null);

      if (error) throw error;

      // Aggregate by category
      const categoryMap: Record<string, { name: string; count: number }> = {};
      data?.forEach((item) => {
        const categoryId = item.category_id || "none";
        const categoryName = (item.category as any)?.name || "Non catégorisé";
        if (!categoryMap[categoryId]) {
          categoryMap[categoryId] = { name: categoryName, count: 0 };
        }
        categoryMap[categoryId].count++;
      });

      // Convert to array and sort by count
      const stats: CategoryStats[] = Object.entries(categoryMap)
        .map(([id, { name, count }]) => ({
          category_id: id,
          category_name: name,
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10 categories

      return stats;
    },
    enabled: showStats,
  });

  // Fetch monthly distribution
  const { data: monthStats = [], isLoading: isLoadingMonths } = useQuery({
    queryKey: ["vitrine-month-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artisans")
        .select("created_at")
        .eq("status", "prospect")
        .is("user_id", null);

      if (error) throw error;

      // Aggregate by month
      const monthMap: Record<string, number> = {};
      data?.forEach((item) => {
        const date = new Date(item.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        monthMap[monthKey] = (monthMap[monthKey] || 0) + 1;
      });

      // Convert to array and sort by date
      const stats: MonthStats[] = Object.entries(monthMap)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-12); // Last 12 months

      return stats;
    },
    enabled: showStats,
  });

  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
  };

  const isLoading = isLoadingCities || isLoadingCategories || isLoadingMonths;

  return (
    <div className="mb-4 md:mb-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowStats(!showStats)}
        className="mb-4 gap-2"
      >
        <BarChart3 className="h-4 w-4" />
        Statistiques détaillées
        {showStats ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {showStats && (
        <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Top Cities */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Top 10 Villes
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {cityStats.length > 0 ? (
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={cityStats} layout="vertical" margin={{ left: 0, right: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                          <XAxis type="number" fontSize={10} />
                          <YAxis 
                            type="category" 
                            dataKey="city" 
                            width={80} 
                            fontSize={10}
                            tickFormatter={(value) => value.length > 12 ? value.slice(0, 12) + "..." : value}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: "hsl(var(--popover))", 
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                              fontSize: "12px"
                            }}
                          />
                          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">Aucune donnée</p>
                  )}
                </CardContent>
              </Card>

              {/* Top Categories */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    Top 10 Catégories
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {categoryStats.length > 0 ? (
                    <div className="h-[250px] flex items-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryStats}
                            dataKey="count"
                            nameKey="category_name"
                            cx="50%"
                            cy="50%"
                            outerRadius={70}
                            innerRadius={40}
                            paddingAngle={2}
                          >
                            {categoryStats.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: "hsl(var(--popover))", 
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                              fontSize: "12px"
                            }}
                            formatter={(value, name) => [value, name]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">Aucune donnée</p>
                  )}
                  {/* Legend */}
                  <div className="flex flex-wrap gap-1.5 mt-2 max-h-[80px] overflow-y-auto">
                    {categoryStats.slice(0, 6).map((cat, index) => (
                      <Badge
                        key={cat.category_id}
                        variant="secondary"
                        className="text-xs gap-1"
                        style={{ borderLeftColor: COLORS[index % COLORS.length], borderLeftWidth: 3 }}
                      >
                        {cat.category_name.length > 15 
                          ? cat.category_name.slice(0, 15) + "..." 
                          : cat.category_name} ({cat.count})
                      </Badge>
                    ))}
                    {categoryStats.length > 6 && (
                      <Badge variant="outline" className="text-xs">
                        +{categoryStats.length - 6} autres
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Timeline */}
              <Card className="md:col-span-2 lg:col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Imports par mois
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {monthStats.length > 0 ? (
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthStats} margin={{ left: -20, right: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis 
                            dataKey="month" 
                            fontSize={10} 
                            tickFormatter={formatMonth}
                            angle={-45}
                            textAnchor="end"
                            height={50}
                          />
                          <YAxis fontSize={10} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: "hsl(var(--popover))", 
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                              fontSize: "12px"
                            }}
                            labelFormatter={(label) => formatMonth(label)}
                            formatter={(value) => [value, "Vitrines"]}
                          />
                          <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">Aucune donnée</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
