-- Create demo_profiles table for fake clients (not linked to auth.users)
CREATE TABLE public.demo_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  city TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.demo_profiles ENABLE ROW LEVEL SECURITY;

-- Allow public read for demo data
CREATE POLICY "Demo profiles are viewable by everyone" ON public.demo_profiles FOR SELECT USING (true);

-- Allow admins to manage
CREATE POLICY "Admins can manage demo profiles" ON public.demo_profiles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create demo_missions table for fake missions
CREATE TABLE public.demo_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  client_city TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id),
  budget DECIMAL(10,2),
  city TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  applicants_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.demo_missions ENABLE ROW LEVEL SECURITY;

-- Allow public read for demo data
CREATE POLICY "Demo missions are viewable by everyone" ON public.demo_missions FOR SELECT USING (true);

-- Allow admins to manage
CREATE POLICY "Admins can manage demo missions" ON public.demo_missions FOR ALL USING (public.has_role(auth.uid(), 'admin'));