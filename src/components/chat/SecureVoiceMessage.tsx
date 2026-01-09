import { useSignedAttachmentUrl } from "@/hooks/useSignedAttachmentUrl";
import { VoiceMessage } from "./VoiceMessage";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SecureVoiceMessageProps {
  audioUrl: string | null | undefined;
  duration?: number;
  isOwn?: boolean;
}

export const SecureVoiceMessage = ({ audioUrl, duration = 0, isOwn = false }: SecureVoiceMessageProps) => {
  const { signedUrl, isLoading } = useSignedAttachmentUrl(audioUrl);

  if (isLoading) {
    return (
      <div className={cn(
        "flex items-center gap-2 p-2.5 rounded-2xl min-w-[220px] max-w-[300px] shadow-sm",
        isOwn 
          ? "bg-primary text-primary-foreground" 
          : "bg-muted text-foreground"
      )}>
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Chargement...</span>
      </div>
    );
  }

  if (!signedUrl) {
    return (
      <div className={cn(
        "flex items-center gap-2 p-2.5 rounded-2xl min-w-[220px] max-w-[300px] shadow-sm",
        isOwn 
          ? "bg-primary text-primary-foreground" 
          : "bg-muted text-foreground"
      )}>
        <span className="text-sm">Message vocal non disponible</span>
      </div>
    );
  }

  return <VoiceMessage audioUrl={signedUrl} duration={duration} isOwn={isOwn} />;
};
