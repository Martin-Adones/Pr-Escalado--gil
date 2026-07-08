-- =============================================================================
-- Migration 001: Agregar sp_listar_productos_planes
-- =============================================================================
-- Creado: 2026-07-08
-- Descripcion: Nueva funcion que devuelve todos los productos asociados a
--              planes via la tabla Plans_Products. Se usa desde el servicio
--              listarPlanes para enriquecer cada plan con sus productos.
--
-- Uso en Dokploy:
--   Conectate a la base de datos:
--     psql -h <host> -U <usuario> -d <base>
--   Luego ejecuta:
--     \i 001_sp_listar_productos_planes.sql
--
-- O directamente:
--     psql -h <host> -U <usuario> -d <base> -f 001_sp_listar_productos_planes.sql
-- =============================================================================

-- La funcion se elimina primero por si existe (idempotente)
DROP FUNCTION IF EXISTS sp_listar_productos_planes();

-- -----------------------------------------------------------------------------
-- sp_listar_productos_planes
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_listar_productos_planes(p_id_plans BIGINT[])
RETURNS TABLE (
    id_plans BIGINT,
    id_products BIGINT,
    name VARCHAR(255),
    description TEXT,
    type VARCHAR(255),
    quantity INTEGER,
    price DECIMAL(12, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pp."id_plans",
    pr."id_products",
    pr."name",
    pr."description",
    pr."type",
    pr."quantity",
    pr."price"
  FROM "Plans_Products" pp
  JOIN "Products" pr ON pr."id_products" = pp."id_products"
  WHERE pp."id_plans" = ANY(p_id_plans)
  ORDER BY pp."id_plans", pr."name";

  RETURN;
END;
$$ LANGUAGE plpgsql;
