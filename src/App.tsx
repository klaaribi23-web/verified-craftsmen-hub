import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import TrouverArtisan from "./pages/TrouverArtisan";
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
import { ClientFavorites } from "./pages/client/ClientFavorites";
import { ClientMessaging } from "./pages/client/ClientMessaging";
import { ClientSettings } from "./pages/client/ClientSettings";

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
          <Route path="/demande-devis" element={<DemandeDevis />} />
          <Route path="/deposer-mission" element={<DemandeDevis />} />
          <Route path="/devenir-artisan" element={<DevenirArtisan />} />
          <Route path="/comment-ca-marche" element={<CommentCaMarche />} />
          <Route path="/connexion" element={<Connexion />} />
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
          <Route path="/client/favoris" element={<ClientFavorites />} />
          <Route path="/client/messagerie" element={<ClientMessaging />} />
          <Route path="/client/parametres" element={<ClientSettings />} />
          {/* Public Artisan Profile */}
          <Route path="/artisan/:id" element={<ArtisanPublicProfile />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;