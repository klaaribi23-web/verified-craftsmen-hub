INSERT INTO storage.buckets (id, name, public) VALUES ('public', 'public', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access on public bucket" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'public');
CREATE POLICY "Authenticated upload to public bucket" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'public');