-- =============================================================================
-- SOPORTE — Script único para funciones del dominio de soporte (tabla "Support" en init.sql)
-- =============================================================================
-- Columnas: id_support (BIGSERIAL), id_contracts (BIGINT), description (TEXT), status (VARCHAR 50), created_at (TIMESTAMP), updated_at (TIMESTAMP)
-- Requisito: haber ejecutado database/init.sql.
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
        'sp_crear_ticket',
        'sp_listar_tickets',
        'sp_actualizar_ticket'
      )
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.sig::text || ' CASCADE';
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- sp_crear_ticket
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_crear_ticket(
    p_id_contrato BIGINT,
    p_descripcion TEXT,
    p_status VARCHAR DEFAULT 'open'
)
RETURNS TABLE (
    id_support BIGINT,
    id_contracts BIGINT,
    id_users UUID,
    description TEXT,
    status VARCHAR(50),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
) AS $$
#variable_conflict use_column
DECLARE
  v_existe_contrato BOOLEAN;
  v_id_support BIGINT;
BEGIN
  IF p_id_contrato IS NULL OR p_descripcion IS NULL THEN
    RAISE EXCEPTION 'Parametros obligatorios: id_contrato, descripcion';
  END IF;

  SELECT EXISTS (SELECT 1 FROM "Contracts" c WHERE c."id_contracts" = p_id_contrato) INTO v_existe_contrato;
  IF NOT v_existe_contrato THEN
    RAISE EXCEPTION 'El contrato con id % no existe', p_id_contrato;
  END IF;

  INSERT INTO "Support" ("id_contracts", "description", "status", "created_at", "updated_at")
  VALUES (p_id_contrato, p_descripcion, COALESCE(p_status, 'open'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  RETURNING "id_support" INTO v_id_support;

  RETURN QUERY
  SELECT s."id_support", s."id_contracts", c."id_users", s."description", s."status", s."created_at", s."updated_at"
  FROM "Support" s
  JOIN "Contracts" c ON s."id_contracts" = c."id_contracts"
  WHERE s."id_support" = v_id_support;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- sp_listar_tickets — filtros opcionales por id, contrato, usuario, estado y paginacion
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_listar_tickets(
    p_id_support BIGINT DEFAULT NULL,
    p_id_contrato BIGINT DEFAULT NULL,
    p_id_usuario UUID DEFAULT NULL,
    p_status VARCHAR DEFAULT NULL,
    p_tam_pagina INTEGER DEFAULT 10,
    p_num_pagina INTEGER DEFAULT 1
)
RETURNS TABLE (
    id_support BIGINT,
    id_contracts BIGINT,
    id_users UUID,
    description TEXT,
    status VARCHAR(50),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    total_count BIGINT
) AS $$
#variable_conflict use_column
DECLARE
  v_offset INTEGER;
  v_total BIGINT;
  v_filtro_status VARCHAR;
BEGIN
  v_offset := GREATEST(COALESCE(p_num_pagina, 1) - 1, 0) * GREATEST(COALESCE(p_tam_pagina, 10), 1);
  v_filtro_status := CASE
    WHEN p_status IS NULL THEN NULL
    ELSE trim(p_status)
  END;

  SELECT COUNT(*) INTO v_total
  FROM "Support" s
  JOIN "Contracts" c ON s."id_contracts" = c."id_contracts"
  WHERE (p_id_support IS NULL OR s."id_support" = p_id_support)
    AND (p_id_contrato IS NULL OR s."id_contracts" = p_id_contrato)
    AND (p_id_usuario IS NULL OR c."id_users" = p_id_usuario)
    AND (v_filtro_status IS NULL OR s."status" ILIKE v_filtro_status);

  RETURN QUERY
  SELECT
    s."id_support",
    s."id_contracts",
    c."id_users",
    s."description",
    s."status",
    s."created_at",
    s."updated_at",
    v_total AS total_count
  FROM "Support" s
  JOIN "Contracts" c ON s."id_contracts" = c."id_contracts"
  WHERE (p_id_support IS NULL OR s."id_support" = p_id_support)
    AND (p_id_contrato IS NULL OR s."id_contracts" = p_id_contrato)
    AND (p_id_usuario IS NULL OR c."id_users" = p_id_usuario)
    AND (v_filtro_status IS NULL OR s."status" ILIKE v_filtro_status)
  ORDER BY s."id_support" ASC
  LIMIT GREATEST(COALESCE(p_tam_pagina, 10), 1)
  OFFSET v_offset;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- sp_actualizar_ticket
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_actualizar_ticket(
    p_id_support BIGINT,
    p_id_contrato BIGINT DEFAULT NULL,
    p_descripcion TEXT DEFAULT NULL,
    p_status VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    id_support BIGINT,
    id_contracts BIGINT,
    id_users UUID,
    description TEXT,
    status VARCHAR(50),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
) AS $$
#variable_conflict use_column
DECLARE
  v_existe BOOLEAN;
  v_existe_contrato BOOLEAN;
BEGIN
  IF p_id_support IS NULL THEN
    RAISE EXCEPTION 'id_support es obligatorio';
  END IF;

  SELECT EXISTS (SELECT 1 FROM "Support" s WHERE s."id_support" = p_id_support) INTO v_existe;
  IF NOT v_existe THEN
    RAISE EXCEPTION 'El ticket de soporte con id % no existe', p_id_support;
  END IF;

  IF p_id_contrato IS NOT NULL THEN
    SELECT EXISTS (SELECT 1 FROM "Contracts" c WHERE c."id_contracts" = p_id_contrato) INTO v_existe_contrato;
    IF NOT v_existe_contrato THEN
      RAISE EXCEPTION 'El contrato con id % no existe', p_id_contrato;
    END IF;
  END IF;

  UPDATE "Support" s
  SET "id_contracts" = COALESCE(p_id_contrato, s."id_contracts"),
      "description" = COALESCE(p_descripcion, s."description"),
      "status" = COALESCE(p_status, s."status"),
      "updated_at" = CURRENT_TIMESTAMP
  WHERE s."id_support" = p_id_support;

  RETURN QUERY
  SELECT s."id_support", s."id_contracts", c."id_users", s."description", s."status", s."created_at", s."updated_at"
  FROM "Support" s
  JOIN "Contracts" c ON s."id_contracts" = c."id_contracts"
  WHERE s."id_support" = p_id_support;

  RETURN;
END;
$$ LANGUAGE plpgsql;
