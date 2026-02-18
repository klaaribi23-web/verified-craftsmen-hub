import { useState } from "react";
import { ArtisanSidebar } from "@/components/artisan-dashboard/ArtisanSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { QuoteCard } from "@/components/quotes/QuoteCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Clock, Check, X, Mic } from "lucide-react";
import { useQuotes, Quote } from "@/hooks/useQuotes";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { VoiceDictation } from "@/components/quotes/VoiceDictation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Navbar from "@/components/layout/Navbar";

// Demo quotes for design validation
const demoQuotes: Quote[] = [
  {
    id: "demo-1",
    artisan_id: "demo-artisan",
    client_id: "demo-client-1",
    conversation_id: "conv-1",
    description: "Rénovation complète de la cuisine : peinture murs et plafond, pose de carrelage au sol, installation plan de travail.",
    price_ht: 2500,
    tva_rate: 20,
    price_ttc: 3000,
    status: "pending",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    message_id: null,
    client: { first_name: "Marie", last_name: "Dupont", avatar_url: "" },
    artisan: { business_name: "Durand Peinture", photo_url: "" },
  },
  {
    id: "demo-2",
    artisan_id: "demo-artisan",
    client_id: "demo-client-2",
    conversation_id: "conv-2",
    description: "Peinture intérieure salon + 2 chambres, sous-couche et 2 couches de finition.",
    price_ht: 1800,
    tva_rate: 20,
    price_ttc: 2160,
    status: "accepted",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    message_id: null,
    client: { first_name: "Jean", last_name: "Martin", avatar_url: "" },
    artisan: { business_name: "Durand Peinture", photo_url: "" },
  },
  {
    id: "demo-3",
    artisan_id: "demo-artisan",
    client_id: "demo-client-3",
    conversation_id: "conv-3",
    description: "Ravalement façade extérieure, nettoyage haute pression et application enduit.",
    price_ht: 4200,
    tva_rate: 10,
    price_ttc: 4620,
    status: "refused",
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    message_id: null,
    client: { first_name: "Sophie", last_name: "Bernard", avatar_url: "" },
    artisan: { business_name: "Durand Peinture", photo_url: "" },
  },
];

