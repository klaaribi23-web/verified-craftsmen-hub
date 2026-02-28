import { CheckCircle2 } from "lucide-react";

const items = [
  "87% des artisans refusés à l'audit",
  "Audit terrain obligatoire",
  "Zéro commission sur vos chantiers",
  "Vos coordonnées jamais partagées sans votre accord",
];

const ReassuranceBar = () => (
  <section className="bg-navy-dark py-3 border-t border-b border-primary/10">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-2 md:flex items-center justify-center gap-3 md:gap-6">
        {items.map((text, i) => (
          <span key={i} className="flex items-center gap-1.5 text-xs md:text-sm text-foreground font-medium">
            {i > 0 && <span className="hidden md:inline text-white/40 mr-2">·</span>}
            <CheckCircle2 className="w-3.5 h-3.5 text-white/70 flex-shrink-0" />
            {text}
          </span>
        ))}
      </div>
    </div>
  </section>
);

export default ReassuranceBar;
