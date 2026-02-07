import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Circle,
  MapPin,
  Calendar,
  Euro,
  Camera,
  ImageIcon,
  Clock,
} from "lucide-react";

const tasks = [
  { label: "Dépose de l'ancien carrelage", done: true },
  { label: "Création d'une douche à l'italienne avec receveur extra-plat", done: false },
  { label: "Pose de double vasque et robinetterie encastrée", done: false },
  { label: "Peinture hydrofuge et éclairage LED intégré", done: false },
];

const photoPlaceholders = [
  { label: "Plan de la pièce", icon: ImageIcon },
  { label: "État actuel — vue 1", icon: Camera },
  { label: "État actuel — vue 2", icon: Camera },
];

export const DemoProjectShowcase = () => {
  return (
    <Card className="border-2 border-teal-200 bg-gradient-to-br from-white via-teal-50/40 to-sky-50/40 shadow-lg overflow-hidden">
      <CardContent className="p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-600">
              Projet principal
            </p>
            <h2 className="text-xl font-bold text-foreground leading-tight">
              Rénovation complète Suite Parentale (35m²)
            </h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <MapPin className="w-4 h-4 text-teal-500" />
              Lille (59000)
            </div>
          </div>
          <Badge className="bg-amber-100 text-amber-700 border-0 text-sm whitespace-nowrap self-start">
            En attente de devis
          </Badge>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progression</span>
            <span className="font-semibold text-teal-700">30%</span>
          </div>
          <Progress value={30} className="h-3 bg-teal-100" />
        </div>

        {/* Tasks */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">Détails des travaux</p>
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li key={task.label} className="flex items-start gap-2.5 text-sm">
                {task.done ? (
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-teal-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 mt-0.5 text-muted-foreground/40 flex-shrink-0" />
                )}
                <span className={task.done ? "text-muted-foreground line-through" : "text-foreground"}>
                  {task.label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Budget + Deadline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-3 bg-white rounded-lg border border-border p-3">
            <div className="p-2 rounded-lg bg-emerald-100">
              <Euro className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Budget estimé</p>
              <p className="font-semibold text-foreground">12 000 € — 15 000 €</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white rounded-lg border border-border p-3">
            <div className="p-2 rounded-lg bg-sky-100">
              <Calendar className="w-4 h-4 text-sky-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Délai souhaité</p>
              <p className="font-semibold text-foreground">Dès que possible <span className="text-muted-foreground font-normal text-xs">(avant le printemps)</span></p>
            </div>
          </div>
        </div>

        {/* Photos */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Camera className="w-4 h-4 text-teal-500" />
            Photos du projet
          </p>
          <div className="grid grid-cols-3 gap-3">
            {photoPlaceholders.map((photo) => (
              <div
                key={photo.label}
                className="aspect-[4/3] rounded-lg border-2 border-dashed border-teal-200 bg-teal-50/50 flex flex-col items-center justify-center gap-1.5 text-center p-2"
              >
                <photo.icon className="w-6 h-6 text-teal-400" />
                <span className="text-[10px] sm:text-xs text-muted-foreground leading-tight">
                  {photo.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t border-border">
          <Clock className="w-3.5 h-3.5" />
          Publié il y a 2 jours
        </div>
      </CardContent>
    </Card>
  );
};
