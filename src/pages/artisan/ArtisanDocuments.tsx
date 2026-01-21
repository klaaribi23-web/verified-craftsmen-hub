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
  Eye,
  AlertTriangle,
  Loader2,
  Shield,
  Building,
  CreditCard,
  Award
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

const REQUIRED_DOCUMENTS = [
  { 
    id: "rc_pro", 
    name: "Attestation d'assurance RC Pro", 
    description: "Responsabilité civile professionnelle en cours de validité",
    required: true,
    icon: Shield
  },
  { 
    id: "decennale", 
    name: "Garantie décennale", 
    description: "Attestation de garantie décennale en cours de validité",
    required: true,
    icon: Shield
  },
  { 
    id: "kbis", 
    name: "Extrait KBIS ou INSEE", 
    description: "Document de moins de 3 mois",
    required: true,
    icon: Building
  },
  { 
    id: "identite", 
    name: "Pièce d'identité (recto/verso)", 
    description: "Carte d'identité ou passeport valide",
    required: true,
    icon: CreditCard
  },
  { 
    id: "certifications", 
    name: "Qualifications / Certifications", 
    description: "RGE, Qualibat, ou autres certifications professionnelles",
    required: false,
    icon: Award
  },
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
        label: "En attente de vérification", 
        icon: Clock, 
        className: "bg-accent/20 text-accent border-0" 
      };
    case "rejected":
      return { 
        label: "Refusé", 
        icon: XCircle, 
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
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

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
    mutationFn: async ({ file, documentType, documentName }: { file: File; documentType: string; documentName: string }) => {
      if (!artisan?.id) throw new Error("Artisan non trouvé");
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      console.log("Uploading to path:", filePath);
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from("artisan-documents")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw new Error(`Erreur de stockage: ${uploadError.message}`);
      }
      
      console.log("Upload successful:", uploadData);

      // Insert document record with document type as name
      const { data: insertedDoc, error: insertError } = await supabase
        .from("artisan_documents")
        .insert({
          artisan_id: artisan.id,
          name: documentType,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          status: "pending"
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("Database insert error:", insertError);
        throw new Error(`Erreur base de données: ${insertError.message}`);
      }

      // Check if ALL 4 mandatory documents are now present
      const mandatoryDocIds = ["rc_pro", "decennale", "kbis", "identite"];
      const { data: allDocs } = await supabase
        .from("artisan_documents")
        .select("name")
        .eq("artisan_id", artisan.id);

      const uploadedMandatoryCount = mandatoryDocIds.filter(docId => 
        allDocs?.some(d => d.name === docId)
      ).length;

      // Only notify admin when ALL 4 mandatory documents are complete
      if (uploadedMandatoryCount === mandatoryDocIds.length) {
        const { data: admins } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "admin");

        if (admins && admins.length > 0) {
          for (const admin of admins) {
            await supabase.rpc("create_notification", {
              p_user_id: admin.user_id,
              p_type: "documents_complete",
              p_title: "Dossier complet à valider",
              p_message: `L'artisan ${artisan.business_name} a soumis tous ses documents obligatoires`,
              p_related_id: artisan.id
            });
          }
        }
      }

      return { documentType, allDocsComplete: uploadedMandatoryCount === mandatoryDocIds.length };
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["artisan-documents"] });
      toast.success("Document téléchargé avec succès");
      
      if (data?.allDocsComplete) {
        toast.success(
          "🎉 Tous vos documents obligatoires sont téléchargés ! Rendez-vous sur votre Tableau de bord pour demander l'approbation.",
          { duration: 8000 }
        );
      }
    },
    onError: (error: Error) => {
      console.error("Upload error details:", error);
      toast.error(error.message || "Erreur lors du téléchargement");
    }
  });


  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: typeof REQUIRED_DOCUMENTS[0]) => {
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

    setUploadingDocType(docType.id);
    await uploadMutation.mutateAsync({ 
      file, 
      documentType: docType.id,
      documentName: docType.name 
    });
    setUploadingDocType(null);

    // Reset file input
    const inputRef = fileInputRefs.current[docType.id];
    if (inputRef) {
      inputRef.value = "";
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

  // Get document for a specific type
  const getDocumentForType = (typeId: string): DocumentRecord | undefined => {
    return documents.find(d => d.name === typeId);
  };

  // Calculate mandatory documents count
  const mandatoryDocs = REQUIRED_DOCUMENTS.filter(d => d.required);
  const uploadedMandatoryCount = mandatoryDocs.filter(docType => 
    documents.some(d => d.name === docType.id)
  ).length;
  const allMandatoryUploaded = uploadedMandatoryCount === mandatoryDocs.length;

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-background pt-28 lg:pt-20">
        <ArtisanSidebar />
      
        <div className="flex-1 flex flex-col">
          <DashboardHeader 
            title="Documents" 
            subtitle="Téléchargez vos documents professionnels pour valider votre profil"
          />

          <main className="flex-1 p-3 md:p-6 pb-24 lg:pb-6 overflow-auto">
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Progress Alert */}
              <div className={`rounded-xl border p-4 ${
                allMandatoryUploaded 
                  ? "bg-success/10 border-success/30" 
                  : "bg-amber-500/10 border-amber-500/30"
              }`}>
                <div className="flex items-start gap-3">
                  {allMandatoryUploaded ? (
                    <CheckCircle className="w-5 h-5 text-success mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className={`font-medium ${allMandatoryUploaded ? "text-success" : "text-amber-700"}`}>
                      {allMandatoryUploaded 
                        ? "Tous les documents obligatoires ont été téléchargés !" 
                        : `Documents obligatoires : ${uploadedMandatoryCount}/${mandatoryDocs.length} téléchargés`
                      }
                    </p>
                    <p className={`text-sm ${allMandatoryUploaded ? "text-success/80" : "text-amber-600"}`}>
                      {allMandatoryUploaded 
                        ? "Vos documents sont en cours de vérification par notre équipe."
                        : "Vous devez télécharger les 4 documents obligatoires pour pouvoir demander l'approbation de votre profil."
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Document Cards Grid */}
              {isLoading ? (
                <div className="p-12 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {REQUIRED_DOCUMENTS.map((docType) => {
                    const uploadedDoc = getDocumentForType(docType.id);
                    const hasDocument = !!uploadedDoc;
                    const statusConfig = hasDocument ? getStatusConfig(uploadedDoc.status) : null;
                    const StatusIcon = statusConfig?.icon;
                    const DocIcon = docType.icon;
                    const isUploading = uploadingDocType === docType.id;

                    return (
                      <div 
                        key={docType.id} 
                        className={`bg-card rounded-xl border p-5 transition-all ${
                          hasDocument 
                            ? "border-border" 
                            : docType.required 
                              ? "border-amber-500/30 border-dashed" 
                              : "border-border border-dashed"
                        }`}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                              hasDocument ? "bg-primary/10" : "bg-muted"
                            }`}>
                              <DocIcon className={`w-5 h-5 ${hasDocument ? "text-primary" : "text-muted-foreground"}`} />
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground">{docType.name}</h4>
                              <p className="text-sm text-muted-foreground">{docType.description}</p>
                            </div>
                          </div>
                          <Badge variant={docType.required ? "destructive" : "secondary"} className="shrink-0">
                            {docType.required ? "Obligatoire" : "Facultatif"}
                          </Badge>
                        </div>

                        {/* Content based on state */}
                        {hasDocument ? (
                          <div className="space-y-3">
                            {/* Status */}
                            <div className="flex items-center gap-2">
                              <Badge className={statusConfig?.className}>
                                {StatusIcon && <StatusIcon className="w-3 h-3 mr-1" />}
                                {statusConfig?.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(uploadedDoc.created_at).toLocaleDateString("fr-FR")}
                              </span>
                            </div>

                            {/* File info */}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <FileText className="w-4 h-4" />
                              <span className="truncate">{uploadedDoc.file_name}</span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleView(uploadedDoc)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Voir
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <input
                              ref={(el) => { fileInputRefs.current[docType.id] = el; }}
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.webp"
                              onChange={(e) => handleUpload(e, docType)}
                              className="hidden"
                            />
                            <Button 
                              variant={docType.required ? "gold" : "outline"}
                              className="w-full"
                              onClick={() => fileInputRefs.current[docType.id]?.click()}
                              disabled={isUploading}
                            >
                              {isUploading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Upload className="w-4 h-4 mr-2" />
                              )}
                              Télécharger
                            </Button>
                            <p className="text-xs text-muted-foreground text-center mt-2">
                              PDF, JPG ou PNG (max 10 Mo)
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};
