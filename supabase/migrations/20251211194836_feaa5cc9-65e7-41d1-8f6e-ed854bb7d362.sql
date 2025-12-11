-- Ajouter nouveaux statuts de mission
ALTER TYPE mission_status ADD VALUE IF NOT EXISTS 'pending_approval';
ALTER TYPE mission_status ADD VALUE IF NOT EXISTS 'rejected';
ALTER TYPE mission_status ADD VALUE IF NOT EXISTS 'published';

-- Ajouter colonne pour le motif de refus
ALTER TABLE missions ADD COLUMN IF NOT EXISTS rejection_reason TEXT;