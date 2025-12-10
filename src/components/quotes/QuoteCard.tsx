import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileText, Check, X, Clock, User } from "lucide-react";
import { Quote } from "@/hooks/useQuotes";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface QuoteCardProps {
  quote: Quote;
  isArtisan?: boolean;
  onAccept?: () => void;
  onRefuse?: () => void;
  onViewDetails?: () => void;
}

export const QuoteCard = ({
  quote,
  isArtisan = false,
  onAccept,
  onRefuse,
  onViewDetails,
}: QuoteCardProps) => {
  const statusConfig = {
    pending: {
      label: "En attente",
      variant: "outline" as const,
      icon: Clock,
      className: "border-amber-500 text-amber-600",
    },
    accepted: {
      label: "Accepté",
      variant: "outline" as const,
      icon: Check,
      className: "border-green-500 text-green-600",
    },
    refused: {
      label: "Refusé",
      variant: "outline" as const,
      icon: X,
      className: "border-red-500 text-red-600",
    },
  };

  const status = statusConfig[quote.status];
  const StatusIcon = status.icon;

  const displayName = isArtisan
    ? `${quote.client?.first_name || ""} ${quote.client?.last_name || ""}`.trim() || "Client"
    : quote.artisan?.business_name || "Artisan";

  const displayPhoto = isArtisan
    ? quote.client?.avatar_url
    : quote.artisan?.photo_url;

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onViewDetails}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={displayPhoto || undefined} />
              <AvatarFallback className="bg-primary/10">
                <User className="w-5 h-5 text-primary" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(quote.created_at), "d MMMM yyyy", { locale: fr })}
              </p>
            </div>
          </div>
          <Badge variant={status.variant} className={status.className}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-2">
          <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
          <p className="text-sm text-muted-foreground line-clamp-2">{quote.description}</p>
        </div>

        <div className="bg-muted/50 rounded-lg p-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Prix HT</span>
            <span>{quote.price_ht.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">TVA ({quote.tva_rate}%)</span>
            <span>{(quote.price_ttc - quote.price_ht).toFixed(2)} €</span>
          </div>
          <div className="border-t pt-1 flex justify-between font-medium">
            <span>Total TTC</span>
            <span className="text-primary">{quote.price_ttc.toFixed(2)} €</span>
          </div>
        </div>

        {!isArtisan && quote.status === "pending" && (
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-red-500 text-red-600 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                onRefuse?.();
              }}
            >
              <X className="w-4 h-4 mr-1" />
              Refuser
            </Button>
            <Button
              variant="gold"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onAccept?.();
              }}
            >
              <Check className="w-4 h-4 mr-1" />
              Accepter
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
