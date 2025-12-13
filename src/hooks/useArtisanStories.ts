import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useArtisanProfile } from "./useArtisanProfile";
import { toast } from "sonner";

export interface ArtisanStory {
  id: string;
  artisan_id: string;
  media_url: string;
  media_type: string;
  duration: number | null;
  views_count: number;
  caption: string | null;
  created_at: string;
  expires_at: string;
}

export const useArtisanStories = () => {
  const queryClient = useQueryClient();
  const { artisan } = useArtisanProfile();
  const [isUploading, setIsUploading] = useState(false);

  // Fetch stories for the current artisan
  const { data: stories = [], isLoading, error } = useQuery({
    queryKey: ["artisan-stories", artisan?.id],
    queryFn: async () => {
      if (!artisan?.id) return [];
      
      const { data, error } = await supabase
        .from("artisan_stories")
        .select("*")
        .eq("artisan_id", artisan.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as ArtisanStory[];
    },
    enabled: !!artisan?.id,
  });

  // Filter active stories (not expired)
  const activeStories = stories.filter(
    (story) => new Date(story.expires_at) > new Date()
  );

  // Filter expired stories
  const expiredStories = stories.filter(
    (story) => new Date(story.expires_at) <= new Date()
  );

  // Upload a new story (accepts File or Blob)
  const uploadStory = async (file: File | Blob, caption?: string) => {
    if (!artisan?.id) {
      toast.error("Profil artisan non trouvé");
      return null;
    }

    setIsUploading(true);
    try {
      // Determine file extension and media type
      let fileExt = "jpg";
      let mediaType: "image" | "video" = "image";
      
      if (file instanceof File) {
        fileExt = file.name.split(".").pop() || "jpg";
        mediaType = file.type.startsWith("video/") ? "video" : "image";
      } else {
        // Blob from camera capture
        mediaType = file.type.startsWith("video/") ? "video" : "image";
        fileExt = mediaType === "video" ? "webm" : "jpg";
      }
      
      const fileName = `${artisan.id}/${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("artisan-stories")
        .upload(fileName, file, {
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("artisan-stories")
        .getPublicUrl(fileName);

      // Insert story record
      const { data, error: insertError } = await supabase
        .from("artisan_stories")
        .insert({
          artisan_id: artisan.id,
          media_url: urlData.publicUrl,
          media_type: mediaType,
          duration: mediaType === "video" ? 15 : 5,
          caption: caption || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      queryClient.invalidateQueries({ queryKey: ["artisan-stories", artisan.id] });
      toast.success("Story publiée avec succès !");
      return data;
    } catch (error: any) {
      console.error("Error uploading story:", error);
      toast.error("Erreur lors de la publication de la story");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Delete a story
  const deleteStoryMutation = useMutation({
    mutationFn: async (storyId: string) => {
      const story = stories.find((s) => s.id === storyId);
      if (!story) throw new Error("Story non trouvée");

      // Extract file path from URL
      const urlParts = story.media_url.split("/artisan-stories/");
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from("artisan-stories").remove([filePath]);
      }

      // Delete story record
      const { error } = await supabase
        .from("artisan_stories")
        .delete()
        .eq("id", storyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artisan-stories", artisan?.id] });
      toast.success("Story supprimée");
    },
    onError: (error: any) => {
      console.error("Error deleting story:", error);
      toast.error("Erreur lors de la suppression");
    },
  });

  return {
    stories,
    activeStories,
    expiredStories,
    isLoading,
    error,
    isUploading,
    uploadStory,
    deleteStory: deleteStoryMutation.mutate,
    isDeleting: deleteStoryMutation.isPending,
  };
};
