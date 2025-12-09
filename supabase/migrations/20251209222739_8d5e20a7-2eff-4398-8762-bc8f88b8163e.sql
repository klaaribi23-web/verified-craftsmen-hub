-- Create storage bucket for artisan portfolios
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'artisan-portfolios', 
  'artisan-portfolios', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4']
);

-- Allow authenticated users to upload their own files
CREATE POLICY "Artisans can upload their own portfolio files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'artisan-portfolios' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own files
CREATE POLICY "Artisans can update their own portfolio files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'artisan-portfolios' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Artisans can delete their own portfolio files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'artisan-portfolios' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access (portfolios are public)
CREATE POLICY "Public can view portfolio files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'artisan-portfolios');