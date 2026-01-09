-- Table pour gérer l'archivage des conversations par utilisateur
CREATE TABLE public.conversation_archives (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  archived_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_profile_id, participant_id)
);

-- Enable RLS
ALTER TABLE public.conversation_archives ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only manage their own archives
CREATE POLICY "Users can manage their own archives"
  ON public.conversation_archives
  FOR ALL
  USING (user_profile_id = public.get_my_profile_id())
  WITH CHECK (user_profile_id = public.get_my_profile_id());