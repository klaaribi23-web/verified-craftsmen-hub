import { ShieldCheck, Lock, Ban, Clock } from "lucide-react";

const items = [
  { icon: ShieldCheck, text: "87% des artisans refusés" },
  { icon: Lock, text: "Coordonnées jamais partagées" },
  { icon: Ban, text: "Zéro commission" },
  { icon: Clock, text: "Réponse sous 24h" },
];

const ReassuranceBar = () => (
  <section className="bg-primary py-3.5">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-2 md:flex items-center justify-center gap-3 md:gap-8">
        {items.map(({ icon: Icon, text }, i) => (
          <span key={i} className="flex items-center gap-2 text-xs md:text-sm text-primary-foreground font-medium">
            <Icon className="w-4 h-4 text-accent flex-shrink-0" />
            {text}
          </span>
        ))}
      </div>
    </div>
  </section>
);

export default ReassuranceBar;
