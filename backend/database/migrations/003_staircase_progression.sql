-- =============================================================================
-- Migration 003: Progresión escalonada perfecta plan → producto
-- =============================================================================
-- Cada plan incluye todos los productos del anterior más los nuevos.
-- Esto garantiza que en la tabla comparativa se vea una escalera
-- perfecta de izquierda (menos tics) a derecha (más tics).
--
-- Progresión:
--   Básica (1):     Automatización, Soporte estándar, Reportes básicos
--   Esencial (4):   + Panel de métricas
--   Profesional (2): + Soporte prioritario, Almacenamiento 10GB
--   Premium (3):    + Usuarios ilimitados, API REST, Almacenamiento 50GB
--   Elite (5):      + SSL Dedicado
-- =============================================================================

-- Limpiar asignaciones existentes
DELETE FROM "Plans_Products";

-- Básica (1): esenciales
INSERT INTO "Plans_Products" ("id_plans", "id_products") VALUES
  (1, 5), (1, 1), (1, 4);

-- Esencial (4): añade Panel de métricas
INSERT INTO "Plans_Products" ("id_plans", "id_products") VALUES
  (4, 5), (4, 1), (4, 4), (4, 3);

-- Profesional (2): añade Soporte prioritario y Almacenamiento 10GB
INSERT INTO "Plans_Products" ("id_plans", "id_products") VALUES
  (2, 5), (2, 1), (2, 4), (2, 3), (2, 2), (2, 8);

-- Premium (3): añade Usuarios ilimitados, API REST y Almacenamiento 50GB
INSERT INTO "Plans_Products" ("id_plans", "id_products") VALUES
  (3, 5), (3, 1), (3, 4), (3, 3), (3, 2), (3, 8), (3, 6), (3, 7), (3, 9);

-- Elite (5): añade SSL Dedicado
INSERT INTO "Plans_Products" ("id_plans", "id_products") VALUES
  (5, 5), (5, 1), (5, 4), (5, 3), (5, 2), (5, 8), (5, 6), (5, 7), (5, 9), (5, 10);
