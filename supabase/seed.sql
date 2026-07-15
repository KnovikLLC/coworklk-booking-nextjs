-- Seed data transcribed from docs/cowork-booking-architecture.md
-- §3.2 spaces (lines 202-208), pricing (lines 229-261), addons (lines 589-598)
-- Applied automatically by `supabase db reset`.

INSERT INTO spaces (name, type, capacity, total_inventory, requires_specific_seat, image_url) VALUES
('Hot Desk', 'hot_desk', 1, 5, FALSE, '/images/spaces/hotdesks.webp'),
('Workspace Seat', 'workspace', 1, 16, FALSE, '/images/spaces/co-work-area.png'),
('4-Seater Meeting Room', 'meeting_room_4', 4, 1, TRUE, '/images/spaces/4-seater.png'),
('4-Seater Black Meeting Room', 'meeting_room_4_black', 4, 1, TRUE, '/images/spaces/meeting-rooms.png'),
('5-Seater Meeting Room', 'meeting_room_5', 5, 1, TRUE, '/images/spaces/table.png'),
('Lobby Area', 'lobby', 10, 1, TRUE, '/images/spaces/lobby.png');

-- Hot Desk pricing (mapped to Zoho)
INSERT INTO pricing (space_id, duration, price, zoho_item_id, zoho_item_name, description) VALUES
((SELECT id FROM spaces WHERE type='hot_desk'), 'half_day', 490, '4944213000001171243', 'Hot Desk - Half Daytime', '4hrs (8am-12pm or 12pm-4pm)'),
((SELECT id FROM spaces WHERE type='hot_desk'), 'full_day', 790, '4944213000001171232', 'Hot Desk Full Day', '8hrs (8am-5pm)'),
((SELECT id FROM spaces WHERE type='hot_desk'), 'unlimited', 990, '4944213000001171254', 'Hot Desk - Daily Unlimited', '12hrs (8am-8pm)');

-- Workspace pricing
INSERT INTO pricing (space_id, duration, price, zoho_item_id, zoho_item_name, description) VALUES
((SELECT id FROM spaces WHERE type='workspace'), 'half_day', 790, '4944213000000084278', 'Workspace - Half Day', '4hrs access'),
((SELECT id FROM spaces WHERE type='workspace'), 'full_day', 1000, '4944213000000084226', 'Workspace - Full Daytime', '8hrs (8am-5pm)'),
((SELECT id FROM spaces WHERE type='workspace'), 'unlimited', 1350, '4944213000000100027', 'Workspace - Daily Unlimited', '12hrs (8am-8pm)');

-- 4-Seater Meeting Room pricing
INSERT INTO pricing (space_id, duration, price, zoho_item_id, zoho_item_name, includes_data_gb) VALUES
((SELECT id FROM spaces WHERE type='meeting_room_4'), 'half_day', 3450, '4944213000000154001', '4 Seater Private Room - Half Day', 4),
((SELECT id FROM spaces WHERE type='meeting_room_4'), 'full_day', 4950, '4944213000000152001', '4 Seater Private Room - Full Day', 8),
((SELECT id FROM spaces WHERE type='meeting_room_4'), 'unlimited', 5950, '4944213000000175001', '4 Seater Private Room - Unlimited Day Access', 8);

-- 4-Seater Black Meeting Room pricing
INSERT INTO pricing (space_id, duration, price, zoho_item_id, zoho_item_name, includes_data_gb) VALUES
((SELECT id FROM spaces WHERE type='meeting_room_4_black'), 'half_day', 3450, '4944213000001985001', '4 Seater Black Private Room - Half Day', 4),
((SELECT id FROM spaces WHERE type='meeting_room_4_black'), 'full_day', 4950, '4944213000001985012', '4 Seater Black Private Room - Full Day', 8),
((SELECT id FROM spaces WHERE type='meeting_room_4_black'), 'unlimited', 5950, '4944213000001983049', '4 Seater Black Private Room - Unlimited Day Access', 8);

-- 5-Seater Meeting Room pricing
INSERT INTO pricing (space_id, duration, price, zoho_item_id, zoho_item_name, includes_data_gb) VALUES
((SELECT id FROM spaces WHERE type='meeting_room_5'), 'half_day', 3950, '4944213000001171199', '5 Seater Private Room - Half Day', 5),
((SELECT id FROM spaces WHERE type='meeting_room_5'), 'full_day', 5950, '4944213000001171210', '5 Seater Private Room - Full Day', 10),
((SELECT id FROM spaces WHERE type='meeting_room_5'), 'unlimited', 6750, '4944213000001171221', '5 Seater Private Room - Unlimited Day Access', 15);

-- Lobby Area pricing
INSERT INTO pricing (space_id, duration, price, zoho_item_id, zoho_item_name) VALUES
((SELECT id FROM spaces WHERE type='lobby'), '1hr', 1200, '4944213000001171476', 'Lobby Area Meeting for 1h | Max 3 Pax'),
((SELECT id FROM spaces WHERE type='lobby'), '2hr', 6500, '4944213000001171487', 'Lobby Area Meeting for 2h | Maximum 10 Pax');

-- Addons
INSERT INTO addons (name, price, zoho_item_id, category) VALUES
('5 GB Extra Data', 650, '4944213000001171366', 'data'),
('10 GB Extra Data', 1300, '4944213000001171388', 'data'),
('20 GB Extra Data', 2500, '4944213000001171377', 'data'),
('Monitor Rental (Day)', 500, '4944213000001171305', 'equipment'),
('Projector (Up to 4hrs)', 1800, '4944213000001171316', 'equipment'),
('Projector (4+ hrs)', 2800, '4944213000001171349', 'equipment'),
('Projector Screen (Up to 4hrs)', 2400, '4944213000001171327', 'equipment'),
('Projector Screen (4+ hrs)', 3800, '4944213000001171338', 'equipment'),
('Photocopy B&W (per page)', 10, '4944213000001171288', 'printing');