export const ArtisanQuotes = () => {
  const { user } = useAuth();
  const demoMode = !user;
  const { artisanQuotes: realQuotes, artisanQuotesLoading } = useQuotes();
  const artisanQuotes = demoMode ? demoQuotes : realQuotes;
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showNewQuoteForm, setShowNewQuoteForm] = useState(false);
  const [demoDescription, setDemoDescription] = useState("");

  const pendingQuotes = artisanQuotes.filter((q) => q.status === "pending");
  const acceptedQuotes = artisanQuotes.filter((q) => q.status === "accepted");
  const refusedQuotes = artisanQuotes.filter((q) => q.status === "refused");

  const renderQuotes = (quotes: Quote[]) => {
    if (artisanQuotesLoading && !demoMode) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 md:h-64 rounded-xl" />
          ))}
        </div>
      );
    }

    if (quotes.length === 0) {
      return (
        <div className="text-center py-8 md:py-12 text-muted-foreground">
          <FileText className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 opacity-50" />
          <p className="text-sm md:text-base">Aucun devis dans cette catégorie</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {quotes.map((quote) => (
          <QuoteCard
            key={quote.id}
            quote={quote}
            isArtisan
            onViewDetails={() => setSelectedQuote(quote)}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-background">
        <ArtisanSidebar />

      <div className="flex-1 flex flex-col">
        <DashboardHeader
          title="Mes devis"
          subtitle="Gérez tous vos devis envoyés"
        />

        <main className="flex-1 p-3 md:p-6">
          <div className="max-w-6xl mx-auto">
            {/* New Quote Button with Voice Dictation */}
            <div className="mb-6 p-4 bg-card rounded-xl border border-border shadow-soft">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-foreground">Créer un nouveau devis</h3>
                  <p className="text-sm text-muted-foreground">Utilisez la dictée vocale pour rédiger rapidement</p>
                </div>
                <div className="flex gap-2">
                  <VoiceDictation 
                    onTranscript={(text) => {
                      setDemoDescription(prev => prev ? prev + " " + text : text);
                      setShowNewQuoteForm(true);
                    }}
                  />
                  <Button variant="outline" onClick={() => setShowNewQuoteForm(true)}>
                    <FileText className="w-4 h-4 mr-2" />
                    Nouveau devis
                  </Button>
                </div>
              </div>
            </div>

            <Tabs defaultValue="all" className="space-y-4 md:space-y-6">
              <TabsList className="w-full flex flex-wrap h-auto gap-1 p-1">
                <TabsTrigger value="all" className="flex-1 min-w-[45%] sm:min-w-0 sm:flex-none gap-1 text-xs sm:text-sm px-2 sm:px-3">
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Tous</span> ({artisanQuotes.length})
                </TabsTrigger>
                <TabsTrigger value="pending" className="flex-1 min-w-[45%] sm:min-w-0 sm:flex-none gap-1 text-xs sm:text-sm px-2 sm:px-3">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">En attente</span> ({pendingQuotes.length})
                </TabsTrigger>
                <TabsTrigger value="accepted" className="flex-1 min-w-[45%] sm:min-w-0 sm:flex-none gap-1 text-xs sm:text-sm px-2 sm:px-3">
                  <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Acceptés</span> ({acceptedQuotes.length})
                </TabsTrigger>
                <TabsTrigger value="refused" className="flex-1 min-w-[45%] sm:min-w-0 sm:flex-none gap-1 text-xs sm:text-sm px-2 sm:px-3">
                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Refusés</span> ({refusedQuotes.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all">{renderQuotes(artisanQuotes)}</TabsContent>
              <TabsContent value="pending">{renderQuotes(pendingQuotes)}</TabsContent>
              <TabsContent value="accepted">{renderQuotes(acceptedQuotes)}</TabsContent>
              <TabsContent value="refused">{renderQuotes(refusedQuotes)}</TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* New Quote Demo Form */}
      <Dialog open={showNewQuoteForm} onOpenChange={setShowNewQuoteForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Nouveau devis
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="demo-desc">Description du travail</Label>
                <VoiceDictation 
                  onTranscript={(text) => setDemoDescription(prev => prev ? prev + " " + text : text)}
                />
              </div>
              <Textarea
                id="demo-desc"
                placeholder="Décrivez les travaux ou utilisez la dictée vocale..."
                value={demoDescription}
                onChange={(e) => setDemoDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prix HT (€)</Label>
                <Input type="number" placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>TVA (%)</Label>
                <Input type="number" defaultValue="20" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowNewQuoteForm(false)}>Annuler</Button>
              <Button variant="gold">Envoyer le devis</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quote Details Modal */}
      <Dialog open={!!selectedQuote} onOpenChange={() => setSelectedQuote(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Détails du devis
            </DialogTitle>
          </DialogHeader>
          {selectedQuote && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Client</p>
                <p className="font-medium">
                  {selectedQuote.client?.first_name} {selectedQuote.client?.last_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">
                  {format(new Date(selectedQuote.created_at), "d MMMM yyyy à HH:mm", {
                    locale: fr,
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p>{selectedQuote.description}</p>
              </div>
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prix HT</span>
                  <span>{selectedQuote.price_ht.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">TVA ({selectedQuote.tva_rate}%)</span>
                  <span>{(selectedQuote.price_ttc - selectedQuote.price_ht).toFixed(2)} €</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-medium">
                  <span>Total TTC</span>
                  <span className="text-primary">{selectedQuote.price_ttc.toFixed(2)} €</span>
                </div>
              </div>
            </div>
          )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};
