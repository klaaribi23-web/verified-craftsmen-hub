import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { QuoteNotificationListener } from "@/components/notifications/QuoteNotificationListener";
import GlobalMobileNavbar from "@/components/layout/GlobalMobileNavbar";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { DemoContactProvider } from "@/contexts/DemoContactContext";
import ScrollToTop from "@/components/layout/ScrollToTop";
import Index from "./pages/Index";
import TrouverArtisan from "./pages/TrouverArtisan";
import CityArtisansPage from "./pages/CityArtisansPage";
import NosMissions from "./pages/NosMissions";
import DemandeDevis from "./pages/DemandeDevis";
import DevenirArtisan from "./pages/DevenirArtisan";
// DevenirPartenaire merged into DevenirArtisan
import AdminExclusive from "./pages/admin/AdminExclusive";
import CommentCaMarche from "./pages/CommentCaMarche";
import Connexion from "./pages/Connexion";
import NotFound from "./pages/NotFound";
import { ArtisanDashboard } from "./pages/artisan/ArtisanDashboard";
import { ArtisanProfile } from "./pages/artisan/ArtisanProfile";
import { ArtisanDocuments } from "./pages/artisan/ArtisanDocuments";
import { ArtisanServices } from "./pages/artisan/ArtisanServices";
import { ArtisanRequests } from "./pages/artisan/ArtisanRequests";
import { ArtisanMessaging } from "./pages/artisan/ArtisanMessaging";

