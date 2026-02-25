ALTER TABLE public.artisans 
ADD COLUMN available_urgent boolean NOT NULL DEFAULT false,
ADD COLUMN available_urgent_at timestamp with time zone;