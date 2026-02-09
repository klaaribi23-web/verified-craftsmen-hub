import { useState } from "react";
import { AdminSidebar } from "@/components/admin-dashboard/AdminSidebar";
import { SEOHead } from "@/components/seo/SEOHead";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import Navbar from "@/components/layout/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Briefcase, Phone, Mail, MapPin, Calendar, Building2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const useLeadsParticuliers = () =>
  useQuery({
    queryKey: ["admin-leads-particuliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads_particuliers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

const useLeadsArtisans = () =>
  useQuery({
    queryKey: ["admin-leads-artisans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads_artisans")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    nouveau: "bg-blue-500/20 text-blue-400",
    contacte: "bg-amber-500/20 text-amber-400",
    converti: "bg-green-500/20 text-green-400",
    perdu: "bg-red-500/20 text-red-400",
  };
  return <Badge className={map[status] || "bg-muted text-muted-foreground"}>{status}</Badge>;
};

const formatDate = (d: string) => {
  try {
    return format(new Date(d), "dd MMM yyyy HH:mm", { locale: fr });
  } catch {
    return d;
  }
};

const AdminLeads = () => {
  const { data: leadsP = [], isLoading: loadingP } = useLeadsParticuliers();
  const { data: leadsA = [], isLoading: loadingA } = useLeadsArtisans();

  return (
    <>
      <SEOHead title="Leads Andrea" description="Leads qualifiés par Andrea" noIndex />
      <Navbar />
      <div className="flex min-h-screen bg-background pt-28 lg:pt-20">
        <AdminSidebar />
        <main className="flex-1">
          <DashboardHeader title="Leads Andrea" subtitle="Contacts qualifiés par l'assistant vocal" />
          <div className="p-4 md:p-8">
            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-4 flex items-center gap-3">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{leadsP.length}</p>
                    <p className="text-xs text-muted-foreground">Particuliers</p>
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
                  <Phone className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {leadsP.filter((l: any) => l.telephone).length + leadsA.filter((l: any) => l.telephone).length}
                    </p>
                    <p className="text-xs text-muted-foreground">Avec téléphone</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 flex items-center gap-3">
                  <Calendar className="h-8 w-8 text-amber-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {leadsP.filter((l: any) => l.status === "nouveau").length + leadsA.filter((l: any) => l.status === "nouveau").length}
                    </p>
                    <p className="text-xs text-muted-foreground">Nouveaux</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="particuliers">
              <TabsList className="mb-4">
                <TabsTrigger value="particuliers">
                  Projets Particuliers ({leadsP.length})
                </TabsTrigger>
                <TabsTrigger value="artisans">
                  Inscriptions Artisans ({leadsA.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="particuliers">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Particuliers avec projet</CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    {loadingP ? (
                      <p className="text-muted-foreground text-sm py-8 text-center">Chargement...</p>
                    ) : leadsP.length === 0 ? (
                      <p className="text-muted-foreground text-sm py-8 text-center">Aucun lead particulier pour l'instant</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Nom</TableHead>
                            <TableHead>Téléphone</TableHead>
                            <TableHead>Ville</TableHead>
                            <TableHead>Type de projet</TableHead>
                            <TableHead>Budget</TableHead>
                            <TableHead>Statut</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {leadsP.map((lead: any) => (
                            <TableRow key={lead.id}>
                              <TableCell className="text-xs whitespace-nowrap">{formatDate(lead.created_at)}</TableCell>
                              <TableCell className="font-medium">{[lead.prenom, lead.nom].filter(Boolean).join(" ") || "—"}</TableCell>
                              <TableCell>
                                {lead.telephone ? (
                                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.telephone}</span>
                                ) : "—"}
                              </TableCell>
                              <TableCell>
                                {lead.ville ? (
                                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{lead.ville}</span>
                                ) : "—"}
                              </TableCell>
                              <TableCell>{lead.type_projet || "—"}</TableCell>
                              <TableCell>{lead.budget_estime || "—"}</TableCell>
                              <TableCell>{statusBadge(lead.status)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="artisans">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Artisans intéressés</CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    {loadingA ? (
                      <p className="text-muted-foreground text-sm py-8 text-center">Chargement...</p>
                    ) : leadsA.length === 0 ? (
                      <p className="text-muted-foreground text-sm py-8 text-center">Aucun lead artisan pour l'instant</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Société</TableHead>
                            <TableHead>Nom</TableHead>
                            <TableHead>Téléphone</TableHead>
                            <TableHead>Ville</TableHead>
                            <TableHead>Métier</TableHead>
                            <TableHead>Années</TableHead>
                            <TableHead>Statut</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {leadsA.map((lead: any) => (
                            <TableRow key={lead.id}>
                              <TableCell className="text-xs whitespace-nowrap">{formatDate(lead.created_at)}</TableCell>
                              <TableCell className="font-medium">{lead.societe || "—"}</TableCell>
                              <TableCell>{[lead.prenom, lead.nom].filter(Boolean).join(" ") || "—"}</TableCell>
                              <TableCell>
                                {lead.telephone ? (
                                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.telephone}</span>
                                ) : "—"}
                              </TableCell>
                              <TableCell>
                                {lead.ville ? (
                                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{lead.ville}</span>
                                ) : "—"}
                              </TableCell>
                              <TableCell>{lead.metier || "—"}</TableCell>
                              <TableCell>{lead.annees_existence ?? "—"}</TableCell>
                              <TableCell>{statusBadge(lead.status)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminLeads;
