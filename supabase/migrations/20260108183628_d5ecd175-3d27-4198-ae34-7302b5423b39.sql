-- Fonction trigger pour auto-incrémenter le compteur de candidatures
CREATE OR REPLACE FUNCTION public.increment_mission_application_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier si on doit réinitialiser le compteur (nouveau mois)
  UPDATE artisans 
  SET missions_applied_this_month = CASE 
        WHEN last_mission_reset IS NULL 
          OR date_trunc('month', last_mission_reset) != date_trunc('month', now())
        THEN 1  -- Nouveau mois, on repart à 1
        ELSE COALESCE(missions_applied_this_month, 0) + 1
      END,
      last_mission_reset = CASE 
        WHEN last_mission_reset IS NULL 
          OR date_trunc('month', last_mission_reset) != date_trunc('month', now())
        THEN now()
        ELSE last_mission_reset
      END
  WHERE id = NEW.artisan_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS on_mission_application_insert ON mission_applications;

-- Créer le trigger
CREATE TRIGGER on_mission_application_insert
AFTER INSERT ON mission_applications
FOR EACH ROW EXECUTE FUNCTION public.increment_mission_application_count();

-- Synchroniser les compteurs existants pour tous les artisans
UPDATE artisans a
SET missions_applied_this_month = (
  SELECT COUNT(*) 
  FROM mission_applications ma 
  WHERE ma.artisan_id = a.id 
  AND date_trunc('month', ma.created_at) = date_trunc('month', now())
),
last_mission_reset = now();