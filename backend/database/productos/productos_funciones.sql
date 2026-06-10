-- =============================================================================
-- PRODUCTOS — Script unico para funciones del dominio (tabla "Products" en init.sql)
-- =============================================================================
-- Columnas: id_products (BIGSERIAL), name (VARCHAR 255), description (TEXT), type (VARCHAR 255), quantity (INTEGER), price (DECIMAL), isActive (BOOLEAN).
-- Requisito: haber ejecutado database/init.sql.
-- Aplicacion: psql -v ON_ERROR_STOP=1 -U <usuario> -d <base> -f database/productos/productos_funciones.sql
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
        'sp_crear_producto',
        'sp_listar_productos',
        'sp_actualizar_producto',
        'sp_desactivar_producto',
        'fn_normalizar_nombre_producto',
        'fn_es_nombre_producto_valido',
        'fn_normalizar_tipo_producto',
        'fn_es_tipo_producto_valido'
      )
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.sig::text || ' CASCADE';
  END LOOP;
END $$;

-- Normaliza nombre del producto (trim)
CREATE OR REPLACE FUNCTION fn_normalizar_nombre_producto(p_nombre VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
  RETURN trim(p_nombre);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION fn_es_nombre_producto_valido(p_nombre VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  v_nombre VARCHAR;
BEGIN
  v_nombre := fn_normalizar_nombre_producto(p_nombre);
  RETURN length(v_nombre) > 0 AND length(v_nombre) <= 255;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Normaliza tipo del producto (trim)
CREATE OR REPLACE FUNCTION fn_normalizar_tipo_producto(p_tipo VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
  RETURN trim(p_tipo);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION fn_es_tipo_producto_valido(p_tipo VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  v_tipo VARCHAR;
BEGIN
  v_tipo := fn_normalizar_tipo_producto(p_tipo);
  RETURN length(v_tipo) > 0 AND length(v_tipo) <= 255;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- -----------------------------------------------------------------------------
-- sp_crear_producto
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_crear_producto(
    p_nombre VARCHAR,
    p_descripcion TEXT,
    p_tipo VARCHAR,
    p_cantidad INTEGER,
    p_precio DECIMAL(12, 2),
    p_is_active BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
    id_products BIGINT,
    name VARCHAR(255),
    description TEXT,
    type VARCHAR(255),
    quantity INTEGER,
    price DECIMAL(12, 2),
    "isActive" BOOLEAN
) AS $$
DECLARE
  v_nombre VARCHAR(255);
  v_tipo VARCHAR(255);
BEGIN
  IF p_nombre IS NULL OR p_tipo IS NULL OR p_precio IS NULL THEN
    RAISE EXCEPTION 'Parametros obligatorios: nombre, tipo, precio';
  END IF;

  v_nombre := fn_normalizar_nombre_producto(p_nombre);
  IF NOT fn_es_nombre_producto_valido(v_nombre) THEN
    RAISE EXCEPTION 'nombre invalido: debe ser texto no vacio de hasta 255 caracteres';
  END IF;

  v_tipo := fn_normalizar_tipo_producto(p_tipo);
  IF NOT fn_es_tipo_producto_valido(v_tipo) THEN
    RAISE EXCEPTION 'tipo invalido: debe ser texto no vacio de hasta 255 caracteres';
  END IF;

  IF p_cantidad IS NOT NULL AND p_cantidad <= 0 THEN
    RAISE EXCEPTION 'cantidad invalida: debe ser mayor o igual que 0';
  END IF;

  IF p_precio <= 0 THEN
    RAISE EXCEPTION 'precio invalido: debe ser mayor o igual que 0';
  END IF;

  RETURN QUERY
  INSERT INTO "Products" AS p ("name", "description", "type", "quantity", "price", "isActive")
  VALUES (v_nombre, p_descripcion, v_tipo, p_cantidad, p_precio, COALESCE(p_is_active, TRUE))
  RETURNING p."id_products", p."name", p."description", p."type", p."quantity", p."price", p."isActive";

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- sp_listar_productos — filtros opcionales y paginacion
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_listar_productos(
    p_id_producto BIGINT DEFAULT NULL,
    p_nombre_contiene VARCHAR DEFAULT NULL,
    p_tipo_contiene VARCHAR DEFAULT NULL,
    p_is_active BOOLEAN DEFAULT NULL,
    p_tam_pagina INTEGER DEFAULT 10,
    p_num_pagina INTEGER DEFAULT 1
)
RETURNS TABLE (
    id_products BIGINT,
    name VARCHAR(255),
    description TEXT,
    type VARCHAR(255),
    quantity INTEGER,
    price DECIMAL(12, 2),
    "isActive" BOOLEAN,
    total_count BIGINT
) AS $$
DECLARE
  v_offset INTEGER;
  v_total BIGINT;
  v_filtro_nombre VARCHAR;
  v_filtro_tipo VARCHAR;
BEGIN
  v_offset := GREATEST(COALESCE(p_num_pagina, 1) - 1, 0) * GREATEST(COALESCE(p_tam_pagina, 10), 1);
  v_filtro_nombre := CASE
    WHEN p_nombre_contiene IS NULL THEN NULL
    ELSE NULLIF(fn_normalizar_nombre_producto(p_nombre_contiene), '')
  END;
  v_filtro_tipo := CASE
    WHEN p_tipo_contiene IS NULL THEN NULL
    ELSE NULLIF(fn_normalizar_tipo_producto(p_tipo_contiene), '')
  END;

  SELECT COUNT(*) INTO v_total
  FROM "Products" p
  WHERE (p_id_producto IS NULL OR p."id_products" = p_id_producto)
    AND (v_filtro_nombre IS NULL OR p."name" ILIKE '%' || v_filtro_nombre || '%')
    AND (v_filtro_tipo IS NULL OR p."type" ILIKE '%' || v_filtro_tipo || '%')
    AND (p_is_active IS NULL OR p."isActive" = p_is_active);

  RETURN QUERY
  SELECT
    p."id_products",
    p."name",
    p."description",
    p."type",
    p."quantity",
    p."price",
    p."isActive",
    v_total AS total_count
  FROM "Products" p
  WHERE (p_id_producto IS NULL OR p."id_products" = p_id_producto)
    AND (v_filtro_nombre IS NULL OR p."name" ILIKE '%' || v_filtro_nombre || '%')
    AND (v_filtro_tipo IS NULL OR p."type" ILIKE '%' || v_filtro_tipo || '%')
    AND (p_is_active IS NULL OR p."isActive" = p_is_active)
  ORDER BY p."id_products"
  LIMIT GREATEST(COALESCE(p_tam_pagina, 10), 1)
  OFFSET v_offset;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- sp_actualizar_producto
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_actualizar_producto(
    p_id_producto BIGINT,
    p_nombre VARCHAR DEFAULT NULL,
    p_descripcion TEXT DEFAULT NULL,
    p_tipo VARCHAR DEFAULT NULL,
    p_cantidad INTEGER DEFAULT NULL,
    p_precio DECIMAL(12, 2) DEFAULT NULL
)
RETURNS TABLE (
    id_products BIGINT,
    name VARCHAR(255),
    description TEXT,
    type VARCHAR(255),
    quantity INTEGER,
    price DECIMAL(12, 2),
    "isActive" BOOLEAN
) AS $$
DECLARE
  v_existe BOOLEAN;
  v_nombre VARCHAR(255);
  v_tipo VARCHAR(255);
BEGIN
  IF p_id_producto IS NULL THEN
    RAISE EXCEPTION 'id_producto es obligatorio';
  END IF;

  SELECT EXISTS (SELECT 1 FROM "Products" p WHERE p."id_products" = p_id_producto) INTO v_existe;
  IF NOT v_existe THEN
    RAISE EXCEPTION 'El producto con id % no existe', p_id_producto;
  END IF;

  IF p_nombre IS NOT NULL THEN
    v_nombre := fn_normalizar_nombre_producto(p_nombre);
    IF NOT fn_es_nombre_producto_valido(v_nombre) THEN
      RAISE EXCEPTION 'nombre invalido: debe ser texto no vacio de hasta 255 caracteres';
    END IF;
  END IF;

  IF p_tipo IS NOT NULL THEN
    v_tipo := fn_normalizar_tipo_producto(p_tipo);
    IF NOT fn_es_tipo_producto_valido(v_tipo) THEN
      RAISE EXCEPTION 'tipo invalido: debe ser texto no vacio de hasta 255 caracteres';
    END IF;
  END IF;

  IF p_cantidad IS NOT NULL AND p_cantidad < 0 THEN
    RAISE EXCEPTION 'cantidad invalida: debe ser mayor o igual que 0';
  END IF;

  IF p_precio IS NOT NULL AND p_precio <= 0 THEN
    RAISE EXCEPTION 'precio invalido: debe ser mayor que 0';
  END IF;

  RETURN QUERY
  UPDATE "Products" p
  SET "name" = COALESCE(v_nombre, p."name"),
      "description" = COALESCE(p_descripcion, p."description"),
      "type" = COALESCE(v_tipo, p."type"),
      "quantity" = COALESCE(p_cantidad, p."quantity"),
      "price" = COALESCE(p_precio, p."price")
  WHERE p."id_products" = p_id_producto
  RETURNING p."id_products", p."name", p."description", p."type", p."quantity", p."price", p."isActive";

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- sp_desactivar_producto
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_desactivar_producto(
    p_id_producto BIGINT
)
RETURNS TABLE (
    id_products BIGINT,
    name VARCHAR(255),
    description TEXT,
    type VARCHAR(255),
    quantity INTEGER,
    price DECIMAL(12, 2),
    "isActive" BOOLEAN
) AS $$
DECLARE
  v_existe BOOLEAN;
BEGIN
  IF p_id_producto IS NULL THEN
    RAISE EXCEPTION 'id_producto es obligatorio';
  END IF;

  SELECT EXISTS (SELECT 1 FROM "Products" p WHERE p."id_products" = p_id_producto) INTO v_existe;
  IF NOT v_existe THEN
    RAISE EXCEPTION 'El producto con id % no existe', p_id_producto;
  END IF;

  RETURN QUERY
  UPDATE "Products" p
  SET "isActive" = FALSE
  WHERE p."id_products" = p_id_producto
  RETURNING p."id_products", p."name", p."description", p."type", p."quantity", p."price", p."isActive";

  RETURN;
END;
$$ LANGUAGE plpgsql;
