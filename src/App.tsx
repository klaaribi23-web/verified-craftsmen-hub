import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
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
          {/* Public Routes */}
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
          <Route path="/artisan/:id" element={<ArtisanPublicProfile />} />
          
          {/* Protected Artisan Routes */}
          <Route path="/artisan/dashboard" element={
            <ProtectedRoute allowedRoles={["artisan"]}>
              <ArtisanDashboard />
            </ProtectedRoute>
          } />
          <Route path="/artisan/profil" element={
            <ProtectedRoute allowedRoles={["artisan"]}>
              <ArtisanProfile />
            </ProtectedRoute>
          } />
          <Route path="/artisan/documents" element={
            <ProtectedRoute allowedRoles={["artisan"]}>
              <ArtisanDocuments />
            </ProtectedRoute>
          } />
          <Route path="/artisan/prestations" element={
            <ProtectedRoute allowedRoles={["artisan"]}>
              <ArtisanServices />
            </ProtectedRoute>
          } />
          <Route path="/artisan/demandes" element={
            <ProtectedRoute allowedRoles={["artisan"]}>
              <ArtisanRequests />
            </ProtectedRoute>
          } />
          <Route path="/artisan/messagerie" element={
            <ProtectedRoute allowedRoles={["artisan"]}>
              <ArtisanMessaging />
            </ProtectedRoute>
          } />
          <Route path="/artisan/planning" element={
            <ProtectedRoute allowedRoles={["artisan"]}>
              <ArtisanPlanning />
            </ProtectedRoute>
          } />
          <Route path="/artisan/offres-partenaires" element={
            <ProtectedRoute allowedRoles={["artisan"]}>
              <ArtisanPartnerOffers />
            </ProtectedRoute>
          } />
          <Route path="/artisan/parametres" element={
            <ProtectedRoute allowedRoles={["artisan"]}>
              <ArtisanSettings />
            </ProtectedRoute>
          } />
          
          {/* Protected Client Routes */}
          <Route path="/client/dashboard" element={
            <ProtectedRoute allowedRoles={["client"]}>
              <ClientDashboard />
            </ProtectedRoute>
          } />
          <Route path="/client/missions" element={
            <ProtectedRoute allowedRoles={["client"]}>
              <ClientMissions />
            </ProtectedRoute>
          } />
          <Route path="/client/missions/:id" element={
            <ProtectedRoute allowedRoles={["client"]}>
              <ClientMissionDetail />
            </ProtectedRoute>
          } />
          <Route path="/client/favoris" element={
            <ProtectedRoute allowedRoles={["client"]}>
              <ClientFavorites />
            </ProtectedRoute>
          } />
          <Route path="/client/messagerie" element={
            <ProtectedRoute allowedRoles={["client"]}>
              <ClientMessaging />
            </ProtectedRoute>
          } />
          <Route path="/client/parametres" element={
            <ProtectedRoute allowedRoles={["client"]}>
              <ClientSettings />
            </ProtectedRoute>
          } />
          
          {/* Protected Admin Routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/artisans" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminArtisans />
            </ProtectedRoute>
          } />
          <Route path="/admin/clients" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminClients />
            </ProtectedRoute>
          } />
          <Route path="/admin/statistiques" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminStatistics />
            </ProtectedRoute>
          } />
          <Route path="/admin/messagerie" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminMessaging />
            </ProtectedRoute>
          } />
          <Route path="/admin/emails" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminEmails />
            </ProtectedRoute>
          } />
          <Route path="/admin/ajouter-artisan" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminAddArtisan />
            </ProtectedRoute>
          } />
          
          {/* Catch-all Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
