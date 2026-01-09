-- Create function to validate artisan description
CREATE OR REPLACE FUNCTION public.validate_artisan_description()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check description length (max 320 characters)
  IF NEW.description IS NOT NULL AND length(NEW.description) > 320 THEN
    RAISE EXCEPTION 'La description ne peut pas dépasser 320 caractères';
  END IF;
  
  -- Check for URLs in description
  IF NEW.description IS NOT NULL AND NEW.description ~* '(https?://|www\.|\.com|\.fr|\.net|\.org|\.io)' THEN
    RAISE EXCEPTION 'Les liens ne sont pas autorisés dans la description';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on artisans table
DROP TRIGGER IF EXISTS validate_artisan_description_trigger ON public.artisans;
CREATE TRIGGER validate_artisan_description_trigger
  BEFORE INSERT OR UPDATE ON public.artisans
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_artisan_description();