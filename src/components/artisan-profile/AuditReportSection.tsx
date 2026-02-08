import { Shield, CheckCircle2, Home, Wrench, Star, ClipboardCheck, HardHat } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AuditReportSectionProps {
  businessName: string;
  city: string;
  category?: string;
}

const auditChecks = [
  { icon: Home, label: "Visite du local / atelier effectuée", color: "text-emerald-600" },
  { icon: Wrench, label: "Outillage professionnel vérifié", color: "text-emerald-600" },
  { icon: ClipboardCheck, label: "Assurance décennale contrôlée sur site", color: "text-emerald-600" },
  { icon: HardHat, label: "Conformité sécurité & EPI validée", color: "text-emerald-600" },
  { icon: Star, label: "Qualité des réalisations inspectée", color: "text-emerald-600" },
  { icon: CheckCircle2, label: "Références clients vérifiées", color: "text-emerald-600" },
];

const AuditReportSection = ({ businessName, city, category }: AuditReportSectionProps) => {
  return (
    <Card className="border-amber-200 shadow-md" id="audit-report">
      <CardHeader className="p-4 md:p-6 pb-2 md:pb-3">
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <Shield className="h-5 w-5 text-amber-500 fill-amber-500/20" />
          Rapport d'Audit Terrain
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Cet artisan a été audité sur place par un expert Artisans Validés
        </p>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-2 md:pt-2 space-y-4">
        {/* Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {auditChecks.map((check, i) => (
            <div key={i} className="flex items-center gap-2.5 py-1.5">
              <check.icon className={`h-4 w-4 ${check.color} flex-shrink-0`} />
              <span className="text-sm text-foreground">{check.label}</span>
            </div>
          ))}
        </div>

        {/* Expert Opinion */}
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-4 mt-3">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Shield className="h-4 w-4 text-white fill-current" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
                L'avis de l'expert
              </p>
              <p className="text-sm text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
                « Après une visite approfondie de l'entreprise <strong>{businessName}</strong>{city && city !== 'À compléter' ? ` à ${city}` : ''}, 
                nous confirmons le sérieux de cette structure. 
                {category ? ` Spécialisé en ${category.toLowerCase()}, cet artisan` : ' Cet artisan'} dispose
                d'un équipement professionnel adapté, d'une organisation rigoureuse et d'un réel souci 
                de satisfaction client. Nous recommandons cette entreprise en toute confiance. »
              </p>
              <p className="text-xs text-amber-700/60 dark:text-amber-300/50 mt-2 italic">
                — Équipe Audit, Artisans Validés
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuditReportSection;
