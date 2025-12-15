import { useState, useRef } from "react";
import { ArtisanSidebar } from "@/components/artisan-dashboard/ArtisanSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useArtisanProfile } from "@/hooks/useArtisanProfile";
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

interface DocumentRecord {
  id: string;
  name: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  status: string;
  expiry_date: string | null;
  created_at: string;
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
  const queryClient = useQueryClient();
  const { artisan } = useArtisanProfile();
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch documents from database
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["artisan-documents", artisan?.id],
    queryFn: async () => {
      if (!artisan?.id) return [];
      const { data, error } = await supabase
        .from("artisan_documents")
        .select("*")
        .eq("artisan_id", artisan.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DocumentRecord[];
    },
    enabled: !!artisan?.id
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!artisan?.id) throw new Error("Artisan non trouvé");
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("artisan-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Insert document record
      const { data: insertedDoc, error: insertError } = await supabase
        .from("artisan_documents")
        .insert({
          artisan_id: artisan.id,
          name: file.name.replace(/\.[^/.]+$/, ""),
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          status: "pending"
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      // Notify all admins about new document
      const { data: admins } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (admins && admins.length > 0) {
        for (const admin of admins) {
          await supabase.rpc("create_notification", {
            p_user_id: admin.user_id,
            p_type: "new_document",
            p_title: "Nouveau document à vérifier",
            p_message: `L'artisan ${artisan.business_name} a soumis un document : ${file.name}`,
            p_related_id: insertedDoc?.id || null
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artisan-documents"] });
      toast.success("Document téléchargé avec succès");
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast.error("Erreur lors du téléchargement");
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (doc: DocumentRecord) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("artisan-documents")
        .remove([doc.file_path]);

      if (storageError) console.error("Storage delete error:", storageError);

      // Delete from database
      const { error: dbError } = await supabase
        .from("artisan_documents")
        .delete()
        .eq("id", doc.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artisan-documents"] });
      toast.success("Document supprimé");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    }
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Format non supporté. Utilisez PDF, JPG ou PNG.");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Le fichier est trop volumineux (max 10 Mo)");
      return;
    }

    setIsUploading(true);
    await uploadMutation.mutateAsync(file);
    setIsUploading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleView = async (doc: DocumentRecord) => {
    try {
      const { data, error } = await supabase.storage
        .from("artisan-documents")
        .createSignedUrl(doc.file_path, 3600);

      if (error || !data?.signedUrl) {
        console.error("View error:", error);
        toast.error("Impossible d'ouvrir le document");
        return;
      }

      window.open(data.signedUrl, "_blank");
    } catch (error) {
      console.error("View error:", error);
      toast.error("Erreur lors de l'ouverture du document");
    }
  };

  const handleDownload = async (doc: DocumentRecord) => {
    setDownloadingId(doc.id);
    try {
      const { data, error } = await supabase.storage
        .from("artisan-documents")
        .createSignedUrl(doc.file_path, 3600, {
          download: doc.file_name
        });

      if (error || !data?.signedUrl) {
        console.error("Download error:", error);
        toast.error("Impossible de télécharger le document");
        return;
      }

      // Fetch as blob for reliable cross-origin download
      const response = await fetch(data.signedUrl);
      if (!response.ok) throw new Error("Erreur de téléchargement");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = doc.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("Document téléchargé");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Erreur lors du téléchargement");
    } finally {
      setDownloadingId(null);
    }
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
                accept=".pdf,.jpg,.jpeg,.png,.webp"
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
              {isLoading ? (
                <div className="p-12 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : documents.length === 0 ? (
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
                        <th className="text-left p-4 font-medium text-muted-foreground">Taille</th>
                        <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {documents.map((doc) => {
                        const statusConfig = getStatusConfig(doc.status);
                        const StatusIcon = statusConfig.icon;
                        const sizeInKB = doc.file_size ? Math.round(doc.file_size / 1024) : 0;
                        const sizeDisplay = sizeInKB > 1024 
                          ? `${(sizeInKB / 1024).toFixed(1)} Mo` 
                          : `${sizeInKB} Ko`;
                        
                        return (
                          <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">{doc.name}</p>
                                  <p className="text-sm text-muted-foreground">{doc.file_name}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge className={statusConfig.className}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusConfig.label}
                              </Badge>
                            </td>
                            <td className="p-4 text-muted-foreground">
                              {new Date(doc.created_at).toLocaleDateString("fr-FR")}
                            </td>
                            <td className="p-4 text-muted-foreground">
                              {sizeDisplay}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => handleView(doc)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => handleDownload(doc)}
                                  disabled={downloadingId === doc.id}
                                >
                                  {downloadingId === doc.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Download className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => deleteMutation.mutate(doc)}
                                  disabled={deleteMutation.isPending}
                                >
                                  {deleteMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
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