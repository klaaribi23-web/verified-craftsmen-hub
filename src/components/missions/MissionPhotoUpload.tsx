import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface MissionPhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
  disabled?: boolean;
}

const MissionPhotoUpload = ({ photos, onPhotosChange, maxPhotos = 3, disabled = false }: MissionPhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxPhotos - photos.length;
    if (remainingSlots <= 0) {
      toast({
        title: "Limite atteinte",
        description: `Maximum ${maxPhotos} photos autorisées.`,
        variant: "destructive",
      });
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of filesToUpload) {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          toast({
            title: "Format invalide",
            description: `${file.name} n'est pas une image valide.`,
            variant: "destructive",
          });
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "Fichier trop volumineux",
            description: `${file.name} dépasse la limite de 5 Mo.`,
            variant: "destructive",
          });
          continue;
        }

        // Upload to Supabase storage
        const fileExt = file.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `mission-photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("artisan-portfolios")
          .upload(filePath, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast({
            title: "Erreur d'upload",
            description: `Impossible d'uploader ${file.name}.`,
            variant: "destructive",
          });
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("artisan-portfolios")
          .getPublicUrl(filePath);

        if (urlData?.publicUrl) {
          uploadedUrls.push(urlData.publicUrl);
        }
      }

      if (uploadedUrls.length > 0) {
        onPhotosChange([...photos, ...uploadedUrls]);
        toast({
          title: "Photos ajoutées",
          description: `${uploadedUrls.length} photo(s) ajoutée(s) avec succès.`,
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'upload.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  return (
    <div className="space-y-4">
      {/* Photo previews */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {photos.map((photo, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
              <img
                src={photo}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={disabled}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload zone */}
      {photos.length < maxPhotos && (
        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
            uploading || disabled
              ? "border-muted bg-muted/50 cursor-not-allowed"
              : "border-border hover:border-gold/50 cursor-pointer"
          }`}
          onClick={() => !uploading && !disabled && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading || disabled}
          />
          
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-muted-foreground mx-auto mb-2 animate-spin" />
              <p className="text-sm text-muted-foreground">Upload en cours...</p>
            </>
          ) : (
            <>
              <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Cliquez pour ajouter des photos
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {photos.length}/{maxPhotos} photos • JPG, PNG (max 5 Mo)
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MissionPhotoUpload;
