-- Ajouter les sous-catégories pour le Chasseur de Talents
INSERT INTO categories (id, name, parent_id, icon, display_order) VALUES
  ('a1000000-0000-0000-0000-000000000021', 'Panneaux solaires', 'a1000000-0000-0000-0000-000000000002', 'Sun', 10),
  ('a1000000-0000-0000-0000-000000000022', 'Pompe à chaleur', 'a1000000-0000-0000-0000-000000000004', 'Thermometer', 10),
  ('a1000000-0000-0000-0000-000000000023', 'Menuiserie PVC/Alu', 'a1000000-0000-0000-0000-000000000006', 'DoorOpen', 10)
ON CONFLICT (id) DO NOTHING;