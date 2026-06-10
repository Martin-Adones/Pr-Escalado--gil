-- =============================================================================
-- PLANES — Script unico para funciones del dominio (tabla "Plans" en init.sql)
-- =============================================================================
-- Columnas: id_plans (BIGSERIAL), name (VARCHAR 255), billing_cycle (VARCHAR 255), amount (DECIMAL), isActive (BOOLEAN).
-- Requisito: haber ejecutado database/init.sql.
-- Aplicacion: psql -v ON_ERROR_STOP=1 -U <usuario> -d <base> -f database/planes/planes_funciones.sql
-- =============================================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'sp_crear_plan',
        'sp_listar_planes',
        'sp_actualizar_plan',
        'sp_desactivar_plan',
        'sp_registrar_productos_plan',
        'fn_normalizar_nombre_plan',
        'fn_es_nombre_plan_valido',
        'fn_normalizar_ciclo_facturacion',
        'fn_es_ciclo_facturacion_valido'
      )
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.sig::text || ' CASCADE';
  END LOOP;
END $$;

-- Normaliza nombre del plan (trim)
CREATE OR REPLACE FUNCTION fn_normalizar_nombre_plan(p_nombre VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
  RETURN trim(p_nombre);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION fn_es_nombre_plan_valido(p_nombre VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  v_nombre VARCHAR;
BEGIN
  v_nombre := fn_normalizar_nombre_plan(p_nombre);
  RETURN length(v_nombre) > 0 AND length(v_nombre) <= 255;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Normaliza y valida el ciclo de facturacion (lower + trim)
CREATE OR REPLACE FUNCTION fn_normalizar_ciclo_facturacion(p_ciclo VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
  RETURN lower(trim(p_ciclo));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION fn_es_ciclo_facturacion_valido(p_ciclo VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN fn_normalizar_ciclo_facturacion(p_ciclo) IN (
    'daily',
    'weekly',
    'biweekly',
    'monthly',
    'bimonthly',
    'quarterly',
    'semiannual',
    'yearly'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- -----------------------------------------------------------------------------
-- sp_crear_plan
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_crear_plan(
    p_nombre VARCHAR,
    p_ciclo_facturacion VARCHAR,
    p_monto DECIMAL(12, 2),
    p_is_active BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
    id_plans BIGINT,
    name VARCHAR(255),
    billing_cycle VARCHAR(255),
    amount DECIMAL(12, 2),
    "isActive" BOOLEAN
) AS $$
DECLARE
  v_nombre VARCHAR(255);
  v_ciclo VARCHAR(255);
BEGIN
  IF p_nombre IS NULL OR p_ciclo_facturacion IS NULL OR p_monto IS NULL THEN
    RAISE EXCEPTION 'Parametros obligatorios: nombre, ciclo_facturacion, monto';
  END IF;

  v_nombre := fn_normalizar_nombre_plan(p_nombre);
  IF NOT fn_es_nombre_plan_valido(v_nombre) THEN
    RAISE EXCEPTION 'nombre invalido: debe ser texto no vacio de hasta 255 caracteres';
  END IF;

  v_ciclo := fn_normalizar_ciclo_facturacion(p_ciclo_facturacion);
  IF NOT fn_es_ciclo_facturacion_valido(v_ciclo) THEN
    RAISE EXCEPTION 'ciclo_facturacion invalido: %', p_ciclo_facturacion;
  END IF;

  IF p_monto <= 0 THEN
    RAISE EXCEPTION 'monto invalido: debe ser mayor que 0';
  END IF;

  RETURN QUERY
  INSERT INTO "Plans" AS p ("name", "billing_cycle", "amount", "isActive")
  VALUES (v_nombre, v_ciclo, p_monto, COALESCE(p_is_active, TRUE))
  RETURNING p."id_plans", p."name", p."billing_cycle", p."amount", p."isActive";

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- sp_listar_planes — filtros opcionales y paginacion
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_listar_planes(
    p_id_plan BIGINT DEFAULT NULL,
    p_nombre_contiene VARCHAR DEFAULT NULL,
    p_ciclo_facturacion VARCHAR DEFAULT NULL,
    p_is_active BOOLEAN DEFAULT NULL,
    p_tam_pagina INTEGER DEFAULT 10,
    p_num_pagina INTEGER DEFAULT 1
)
RETURNS TABLE (
    id_plans BIGINT,
    name VARCHAR(255),
    billing_cycle VARCHAR(255),
    amount DECIMAL(12, 2),
    "isActive" BOOLEAN,
    total_count BIGINT
) AS $$
DECLARE
  v_offset INTEGER;
  v_total BIGINT;
  v_filtro_nombre VARCHAR;
  v_ciclo VARCHAR;
BEGIN
  v_offset := GREATEST(COALESCE(p_num_pagina, 1) - 1, 0) * GREATEST(COALESCE(p_tam_pagina, 10), 1);
  v_filtro_nombre := CASE
    WHEN p_nombre_contiene IS NULL THEN NULL
    ELSE NULLIF(fn_normalizar_nombre_plan(p_nombre_contiene), '')
  END;
  v_ciclo := CASE
    WHEN p_ciclo_facturacion IS NULL THEN NULL
    ELSE fn_normalizar_ciclo_facturacion(p_ciclo_facturacion)
  END;

  SELECT COUNT(*) INTO v_total
  FROM "Plans" p
  WHERE (p_id_plan IS NULL OR p."id_plans" = p_id_plan)
    AND (v_filtro_nombre IS NULL OR p."name" ILIKE '%' || v_filtro_nombre || '%')
    AND (v_ciclo IS NULL OR p."billing_cycle" = v_ciclo)
    AND (p_is_active IS NULL OR p."isActive" = p_is_active);

  RETURN QUERY
  SELECT
    p."id_plans",
    p."name",
    p."billing_cycle",
    p."amount",
    p."isActive",
    v_total AS total_count
  FROM "Plans" p
  WHERE (p_id_plan IS NULL OR p."id_plans" = p_id_plan)
    AND (v_filtro_nombre IS NULL OR p."name" ILIKE '%' || v_filtro_nombre || '%')
    AND (v_ciclo IS NULL OR p."billing_cycle" = v_ciclo)
    AND (p_is_active IS NULL OR p."isActive" = p_is_active)
  ORDER BY p."id_plans"
  LIMIT GREATEST(COALESCE(p_tam_pagina, 10), 1)
  OFFSET v_offset;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- sp_actualizar_plan
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_actualizar_plan(
    p_id_plan BIGINT,
    p_nombre VARCHAR DEFAULT NULL,
    p_ciclo_facturacion VARCHAR DEFAULT NULL,
    p_monto DECIMAL(12, 2) DEFAULT NULL
)
RETURNS TABLE (
    id_plans BIGINT,
    name VARCHAR(255),
    billing_cycle VARCHAR(255),
    amount DECIMAL(12, 2),
    "isActive" BOOLEAN
) AS $$
DECLARE
  v_existe BOOLEAN;
  v_nombre VARCHAR(255);
  v_ciclo VARCHAR(255);
BEGIN
  IF p_id_plan IS NULL THEN
    RAISE EXCEPTION 'id_plan es obligatorio';
  END IF;

  SELECT EXISTS (SELECT 1 FROM "Plans" p WHERE p."id_plans" = p_id_plan) INTO v_existe;
  IF NOT v_existe THEN
    RAISE EXCEPTION 'El plan con id % no existe', p_id_plan;
  END IF;

  IF p_nombre IS NOT NULL THEN
    v_nombre := fn_normalizar_nombre_plan(p_nombre);
    IF NOT fn_es_nombre_plan_valido(v_nombre) THEN
      RAISE EXCEPTION 'nombre invalido: debe ser texto no vacio de hasta 255 caracteres';
    END IF;
  END IF;

  IF p_ciclo_facturacion IS NOT NULL THEN
    v_ciclo := fn_normalizar_ciclo_facturacion(p_ciclo_facturacion);
    IF NOT fn_es_ciclo_facturacion_valido(v_ciclo) THEN
      RAISE EXCEPTION 'ciclo_facturacion invalido: %', p_ciclo_facturacion;
    END IF;
  END IF;

  IF p_monto IS NOT NULL AND p_monto <= 0 THEN
    RAISE EXCEPTION 'monto invalido: debe ser mayor que 0';
  END IF;

  RETURN QUERY
  UPDATE "Plans" p
  SET "name" = COALESCE(v_nombre, p."name"),
      "billing_cycle" = COALESCE(v_ciclo, p."billing_cycle"),
      "amount" = COALESCE(p_monto, p."amount")
  WHERE p."id_plans" = p_id_plan
  RETURNING p."id_plans", p."name", p."billing_cycle", p."amount", p."isActive";

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- sp_desactivar_plan
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_desactivar_plan(
    p_id_plan BIGINT
)
RETURNS TABLE (
    id_plans BIGINT,
    name VARCHAR(255),
    billing_cycle VARCHAR(255),
    amount DECIMAL(12, 2),
    "isActive" BOOLEAN
) AS $$
DECLARE
  v_existe BOOLEAN;
BEGIN
  IF p_id_plan IS NULL THEN
    RAISE EXCEPTION 'id_plan es obligatorio';
  END IF;

  SELECT EXISTS (SELECT 1 FROM "Plans" p WHERE p."id_plans" = p_id_plan) INTO v_existe;
  IF NOT v_existe THEN
    RAISE EXCEPTION 'El plan con id % no existe', p_id_plan;
  END IF;

  RETURN QUERY
  UPDATE "Plans" p
  SET "isActive" = FALSE
  WHERE p."id_plans" = p_id_plan
  RETURNING p."id_plans", p."name", p."billing_cycle", p."amount", p."isActive";

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- sp_registrar_productos_plan
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_registrar_productos_plan(
    p_id_plan BIGINT,
    p_id_products BIGINT[]
)
RETURNS TABLE (
    id_plans BIGINT,
    id_products BIGINT
) AS $$
DECLARE
  v_existe BOOLEAN;
  v_total INTEGER;
  v_existentes INTEGER;
BEGIN
  IF p_id_plan IS NULL THEN
    RAISE EXCEPTION 'id_plan es obligatorio';
  END IF;

  IF p_id_products IS NULL OR array_length(p_id_products, 1) IS NULL THEN
    RAISE EXCEPTION 'id_products es obligatorio y no puede estar vacio';
  END IF;

  IF EXISTS (SELECT 1 FROM unnest(p_id_products) AS p(id) WHERE p.id IS NULL) THEN
    RAISE EXCEPTION 'id_products no puede contener null';
  END IF;

  SELECT EXISTS (SELECT 1 FROM "Plans" p WHERE p."id_plans" = p_id_plan) INTO v_existe;
  IF NOT v_existe THEN
    RAISE EXCEPTION 'El plan con id % no existe', p_id_plan;
  END IF;

  SELECT COUNT(*) INTO v_total FROM (SELECT DISTINCT unnest(p_id_products) AS id) s;
  SELECT COUNT(*) INTO v_existentes
  FROM "Products" pr
  WHERE pr."id_products" = ANY(p_id_products);

  IF v_existentes <> v_total THEN
    RAISE EXCEPTION 'Uno o mas productos no existen';
  END IF;

  RETURN QUERY
  INSERT INTO "Plans_Products" ("id_plans", "id_products")
  SELECT p_id_plan, s.id
  FROM (SELECT DISTINCT unnest(p_id_products) AS id) s
  ON CONFLICT DO NOTHING
  RETURNING "id_plans", "id_products";

  RETURN;
END;
$$ LANGUAGE plpgsql;
