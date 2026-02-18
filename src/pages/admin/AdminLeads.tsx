import { AdminSidebar } from "@/components/admin-dashboard/AdminSidebar";
import { SEOHead } from "@/components/seo/SEOHead";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import Navbar from "@/components/layout/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Building2, Phone, Calendar, Leaf } from "lucide-react";
import LeadsParticuliersTab from "@/components/admin-dashboard/LeadsParticuliersTab";
import LeadsArtisansTab from "@/components/admin-dashboard/LeadsArtisansTab";
import LeadsExpertCallsTab from "@/components/admin-dashboard/LeadsExpertCallsTab";
import LeadsPendingArtisansTab from "@/components/admin-dashboard/LeadsPendingArtisansTab";

const AdminLeads = () => {
  const { data: leadsP = [] } = useQuery({
    queryKey: ["admin-leads-particuliers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads_particuliers").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: leadsA = [] } = useQuery({
    queryKey: ["admin-leads-artisans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads_artisans").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: expertCalls = [] } = useQuery({
    queryKey: ["admin-expert-calls"],
    queryFn: async () => {
      const { data, error } = await supabase.from("expert_calls").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: pendingArtisans = [] } = useQuery({
    queryKey: ["admin-pending-artisans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("partner_candidacies").select("*").eq("status", "pending").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      <SEOHead title="Leads Andrea" description="Leads qualifiés par Andrea" noIndex />
      <Navbar />
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1">
          <DashboardHeader title="Leads Andrea" subtitle="Contacts qualifiés par la Super-IA Experte" />
          <div className="p-4 md:p-8">
            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <Card>
                <CardContent className="pt-4 flex items-center gap-3">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{leadsP.length}</p>
                    <p className="text-xs text-muted-foreground">Travaux</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 flex items-center gap-3">
                  <Leaf className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{expertCalls.length}</p>
                    <p className="text-xs text-muted-foreground">Énergie</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 flex items-center gap-3">
                  <Building2 className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{leadsA.length}</p>
                    <p className="text-xs text-muted-foreground">Artisans</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 flex items-center gap-3">
                  <Phone className="h-8 w-8 text-amber-500" />
                  <div>
                    <p className="text-2xl font-bold">{pendingArtisans.length}</p>
                    <p className="text-xs text-muted-foreground">En attente</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 flex items-center gap-3">
                  <Calendar className="h-8 w-8 text-teal-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {leadsP.filter((l: any) => l.status === "nouveau").length + leadsA.filter((l: any) => l.status === "nouveau").length + expertCalls.filter((l: any) => l.status === "nouveau").length}
                    </p>
                    <p className="text-xs text-muted-foreground">Nouveaux</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="travaux">
              <TabsList className="mb-4 flex-wrap">
                <TabsTrigger value="travaux">Leads Travaux ({leadsP.length})</TabsTrigger>
                <TabsTrigger value="energie">Économies d'Énergie ({expertCalls.length})</TabsTrigger>
                <TabsTrigger value="artisans">Inscriptions Artisans ({leadsA.length})</TabsTrigger>
                <TabsTrigger value="pending">En attente ({pendingArtisans.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="travaux"><LeadsParticuliersTab data={leadsP} /></TabsContent>
              <TabsContent value="energie"><LeadsExpertCallsTab data={expertCalls} /></TabsContent>
              <TabsContent value="artisans"><LeadsArtisansTab data={leadsA} /></TabsContent>
              <TabsContent value="pending"><LeadsPendingArtisansTab data={pendingArtisans} /></TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminLeads;
