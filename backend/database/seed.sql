-- =============================================================================
-- SEED DATA — datos de prueba para todas las tablas (~10 registros c/u)
-- =============================================================================
-- Requisito: haber ejecutado database/init.sql primero (tablas + funciones).
-- Aplicación: pegar en pgAdmin4 o psql -U postgres -d microservicio_db -f seed.sql
-- =============================================================================

-- 1. USERS (10)
INSERT INTO "Users" ("type", "isActive", "keycloak_id") VALUES
  ('client', TRUE, '2d4ddcb1-e822-46ad-b4ee-6016f8ce8633'),
  ('client', TRUE, 'f4e18dcd-e3e2-47c2-8e2d-a346cd60b043'),
  ('client', TRUE, 'c93a4ca9-7a25-47d2-8272-12130d2843d7'),
  ('client', TRUE, 'eda5c8c2-dafd-451d-b860-34e592ece123'),
  ('client', TRUE, 'a15b2f00-26a5-474c-b530-d0f6824558b2'),
  ('client', TRUE, '4a487811-6f23-417c-8951-b1ad2e8bacce'),
  ('client', TRUE, 'b717bc0e-bead-470e-b086-f28aadb51179'),
  ('client', TRUE, 'd81750d2-a656-4f3c-aaf5-2c1a4f022982'),
  ('admin', TRUE, 'a065ba72-be8c-4116-be9c-590ce708b784'),
  ('admin', TRUE, '4d63a0df-e7a1-4c3c-9fab-89ed5c7ca10d');

-- 2. PLANS (5)
INSERT INTO "Plans" ("name", "billing_cycle", "amount", "isActive") VALUES
  ('Básico',    'monthly',   19990, TRUE),
  ('Profesional', 'monthly', 32990, TRUE),
  ('Enterprise', 'monthly',    45990, TRUE),
  ('Pyme',         'monthly',    24990, TRUE),
  ('Corporativo',  'monthly',    59990, TRUE);

-- 3. PRODUCTS (10)
INSERT INTO "Products" ("name", "description", "type", "quantity", "price", "isActive") VALUES
  ('Soporte estándar',       'Soporte por correo electrónico en horario laboral',        'service', NULL,   0,    TRUE),
  ('Soporte prioritario',    'Soporte 24/7 con tiempo de respuesta de 1 hora',            'service', NULL,   14990, TRUE),
  ('Panel de métricas',      'Dashboard con métricas avanzadas de uso',                   'feature', 1,      9990,  TRUE),
  ('Reportes básicos',       'Reportes mensuales de facturación y uso',                   'feature', 1,      0,    TRUE),
  ('Automatización de pagos','Cobro automático con tarjeta de crédito/débito',            'feature', 1,      0,    TRUE),
  ('Usuarios ilimitados',    'Sin límite de usuarios en la plataforma',                   'feature', 99999,  0,    TRUE),
  ('API REST privada',       'Acceso a API privada para integraciones personalizadas',     'feature', 1,      24990, TRUE),
  ('Almacenamiento 10GB',    'Almacenamiento en la nube de 10 GB',                        'storage', 1,      4990,  TRUE),
  ('Almacenamiento 50GB',    'Almacenamiento en la nube de 50 GB',                        'storage', 1,      14990, TRUE),
  ('SSL Dedicado',           'Certificado SSL dedicado con validación extendida',          'service', NULL,   29990, TRUE);

-- 4. CONTRACTS (10) — referencian Users (1-10) y Plans (1-5)
INSERT INTO "Contracts" ("id_users", "id_plans", "status", "start_date", "end_date") VALUES
  (1, 4, 'ACTIVE',     '2026-01-01', '2026-12-31'),
  (2, 3, 'ACTIVE',     '2026-03-15', '2026-09-15'),
  (3, 2, 'ACTIVE',     '2026-05-01', '2026-08-01'),
  (4, 1, 'ACTIVE',     '2026-02-01', '2026-07-01'),
  (5, 5, 'ACTIVE',     '2026-04-10', '2026-07-10'),
  (6, 2, 'SUSPENDED',  '2026-01-15', '2026-06-15'),
  (7, 3, 'TERMINATED', '2025-11-01', '2026-04-01'),
  (9, 5, 'DRAFT',      '2026-06-01', '2026-09-01'),
  (10,4, 'ACTIVE',     '2026-03-01', '2027-02-28');

