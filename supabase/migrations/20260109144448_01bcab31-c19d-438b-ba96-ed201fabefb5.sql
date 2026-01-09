-- Set default intervention_radius to 50km for all new artisans
ALTER TABLE artisans ALTER COLUMN intervention_radius SET DEFAULT 50;

-- Update existing artisans without intervention_radius to 50km
UPDATE artisans SET intervention_radius = 50 WHERE intervention_radius IS NULL;