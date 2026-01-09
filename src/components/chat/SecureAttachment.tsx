import { useSignedAttachmentUrl } from "@/hooks/useSignedAttachmentUrl";
import { FileText, Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SecureAttachmentProps {
  url: string | null | undefined;
  name?: string | null;
  type?: string | null;
  isOwn?: boolean;
}

export const SecureAttachment = ({ url, name, type, isOwn = false }: SecureAttachmentProps) => {
  const { signedUrl, isLoading } = useSignedAttachmentUrl(url);
  
  const isImage = type?.startsWith('image/');

  if (isLoading) {
    return (
      <div className={cn(
        "flex items-center justify-center p-4 rounded-lg",
        isOwn ? "bg-primary-foreground/10" : "bg-muted"
      )}>
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!signedUrl) {
    return (
      <div className={cn(
        "p-2 rounded-lg text-sm text-muted-foreground",
        isOwn ? "bg-primary-foreground/10" : "bg-muted"
      )}>
        Fichier non disponible
      </div>
    );
  }

  if (isImage) {
    return (
      <a href={signedUrl} target="_blank" rel="noopener noreferrer">
        <img 
          src={signedUrl} 
          alt={name || "Image"} 
          className="max-w-full rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity"
        />
      </a>
    );
  }

  return (
    <a 
      href={signedUrl} 
      target="_blank" 
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg mb-2",
        isOwn ? "bg-primary-foreground/10" : "bg-muted"
      )}
    >
      <FileText className="w-8 h-8 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name || "Fichier"}</p>
      </div>
      <Download className="w-4 h-4 flex-shrink-0" />
    </a>
  );
};
