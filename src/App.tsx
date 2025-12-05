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
          <Route path="/devenir-artisan" element={<DevenirArtisan />} />
          <Route path="/comment-ca-marche" element={<CommentCaMarche />} />
          <Route path="/connexion" element={<Connexion />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
