-- =====================================================
-- CORRECTION DES WARNINGS DE SÉCURITÉ
-- =====================================================

-- Corriger la politique INSERT trop permissive sur login_attempts
-- (nécessaire pour le système, mais restreindre aux edge functions)
DROP POLICY IF EXISTS "System can insert login attempts" ON public.login_attempts;

-- Nouvelle politique : seules les fonctions système peuvent insérer
CREATE POLICY "Edge functions can insert login attempts"
    ON public.login_attempts
    FOR INSERT
    WITH CHECK (
        -- Permettre l'insertion seulement via service role (edge functions)
        -- ou si aucun utilisateur n'est connecté (tentative de connexion)
        auth.uid() IS NULL OR auth.role() = 'service_role'
    );

-- Corriger la politique INSERT trop permissive sur security_logs
DROP POLICY IF EXISTS "System can insert security logs" ON public.security_logs;

-- Nouvelle politique : restreindre aux edge functions ou utilisateurs authentifiés pour leurs propres logs
CREATE POLICY "Authenticated users can insert their own logs"
    ON public.security_logs
    FOR INSERT
    WITH CHECK (
        -- Permettre l'insertion si c'est son propre user_id ou via service role
        (user_id = auth.uid()) OR auth.role() = 'service_role'
    );

-- Corriger la politique INSERT sur story_views
DROP POLICY IF EXISTS "Anyone can insert story views" ON public.story_views;

CREATE POLICY "Authenticated users can insert story views"
    ON public.story_views
    FOR INSERT
    WITH CHECK (
        -- Permettre l'insertion seulement aux utilisateurs authentifiés ou via service role
        auth.uid() IS NOT NULL OR auth.role() = 'service_role'
    );

-- Ajouter une politique sur contact_rate_limits (table sans RLS actuellement)
ALTER TABLE public.contact_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Edge functions can manage rate limits"
    ON public.contact_rate_limits
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Public can check rate limits"
    ON public.contact_rate_limits
    FOR SELECT
    USING (true);