import { ArtisanSidebar } from "@/components/artisan-dashboard/ArtisanSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  Clock, 
  XCircle,
  Download,
  Eye,
  Trash2,
  AlertTriangle
} from "lucide-react";

const documents = [
  {
    id: 1,
    name: "Attestation d'assurance RC Pro",
    type: "assurance",
    status: "verified",
    uploadDate: "15/03/2024",
    expiryDate: "15/03/2025",
    fileName: "assurance_rcpro_2024.pdf",
  },
  {
    id: 2,
    name: "Extrait Kbis",
    type: "legal",
    status: "verified",
    uploadDate: "10/02/2024",
    expiryDate: null,
    fileName: "kbis_2024.pdf",
  },
  {
    id: 3,
    name: "Garantie décennale",
    type: "assurance",
    status: "pending",
    uploadDate: "01/06/2024",
    expiryDate: "01/06/2025",
    fileName: "garantie_decennale.pdf",
  },
  {
    id: 4,
    name: "Qualification RGE",
    type: "certification",
    status: "expired",
    uploadDate: "20/01/2023",
    expiryDate: "20/01/2024",
    fileName: "rge_qualification.pdf",
  },
  {
    id: 5,
    name: "Pièce d'identité",
    type: "identity",
    status: "verified",
    uploadDate: "05/01/2024",
    expiryDate: null,
    fileName: "carte_identite.pdf",
  },
];

const requiredDocuments = [
  { name: "Attestation d'assurance RC Pro", required: true, uploaded: true },
  { name: "Garantie décennale", required: true, uploaded: true },
  { name: "Extrait Kbis ou INSEE", required: true, uploaded: true },
  { name: "Pièce d'identité", required: true, uploaded: true },
  { name: "Qualifications / Certifications", required: false, uploaded: true },
];

const getStatusConfig = (status: string) => {
  switch (status) {
    case "verified":
      return { 
        label: "Vérifié", 
        icon: CheckCircle, 
        className: "bg-success/20 text-success border-0" 
      };
    case "pending":
      return { 
        label: "En cours", 
        icon: Clock, 
        className: "bg-accent/20 text-accent border-0" 
      };
    case "expired":
      return { 
        label: "Expiré", 
        icon: AlertTriangle, 
        className: "bg-destructive/20 text-destructive border-0" 
      };
    default:
      return { 
        label: "Non vérifié", 
        icon: XCircle, 
        className: "bg-muted text-muted-foreground border-0" 
      };
  }
};

export const ArtisanDocuments = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <ArtisanSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader 
          title="Documents" 
          subtitle="Gérez vos documents professionnels et certifications"
        />

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Document Checklist */}
            <div className="bg-card rounded-xl border border-border shadow-soft p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Documents requis pour la validation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {requiredDocuments.map((doc, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border ${
                      doc.uploaded 
                        ? "border-success/30 bg-success/5" 
                        : "border-border bg-muted/30"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        doc.uploaded ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        {doc.uploaded ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <span className="text-xs font-bold">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{doc.name}</p>
                        {doc.required && (
                          <p className="text-xs text-muted-foreground">Obligatoire</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upload Button */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-foreground">Mes documents</h3>
              <Button variant="gold">
                <Upload className="w-4 h-4 mr-2" /> Ajouter un document
              </Button>
            </div>

            {/* Documents List */}
            <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-4 font-medium text-muted-foreground">Document</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Statut</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Date d'ajout</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Expiration</th>
                      <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {documents.map((doc) => {
                      const statusConfig = getStatusConfig(doc.status);
                      const StatusIcon = statusConfig.icon;
                      
                      return (
                        <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{doc.name}</p>
                                <p className="text-sm text-muted-foreground">{doc.fileName}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge className={statusConfig.className}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                          </td>
                          <td className="p-4 text-muted-foreground">{doc.uploadDate}</td>
                          <td className="p-4">
                            {doc.expiryDate ? (
                              <span className={doc.status === "expired" ? "text-destructive" : "text-muted-foreground"}>
                                {doc.expiryDate}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Alert for expiring documents */}
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Document expiré</p>
                <p className="text-sm text-destructive/80">
                  Votre qualification RGE a expiré. Veuillez télécharger une version à jour pour maintenir votre statut d'artisan validé.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