-- 5. billing_cycles (10) — referencian Contracts (1-10)
INSERT INTO "billing_cycles" ("id_contracts", "amount", "status", "retry_attempts", "created_at") VALUES
  (1,  45990,   'completed', 0, '2026-05-01 00:00:00'),
  (1,  45990,   'completed', 0, '2026-04-01 00:00:00'),
  (2,  45990,   'completed', 0, '2026-05-15 00:00:00'),
  (3,  32990,   'completed', 0, '2026-06-01 00:00:00'),
  (4,  19990,   'completed', 0, '2026-05-01 00:00:00'),
  (4,  19990,   'failed',    2, '2026-04-01 00:00:00'),
  (5,  9990,    'completed', 0, '2026-05-10 00:00:00'),
  (5,  9990,    'pending',   0, '2026-06-10 00:00:00'),
  (10, 469100,  'completed', 0, '2026-05-01 00:00:00'),
  (10, 469100,  'completed', 0, '2026-04-01 00:00:00');

-- 6. Discount (5) — referencian Products (1-10)
INSERT INTO "Discount" ("id_products", "quantity", "discount") VALUES
  (7,  2,  10.00),
  (8,  5,  15.00),
  (9,  3,  20.00),
  (10, 1,  5.00),
  (2,  10, 12.50);

-- 7. Support / Tickets (5) — referencian Contracts (1-10)
INSERT INTO "Support" ("id_contracts", "description", "status", "created_at") VALUES
  (1, 'Error al iniciar sesión en el panel de métricas',                         'open',       '2026-06-01 10:00:00'),
  (2, 'Solicitud de cambio de método de pago',                                   'in_progress','2026-05-28 14:30:00'),
  (3, 'Problema con la factura del mes de mayo',                                 'resolved',   '2026-05-20 09:00:00'),
  (4, 'Requiero aumentar el límite de usuarios en mi plan actual',               'open',       '2026-06-05 16:45:00'),
  (5, 'No recibo los correos de notificación de cobro',                         'in_progress','2026-06-02 08:15:00');

-- 8. audit_logs (5) — referencian Contracts (1-10)
INSERT INTO "audit_logs" ("id_contracts", "action", "assigned_to", "created_at") VALUES
  (1,  'CREAR_CONTRATO',        'sistema',     '2026-01-01 10:00:00'),
  (2,  'CREAR_CONTRATO',        'sistema',     '2026-03-15 10:00:00'),
  (6,  'SUSPENDER_CONTRATO',    'admin',       '2026-05-01 09:00:00'),
  (7,  'FINALIZAR_CONTRATO',    'sistema',     '2026-04-01 00:00:00'),
  (10, 'ACTUALIZAR_CONTRATO',   'admin',       '2026-04-15 11:30:00');

-- 9. Plans_Products (7) — asociaciones plan ↔ producto
INSERT INTO "Plans_Products" ("id_plans", "id_products") VALUES
  (1, 1),  -- Básico → Soporte estándar
  (1, 4),  -- Básico → Reportes básicos
  (2, 2),  -- Profesional → Soporte prioritario
  (2, 3),  -- Profesional → Panel de métricas
  (2, 5),  -- Profesional → Automatización de pagos
  (3, 6),  -- Enterprise → Usuarios ilimitados
  (3, 7);  -- Enterprise → API REST privada

-- 10. Contracts_Products (6) — productos adicionales por contrato
INSERT INTO "Contracts_Products" ("id_contracts", "id_products", "quantity") VALUES
  (1, 8,  1),   -- Contrato 1 → Almacenamiento 10GB x1
  (1, 10, 1),   -- Contrato 1 → SSL Dedicado x1
  (2, 9,  1),   -- Contrato 2 → Almacenamiento 50GB x1
  (3, 5,  1),   -- Contrato 3 → Automatización de pagos x1
  (10, 8, 2),   -- Contrato 10 → Almacenamiento 10GB x2
  (10, 7, 1);   -- Contrato 10 → API REST privada x1