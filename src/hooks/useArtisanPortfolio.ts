import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const MAX_PHOTOS = 12;
const MAX_VIDEOS = 6;
const BUCKET_NAME = "artisan-portfolios";

export const useArtisanPortfolio = () => {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [artisanId, setArtisanId] = useState<string | null>(null);

  // Fetch artisan data on mount
  useEffect(() => {
    const fetchArtisanData = async () => {
      if (!user?.id) {
        setIsLoading(false);
        console.log("not work");
        return;
      }

      try {
        const { data: artisan, error } = await supabase
          .from("artisans")
          .select("id, portfolio_images, portfolio_videos")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error fetching artisan:", error);
          setIsLoading(false);
          return;
        }

        if (artisan) {
          setArtisanId(artisan.id);
          setPhotos(artisan.portfolio_images || []);
          setVideos(artisan.portfolio_videos || []);
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArtisanData();
  }, [user?.id]);

  // Upload photo to storage
  const uploadPhoto = async (file: File): Promise<string | null> => {
    if (!user?.id) {
      toast.error("Vous devez être connecté");
      return null;
    }

    if (!artisanId) {
      toast.error("Profil artisan non trouvé");
      return null;
    }

    if (photos.length >= MAX_PHOTOS) {
      toast.error(`Maximum ${MAX_PHOTOS} photos autorisées`);
      return null;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      toast.error("Format non supporté. Utilisez JPG, PNG, WebP ou GIF");
      return null;
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${artisanId}/photos/${Date.now()}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(fileName, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast.error("Erreur lors de l'upload");
        return null;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);

      return publicUrl;
    } catch (err) {
      console.error("Error uploading photo:", err);
      toast.error("Erreur lors de l'upload");
      return null;
    }
  };

  // Upload video to storage
  const uploadVideo = async (file: File): Promise<string | null> => {
    if (!user?.id) {
      toast.error("Vous devez être connecté");
      return null;
    }

    if (!artisanId) {
      toast.error("Profil artisan non trouvé");
      return null;
    }

    if (videos.length >= MAX_VIDEOS) {
      toast.error(`Maximum ${MAX_VIDEOS} vidéos autorisées`);
      return null;
    }

    if (!file.type.includes("video/mp4")) {
      toast.error("Seuls les fichiers MP4 sont acceptés");
      return null;
    }

    const fileName = `${artisanId}/videos/${Date.now()}.mp4`;

    try {
      const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(fileName, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast.error("Erreur lors de l'upload");
        return null;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);

      return publicUrl;
    } catch (err) {
      console.error("Error uploading video:", err);
      toast.error("Erreur lors de l'upload");
      return null;
    }
  };

  // Add photo (upload + update state)
  const addPhoto = async (file: File) => {
    setIsSaving(true);
    const url = await uploadPhoto(file);
    if (url) {
      const newPhotos = [...photos, url];
      setPhotos(newPhotos);
      await saveToDatabase(newPhotos, videos);
      toast.success("Photo ajoutée");
    }
    setIsSaving(false);
  };

  // Add video URL (YouTube/Vimeo)
  const addVideoUrl = async (url: string) => {
    if (videos.length >= MAX_VIDEOS) {
      toast.error(`Maximum ${MAX_VIDEOS} vidéos autorisées`);
      return;
    }

    if (videos.includes(url)) {
      toast.error("Cette vidéo existe déjà");
      return;
    }

    setIsSaving(true);
    const newVideos = [...videos, url];
    setVideos(newVideos);
    await saveToDatabase(photos, newVideos);
    toast.success("Vidéo ajoutée");
    setIsSaving(false);
  };

  // Add video file (upload + update state)
  const addVideoFile = async (file: File) => {
    setIsSaving(true);
    const url = await uploadVideo(file);
    if (url) {
      const newVideos = [...videos, url];
      setVideos(newVideos);
      await saveToDatabase(photos, newVideos);
      toast.success("Vidéo téléchargée");
    }
    setIsSaving(false);
  };

  // Remove photo
  const removePhoto = async (index: number) => {
    const photoUrl = photos[index];
    setIsSaving(true);

    // Try to delete from storage if it's a storage URL
    if (photoUrl.includes(BUCKET_NAME)) {
      try {
        const path = photoUrl.split(`${BUCKET_NAME}/`)[1];
        if (path) {
          await supabase.storage.from(BUCKET_NAME).remove([path]);
        }
      } catch (err) {
        console.error("Error deleting file from storage:", err);
      }
    }

    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    await saveToDatabase(newPhotos, videos);
    toast.success("Photo supprimée");
    setIsSaving(false);
  };

  // Remove video
  const removeVideo = async (index: number) => {
    const videoUrl = videos[index];
    setIsSaving(true);

    // Try to delete from storage if it's a storage URL
    if (videoUrl.includes(BUCKET_NAME)) {
      try {
        const path = videoUrl.split(`${BUCKET_NAME}/`)[1];
        if (path) {
          await supabase.storage.from(BUCKET_NAME).remove([path]);
        }
      } catch (err) {
        console.error("Error deleting file from storage:", err);
      }
    }

    const newVideos = videos.filter((_, i) => i !== index);
    setVideos(newVideos);
    await saveToDatabase(photos, newVideos);
    toast.success("Vidéo supprimée");
    setIsSaving(false);
  };

  // Save to database
  const saveToDatabase = async (newPhotos: string[], newVideos: string[]) => {
    if (!artisanId) return;

    try {
      const { error } = await supabase
        .from("artisans")
        .update({
          portfolio_images: newPhotos,
          portfolio_videos: newVideos,
        })
        .eq("id", artisanId);

      if (error) {
        console.error("Error saving to database:", error);
        toast.error("Erreur lors de la sauvegarde");
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  return {
    photos,
    videos,
    isLoading,
    isSaving,
    addPhoto,
    addVideoUrl,
    addVideoFile,
    removePhoto,
    removeVideo,
    maxPhotos: MAX_PHOTOS,
    maxVideos: MAX_VIDEOS,
  };
};
