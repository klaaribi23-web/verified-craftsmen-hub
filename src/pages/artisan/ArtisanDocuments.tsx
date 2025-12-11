import { useState, useRef } from "react";
import { ArtisanSidebar } from "@/components/artisan-dashboard/ArtisanSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  Clock, 
  XCircle,
  Download,
  Eye,
  Trash2,
  AlertTriangle,
  Loader2
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";

interface Document {
  id: string;
  name: string;
  type: string;
  status: "verified" | "pending" | "expired" | "unverified";
  uploadDate: string;
  expiryDate: string | null;
  fileName: string;
}

const requiredDocuments = [
  { name: "Attestation d'assurance RC Pro", required: true },
  { name: "Garantie décennale", required: true },
  { name: "Extrait Kbis ou INSEE", required: true },
  { name: "Pièce d'identité", required: true },
  { name: "Qualifications / Certifications", required: false },
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
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    // Simulate upload - in real implementation, this would upload to Supabase Storage
    setTimeout(() => {
      const newDoc: Document = {
        id: Date.now().toString(),
        name: file.name.replace(/\.[^/.]+$/, ""),
        type: "document",
        status: "pending",
        uploadDate: new Date().toLocaleDateString("fr-FR"),
        expiryDate: null,
        fileName: file.name
      };
      setDocuments(prev => [...prev, newDoc]);
      setIsUploading(false);
      toast.success("Document téléchargé avec succès");
    }, 1500);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = (docId: string) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
    toast.success("Document supprimé");
  };

  const uploadedDocNames = documents.map(d => d.name.toLowerCase());

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-background pt-16 lg:pt-20">
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
                {requiredDocuments.map((doc, index) => {
                  const isUploaded = uploadedDocNames.some(name => 
                    doc.name.toLowerCase().includes(name) || name.includes(doc.name.toLowerCase().split(" ")[0])
                  );
                  return (
                    <div 
                      key={index}
                      className={`p-4 rounded-lg border ${
                        isUploaded 
                          ? "border-success/30 bg-success/5" 
                          : "border-border bg-muted/30"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          isUploaded ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
                        }`}>
                          {isUploaded ? (
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
                  );
                })}
              </div>
            </div>

            {/* Upload Button */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-foreground">Mes documents</h3>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleUpload}
                className="hidden"
              />
              <Button 
                variant="gold" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Ajouter un document
              </Button>
            </div>

            {/* Documents List */}
            <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
              {documents.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">Aucun document</h3>
                  <p className="text-muted-foreground mb-4">
                    Téléchargez vos documents professionnels pour compléter votre profil
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" /> Ajouter un document
                  </Button>
                </div>
              ) : (
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
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleDelete(doc.id)}
                                >
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
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
    </>
  );
};
