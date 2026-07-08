-- =============================================================================
-- Migration 002: Asignación progresiva de productos a todos los planes
-- =============================================================================
-- Creado: 2026-07-08
-- Descripcion: Asocia productos a planes Pyme (id=4) y Corporativo (id=5),
--              y refuerza la progresión en planes existentes.
--
-- Progresión:
--   Básico (1):      Soporte estándar, Reportes básicos, Automatización de pagos
--   Pyme (4):        + Panel de métricas
--   Profesional (2): Soporte prioritario, Panel de métricas, Automatización de pagos, Almacenamiento 10GB
--   Enterprise (3):  + Usuarios ilimitados, API REST privada, Almacenamiento 50GB
--   Corporativo (5): + SSL Dedicado
--
-- Uso:
--   docker exec -i postgres_db_ms psql -U postgres -d microservicio_db < 002_products_progression.sql
-- =============================================================================

-- Básico (1): añadir Automatización de pagos
INSERT INTO "Plans_Products" ("id_plans", "id_products") VALUES (1, 5)
ON CONFLICT DO NOTHING;

-- Pyme (4): Soporte estándar, Panel de métricas, Reportes básicos, Automatización de pagos
INSERT INTO "Plans_Products" ("id_plans", "id_products") VALUES
  (4, 1), (4, 3), (4, 4), (4, 5)
ON CONFLICT DO NOTHING;

-- Profesional (2): añadir Almacenamiento 10GB
INSERT INTO "Plans_Products" ("id_plans", "id_products") VALUES (2, 8)
ON CONFLICT DO NOTHING;

-- Enterprise (3): añadir Soporte prioritario, Panel de métricas, Automatización de pagos, Almacenamiento 10GB y 50GB
INSERT INTO "Plans_Products" ("id_plans", "id_products") VALUES
  (3, 2), (3, 3), (3, 5), (3, 8), (3, 9)
ON CONFLICT DO NOTHING;

-- Corporativo (5): Soporte prioritario, Panel de métricas, Automatización de pagos,
--                  Usuarios ilimitados, API REST privada, Almacenamiento 50GB, SSL Dedicado
INSERT INTO "Plans_Products" ("id_plans", "id_products") VALUES
  (5, 2), (5, 3), (5, 5), (5, 6), (5, 7), (5, 9), (5, 10)
ON CONFLICT DO NOTHING;
