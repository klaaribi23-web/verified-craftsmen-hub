import { CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentMethodCardProps {
  last4: string;
  brand: string;
  expMonth: number;
  expYear: number;
  className?: string;
}

const brandIcons: Record<string, string> = {
  visa: "💳 Visa",
  mastercard: "💳 Mastercard",
  amex: "💳 Amex",
  discover: "💳 Discover",
  diners: "💳 Diners",
  jcb: "💳 JCB",
  unionpay: "💳 UnionPay",
};

export const PaymentMethodCard = ({
  last4,
  brand,
  expMonth,
  expYear,
  className,
}: PaymentMethodCardProps) => {
  const brandLabel = brandIcons[brand.toLowerCase()] || `💳 ${brand}`;
  const expiry = `${expMonth.toString().padStart(2, "0")}/${expYear}`;

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 bg-muted/50 rounded-lg border border-border",
        className
      )}
    >
      <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center border border-border">
        <CreditCard className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <p className="font-medium text-foreground">{brandLabel}</p>
        <p className="text-sm text-muted-foreground">
          •••• •••• •••• {last4}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm text-muted-foreground">Expire</p>
        <p className="font-medium text-foreground">{expiry}</p>
      </div>
    </div>
  );
};
