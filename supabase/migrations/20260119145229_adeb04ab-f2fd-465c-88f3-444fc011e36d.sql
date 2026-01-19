-- 1. Supprimer le rôle artisan incorrect sur le compte admin
DELETE FROM public.user_roles 
WHERE user_id = 'c835d495-2d1b-420b-9b64-4cf16d5f329e';

-- 2. Restaurer le rôle admin
INSERT INTO public.user_roles (user_id, role) 
VALUES ('c835d495-2d1b-420b-9b64-4cf16d5f329e', 'admin');

-- 3. Délier l'artisan Mourad Agency de votre compte admin
UPDATE public.artisans 
SET user_id = NULL, activation_token = gen_random_uuid()
WHERE id = '37142770-424b-4f48-b979-e43f9f4a0093';