import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Check, 
  X, 
  Clock, 
  CheckCircle2, 
  XCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMessageTime } from "@/hooks/useMessaging";
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

interface QuoteMessageCardProps {
  quoteId: string;
  description: string;
  priceHt: number;
  tvaRate: number;
  priceTtc: number;
  status: "pending" | "accepted" | "refused";
  createdAt: string;
  isOwn: boolean; // Is this message from the current user
  isArtisan: boolean; // Is the current user an artisan
  onAccept?: () => void;
  onRefuse?: () => void;
}

export const QuoteMessageCard = ({
  quoteId,
  description,
  priceHt,
  tvaRate,
  priceTtc,
  status,
  createdAt,
  isOwn,
  isArtisan,
  onAccept,
  onRefuse,
}: QuoteMessageCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"accept" | "refuse" | null>(null);

  const statusConfig = {
    pending: {
      label: "En attente",
      icon: Clock,
      color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      iconColor: "text-yellow-500",
    },
    accepted: {
      label: "Accepté",
      icon: CheckCircle2,
      color: "bg-green-500/10 text-green-600 border-green-500/20",
      iconColor: "text-green-500",
    },
    refused: {
      label: "Refusé",
      icon: XCircle,
      color: "bg-red-500/10 text-red-600 border-red-500/20",
      iconColor: "text-red-500",
    },
  };

  const currentStatus = statusConfig[status];
  const StatusIcon = currentStatus.icon;

  const handleConfirm = () => {
    if (confirmAction === "accept" && onAccept) {
      onAccept();
    } else if (confirmAction === "refuse" && onRefuse) {
      onRefuse();
    }
    setConfirmAction(null);
  };

  return (
    <>
      <Card
        className={cn(
          "max-w-sm overflow-hidden transition-all duration-200 cursor-pointer",
          isOwn 
            ? "bg-gradient-to-br from-primary/90 to-primary border-primary/50" 
            : "bg-gradient-to-br from-card to-muted border-border",
          expanded && "max-w-md"
        )}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Header */}
        <div className={cn(
          "px-4 py-3 flex items-center gap-3 border-b",
          isOwn ? "border-primary-foreground/20" : "border-border"
        )}>
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            isOwn ? "bg-primary-foreground/20" : "bg-primary/10"
          )}>
            <FileText className={cn("w-5 h-5", isOwn ? "text-primary-foreground" : "text-primary")} />
          </div>
          <div className="flex-1">
            <p className={cn(
              "font-semibold text-sm",
              isOwn ? "text-primary-foreground" : "text-foreground"
            )}>
              📋 Devis
            </p>
            <Badge className={cn("text-xs px-2 py-0.5", currentStatus.color)}>
              <StatusIcon className={cn("w-3 h-3 mr-1", currentStatus.iconColor)} />
              {currentStatus.label}
            </Badge>
          </div>
          {expanded ? (
            <ChevronUp className={cn("w-5 h-5", isOwn ? "text-primary-foreground/70" : "text-muted-foreground")} />
          ) : (
            <ChevronDown className={cn("w-5 h-5", isOwn ? "text-primary-foreground/70" : "text-muted-foreground")} />
          )}
        </div>

        {/* Content */}
        <div className="px-4 py-3 space-y-3">
          <p className={cn(
            "text-sm",
            isOwn ? "text-primary-foreground/90" : "text-foreground",
            !expanded && "line-clamp-2"
          )}>
            {description}
          </p>

          {/* Price summary */}
          <div className={cn(
            "rounded-lg p-3 space-y-1.5",
            isOwn ? "bg-primary-foreground/10" : "bg-muted"
          )}>
            {expanded && (
              <>
                <div className={cn(
                  "flex justify-between text-sm",
                  isOwn ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>
                  <span>Prix HT</span>
                  <span>{priceHt.toFixed(2)} €</span>
                </div>
                <div className={cn(
                  "flex justify-between text-sm",
                  isOwn ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>
                  <span>TVA ({tvaRate}%)</span>
                  <span>{(priceTtc - priceHt).toFixed(2)} €</span>
                </div>
                <div className={cn(
                  "border-t pt-1.5",
                  isOwn ? "border-primary-foreground/20" : "border-border"
                )} />
              </>
            )}
            <div className={cn(
              "flex justify-between font-semibold",
              isOwn ? "text-primary-foreground" : "text-foreground"
            )}>
              <span>Total TTC</span>
              <span className={isOwn ? "" : "text-primary"}>{priceTtc.toFixed(2)} €</span>
            </div>
          </div>

          {/* Actions for client (only show if pending and not artisan view) */}
          {status === "pending" && !isArtisan && !isOwn && expanded && (
            <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => setConfirmAction("accept")}
              >
                <Check className="w-4 h-4 mr-1" />
                Accepter
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-red-500/50 text-red-600 hover:bg-red-500/10"
                onClick={() => setConfirmAction("refuse")}
              >
                <X className="w-4 h-4 mr-1" />
                Refuser
              </Button>
            </div>
          )}

          {/* Timestamp */}
          <div className={cn(
            "text-xs text-right",
            isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
          )}>
            {formatMessageTime(createdAt)}
          </div>
        </div>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "accept" ? "Accepter le devis" : "Refuser le devis"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "accept"
                ? "Êtes-vous sûr de vouloir accepter ce devis ? L'artisan sera notifié de votre décision."
                : "Êtes-vous sûr de vouloir refuser ce devis ? Cette action est définitive."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={
                confirmAction === "accept"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {confirmAction === "accept" ? "Accepter" : "Refuser"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// Helper function to parse quote from message content
export const parseQuoteFromMessage = (content: string): {
  isQuote: boolean;
  quoteId: string | null;
  description: string | null;
  priceHt: number | null;
  tvaRate: number | null;
  priceTtc: number | null;
} => {
  const quoteIdMatch = content.match(/\[QUOTE_ID:([^\]]+)\]/);
  
  if (!quoteIdMatch) {
    return { isQuote: false, quoteId: null, description: null, priceHt: null, tvaRate: null, priceTtc: null };
  }

  const quoteId = quoteIdMatch[1];
  
  // Parse description (between "DEVIS ENVOYÉ\n\n" and "\n\nPrix HT:")
  const descMatch = content.match(/DEVIS ENVOYÉ\n\n([^]*?)\n\nPrix HT:/);
  const description = descMatch ? descMatch[1].trim() : null;

  // Parse prices
  const priceHtMatch = content.match(/Prix HT:\s*([0-9.]+)€/);
  const tvaMatch = content.match(/TVA \(([0-9.]+)%\)/);
  const priceTtcMatch = content.match(/Total TTC:\s*([0-9.]+)€/);

  return {
    isQuote: true,
    quoteId,
    description,
    priceHt: priceHtMatch ? parseFloat(priceHtMatch[1]) : null,
    tvaRate: tvaMatch ? parseFloat(tvaMatch[1]) : null,
    priceTtc: priceTtcMatch ? parseFloat(priceTtcMatch[1]) : null,
  };
};
