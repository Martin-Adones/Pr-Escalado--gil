-- =============================================================================
-- USUARIOS — Script único para funciones del dominio (tabla "Users" en init.sql)
-- =============================================================================
-- Columnas: id_users (BIGSERIAL), type (VARCHAR 255, rol o categoría del usuario).
-- Requisito: haber ejecutado database/init.sql.
-- Aplicación: psql -v ON_ERROR_STOP=1 -U <usuario> -d <base> -f database/usuarios/usuarios_funciones.sql
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
        'sp_crear_usuario',
        'sp_listar_usuarios',
        'sp_actualizar_usuario',
        'fn_normalizar_tipo_usuario',
        'fn_es_tipo_usuario_valido'
      )
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.sig::text || ' CASCADE';
  END LOOP;
END $$;

-- Texto recortado; debe ser no vacío y caber en VARCHAR(255).
CREATE OR REPLACE FUNCTION fn_normalizar_tipo_usuario(p_tipo VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
  RETURN trim(p_tipo);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION fn_es_tipo_usuario_valido(p_tipo VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  t VARCHAR;
BEGIN
  t := fn_normalizar_tipo_usuario(p_tipo);
  RETURN length(t) > 0 AND length(t) <= 255;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- -----------------------------------------------------------------------------
-- sp_crear_usuario
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_crear_usuario(p_tipo VARCHAR)
RETURNS TABLE (
    id_users BIGINT,
    type VARCHAR(255)
) AS $$
DECLARE
  v_tipo VARCHAR(255);
BEGIN
  IF p_tipo IS NULL THEN
    RAISE EXCEPTION 'El tipo de usuario es obligatorio';
  END IF;

  v_tipo := fn_normalizar_tipo_usuario(p_tipo);
  IF NOT fn_es_tipo_usuario_valido(v_tipo) THEN
    RAISE EXCEPTION 'tipo inválido: debe ser texto no vacío de hasta 255 caracteres';
  END IF;

  RETURN QUERY
  INSERT INTO "Users" AS u ("type")
  VALUES (v_tipo)
  RETURNING u."id_users", u."type";

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- sp_listar_usuarios — filtros opcionales y paginación
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_listar_usuarios(
    p_id_usuario BIGINT DEFAULT NULL,
    p_tipo_contiene VARCHAR DEFAULT NULL,
    p_tam_pagina INTEGER DEFAULT 10,
    p_num_pagina INTEGER DEFAULT 1
)
RETURNS TABLE (
    id_users BIGINT,
    type VARCHAR(255),
    total_count BIGINT
) AS $$
DECLARE
  v_offset INTEGER;
  v_total BIGINT;
  v_filtro VARCHAR;
BEGIN
  v_offset := GREATEST(COALESCE(p_num_pagina, 1) - 1, 0) * GREATEST(COALESCE(p_tam_pagina, 10), 1);
  v_filtro := CASE
    WHEN p_tipo_contiene IS NULL THEN NULL
    ELSE NULLIF(fn_normalizar_tipo_usuario(p_tipo_contiene), '')
  END;

  SELECT COUNT(*) INTO v_total
  FROM "Users" u
  WHERE (p_id_usuario IS NULL OR u."id_users" = p_id_usuario)
    AND (v_filtro IS NULL OR u."type" ILIKE '%' || v_filtro || '%');

  RETURN QUERY
  SELECT
    u."id_users",
    u."type",
    v_total AS total_count
  FROM "Users" u
  WHERE (p_id_usuario IS NULL OR u."id_users" = p_id_usuario)
    AND (v_filtro IS NULL OR u."type" ILIKE '%' || v_filtro || '%')
  ORDER BY u."id_users"
  LIMIT GREATEST(COALESCE(p_tam_pagina, 10), 1)
  OFFSET v_offset;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- sp_actualizar_usuario
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_actualizar_usuario(
    p_id_usuario BIGINT,
    p_tipo VARCHAR
)
RETURNS TABLE (
    id_users BIGINT,
    type VARCHAR(255)
) AS $$
DECLARE
  v_existe BOOLEAN;
  v_tipo VARCHAR(255);
BEGIN
  IF p_id_usuario IS NULL OR p_tipo IS NULL THEN
    RAISE EXCEPTION 'id_usuario y tipo son obligatorios';
  END IF;

  v_tipo := fn_normalizar_tipo_usuario(p_tipo);
  IF NOT fn_es_tipo_usuario_valido(v_tipo) THEN
    RAISE EXCEPTION 'tipo inválido: debe ser texto no vacío de hasta 255 caracteres';
  END IF;

  SELECT EXISTS (SELECT 1 FROM "Users" u WHERE u."id_users" = p_id_usuario) INTO v_existe;
  IF NOT v_existe THEN
    RAISE EXCEPTION 'El usuario con id % no existe', p_id_usuario;
  END IF;

  RETURN QUERY
  UPDATE "Users" u
  SET "type" = v_tipo
  WHERE u."id_users" = p_id_usuario
  RETURNING u."id_users", u."type";

  RETURN;
END;
$$ LANGUAGE plpgsql;
