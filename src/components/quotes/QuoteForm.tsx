import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Calculator } from "lucide-react";
import { useQuotes } from "@/hooks/useQuotes";
import { toast } from "sonner";

interface QuoteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  clientId: string;
  clientName: string;
}

export const QuoteForm = ({
  open,
  onOpenChange,
  conversationId,
  clientId,
  clientName,
}: QuoteFormProps) => {
  const { createQuote } = useQuotes();
  const [description, setDescription] = useState("");
  const [priceHt, setPriceHt] = useState<string>("");
  const [tvaRate, setTvaRate] = useState<string>("20");

  const priceHtNum = parseFloat(priceHt) || 0;
  const tvaRateNum = parseFloat(tvaRate) || 0;
  const tvaAmount = priceHtNum * (tvaRateNum / 100);
  const priceTtc = priceHtNum + tvaAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim() || priceHtNum <= 0) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    try {
      await createQuote.mutateAsync({
        conversationId,
        clientId,
        description: description.trim(),
        priceHt: priceHtNum,
        tvaRate: tvaRateNum,
      });

      toast.success("Devis envoyé avec succès");
      onOpenChange(false);
      setDescription("");
      setPriceHt("");
      setTvaRate("20");
    } catch (error) {
      toast.error("Erreur lors de l'envoi du devis");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Proposer un devis à {clientName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description du travail</Label>
            <Textarea
              id="description"
              placeholder="Décrivez les travaux à effectuer..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priceHt">Prix HT (€)</Label>
              <Input
                id="priceHt"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={priceHt}
                onChange={(e) => setPriceHt(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tvaRate">TVA (%)</Label>
              <Input
                id="tvaRate"
                type="number"
                step="0.1"
                min="0"
                max="100"
                placeholder="20"
                value={tvaRate}
                onChange={(e) => setTvaRate(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Récapitulatif</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Prix HT</span>
              <span>{priceHtNum.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">TVA ({tvaRateNum}%)</span>
              <span>{tvaAmount.toFixed(2)} €</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-medium">
              <span>Total TTC</span>
              <span className="text-primary">{priceTtc.toFixed(2)} €</span>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="gold"
              disabled={createQuote.isPending}
            >
              {createQuote.isPending ? "Envoi..." : "Envoyer le devis"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
