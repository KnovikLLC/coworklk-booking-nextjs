-- NULL = offered for every space (matches every existing addon row);
-- non-null = offered only when that specific space is selected.
ALTER TABLE addons ADD COLUMN space_id UUID NULL REFERENCES spaces(id);

-- "Additional Chair" — 5-Seater Meeting Room only, LKR 1,190.
-- Zoho item created via Books API: item_id 4944213000002421001.
INSERT INTO addons (name, description, price, zoho_item_id, category, space_id, is_active)
VALUES (
  'Additional Chair',
  'Extra chair for the 5-Seater Meeting Room',
  1190.00,
  '4944213000002421001',
  'equipment',
  '7036d73f-60a3-4711-b7db-44e1c67e3309',
  true
);
