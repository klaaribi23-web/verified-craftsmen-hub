-- ============================================
-- PHASE 1: Stories Feature - Database Setup
-- ============================================

-- 1. Create artisan_stories table
CREATE TABLE public.artisan_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID NOT NULL REFERENCES public.artisans(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  duration INTEGER, -- durée en secondes pour les vidéos (max 20)
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours')
);

-- Index pour optimiser les requêtes fréquentes
CREATE INDEX idx_artisan_stories_artisan_id ON public.artisan_stories(artisan_id);
CREATE INDEX idx_artisan_stories_expires_at ON public.artisan_stories(expires_at);

-- Activer Row Level Security
ALTER TABLE public.artisan_stories ENABLE ROW LEVEL SECURITY;

-- 2. Create story_views table (pour les vues uniques)
CREATE TABLE public.story_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.artisan_stories(id) ON DELETE CASCADE,
  viewer_ip TEXT, -- pour visiteurs non connectés
  viewer_id UUID, -- pour utilisateurs connectés
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_story_views_story_id ON public.story_views(story_id);

-- Contraintes d'unicité pour éviter les vues dupliquées
CREATE UNIQUE INDEX idx_story_views_unique_ip ON public.story_views(story_id, viewer_ip) WHERE viewer_ip IS NOT NULL;
CREATE UNIQUE INDEX idx_story_views_unique_user ON public.story_views(story_id, viewer_id) WHERE viewer_id IS NOT NULL;

-- Activer Row Level Security
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. RLS Policies for artisan_stories
-- ============================================

-- Stories visibles par tout le monde (non expirées)
CREATE POLICY "Stories are viewable by everyone"
ON public.artisan_stories FOR SELECT
USING (expires_at > now());

-- Artisans peuvent créer leurs propres stories
CREATE POLICY "Artisans can create their own stories"
ON public.artisan_stories FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.artisans
    WHERE artisans.id = artisan_stories.artisan_id
    AND artisans.user_id = auth.uid()
  )
);

-- Artisans peuvent supprimer leurs propres stories
CREATE POLICY "Artisans can delete their own stories"
ON public.artisan_stories FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.artisans
    WHERE artisans.id = artisan_stories.artisan_id
    AND artisans.user_id = auth.uid()
  )
);

-- Admins peuvent tout gérer
CREATE POLICY "Admins can manage all stories"
ON public.artisan_stories FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- 4. RLS Policies for story_views
-- ============================================

-- Tout le monde peut enregistrer une vue
CREATE POLICY "Anyone can insert story views"
ON public.story_views FOR INSERT
WITH CHECK (true);

-- Seuls les artisans propriétaires peuvent voir les stats de leurs stories
CREATE POLICY "Artisans can view their story views"
ON public.story_views FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.artisan_stories s
    JOIN public.artisans a ON a.id = s.artisan_id
    WHERE s.id = story_views.story_id
    AND a.user_id = auth.uid()
  )
);

-- Admins peuvent tout voir
CREATE POLICY "Admins can view all story views"
ON public.story_views FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- 5. Storage bucket for stories
-- ============================================

-- Créer le bucket public pour les stories (50MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('artisan-stories', 'artisan-stories', true, 52428800);

-- Politique : Lecture publique
CREATE POLICY "Public can view story files"
ON storage.objects FOR SELECT
USING (bucket_id = 'artisan-stories');

-- Politique : Artisans peuvent uploader leurs stories
CREATE POLICY "Artisans can upload story files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'artisan-stories'
  AND auth.role() = 'authenticated'
);

-- Politique : Artisans peuvent supprimer leurs stories
CREATE POLICY "Artisans can delete their story files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'artisan-stories'
  AND auth.role() = 'authenticated'
);

-- ============================================
-- 6. Function to increment story views safely
-- ============================================

CREATE OR REPLACE FUNCTION public.increment_story_views(story_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.artisan_stories
  SET views_count = views_count + 1
  WHERE id = story_id_param
  AND expires_at > now();
END;
$$;