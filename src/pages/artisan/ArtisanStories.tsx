import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import { ArtisanSidebar } from "@/components/artisan-dashboard/ArtisanSidebar";
import { useArtisanStories, ArtisanStory } from "@/hooks/useArtisanStories";
import { useArtisanProfile } from "@/hooks/useArtisanProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FeatureGate } from "@/components/subscription/FeatureGate";
import StoryRecorder from "@/components/stories/StoryRecorder";
import StoryViewer from "@/components/stories/StoryViewer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, Eye, Clock, Image, Video, Loader2, Type, Camera } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export const ArtisanStories = () => {
  const {
    activeStories,
    expiredStories,
    isLoading,
    isUploading,
    uploadStory,
    deleteStory,
    isDeleting,
  } = useArtisanStories();
  
  const { artisan } = useArtisanProfile();
  const { tier, isLoading: isLoadingSubscription } = useSubscription();

  // Get category name for AI caption generation
  const { data: categoryName } = useQuery({
    queryKey: ["category-name", artisan?.category_id],
    queryFn: async () => {
      if (!artisan?.category_id) return null;
      const { data } = await supabase
        .from("categories")
        .select("name")
        .eq("id", artisan.category_id)
        .single();
      return data?.name || null;
    },
    enabled: !!artisan?.category_id,
  });
  
  const [storyToDelete, setStoryToDelete] = useState<string | null>(null);
  const [isRecorderOpen, setIsRecorderOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);

  const handlePublish = async (blob: Blob, mediaType: "image" | "video", caption?: string) => {
    await uploadStory(blob, caption);
  };

  const handleDeleteConfirm = () => {
    if (storyToDelete) {
      deleteStory(storyToDelete);
      setStoryToDelete(null);
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMins}min restantes`;
    }
    return `${diffMins}min restantes`;
  };

  const StoryCard = ({ story, isExpired = false, index }: { story: ArtisanStory; isExpired?: boolean; index: number }) => (
    <Card 
      className={`overflow-hidden group relative cursor-pointer ${isExpired ? "opacity-60" : ""}`}
      onClick={() => !isExpired && setSelectedStoryIndex(index)}
    >
      <CardContent className="p-0 relative aspect-[9/16]">
        {story.media_type === "video" ? (
          <video
            src={story.media_url}
            className="w-full h-full object-cover"
            muted
          />
        ) : (
          <img
            src={story.media_url}
            alt="Story"
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Overlay with info */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex flex-col justify-between p-3">
          {/* Top: media type indicator */}
          <div className="flex justify-between items-start">
            <div className="bg-black/50 rounded-full p-1.5">
              {story.media_type === "video" ? (
                <Video className="w-4 h-4 text-white" />
              ) : (
                <Image className="w-4 h-4 text-white" />
              )}
            </div>
            
            {/* Delete button */}
            <Button
              variant="ghost"
              size="icon"
              className="bg-black/50 hover:bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                setStoryToDelete(story.id);
              }}
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Bottom: stats and caption */}
          <div className="space-y-2">
            {/* Caption if exists */}
            {story.caption && (
              <div className="flex items-start gap-2 text-white">
                <Type className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="text-xs line-clamp-2">{story.caption}</span>
              </div>
            )}
            
            {/* Views count */}
            <div className="flex items-center gap-2 text-white">
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">{story.views_count} vues</span>
            </div>
            
            {/* Time remaining or expired */}
            <div className="flex items-center gap-2 text-white/80">
              <Clock className="w-4 h-4" />
              <span className="text-xs">
                {isExpired ? (
                  `Expirée ${formatDistanceToNow(new Date(story.expires_at), { addSuffix: true, locale: fr })}`
                ) : (
                  getTimeRemaining(story.expires_at)
                )}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Check if user has access to Stories (Essential+ tier)
  const hasStoriesAccess = tier !== "free";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex pt-28 lg:pt-20">
        <ArtisanSidebar />
        <main className="flex-1 p-3 md:p-6 pb-24 lg:pb-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                  Mes Stories
                </h1>
                <p className="text-muted-foreground mt-1">
                  Filmez vos réalisations en direct (visibles 24h)
                </p>
              </div>
              
              {hasStoriesAccess && (
                <Button
                  onClick={() => setIsRecorderOpen(true)}
                  disabled={isUploading}
                  className="gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Publication en cours...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      Filmer une story
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Feature Gate for free users */}
            {!hasStoriesAccess && !isLoadingSubscription ? (
              <FeatureGate 
                requiredTier="exclusivite" 
                feature="Stories Live"
              >
                <div />
              </FeatureGate>
            ) : isLoading || isLoadingSubscription ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Active Stories */}
                <section className="mb-10">
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
                    Stories actives ({activeStories.length})
                  </h2>
                  
                  {activeStories.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                          <Camera className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-medium text-foreground mb-2">
                          Aucune story active
                        </h3>
                        <p className="text-muted-foreground text-sm max-w-sm mb-4">
                          Filmez vos réalisations en direct pour montrer votre travail à vos clients potentiels
                        </p>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsRecorderOpen(true)}
                          className="gap-2"
                        >
                          <Camera className="w-4 h-4" />
                          Filmer ma première story
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {activeStories.map((story, index) => (
                        <StoryCard key={story.id} story={story} index={index} />
                      ))}
                    </div>
                  )}
                </section>

                {/* Expired Stories (optional display) */}
                {expiredStories.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold text-muted-foreground mb-4">
                      Stories expirées ({expiredStories.length})
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {expiredStories.map((story, index) => (
                        <StoryCard key={story.id} story={story} isExpired index={index} />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!storyToDelete} onOpenChange={() => setStoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette story ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La story sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Story Recorder */}
      {hasStoriesAccess && (
        <StoryRecorder
          isOpen={isRecorderOpen}
          onClose={() => setIsRecorderOpen(false)}
          onPublish={handlePublish}
          isUploading={isUploading}
          artisanContext={artisan ? {
            businessName: artisan.business_name,
            city: artisan.city,
            category: categoryName || undefined,
            department: artisan.department || artisan.postal_code?.substring(0, 2) || undefined,
          } : undefined}
        />
      )}

      {/* Story Viewer for full-screen preview */}
      <StoryViewer
        stories={activeStories}
        artisanName={artisan?.business_name || "Mon profil"}
        artisanPhoto={artisan?.photo_url}
        highlightCity={artisan?.city}
        initialIndex={selectedStoryIndex || 0}
        isOpen={selectedStoryIndex !== null}
        onClose={() => setSelectedStoryIndex(null)}
      />
    </div>
  );
};
