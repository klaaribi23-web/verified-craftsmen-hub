import { useState } from "react";
import { ClientSidebar } from "@/components/client-dashboard/ClientSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { QuoteCard } from "@/components/quotes/QuoteCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Clock, Check, X } from "lucide-react";
import { useQuotes, Quote } from "@/hooks/useQuotes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/layout/Navbar";

export const ClientQuotes = () => {
  const { clientQuotes, clientQuotesLoading, updateQuoteStatus } = useQuotes();
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [actionQuote, setActionQuote] = useState<{ quote: Quote; action: "accept" | "refuse" } | null>(null);

  const pendingQuotes = clientQuotes.filter((q) => q.status === "pending");
  const acceptedQuotes = clientQuotes.filter((q) => q.status === "accepted");
  const refusedQuotes = clientQuotes.filter((q) => q.status === "refused");

  const handleAction = async () => {
    if (!actionQuote) return;

    try {
      // Get artisan profile_id
      const { data: artisan } = await supabase
        .from("artisans")
        .select("profile_id")
        .eq("id", actionQuote.quote.artisan_id)
        .single();

      if (!artisan?.profile_id) {
        toast.error("Erreur: artisan introuvable");
        return;
      }

      await updateQuoteStatus.mutateAsync({
        quoteId: actionQuote.quote.id,
        status: actionQuote.action === "accept" ? "accepted" : "refused",
        artisanProfileId: artisan.profile_id,
      });

      toast.success(
        actionQuote.action === "accept"
          ? "Devis accepté avec succès"
          : "Devis refusé"
      );
    } catch (error) {
      toast.error("Erreur lors de la mise à jour du devis");
    } finally {
      setActionQuote(null);
    }
  };

  const renderQuotes = (quotes: Quote[]) => {
    if (clientQuotesLoading) {
      return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      );
    }

    if (quotes.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Aucun devis dans cette catégorie</p>
        </div>
      );
    }

    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quotes.map((quote) => (
          <QuoteCard
            key={quote.id}
            quote={quote}
            isArtisan={false}
            onViewDetails={() => setSelectedQuote(quote)}
            onAccept={() => setActionQuote({ quote, action: "accept" })}
            onRefuse={() => setActionQuote({ quote, action: "refuse" })}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-background pt-16 lg:pt-20">
        <ClientSidebar />

      <div className="flex-1 flex flex-col">
        <DashboardHeader
          title="Mes devis"
          subtitle="Consultez et gérez vos devis reçus"
        />

        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <Tabs defaultValue="all" className="space-y-6">
              <TabsList>
                <TabsTrigger value="all" className="gap-2">
                  <FileText className="w-4 h-4" />
                  Tous ({clientQuotes.length})
                </TabsTrigger>
                <TabsTrigger value="pending" className="gap-2">
                  <Clock className="w-4 h-4" />
                  En attente ({pendingQuotes.length})
                </TabsTrigger>
                <TabsTrigger value="accepted" className="gap-2">
                  <Check className="w-4 h-4" />
                  Acceptés ({acceptedQuotes.length})
                </TabsTrigger>
                <TabsTrigger value="refused" className="gap-2">
                  <X className="w-4 h-4" />
                  Refusés ({refusedQuotes.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all">{renderQuotes(clientQuotes)}</TabsContent>
              <TabsContent value="pending">{renderQuotes(pendingQuotes)}</TabsContent>
              <TabsContent value="accepted">{renderQuotes(acceptedQuotes)}</TabsContent>
              <TabsContent value="refused">{renderQuotes(refusedQuotes)}</TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

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
                <p className="text-sm text-muted-foreground">Artisan</p>
                <p className="font-medium">{selectedQuote.artisan?.business_name}</p>
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

      {/* Confirmation Dialog */}
      <AlertDialog open={!!actionQuote} onOpenChange={() => setActionQuote(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionQuote?.action === "accept" ? "Accepter le devis" : "Refuser le devis"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionQuote?.action === "accept"
                ? "Êtes-vous sûr de vouloir accepter ce devis ? L'artisan sera notifié de votre décision."
                : "Êtes-vous sûr de vouloir refuser ce devis ? Cette action est irréversible."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className={
                actionQuote?.action === "accept"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {actionQuote?.action === "accept" ? "Accepter" : "Refuser"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};
