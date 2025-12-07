import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import TrouverArtisan from "./pages/TrouverArtisan";
import NosMissions from "./pages/NosMissions";
import DemandeDevis from "./pages/DemandeDevis";
import DevenirArtisan from "./pages/DevenirArtisan";
import CommentCaMarche from "./pages/CommentCaMarche";
import Connexion from "./pages/Connexion";
import NotFound from "./pages/NotFound";
import { ArtisanDashboard } from "./pages/artisan/ArtisanDashboard";
import { ArtisanProfile } from "./pages/artisan/ArtisanProfile";
import { ArtisanDocuments } from "./pages/artisan/ArtisanDocuments";
import { ArtisanServices } from "./pages/artisan/ArtisanServices";
import { ArtisanRequests } from "./pages/artisan/ArtisanRequests";
import { ArtisanMessaging } from "./pages/artisan/ArtisanMessaging";
import { ArtisanPlanning } from "./pages/artisan/ArtisanPlanning";
import { ArtisanSettings } from "./pages/artisan/ArtisanSettings";
import { ArtisanPartnerOffers } from "./pages/artisan/ArtisanPartnerOffers";
import ArtisanPublicProfile from "./pages/ArtisanPublicProfile";
import { ClientDashboard } from "./pages/client/ClientDashboard";
import { ClientMissions } from "./pages/client/ClientMissions";
import { ClientMissionDetail } from "./pages/client/ClientMissionDetail";
import { ClientFavorites } from "./pages/client/ClientFavorites";
import { ClientMessaging } from "./pages/client/ClientMessaging";
import { ClientSettings } from "./pages/client/ClientSettings";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminArtisans from "./pages/admin/AdminArtisans";
import AdminClients from "./pages/admin/AdminClients";
import AdminStatistics from "./pages/admin/AdminStatistics";
import AdminMessaging from "./pages/admin/AdminMessaging";
import AdminEmails from "./pages/admin/AdminEmails";
import AdminAddArtisan from "./pages/admin/AdminAddArtisan";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/trouver-artisan" element={<TrouverArtisan />} />
          <Route path="/nos-missions" element={<NosMissions />} />
          <Route path="/demande-devis" element={<DemandeDevis />} />
          <Route path="/deposer-mission" element={<DemandeDevis />} />
          <Route path="/devenir-artisan" element={<DevenirArtisan />} />
          <Route path="/comment-ca-marche" element={<CommentCaMarche />} />
          <Route path="/connexion" element={<Connexion />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          {/* Artisan Dashboard Routes */}
          <Route path="/artisan/dashboard" element={<ArtisanDashboard />} />
          <Route path="/artisan/profil" element={<ArtisanProfile />} />
          <Route path="/artisan/documents" element={<ArtisanDocuments />} />
          <Route path="/artisan/prestations" element={<ArtisanServices />} />
          <Route path="/artisan/demandes" element={<ArtisanRequests />} />
          <Route path="/artisan/messagerie" element={<ArtisanMessaging />} />
          <Route path="/artisan/planning" element={<ArtisanPlanning />} />
          <Route path="/artisan/offres-partenaires" element={<ArtisanPartnerOffers />} />
          <Route path="/artisan/parametres" element={<ArtisanSettings />} />
          {/* Client Dashboard Routes */}
          <Route path="/client/dashboard" element={<ClientDashboard />} />
          <Route path="/client/missions" element={<ClientMissions />} />
          <Route path="/client/missions/:id" element={<ClientMissionDetail />} />
          <Route path="/client/favoris" element={<ClientFavorites />} />
          <Route path="/client/messagerie" element={<ClientMessaging />} />
          <Route path="/client/parametres" element={<ClientSettings />} />
          {/* Public Artisan Profile */}
          <Route path="/artisan/:id" element={<ArtisanPublicProfile />} />
          {/* Admin Dashboard Routes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/artisans" element={<AdminArtisans />} />
          <Route path="/admin/clients" element={<AdminClients />} />
          <Route path="/admin/statistiques" element={<AdminStatistics />} />
          <Route path="/admin/messagerie" element={<AdminMessaging />} />
          <Route path="/admin/emails" element={<AdminEmails />} />
          <Route path="/admin/ajouter-artisan" element={<AdminAddArtisan />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;