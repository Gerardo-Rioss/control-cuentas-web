-- Seed SQL for control_cuentas_web
-- Run with: psql -U postgres -d control_cuentas_web -f seed.sql

-- Demo user (password: demo1234 bcrypt hash)
INSERT INTO users (id, name, email, password, "createdAt", "updatedAt")
SELECT 'cm_user_demo_001', 'Usuario Demo', 'demo@controlcuentas.com', '$2b$10$ZNuKEXuKY/7lL5OueBRgPeDRBpTBLG2cghoZg1suYZ.hj4LcoKcvS', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'demo@controlcuentas.com');

-- Get user ID
\set uid 'cm_user_demo_001'

-- EGRESO categories
INSERT INTO categories (id, name, color, icon, type, "userId", "createdAt", "updatedAt") VALUES
('cat_alquiler', 'Alquiler', '#ef4444', 'home', 'EGRESO', 'cm_user_demo_001', NOW(), NOW()),
('cat_servicios', 'Servicios', '#f97316', 'zap', 'EGRESO', 'cm_user_demo_001', NOW(), NOW()),
('cat_supermercado', 'Supermercado', '#eab308', 'shopping-cart', 'EGRESO', 'cm_user_demo_001', NOW(), NOW()),
('cat_transporte', 'Transporte', '#22c55e', 'bus', 'EGRESO', 'cm_user_demo_001', NOW(), NOW()),
('cat_salud', 'Salud', '#06b6d4', 'heart-pulse', 'EGRESO', 'cm_user_demo_001', NOW(), NOW()),
('cat_entretenimiento', 'Entretenimiento', '#8b5cf6', 'gamepad-2', 'EGRESO', 'cm_user_demo_001', NOW(), NOW()),
('cat_comida', 'Comida', '#ec4899', 'utensils-crossed', 'EGRESO', 'cm_user_demo_001', NOW(), NOW()),
('cat_suscripciones', 'Suscripciones', '#6366f1', 'credit-card', 'EGRESO', 'cm_user_demo_001', NOW(), NOW()),
('cat_otros_gastos', 'Otros Gastos', '#6b7280', 'more-horizontal', 'EGRESO', 'cm_user_demo_001', NOW(), NOW())
ON CONFLICT ("userId", name) DO NOTHING;

-- INGRESO categories
INSERT INTO categories (id, name, color, icon, type, "userId", "createdAt", "updatedAt") VALUES
('cat_sueldo', 'Sueldo', '#16a34a', 'briefcase', 'INGRESO', 'cm_user_demo_001', NOW(), NOW()),
('cat_freelance', 'Freelance', '#2563eb', 'laptop', 'INGRESO', 'cm_user_demo_001', NOW(), NOW()),
('cat_inversiones', 'Inversiones', '#7c3aed', 'trending-up', 'INGRESO', 'cm_user_demo_001', NOW(), NOW()),
('cat_otros_ingresos', 'Otros Ingresos', '#6b7280', 'more-horizontal', 'INGRESO', 'cm_user_demo_001', NOW(), NOW())
ON CONFLICT ("userId", name) DO NOTHING;

-- Sample movements (July 2026)
INSERT INTO movements (id, description, amount, type, date, "isPaid", "paidAt", "categoryId", "userId", "createdAt", "updatedAt") VALUES
('mov_001', 'Alquiler Julio', 180000, 'EGRESO', '2026-07-05', true, '2026-07-05', 'cat_alquiler', 'cm_user_demo_001', NOW(), NOW()),
('mov_002', 'Supermercado Día', 45000, 'EGRESO', '2026-07-03', true, '2026-07-03', 'cat_supermercado', 'cm_user_demo_001', NOW(), NOW()),
('mov_003', 'Cable + Internet', 15000, 'EGRESO', '2026-07-08', true, '2026-07-08', 'cat_servicios', 'cm_user_demo_001', NOW(), NOW()),
('mov_004', 'Gas', 8000, 'EGRESO', '2026-07-10', false, NULL, 'cat_servicios', 'cm_user_demo_001', NOW(), NOW()),
('mov_005', 'Luz + Agua', 12000, 'EGRESO', '2026-07-12', false, NULL, 'cat_servicios', 'cm_user_demo_001', NOW(), NOW()),
('mov_006', 'Netflix + Spotify', 8000, 'EGRESO', '2026-07-15', true, '2026-07-15', 'cat_suscripciones', 'cm_user_demo_001', NOW(), NOW()),
('mov_007', 'Cena afuera', 25000, 'EGRESO', '2026-07-14', true, '2026-07-14', 'cat_comida', 'cm_user_demo_001', NOW(), NOW()),
('mov_008', 'Uber viajes', 12000, 'EGRESO', '2026-07-07', true, '2026-07-07', 'cat_transporte', 'cm_user_demo_001', NOW(), NOW()),
('mov_009', 'Farmacia', 9500, 'EGRESO', '2026-07-11', false, NULL, 'cat_salud', 'cm_user_demo_001', NOW(), NOW()),
('mov_010', 'Cine + cena', 18000, 'EGRESO', '2026-07-09', true, '2026-07-09', 'cat_entretenimiento', 'cm_user_demo_001', NOW(), NOW()),
('mov_011', 'Sueldo Julio', 450000, 'INGRESO', '2026-07-01', true, '2026-07-01', 'cat_sueldo', 'cm_user_demo_001', NOW(), NOW()),
('mov_012', 'Proyecto Web', 120000, 'INGRESO', '2026-07-15', true, '2026-07-15', 'cat_freelance', 'cm_user_demo_001', NOW(), NOW()),
('mov_013', 'Alquiler Junio', 170000, 'EGRESO', '2026-06-05', true, '2026-06-05', 'cat_alquiler', 'cm_user_demo_001', NOW(), NOW()),
('mov_014', 'Supermercado Junio', 52000, 'EGRESO', '2026-06-08', true, '2026-06-08', 'cat_supermercado', 'cm_user_demo_001', NOW(), NOW()),
('mov_015', 'Sueldo Junio', 450000, 'INGRESO', '2026-06-01', true, '2026-06-01', 'cat_sueldo', 'cm_user_demo_001', NOW(), NOW()),
('mov_016', 'Luz Junio', 9500, 'EGRESO', '2026-06-10', true, '2026-06-10', 'cat_servicios', 'cm_user_demo_001', NOW(), NOW()),
('mov_017', 'Transporte Junio', 15000, 'EGRESO', '2026-06-12', true, '2026-06-12', 'cat_transporte', 'cm_user_demo_001', NOW(), NOW());
