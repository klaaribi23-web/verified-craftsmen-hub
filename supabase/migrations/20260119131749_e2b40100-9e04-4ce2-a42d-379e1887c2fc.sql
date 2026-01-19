-- =====================================================
-- PHASE 1: Sécuriser la vue public_artisans
-- =====================================================

-- Supprimer l'ancienne vue
DROP VIEW IF EXISTS public.public_artisans;

-- Recréer la vue SANS les données sensibles (stripe_customer_id, insurance_number)
CREATE VIEW public.public_artisans WITH (security_invoker = on) AS
SELECT 
    id,
    business_name,
    description,
    city,
    department,
    region,
    postal_code,
    address,
    phone,
    email,
    siret,
    photo_url,
    portfolio_images,
    portfolio_videos,
    category_id,
    rating,
    review_count,
    experience_years,
    hourly_rate,
    is_verified,
    missions_completed,
    status,
    working_hours,
    qualifications,
    facebook_url,
    instagram_url,
    linkedin_url,
    website_url,
    slug,
    google_id,
    google_maps_url,
    google_rating,
    google_review_count,
    subscription_tier,
    display_priority,
    latitude,
    longitude,
    intervention_radius,
    profile_id,
    user_id,
    created_at,
    updated_at
FROM artisans
WHERE status IN ('active'::artisan_status, 'prospect'::artisan_status, 'pending'::artisan_status);

-- =====================================================
-- PHASE 2: Table de suivi des tentatives de connexion
-- =====================================================

CREATE TABLE IF NOT EXISTS public.login_attempts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email text NOT NULL,
    ip_address text,
    user_agent text,
    attempted_at timestamptz DEFAULT now(),
    success boolean DEFAULT false
);

-- Index pour recherche rapide par IP et email
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time ON login_attempts(ip_address, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time ON login_attempts(email, attempted_at DESC);

-- RLS sur login_attempts - seuls les admins peuvent lire
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view login attempts"
    ON public.login_attempts
    FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert login attempts"
    ON public.login_attempts
    FOR INSERT
    WITH CHECK (true);

-- Fonction pour nettoyer les anciennes tentatives (+ de 24h)
CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.login_attempts
    WHERE attempted_at < now() - interval '24 hours';
END;
$$;

-- Fonction pour vérifier si une IP est bloquée
CREATE OR REPLACE FUNCTION public.is_ip_blocked(p_ip_address text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    failed_count integer;
BEGIN
    -- Compter les échecs dans les 15 dernières minutes
    SELECT COUNT(*) INTO failed_count
    FROM public.login_attempts
    WHERE ip_address = p_ip_address
    AND success = false
    AND attempted_at > now() - interval '15 minutes';
    
    -- Bloquer si plus de 5 échecs
    RETURN failed_count >= 5;
END;
$$;

-- =====================================================
-- PHASE 3: Table de logs de sécurité
-- =====================================================

CREATE TABLE IF NOT EXISTS public.security_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid,
    action text NOT NULL,
    ip_address text,
    user_agent text,
    details jsonb,
    severity text DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    created_at timestamptz DEFAULT now()
);

-- Index pour recherche par user_id et action
CREATE INDEX IF NOT EXISTS idx_security_logs_user ON security_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON security_logs(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_action ON security_logs(action, created_at DESC);

-- RLS sur security_logs - seuls les admins peuvent lire
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view security logs"
    ON public.security_logs
    FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert security logs"
    ON public.security_logs
    FOR INSERT
    WITH CHECK (true);

-- Fonction pour ajouter un log de sécurité
CREATE OR REPLACE FUNCTION public.add_security_log(
    p_user_id uuid,
    p_action text,
    p_ip_address text DEFAULT NULL,
    p_user_agent text DEFAULT NULL,
    p_details jsonb DEFAULT NULL,
    p_severity text DEFAULT 'info'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_log_id uuid;
BEGIN
    INSERT INTO public.security_logs (user_id, action, ip_address, user_agent, details, severity)
    VALUES (p_user_id, p_action, p_ip_address, p_user_agent, p_details, p_severity)
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$;

-- Fonction pour nettoyer les vieux logs (+ de 90 jours)
CREATE OR REPLACE FUNCTION public.cleanup_old_security_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.security_logs
    WHERE created_at < now() - interval '90 days';
END;
$$;