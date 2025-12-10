import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ClientSidebar } from "@/components/client-dashboard/ClientSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  CheckCircle,
  Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/Navbar";

// Dummy mission data
const missionData = {
  id: 1,
  title: "Réparation fuite salle de bain",
  description: "Fuite sous le lavabo de la salle de bain principale. Besoin d'une intervention rapide.",
  category: "Plomberie",
  budget: 500,
  location: "Paris 15ème",
  date: "15 janvier 2024",
  status: "en_attente",
  applicants: [
    {
      id: 1,
      name: "Jean-Pierre Martin",
      photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      profession: "Plombier",
      rating: 4.8,
      reviews: 127,
      experience: "12 ans",
      message: "Bonjour, je suis disponible immédiatement pour intervenir. J'ai plus de 12 ans d'expérience en plomberie et je suis spécialisé dans les réparations de fuites. Je vous garantis un travail soigné et durable.",
      appliedDate: "16 janvier 2024",
      status: "pending"
    },
    {
      id: 2,
      name: "Marc Lefevre",
      photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      profession: "Plombier",
      rating: 4.6,
      reviews: 89,
      experience: "8 ans",
      message: "Bonjour ! Je peux passer dès demain matin pour diagnostiquer et réparer votre fuite. Devis gratuit sur place.",
      appliedDate: "16 janvier 2024",
      status: "pending"
    },
    {
      id: 3,
      name: "Sophie Bernard",
      photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
      profession: "Plombier",
      rating: 4.9,
      reviews: 156,
      experience: "15 ans",
      message: "Experte en plomberie depuis 15 ans, je vous propose une intervention rapide et efficace. Je suis équipée pour tous types de réparations.",
      appliedDate: "17 janvier 2024",
      status: "pending"
    },
  ]
};

export const ClientMissionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [applicants, setApplicants] = useState(missionData.applicants);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<typeof missionData.applicants[0] | null>(null);

  const handleDecline = (applicant: typeof missionData.applicants[0]) => {
    setSelectedApplicant(applicant);
    setDeclineDialogOpen(true);
  };

  const confirmDecline = () => {
    if (selectedApplicant) {
      setApplicants(prev => prev.map(a => 
        a.id === selectedApplicant.id ? { ...a, status: "declined" } : a
      ));
      toast({
        title: "Artisan décliné",
        description: `${selectedApplicant.name} a été informé qu'il n'a pas été retenu pour cette mission.`,
      });
    }
    setDeclineDialogOpen(false);
    setSelectedApplicant(null);
  };

  const handleContact = (applicant: typeof missionData.applicants[0]) => {
    toast({
      title: "Conversation ouverte",
      description: `Vous pouvez maintenant discuter avec ${applicant.name}`,
    });
    navigate("/client/messagerie");
  };

  const pendingApplicants = applicants.filter(a => a.status === "pending");
  const declinedApplicants = applicants.filter(a => a.status === "declined");

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-background pt-16 lg:pt-20">
        <ClientSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader 
          title="Détail de la mission" 
          subtitle="Consultez les candidatures reçues"
        />

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Back button */}
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux missions
            </Button>

            {/* Mission Summary */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{missionData.title}</CardTitle>
                    <p className="text-muted-foreground mt-1">{missionData.description}</p>
                  </div>
                  <Badge variant="secondary">{missionData.category}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center gap-1 text-gold font-semibold">
                    <Euro className="w-4 h-4" />
                    Budget : {missionData.budget} €
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {missionData.location}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {missionData.date}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    {applicants.length} candidature{applicants.length > 1 ? "s" : ""}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Applicants */}
            <div>
              <h2 className="text-lg font-semibold mb-4">
                Artisans ayant postulé ({pendingApplicants.length})
              </h2>
              
              <div className="space-y-4">
                {pendingApplicants.map((applicant) => (
                  <Card key={applicant.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Artisan info */}
                        <div className="flex items-start gap-4 flex-1">
                          <Avatar className="w-16 h-16">
                            <AvatarImage src={applicant.photo} alt={applicant.name} />
                            <AvatarFallback>{applicant.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold text-lg">{applicant.name}</h3>
                              <Badge variant="outline">{applicant.profession}</Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                              <span className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-gold fill-gold" />
                                {applicant.rating} ({applicant.reviews} avis)
                              </span>
                              <span>{applicant.experience} d'expérience</span>
                              <span>Postulé le {applicant.appliedDate}</span>
                            </div>
                            
                            <div className="bg-muted rounded-lg p-4">
                              <p className="text-sm text-foreground italic">
                                "{applicant.message}"
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex flex-col gap-2 lg:w-48">
                          <Link to={`/artisan/${applicant.id}`}>
                            <Button variant="outline" className="w-full">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Voir le profil
                            </Button>
                          </Link>
                          <Button 
                            variant="gold" 
                            className="w-full"
                            onClick={() => handleContact(applicant)}
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Contacter
                          </Button>
                          <Button 
                            variant="destructive" 
                            className="w-full"
                            onClick={() => handleDecline(applicant)}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Décliner
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {pendingApplicants.length === 0 && (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <p className="text-muted-foreground">Aucune candidature en attente</p>
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
                            <AvatarImage src={applicant.photo} alt={applicant.name} />
                            <AvatarFallback>{applicant.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium">{applicant.name}</p>
                            <p className="text-sm text-muted-foreground">{applicant.profession}</p>
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
          </div>
        </main>
      </div>

      {/* Decline Confirmation Dialog */}
      <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Décliner cet artisan ?</DialogTitle>
            <DialogDescription>
              {selectedApplicant?.name} sera informé qu'il n'a pas été retenu pour cette mission. Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmDecline}>
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
