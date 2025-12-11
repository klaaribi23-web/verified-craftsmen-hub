-- Create storage bucket for artisan documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('artisan-documents', 'artisan-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for artisan documents bucket
CREATE POLICY "Artisans can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'artisan-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Artisans can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'artisan-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Artisans can delete their own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'artisan-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can manage all documents"
ON storage.objects FOR ALL
USING (
  bucket_id = 'artisan-documents' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Create table to track document metadata
CREATE TABLE IF NOT EXISTS public.artisan_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artisan_id UUID NOT NULL REFERENCES public.artisans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.artisan_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for artisan_documents
CREATE POLICY "Artisans can view their own documents"
ON public.artisan_documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.artisans 
    WHERE artisans.id = artisan_documents.artisan_id 
    AND artisans.user_id = auth.uid()
  )
);

CREATE POLICY "Artisans can insert their own documents"
ON public.artisan_documents FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.artisans 
    WHERE artisans.id = artisan_documents.artisan_id 
    AND artisans.user_id = auth.uid()
  )
);

CREATE POLICY "Artisans can delete their own documents"
ON public.artisan_documents FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.artisans 
    WHERE artisans.id = artisan_documents.artisan_id 
    AND artisans.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all artisan documents"
ON public.artisan_documents FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_artisan_documents_updated_at
BEFORE UPDATE ON public.artisan_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();