-- Add 'disponible' status to artisan_status enum
ALTER TYPE public.artisan_status ADD VALUE IF NOT EXISTS 'disponible';
