-- Migration: Move categories from artisan_services to artisan_categories
-- 1. Insert category-based services into artisan_categories if not already present
INSERT INTO artisan_categories (artisan_id, category_id)
SELECT DISTINCT s.artisan_id, c.id
FROM artisan_services s
JOIN categories c ON LOWER(TRIM(s.title)) = LOWER(TRIM(c.name))
WHERE s.artisan_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM artisan_categories ac 
    WHERE ac.artisan_id = s.artisan_id AND ac.category_id = c.id
  );

-- 2. Delete services that are actually category names
DELETE FROM artisan_services
WHERE id IN (
  SELECT s.id
  FROM artisan_services s
  JOIN categories c ON LOWER(TRIM(s.title)) = LOWER(TRIM(c.name))
);