-- =============================================================================
-- CONTRATOS — Único script de base de datos para este dominio
-- =============================================================================
--
-- Qué incluye este archivo
--   1) Limpieza de versiones viejas (inglés, UUID, sobrecargas) para evitar errores
--      del tipo «function … is not unique».
--   2) Funciones auxiliares (prefijo fn_): normalización y reglas de estados.
--   3) Procedimientos de negocio (prefijo sp_): crear, listar, actualizar y finalizar
--      contratos. Los IDs son BIGINT, alineados con database/init.sql (BIGSERIAL).
--
-- Requisito previo
--   Ejecutar antes database/init.sql en la misma base (tablas "Users", "Plans",
--   "Contracts", etc.).
--
-- Cómo aplicarlo
--   psql -v ON_ERROR_STOP=1 -U <usuario> -d <base> -f database/contratos/contratos_funciones.sql
--   O copiar y pegar todo el contenido en DBeaver / otro cliente SQL.
--
-- Estados de negocio (columna Contracts.status)
--   DRAFT | ACTIVE | SUSPENDED | TERMINATED | CANCELLED
--   Al crear solo se admiten DRAFT o ACTIVE. «Finalizar» pone TERMINATED sin borrar la fila.
--
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Paso 1: eliminar funciones antiguas (otro idioma, otra firma, pruebas fallidas)
-- -----------------------------------------------------------------------------
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
        -- Procedimientos en inglés (versiones anteriores del repo)
        'sp_create_contrato',
        'sp_update_contrato',
        'sp_list_contrato',
        'sp_terminate_contrato',
        'sp_delete_contrato',
        -- Procedimientos en español (por si re-ejecutás el script)
        'sp_crear_contrato',
        'sp_actualizar_contrato',
        'sp_listar_contratos',
        'sp_finalizar_contrato',
        'sp_eliminar_contrato_descontinuado',
        -- Helpers en inglés
        'fn_contrato_status_normalizado',
        'fn_contrato_status_es_valido',
        'fn_contrato_transicion_permitida',
        -- Helpers en español
        'fn_normalizar_estado_contrato',
        'fn_es_estado_contrato_valido',
        'fn_transicion_estado_contrato_permitida'
      )
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.sig::text || ' CASCADE';
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- Paso 2: helpers — lógica de estados reutilizada por los sp_
-- -----------------------------------------------------------------------------
-- Devuelve el estado en mayúsculas y sin espacios sobrantes (comparaciones uniformes).
CREATE OR REPLACE FUNCTION fn_normalizar_estado_contrato(p_estado VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
  RETURN upper(trim(p_estado));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Indica si el texto es uno de los cinco estados permitidos en el modelo.
CREATE OR REPLACE FUNCTION fn_es_estado_contrato_valido(p_estado VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN fn_normalizar_estado_contrato(p_estado) IN (
    'DRAFT', 'ACTIVE', 'SUSPENDED', 'TERMINATED', 'CANCELLED'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Reglas de transición al cambiar estado por actualización (no aplica a «mismo estado»).
CREATE OR REPLACE FUNCTION fn_transicion_estado_contrato_permitida(p_desde VARCHAR, p_hacia VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  desde VARCHAR;
  hacia VARCHAR;
BEGIN
  desde := fn_normalizar_estado_contrato(p_desde);
  hacia := fn_normalizar_estado_contrato(p_hacia);

  IF desde = hacia THEN
    RETURN TRUE;
  END IF;

  IF desde IN ('TERMINATED', 'CANCELLED') THEN
    RETURN FALSE;
  END IF;

  IF NOT fn_es_estado_contrato_valido(hacia) THEN
    RETURN FALSE;
  END IF;

  IF desde = 'DRAFT' AND hacia IN ('ACTIVE', 'CANCELLED') THEN
    RETURN TRUE;
  END IF;

  IF desde = 'ACTIVE' AND hacia IN ('SUSPENDED', 'TERMINATED', 'CANCELLED') THEN
    RETURN TRUE;
  END IF;

  IF desde = 'SUSPENDED' AND hacia IN ('ACTIVE', 'TERMINATED', 'CANCELLED') THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- -----------------------------------------------------------------------------
-- sp_crear_contrato — alta de contrato (usuario + plan existentes)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_crear_contrato(
    p_id_usuario UUID,
    p_id_plan BIGINT,
    p_estado VARCHAR(50),
    p_fecha_inicio DATE DEFAULT NULL,
    p_fecha_fin DATE DEFAULT NULL
)
-- Nombres de columnas devueltos en inglés: coinciden con el JSON del microservicio (camelCase se arma en cliente si aplica).
RETURNS TABLE (
    id_contracts BIGINT,
    id_users UUID,
    id_plans BIGINT,
    status VARCHAR(50),
    start_date DATE,
    end_date DATE,
    updated_at TIMESTAMP
) AS $$
DECLARE
    v_inicio DATE;
    v_fin DATE;
    v_ciclo_facturacion VARCHAR(255);
    v_estado VARCHAR(50);
BEGIN
    IF p_id_usuario IS NULL OR p_id_plan IS NULL OR p_estado IS NULL THEN
        RAISE EXCEPTION 'Parámetros obligatorios: id_usuario, id_plan, estado';
    END IF;

    v_estado := fn_normalizar_estado_contrato(p_estado);
    IF NOT fn_es_estado_contrato_valido(v_estado) THEN
        RAISE EXCEPTION 'estado inválido: %. Valores permitidos al crear: DRAFT, ACTIVE', p_estado;
    END IF;
    IF v_estado NOT IN ('DRAFT', 'ACTIVE') THEN
        RAISE EXCEPTION 'Al crear solo se permiten DRAFT o ACTIVE (recibido: %)', v_estado;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Users" u WHERE u."id_users" = p_id_usuario) THEN
        RAISE EXCEPTION 'El usuario con id % no existe', p_id_usuario;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Plans" p WHERE p."id_plans" = p_id_plan) THEN
        RAISE EXCEPTION 'El plan con id % no existe', p_id_plan;
    END IF;

    v_inicio := COALESCE(p_fecha_inicio, CURRENT_DATE);

    IF p_fecha_fin IS NULL THEN
        SELECT p."billing_cycle" INTO v_ciclo_facturacion
        FROM "Plans" p
        WHERE p."id_plans" = p_id_plan;

        v_fin := CASE lower(COALESCE(v_ciclo_facturacion, ''))
            WHEN 'daily' THEN (v_inicio + INTERVAL '1 day')::date
            WHEN 'weekly' THEN (v_inicio + INTERVAL '1 week')::date
            WHEN 'biweekly' THEN (v_inicio + INTERVAL '2 weeks')::date
            WHEN 'monthly' THEN (v_inicio + INTERVAL '1 month')::date
            WHEN 'bimonthly' THEN (v_inicio + INTERVAL '2 months')::date
            WHEN 'quarterly' THEN (v_inicio + INTERVAL '3 months')::date
            WHEN 'semiannual' THEN (v_inicio + INTERVAL '6 months')::date
            WHEN 'yearly' THEN (v_inicio + INTERVAL '1 year')::date
            ELSE NULL
        END;

        IF v_fin IS NULL THEN
            RAISE EXCEPTION 'No se pudo calcular fecha_fin: billing_cycle inválido para el plan id %', p_id_plan;
        END IF;
    ELSE
        v_fin := p_fecha_fin;
    END IF;

    IF v_inicio >= v_fin THEN
        RAISE EXCEPTION 'La fecha de inicio debe ser anterior a la fecha de fin';
    END IF;

    RETURN QUERY
    INSERT INTO "Contracts" AS c ("id_users", "id_plans", "status", "start_date", "end_date")
    VALUES (p_id_usuario, p_id_plan, v_estado, v_inicio, v_fin)
    RETURNING
      c."id_contracts",
      c."id_users",
      c."id_plans",
      c."status",
      c."start_date",
      c."end_date",
      c."updated_at";

    RETURN;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- sp_actualizar_contrato — cambios parciales (usuario, plan, fechas, estado)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_actualizar_contrato(
    p_id_contrato BIGINT,
    p_id_usuario UUID DEFAULT NULL,
    p_id_plan BIGINT DEFAULT NULL,
    p_estado VARCHAR(50) DEFAULT NULL,
    p_fecha_inicio DATE DEFAULT NULL,
    p_fecha_fin DATE DEFAULT NULL
)
RETURNS TABLE (
    id_contracts BIGINT,
    id_users UUID,
    id_plans BIGINT,
    status VARCHAR(50),
    start_date DATE,
    end_date DATE,
    updated_at TIMESTAMP
) AS $$
DECLARE
    v_existe BOOLEAN;
    v_inicio_actual DATE;
    v_fin_actual DATE;
    v_nuevo_inicio DATE;
    v_nuevo_fin DATE;
    v_estado_actual VARCHAR(50);
BEGIN
    SELECT EXISTS(SELECT 1 FROM "Contracts" c WHERE c."id_contracts" = p_id_contrato) INTO v_existe;
    IF NOT v_existe THEN
        RAISE EXCEPTION 'El contrato con id % no existe', p_id_contrato;
    END IF;

    SELECT c."start_date", c."end_date", c."status"
    INTO v_inicio_actual, v_fin_actual, v_estado_actual
    FROM "Contracts" c
    WHERE c."id_contracts" = p_id_contrato;

    v_estado_actual := fn_normalizar_estado_contrato(v_estado_actual);

    IF p_estado IS NOT NULL THEN
        IF NOT fn_es_estado_contrato_valido(fn_normalizar_estado_contrato(p_estado)) THEN
            RAISE EXCEPTION 'estado inválido: %', p_estado;
        END IF;
        IF NOT fn_transicion_estado_contrato_permitida(
            v_estado_actual,
            fn_normalizar_estado_contrato(p_estado)
        ) THEN
            RAISE EXCEPTION 'Transición de estado no permitida: % -> %',
              v_estado_actual, fn_normalizar_estado_contrato(p_estado);
        END IF;
    END IF;

    v_nuevo_inicio := COALESCE(p_fecha_inicio, v_inicio_actual);
    v_nuevo_fin := COALESCE(p_fecha_fin, v_fin_actual);

    IF v_nuevo_inicio >= v_nuevo_fin THEN
        RAISE EXCEPTION 'La fecha de inicio debe ser anterior a la fecha de fin';
    END IF;

    IF p_id_usuario IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "Users" u WHERE u."id_users" = p_id_usuario) THEN
        RAISE EXCEPTION 'El usuario con id % no existe', p_id_usuario;
    END IF;

    IF p_id_plan IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "Plans" p WHERE p."id_plans" = p_id_plan) THEN
        RAISE EXCEPTION 'El plan con id % no existe', p_id_plan;
    END IF;

    RETURN QUERY
    UPDATE "Contracts" c
    SET "id_users" = COALESCE(p_id_usuario, c."id_users"),
        "id_plans" = COALESCE(p_id_plan, c."id_plans"),
        "status" = CASE
            WHEN p_estado IS NULL THEN c."status"
            ELSE fn_normalizar_estado_contrato(p_estado)
        END,
        "start_date" = v_nuevo_inicio,
        "end_date" = v_nuevo_fin,
        "updated_at" = CURRENT_TIMESTAMP
    WHERE c."id_contracts" = p_id_contrato
    RETURNING
      c."id_contracts",
      c."id_users",
      c."id_plans",
      c."status",
      c."start_date",
      c."end_date",
      c."updated_at";

    RETURN;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- sp_listar_contratos — listado filtrado y paginado
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_listar_contratos(
    p_id_contrato BIGINT DEFAULT NULL,
    p_id_usuario UUID DEFAULT NULL,
    p_id_plan BIGINT DEFAULT NULL,
    p_estado VARCHAR(50) DEFAULT NULL,
    p_desde_inicio DATE DEFAULT NULL,
    p_hasta_inicio DATE DEFAULT NULL,
    p_desde_fin DATE DEFAULT NULL,
    p_hasta_fin DATE DEFAULT NULL,
    p_tam_pagina INTEGER DEFAULT 10,
    p_num_pagina INTEGER DEFAULT 1
)
RETURNS TABLE (
    id_contracts BIGINT,
    id_users UUID,
    id_plans BIGINT,
    status VARCHAR(50),
    start_date DATE,
    end_date DATE,
    updated_at TIMESTAMP,
    total_count BIGINT
) AS $$
DECLARE
    v_offset INTEGER;
    v_total BIGINT;
BEGIN
    v_offset := (p_num_pagina - 1) * p_tam_pagina;

    SELECT COUNT(*) INTO v_total
    FROM "Contracts" c
    WHERE (p_id_contrato IS NULL OR c."id_contracts" = p_id_contrato)
      AND (p_id_usuario IS NULL OR c."id_users" = p_id_usuario)
      AND (p_id_plan IS NULL OR c."id_plans" = p_id_plan)
      AND (p_estado IS NULL OR fn_normalizar_estado_contrato(c."status") = fn_normalizar_estado_contrato(p_estado))
      AND (p_desde_inicio IS NULL OR c."start_date" >= p_desde_inicio)
      AND (p_hasta_inicio IS NULL OR c."start_date" <= p_hasta_inicio)
      AND (p_desde_fin IS NULL OR c."end_date" >= p_desde_fin)
      AND (p_hasta_fin IS NULL OR c."end_date" <= p_hasta_fin);

    RETURN QUERY
    SELECT
      c."id_contracts",
      c."id_users",
      c."id_plans",
      c."status",
      c."start_date",
      c."end_date",
      c."updated_at",
      v_total AS total_count
    FROM "Contracts" c
    WHERE (p_id_contrato IS NULL OR c."id_contracts" = p_id_contrato)
      AND (p_id_usuario IS NULL OR c."id_users" = p_id_usuario)
      AND (p_id_plan IS NULL OR c."id_plans" = p_id_plan)
      AND (p_estado IS NULL OR fn_normalizar_estado_contrato(c."status") = fn_normalizar_estado_contrato(p_estado))
      AND (p_desde_inicio IS NULL OR c."start_date" >= p_desde_inicio)
      AND (p_hasta_inicio IS NULL OR c."start_date" <= p_hasta_inicio)
      AND (p_desde_fin IS NULL OR c."end_date" >= p_desde_fin)
      AND (p_hasta_fin IS NULL OR c."end_date" <= p_hasta_fin)
    ORDER BY c."id_contracts"
    LIMIT p_tam_pagina
    OFFSET v_offset;

    RETURN;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- sp_finalizar_contrato — TERMINATED sin borrar fila (ajusta fin si aplica)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_finalizar_contrato(
    p_id_contrato BIGINT
)
RETURNS TABLE (
    id_contracts BIGINT,
    id_users UUID,
    id_plans BIGINT,
    status VARCHAR(50),
    start_date DATE,
    end_date DATE,
    updated_at TIMESTAMP
) AS $$
DECLARE
    v_existe BOOLEAN;
    v_estado_actual VARCHAR(50);
    v_fin DATE;
    v_nuevo_fin DATE;
BEGIN
    SELECT EXISTS(SELECT 1 FROM "Contracts" c WHERE c."id_contracts" = p_id_contrato) INTO v_existe;
    IF NOT v_existe THEN
        RAISE EXCEPTION 'El contrato con id % no existe', p_id_contrato;
    END IF;

    SELECT c."status", c."end_date"
    INTO v_estado_actual, v_fin
    FROM "Contracts" c
    WHERE c."id_contracts" = p_id_contrato;

    v_estado_actual := fn_normalizar_estado_contrato(v_estado_actual);

    IF v_estado_actual IN ('TERMINATED', 'CANCELLED') THEN
        RAISE EXCEPTION 'El contrato ya está en estado final: %', v_estado_actual;
    END IF;

    IF v_estado_actual NOT IN ('DRAFT', 'ACTIVE', 'SUSPENDED') THEN
        RAISE EXCEPTION 'No se puede finalizar un contrato en estado %', v_estado_actual;
    END IF;

    IF v_fin > CURRENT_DATE THEN
        v_nuevo_fin := CURRENT_DATE;
    ELSE
        v_nuevo_fin := v_fin;
    END IF;

    RETURN QUERY
    UPDATE "Contracts" c
    SET "status" = 'TERMINATED',
        "end_date" = v_nuevo_fin,
        "updated_at" = CURRENT_TIMESTAMP
    WHERE c."id_contracts" = p_id_contrato
    RETURNING
      c."id_contracts",
      c."id_users",
      c."id_plans",
      c."status",
      c."start_date",
      c."end_date",
      c."updated_at";

    RETURN;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- sp_eliminar_contrato_descontinuado — no borra datos; evita uso por error
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_eliminar_contrato_descontinuado(
    p_id_contrato BIGINT
)
RETURNS TABLE (
    id_contracts BIGINT,
    id_users UUID,
    id_plans BIGINT,
    status VARCHAR(50),
    start_date DATE,
    end_date DATE,
    updated_at TIMESTAMP
) AS $$
BEGIN
    RAISE EXCEPTION 'sp_eliminar_contrato_descontinuado no se usa: emplee sp_finalizar_contrato para cerrar el contrato sin borrar el registro';
END;
$$ LANGUAGE plpgsql;
