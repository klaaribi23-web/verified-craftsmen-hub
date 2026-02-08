import { Shield, CheckCircle2, Camera, Wrench, FileText, HardHat } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface AuditSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessName: string;
}

const auditItems = [
  { icon: FileText, label: "Assurance décennale", status: "OK" },
  { icon: Wrench, label: "Matériel professionnel", status: "OK" },
  { icon: Camera, label: "Photo du patron", status: "OK" },
  { icon: HardHat, label: "Conformité sécurité", status: "OK" },
  { icon: CheckCircle2, label: "Références clients", status: "OK" },
];

const AuditSummaryDialog = ({ open, onOpenChange, businessName }: AuditSummaryDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center">
              <Shield className="h-4 w-4 text-white fill-current" />
            </div>
            <DialogTitle className="text-base">Audit Terrain Validé</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            {businessName} a été audité sur place par un expert Artisans Validés.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 mt-2">
          {auditItems.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20"
            >
              <div className="flex items-center gap-2.5">
                <item.icon className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full">
                {item.status}
              </span>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground mt-3 italic text-center">
          — Équipe Audit, Artisans Validés
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default AuditSummaryDialog;
