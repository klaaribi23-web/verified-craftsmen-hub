import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/admin-dashboard/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  FileText,
  Loader2,
  Download,
  Filter
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";

interface DocumentRecord {
  id: string;
  artisan_id: string;
  name: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  status: string;
  expiry_date: string | null;
  created_at: string;
  artisan: {
    business_name: string;
    city: string;
    user_id: string;
  };
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case "verified":
      return { 
        label: "Vérifié", 
        icon: CheckCircle, 
        className: "bg-success/20 text-success border-0" 
      };
    case "rejected":
      return { 
        label: "Rejeté", 
        icon: XCircle, 
        className: "bg-destructive/20 text-destructive border-0" 
      };
    case "pending":
    default:
      return { 
        label: "En attente", 
        icon: Clock, 
        className: "bg-accent/20 text-accent border-0" 
      };
  }
};

const AdminDocuments = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Fetch all documents with artisan info
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["admin-documents", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("artisan_documents")
        .select(`
          *,
          artisan:artisans(business_name, city, user_id)
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DocumentRecord[];
    }
  });

  // Approve document mutation
  const approveMutation = useMutation({
    mutationFn: async (doc: DocumentRecord) => {
      const { error } = await supabase
        .from("artisan_documents")
        .update({ status: "verified" })
        .eq("id", doc.id);

      if (error) throw error;

      // Send notification to artisan using secure RPC
      if (doc.artisan?.user_id) {
        await supabase.rpc("create_notification", {
          p_user_id: doc.artisan.user_id,
          p_type: "document_approved",
          p_title: "Document vérifié",
          p_message: `Votre document "${doc.name}" a été vérifié et approuvé.`,
          p_related_id: null
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-documents"] });
      toast.success("Document approuvé");
      setSelectedDoc(null);
    },
    onError: () => {
      toast.error("Erreur lors de l'approbation");
    }
  });

  // Reject document mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ doc, reason }: { doc: DocumentRecord; reason: string }) => {
      const { error } = await supabase
        .from("artisan_documents")
        .update({ status: "rejected" })
        .eq("id", doc.id);

      if (error) throw error;

      // Send notification to artisan using secure RPC
      if (doc.artisan?.user_id) {
        await supabase.rpc("create_notification", {
          p_user_id: doc.artisan.user_id,
          p_type: "document_rejected",
          p_title: "Document refusé",
          p_message: `Votre document "${doc.name}" a été refusé. Raison : ${reason}`,
          p_related_id: null
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-documents"] });
      toast.success("Document refusé");
      setShowRejectDialog(false);
      setSelectedDoc(null);
      setRejectReason("");
    },
    onError: () => {
      toast.error("Erreur lors du refus");
    }
  });

  const handleView = async (doc: DocumentRecord) => {
    // Admin needs to access via service role or signed URL
    const { data } = await supabase.storage
      .from("artisan-documents")
      .createSignedUrl(doc.file_path, 3600);

    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    } else {
      toast.error("Impossible d'ouvrir le document");
    }
  };

  const handleDownload = async (doc: DocumentRecord) => {
    const { data } = await supabase.storage
      .from("artisan-documents")
      .createSignedUrl(doc.file_path, 3600);

    if (data?.signedUrl) {
      const link = document.createElement("a");
      link.href = data.signedUrl;
      link.download = doc.file_name;
      link.click();
    } else {
      toast.error("Impossible de télécharger le document");
    }
  };

  const pendingCount = documents.filter(d => d.status === "pending").length;

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-background pt-16 lg:pt-20">
        <AdminSidebar />
        
        <main className="flex-1 p-8">
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Documents artisans</h1>
              <p className="text-muted-foreground mt-1">
                Vérifiez et validez les documents professionnels
                {pendingCount > 0 && (
                  <Badge className="ml-2 bg-accent/20 text-accent">
                    {pendingCount} en attente
                  </Badge>
                )}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les documents</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="verified">Vérifiés</SelectItem>
                  <SelectItem value="rejected">Refusés</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : documents.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-12 text-center">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Aucun document</h3>
              <p className="text-muted-foreground">
                {statusFilter === "all" 
                  ? "Aucun document n'a été soumis pour le moment."
                  : `Aucun document avec le statut "${statusFilter}".`}
              </p>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-4 font-medium text-muted-foreground">Document</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Artisan</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Statut</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
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
                                <p className="text-sm text-muted-foreground">{doc.file_name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <p className="font-medium text-foreground">{doc.artisan?.business_name}</p>
                            <p className="text-sm text-muted-foreground">{doc.artisan?.city}</p>
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
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              {doc.status === "pending" && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-success hover:text-success"
                                    onClick={() => approveMutation.mutate(doc)}
                                    disabled={approveMutation.isPending}
                                  >
                                    {approveMutation.isPending ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                    )}
                                    Valider
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => {
                                      setSelectedDoc(doc);
                                      setShowRejectDialog(true);
                                    }}
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Refuser
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reject Dialog */}
          <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Refuser le document</DialogTitle>
                <DialogDescription>
                  Expliquez à l'artisan pourquoi son document est refusé.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {selectedDoc && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium">{selectedDoc.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedDoc.artisan?.business_name}
                    </p>
                  </div>
                )}
                <Textarea
                  placeholder="Raison du refus (ex: Document illisible, document expiré, mauvais format...)"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (selectedDoc && rejectReason.trim()) {
                      rejectMutation.mutate({
                        doc: selectedDoc,
                        reason: rejectReason
                      });
                    }
                  }}
                  disabled={!rejectReason.trim() || rejectMutation.isPending}
                >
                  {rejectMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  Refuser le document
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </>
  );
};

export default AdminDocuments;