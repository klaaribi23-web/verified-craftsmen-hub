import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useSignedAttachmentUrl = (storedUrl: string | null | undefined) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!storedUrl) {
      setSignedUrl(null);
      return;
    }

    const generateSignedUrl = async () => {
      setIsLoading(true);
      try {
        // Try to extract path from URL - handles both signed and public URLs
        const urlObj = new URL(storedUrl);
        const pathMatch = urlObj.pathname.match(/\/message-attachments\/(.+)/);
        
        if (pathMatch && pathMatch[1]) {
          // Remove any query params from the path
          const filePath = decodeURIComponent(pathMatch[1].split('?')[0]);
          
          const { data, error } = await supabase.storage
            .from("message-attachments")
            .createSignedUrl(filePath, 3600); // 1 hour validity

          if (!error && data?.signedUrl) {
            setSignedUrl(data.signedUrl);
            return;
          }
        }
        
        // Fallback: use original URL (for backwards compatibility)
        setSignedUrl(storedUrl);
      } catch (err) {
        console.error("Error generating signed URL:", err);
        setSignedUrl(storedUrl);
      } finally {
        setIsLoading(false);
      }
    };

    generateSignedUrl();
  }, [storedUrl]);

  return { signedUrl, isLoading };
};
