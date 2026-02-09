import { Camera } from "lucide-react";

interface PortfolioPlaceholderProps {
  businessName: string;
  category?: string;
}

const PortfolioPlaceholder = ({ businessName, category }: PortfolioPlaceholderProps) => {
  return (
    <div className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 dark:from-slate-800 dark:via-slate-900 dark:to-blue-950 border border-border/50">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Camera className="h-8 w-8 text-primary/40" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Photos de réalisations à venir
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {businessName} — {category || "Artisan"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PortfolioPlaceholder;