import { ArtisanSettings } from "./pages/artisan/ArtisanSettings";
import { ArtisanPartnerOffers } from "./pages/artisan/ArtisanPartnerOffers";
import { ArtisanQuotes } from "./pages/artisan/ArtisanQuotes";
import { ArtisanStories } from "./pages/artisan/ArtisanStories";
import ArtisanSubscription from "./pages/artisan/ArtisanSubscription";
import ArtisanPublicProfile from "./pages/ArtisanPublicProfile";
import { ClientDashboard } from "./pages/client/ClientDashboard";
import { ClientDashboardNew } from "./pages/client/ClientDashboardNew";
import { ClientMissions } from "./pages/client/ClientMissions";
import { ClientMissionDetail } from "./pages/client/ClientMissionDetail";
import { ClientFavorites } from "./pages/client/ClientFavorites";
import { ClientMessaging } from "./pages/client/ClientMessaging";
import { ClientSettings } from "./pages/client/ClientSettings";
import { ClientQuotes } from "./pages/client/ClientQuotes";
import ClientRecommendations from "./pages/client/ClientRecommendations";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminArtisans from "./pages/admin/AdminArtisans";
import AdminClients from "./pages/admin/AdminClients";
import AdminStatistics from "./pages/admin/AdminStatistics";
import AdminMessaging from "./pages/admin/AdminMessaging";
import AdminAddArtisan from "./pages/admin/AdminAddArtisan";
import AdminApprovals from "./pages/admin/AdminApprovals";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminBulkImport from "./pages/admin/AdminBulkImport";
import AdminRecommendations from "./pages/admin/AdminRecommendations";
import AdminSubscriptions from "./pages/admin/AdminSubscriptions";
import AdminProjectStats from "./pages/admin/AdminProjectStats";
import AdminLeads from "./pages/admin/AdminLeads";
import AdminPartners from "./pages/admin/AdminPartners";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import ActivateAccount from "./pages/ActivateAccount";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ConfirmEmail from "./pages/ConfirmEmail";
import Contact from "./pages/Contact";
import APropos from "./pages/APropos";
import Blog from "./pages/Blog";
import BlogArticle from "./pages/BlogArticle";
import MentionsLegales from "./pages/MentionsLegales";
import CGU from "./pages/CGU";
import CGV from "./pages/CGV";
import Confidentialite from "./pages/Confidentialite";
// InscriptionArtisan merged into DevenirArtisan
import CookieConsent from "./components/cookies/CookieConsent";
import AndreaGlobalWidget from "./components/andrea/AndreaGlobalWidget";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <DemoContactProvider>
        <SubscriptionProvider>
        {/* Scroll to top on route change */}
        <ScrollToTop />
        
        {/* Initialize real-time quote notifications */}
        <QuoteNotificationListener />
        
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/trouver-artisan" element={<TrouverArtisan />} />
          <Route path="/nos-missions" element={<NosMissions />} />
          <Route path="/demande-devis" element={<DemandeDevis />} />
          <Route path="/deposer-mission" element={<DemandeDevis />} />
          <Route path="/devenir-artisan" element={<DevenirArtisan />} />
          <Route path="/inscription-artisan" element={<Navigate to="/devenir-artisan" replace />} />
          <Route path="/devenir-partenaire" element={<Navigate to="/devenir-artisan" replace />} />
          <Route path="/comment-ca-marche" element={<CommentCaMarche />} />
          <Route path="/connexion" element={<Connexion />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/activer-compte" element={<ActivateAccount />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/confirmer-email" element={<ConfirmEmail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/a-propos" element={<APropos />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogArticle />} />
          <Route path="/mentions-legales" element={<MentionsLegales />} />
          <Route path="/cgu" element={<CGU />} />
          <Route path="/cgv" element={<CGV />} />
          <Route path="/confidentialite" element={<Confidentialite />} />
          <Route path="/admin-exclusive" element={<AdminExclusive />} />
          <Route path="/artisans-ville/:citySlug" element={<CityArtisansPage />} />
          
          <Route path="/artisan/:slug" element={<ArtisanPublicProfile />} />
          
          {/* Redirection /dashboard/artisan → /artisan/dashboard */}
          <Route path="/dashboard/artisan" element={<Navigate to="/artisan/dashboard" replace />} />
          <Route path="/dashboard/pro" element={<Navigate to="/artisan/dashboard" replace />} />
          
          {/* Redirection /dashboard/client → /client/dashboard */}
          <Route path="/dashboard/client" element={<Navigate to="/client/dashboard" replace />} />
          <Route path="/dashboard/client/*" element={<Navigate to="/client/dashboard" replace />} />
          
          {/* Redirections SEO - anciennes URLs WordPress */}
          <Route path="/accueil-old" element={<Navigate to="/" replace />} />
          <Route path="/accueil-old/" element={<Navigate to="/" replace />} />
          <Route path="/artisansvalides" element={<Navigate to="/" replace />} />
          <Route path="/artisansvalides/" element={<Navigate to="/" replace />} />
          
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
          <Route path="/artisan/devis" element={<ArtisanQuotes />} />
          <Route path="/artisan/stories" element={
            <ProtectedRoute allowedRoles={["artisan"]}>
              <ArtisanStories />
            </ProtectedRoute>
          } />
          <Route path="/artisan/abonnement" element={
            <ProtectedRoute allowedRoles={["artisan"]}>
              <ArtisanSubscription />
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
          <Route path="/client/devis" element={
            <ProtectedRoute allowedRoles={["client"]}>
              <ClientQuotes />
            </ProtectedRoute>
          } />
          <Route path="/client/recommandations" element={
            <ProtectedRoute allowedRoles={["client"]}>
              <ClientRecommendations />
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
          <Route path="/admin/approbations" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminApprovals />
            </ProtectedRoute>
          } />
          <Route path="/admin/ajouter-artisan" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminAddArtisan />
            </ProtectedRoute>
          } />
          <Route path="/admin/parametres" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminSettings />
            </ProtectedRoute>
          } />
          <Route path="/admin/import-massif" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminBulkImport />
            </ProtectedRoute>
          } />
          {/* duplicate removed */}
          <Route path="/admin/recommandations" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminRecommendations />
            </ProtectedRoute>
          } />
          <Route path="/admin/abonnements" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminSubscriptions />
            </ProtectedRoute>
          } />
          <Route path="/admin/demandes-projets" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminProjectStats />
            </ProtectedRoute>
          } />
          <Route path="/admin/leads-andrea" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLeads />
            </ProtectedRoute>
          } />
          <Route path="/admin/partenaires" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminPartners />
            </ProtectedRoute>
          } />
          
          {/* Catch-all Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        
        {/* Global Mobile Navbar for authenticated clients & artisans */}
        <GlobalMobileNavbar />
        
        {/* Andrea Expert Global Widget — Voice + Text */}
        <AndreaGlobalWidget />
        
        {/* GDPR Cookie Consent Banner */}
        <CookieConsent />
        </SubscriptionProvider>
        </DemoContactProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
