import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ClientSidebar } from "@/components/client-dashboard/ClientSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  ArrowLeft,
  MapPin,
  Calendar,
  Euro,
  Star,
  MessageSquare,
  X,
  ExternalLink,
  Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_AVATAR } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface MissionApplication {
  id: string;
  artisan_id: string;
  mission_id: string;
  motivation_message: string | null;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  artisan: {
    id: string;
    business_name: string;
    photo_url: string | null;
    rating: number | null;
    review_count: number | null;
    experience_years: number | null;
    slug: string | null;
    category: {
      name: string;
    } | null;
  } | null;
}

interface Mission {
  id: string;
  title: string;
  description: string | null;
  budget: number | null;
  city: string;
  created_at: string;
  status: string;
  category: {
    name: string;
  } | null;
}

export const ClientMissionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<MissionApplication | null>(null);

  // Fetch mission data
  const { data: mission, isLoading: missionLoading } = useQuery({
    queryKey: ['mission', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('missions')
        .select(`
          id,
          title,
          description,
          budget,
          city,
          created_at,
          status,
          category:categories(name)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Mission;
    },
    enabled: !!id,
  });

  // Fetch applications
  const { data: applications, isLoading: applicationsLoading } = useQuery({
    queryKey: ['mission-applications', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mission_applications')
        .select(`
          id,
          artisan_id,
          mission_id,
          motivation_message,
          status,
          created_at,
          artisan:artisans(
            id,
            business_name,
            photo_url,
            rating,
            review_count,
            experience_years,
            slug,
            category:categories(name)
          )
        `)
        .eq('mission_id', id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as MissionApplication[];
    },
    enabled: !!id,
  });

  // Decline mutation
  const declineMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      const { error } = await supabase
        .from('mission_applications')
        .update({ status: 'declined' })
        .eq('id', applicationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mission-applications', id] });
      toast({
        title: "Artisan décliné",
        description: `${selectedApplicant?.artisan?.business_name || "L'artisan"} a été informé qu'il n'a pas été retenu pour cette mission.`,
      });
      setDeclineDialogOpen(false);
      setSelectedApplicant(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de décliner cet artisan.",
        variant: "destructive",
      });
    },
  });

  const handleDecline = (applicant: MissionApplication) => {
    setSelectedApplicant(applicant);
    setDeclineDialogOpen(true);
  };

  const confirmDecline = () => {
    if (selectedApplicant) {
      declineMutation.mutate(selectedApplicant.id);
    }
  };

  const handleContact = (applicant: MissionApplication) => {
    toast({
      title: "Conversation ouverte",
      description: `Vous pouvez maintenant discuter avec ${applicant.artisan?.business_name || "l'artisan"}`,
    });
    navigate("/client/messagerie");
  };

  // Filter out applications where artisan is null (deleted artisans)
  const validApplications = applications?.filter(a => a.artisan !== null) || [];
  const pendingApplicants = validApplications.filter(a => a.status === "pending");
  const declinedApplicants = validApplications.filter(a => a.status === "declined");

  const isLoading = missionLoading || applicationsLoading;

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-background pt-28 lg:pt-20">
        <ClientSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader 
          title="Détail de la mission" 
          subtitle="Consultez les candidatures reçues"
        />

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
            {/* Back button */}
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2 sm:mb-4 -ml-2 text-sm">
              <ArrowLeft className="w-4 h-4 mr-1.5 sm:mr-2" />
              Retour
            </Button>

            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-28 sm:h-32 w-full" />
                <Skeleton className="h-40 sm:h-48 w-full" />
                <Skeleton className="h-40 sm:h-48 w-full" />
              </div>
            ) : !mission ? (
              <Card>
                <CardContent className="p-8 sm:p-12 text-center">
                  <p className="text-muted-foreground">Mission non trouvée</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Mission Summary */}
                <Card>
                  <CardHeader className="pb-3 sm:pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg sm:text-xl">{mission.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2 sm:line-clamp-none">{mission.description}</p>
                      </div>
                      {mission.category?.name && (
                        <Badge variant="secondary" className="w-fit text-xs">{mission.category.name}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
                      {mission.budget && (
                        <span className="flex items-center gap-1 text-gold font-semibold">
                          <Euro className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          {mission.budget} €
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        {mission.city}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        {format(new Date(mission.created_at), "d MMM yyyy", { locale: fr })}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        {applications?.length || 0} candidat{(applications?.length || 0) > 1 ? "s" : ""}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Applicants */}
                <div>
                  <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                    Artisans ayant postulé ({pendingApplicants.length})
                  </h2>
                  
                  <div className="space-y-3 sm:space-y-4">
                    {pendingApplicants.map((applicant) => (
                      <Card key={applicant.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex flex-col gap-4">
                            {/* Artisan info */}
                            <div className="flex items-start gap-3 sm:gap-4">
                              <Avatar className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0">
                                <AvatarImage src={applicant.artisan?.photo_url || DEFAULT_AVATAR} alt={applicant.artisan?.business_name || "Artisan"} />
                                <AvatarFallback>
                                  <img src={DEFAULT_AVATAR} alt="Avatar" className="w-full h-full object-cover" />
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                                  <h3 className="font-semibold text-sm sm:text-lg truncate">{applicant.artisan?.business_name || "Artisan inconnu"}</h3>
                                  {applicant.artisan?.category?.name && (
                                    <Badge variant="outline" className="w-fit text-xs">{applicant.artisan.category.name}</Badge>
                                  )}
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                                  <span className="flex items-center gap-1">
                                    <Star className="w-3 h-3 sm:w-4 sm:h-4 text-gold fill-gold" />
                                    {applicant.artisan?.rating?.toFixed(1) || "N/A"} ({applicant.artisan?.review_count || 0})
                                  </span>
                                  {applicant.artisan?.experience_years && (
                                    <span className="hidden sm:inline">{applicant.artisan.experience_years} ans d'exp.</span>
                                  )}
                                  <span className="hidden sm:inline">Postulé le {format(new Date(applicant.created_at), "d MMM yyyy", { locale: fr })}</span>
                                </div>
                                
                                {applicant.motivation_message && (
                                  <div className="bg-muted rounded-lg p-3 sm:p-4">
                                    <p className="text-xs sm:text-sm text-foreground italic line-clamp-3 sm:line-clamp-none">
                                      "{applicant.motivation_message}"
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Actions - Grid 3 cols on mobile */}
                            <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2">
                              <Link to={`/artisan/${applicant.artisan?.slug || applicant.artisan?.id || applicant.artisan_id}`} className="contents sm:block">
                                <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm h-9 sm:h-10">
                                  <ExternalLink className="w-3.5 h-3.5 sm:mr-2" />
                                  <span className="hidden sm:inline">Voir le profil</span>
                                </Button>
                              </Link>
                              <Button 
                                variant="gold" 
                                size="sm"
                                className="w-full text-xs sm:text-sm h-9 sm:h-10"
                                onClick={() => handleContact(applicant)}
                              >
                                <MessageSquare className="w-3.5 h-3.5 sm:mr-2" />
                                <span className="hidden sm:inline">Contacter</span>
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                className="w-full text-xs sm:text-sm h-9 sm:h-10"
                                onClick={() => handleDecline(applicant)}
                              >
                                <X className="w-3.5 h-3.5 sm:mr-2" />
                                <span className="hidden sm:inline">Décliner</span>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {pendingApplicants.length === 0 && (
                      <Card>
                        <CardContent className="p-8 sm:p-12 text-center">
                          <p className="text-sm text-muted-foreground">Aucune candidature en attente</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>

                {/* Declined applicants */}
                {declinedApplicants.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-4 text-muted-foreground">
                      Artisans déclinés ({declinedApplicants.length})
                    </h2>
                    
                    <div className="space-y-2">
                      {declinedApplicants.map((applicant) => (
                        <Card key={applicant.id} className="opacity-60">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={applicant.artisan?.photo_url || DEFAULT_AVATAR} alt={applicant.artisan?.business_name || "Artisan"} />
                                <AvatarFallback>
                                  <img src={DEFAULT_AVATAR} alt="Avatar" className="w-full h-full object-cover" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-medium">{applicant.artisan?.business_name || "Artisan inconnu"}</p>
                                <p className="text-sm text-muted-foreground">{applicant.artisan?.category?.name || "Artisan"}</p>
                              </div>
                              <Badge variant="secondary" className="bg-destructive/10 text-destructive">
                                Non retenu
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Decline Confirmation Dialog */}
      <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Décliner cet artisan ?</DialogTitle>
            <DialogDescription>
              {selectedApplicant?.artisan?.business_name || "L'artisan"} sera informé qu'il n'a pas été retenu pour cette mission. Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmDecline} disabled={declineMutation.isPending}>
              <X className="w-4 h-4 mr-2" />
              Confirmer le refus
            </Button>
          </DialogFooter>
        </DialogContent>
        </Dialog>
      </div>
    </>
  );
};
