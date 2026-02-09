
-- Table for expert call requests (energy savings, state aids consultations)
CREATE TABLE public.expert_calls (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom text,
  prenom text,
  telephone text,
  email text,
  ville text,
  code_postal text,
  type_demande text NOT NULL DEFAULT 'energie',
  description text,
  source_page text,
  conversation_id text,
  status text NOT NULL DEFAULT 'nouveau',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.expert_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all expert_calls"
  ON public.expert_calls FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can insert expert_calls"
  ON public.expert_calls FOR INSERT
  WITH CHECK (auth.role() = 'service_role'::text);
