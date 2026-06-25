-- =============================================================================
-- INICIO ARCHIVO: init.sql
-- =============================================================================

-- Reinicia el esquema (borra datos). Ejecutar antes de CREATE si ya existían las tablas.
DROP TABLE IF EXISTS "Plans_Products" CASCADE;
DROP TABLE IF EXISTS "Contracts_Products" CASCADE;
DROP TABLE IF EXISTS "Support" CASCADE;
DROP TABLE IF EXISTS "audit_logs" CASCADE;
DROP TABLE IF EXISTS "UserCards" CASCADE;
DROP TABLE IF EXISTS "Payments" CASCADE;
DROP TABLE IF EXISTS "billing_cycles" CASCADE;
DROP TABLE IF EXISTS "Discount" CASCADE;
DROP TABLE IF EXISTS "Contracts" CASCADE;
DROP TABLE IF EXISTS "Users" CASCADE;
DROP TABLE IF EXISTS "Plans" CASCADE;
DROP TABLE IF EXISTS "Products" CASCADE;

-- Claves primarias/foráneas: BIGINT autoincremental (BIGSERIAL).

-- 1. Tablas Base (Sin dependencias de llaves foráneas)
CREATE TABLE "Users" (
    "id_users" BIGSERIAL PRIMARY KEY,   
    "type" VARCHAR(255) NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "keycloak_id" UUID UNIQUE NOT NULL
);

CREATE TABLE "Plans" (
    "id_plans" BIGSERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "billing_cycle" VARCHAR(255) NOT NULL,
    "amount" DECIMAL(12, 2) NOT NULL,
    "isActive" BOOLEAN NOT NULL
);

CREATE TABLE "Products" (
    "id_products" BIGSERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(255) NOT NULL,
    "quantity" INTEGER,
    "price" DECIMAL(12, 2) NOT NULL,
    "isActive" BOOLEAN NOT NULL
);

-- 2. Tablas con Relaciones Directas
CREATE TABLE "Contracts" (
    "id_contracts" BIGSERIAL PRIMARY KEY,
    "id_users" BIGINT NOT NULL REFERENCES "Users"("id_users") ON DELETE CASCADE,
    "id_plans" BIGINT NOT NULL REFERENCES "Plans"("id_plans"),
    "status" VARCHAR(50) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Discount" (
    "id_discount" BIGSERIAL PRIMARY KEY,
    "id_products" BIGINT NOT NULL REFERENCES "Products"("id_products") ON DELETE CASCADE,
    "quantity" INTEGER,
    "discount" DECIMAL(12, 2) NOT NULL
);

-- 3. Tablas de Gestión y Logs (Dependientes de Contracts)
CREATE TABLE "billing_cycles" (
    "id_billing_cycles" BIGSERIAL PRIMARY KEY,
    "id_contracts" BIGINT NOT NULL REFERENCES "Contracts"("id_contracts") ON DELETE CASCADE,
    "amount" DECIMAL(12, 2) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "retry_attempts" INTEGER DEFAULT 0 NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "UserCards" (
    "id_user_cards" BIGSERIAL PRIMARY KEY,
    "id_users" BIGINT NOT NULL REFERENCES "Users"("id_users") ON DELETE CASCADE,
    "payment_method_token" VARCHAR(255) NOT NULL,
    "card_brand" VARCHAR(50) NOT NULL,
    "card_last4" VARCHAR(4) NOT NULL,
    "holder_name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Payments" (
    "id_payments" BIGSERIAL PRIMARY KEY,
    "id_users" BIGINT NOT NULL REFERENCES "Users"("id_users") ON DELETE CASCADE,
    "id_billing_cycles" BIGINT REFERENCES "billing_cycles"("id_billing_cycles") ON DELETE SET NULL,
    "amount" DECIMAL(12, 2) NOT NULL,
    "concept" VARCHAR(255) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
    "external_tx_id" VARCHAR(255),
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "audit_logs" (
    "id_audit_logs" BIGSERIAL PRIMARY KEY,
    "id_contracts" BIGINT REFERENCES "Contracts"("id_contracts") ON DELETE SET NULL,
    "action" VARCHAR(255) NOT NULL,
    "assigned_to" VARCHAR(255),
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Support" (
    "id_support" BIGSERIAL PRIMARY KEY,
    "id_contracts" BIGINT NOT NULL REFERENCES "Contracts"("id_contracts") ON DELETE CASCADE,
    "description" TEXT NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tablas de Unión (Relaciones Muchos a Muchos)
CREATE TABLE "Contracts_Products" (
    "id_contracts" BIGINT NOT NULL REFERENCES "Contracts"("id_contracts") ON DELETE CASCADE,
    "id_products" BIGINT NOT NULL REFERENCES "Products"("id_products") ON DELETE CASCADE,
    "quantity" INTEGER,
    PRIMARY KEY ("id_contracts", "id_products")
);

CREATE TABLE "Plans_Products" (
    "id_plans" BIGINT NOT NULL REFERENCES "Plans"("id_plans") ON DELETE CASCADE,
    "id_products" BIGINT NOT NULL REFERENCES "Products"("id_products") ON DELETE CASCADE,
    PRIMARY KEY ("id_plans", "id_products")
);

-- 5. Funciones y Triggers

-- =============================================================================
-- INICIO ARCHIVO: contratos/contratos_funciones.sql
-- =============================================================================

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
    p_id_usuario BIGINT,
    p_id_plan BIGINT,
    p_estado VARCHAR(50),
    p_fecha_inicio DATE DEFAULT NULL,
    p_fecha_fin DATE DEFAULT NULL
)
-- Nombres de columnas devueltos en inglés: coinciden con el JSON del microservicio (camelCase se arma en cliente si aplica).
RETURNS TABLE (
    id_contracts BIGINT,
    id_users BIGINT,
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
    p_id_usuario BIGINT DEFAULT NULL,
    p_id_plan BIGINT DEFAULT NULL,
    p_estado VARCHAR(50) DEFAULT NULL,
    p_fecha_inicio DATE DEFAULT NULL,
    p_fecha_fin DATE DEFAULT NULL
)
RETURNS TABLE (
    id_contracts BIGINT,
    id_users BIGINT,
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
    p_id_usuario BIGINT DEFAULT NULL,
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
    id_users BIGINT,
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
    id_users BIGINT,
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
    id_users BIGINT,
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


-- =============================================================================
-- INICIO ARCHIVO: planes/planes_funciones.sql
-- =============================================================================

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


-- =============================================================================
-- INICIO ARCHIVO: productos/productos_funciones.sql
-- =============================================================================

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


-- =============================================================================
-- INICIO ARCHIVO: auditoria/auditoria_funciones.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION sp_listar_logs_auditoria(
  p_id_audit_logs TEXT DEFAULT NULL,
  p_id_contracts TEXT DEFAULT NULL,
  p_action TEXT DEFAULT NULL,
  p_assigned_to TEXT DEFAULT NULL,
  p_created_at_from TEXT DEFAULT NULL,
  p_created_at_to TEXT DEFAULT NULL,
  p_page_size INT DEFAULT 10,
  p_page_number INT DEFAULT 1
)
RETURNS TABLE(
  id_audit_logs BIGINT,
  id_contracts BIGINT,
  action VARCHAR,
  assigned_to VARCHAR,
  created_at TIMESTAMP,
  total_count BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_offset INT;
BEGIN
  v_offset := (p_page_number - 1) * p_page_size;

  RETURN QUERY
  WITH filtrados AS (
    SELECT a.id_audit_logs, a.id_contracts, a.action, a.assigned_to, a.created_at
    FROM audit_logs a
    WHERE (p_id_audit_logs IS NULL OR a.id_audit_logs = p_id_audit_logs::BIGINT)
      AND (p_id_contracts IS NULL OR a.id_contracts = p_id_contracts::BIGINT)
      AND (p_action IS NULL OR a.action ILIKE '%' || p_action || '%')
      AND (p_assigned_to IS NULL OR a.assigned_to ILIKE '%' || p_assigned_to || '%')
      AND (p_created_at_from IS NULL OR a.created_at >= p_created_at_from::TIMESTAMP)
      AND (p_created_at_to IS NULL OR a.created_at <= p_created_at_to::TIMESTAMP)
  )
  SELECT
    f.id_audit_logs,
    f.id_contracts,
    f.action,
    f.assigned_to,
    f.created_at,
    COUNT(*) OVER() AS total_count
  FROM filtrados f
  ORDER BY f.created_at DESC
  LIMIT p_page_size
  OFFSET v_offset;
END;
$$;


-- =============================================================================
-- INICIO ARCHIVO: usuarios/usuarios_funciones.sql
-- =============================================================================

-- =============================================================================
-- USUARIOS — Script único para funciones del dominio (tabla "Users" en init.sql)
-- =============================================================================
-- Columnas: id_users (BIGSERIAL), type (VARCHAR 255, rol o categoria del usuario), isActive (BOOLEAN).
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
        'sp_buscar_usuario_por_keycloak_id',
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
CREATE OR REPLACE FUNCTION sp_crear_usuario(p_tipo VARCHAR, p_is_active BOOLEAN DEFAULT TRUE)
RETURNS TABLE (
  id_users BIGINT,
  type VARCHAR(255),
  "isActive" BOOLEAN
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
  INSERT INTO "Users" AS u ("type", "isActive")
  VALUES (v_tipo, COALESCE(p_is_active, TRUE))
  RETURNING u."id_users", u."type", u."isActive";

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
  p_num_pagina INTEGER DEFAULT 1,
  p_is_active BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
    id_users BIGINT,
  type VARCHAR(255),
  "isActive" BOOLEAN,
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
    AND (v_filtro IS NULL OR u."type" ILIKE '%' || v_filtro || '%')
    AND (p_is_active IS NULL OR u."isActive" = p_is_active);

  RETURN QUERY
  SELECT
    u."id_users",
    u."type",
    u."isActive",
    v_total AS total_count
  FROM "Users" u
  WHERE (p_id_usuario IS NULL OR u."id_users" = p_id_usuario)
    AND (v_filtro IS NULL OR u."type" ILIKE '%' || v_filtro || '%')
    AND (p_is_active IS NULL OR u."isActive" = p_is_active)
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
  p_tipo VARCHAR,
  p_is_active BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
    id_users BIGINT,
  type VARCHAR(255),
  "isActive" BOOLEAN
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
  SET "type" = v_tipo,
      "isActive" = COALESCE(p_is_active, u."isActive")
  WHERE u."id_users" = p_id_usuario
  RETURNING u."id_users", u."type", u."isActive";

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- sp_buscar_usuario_por_keycloak_id — resuelve id_users a partir del sub de Keycloak
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_buscar_usuario_por_keycloak_id(p_keycloak_id UUID)
RETURNS TABLE (
  id_users BIGINT,
  type VARCHAR(255),
  "isActive" BOOLEAN
) AS $$
BEGIN
  IF p_keycloak_id IS NULL THEN
    RAISE EXCEPTION 'keycloak_id es obligatorio';
  END IF;

  RETURN QUERY
  SELECT u."id_users", u."type", u."isActive"
  FROM "Users" u
  WHERE u."keycloak_id" = p_keycloak_id;

  RETURN;
END;
$$ LANGUAGE plpgsql;


-- =============================================================================
-- INICIO ARCHIVO: soporte/soporte_funciones.sql
-- =============================================================================

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
    id_users BIGINT,
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
    p_id_usuario BIGINT DEFAULT NULL,
    p_status VARCHAR DEFAULT NULL,
    p_tam_pagina INTEGER DEFAULT 10,
    p_num_pagina INTEGER DEFAULT 1
)
RETURNS TABLE (
    id_support BIGINT,
    id_contracts BIGINT,
    id_users BIGINT,
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
    id_users BIGINT,
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


-- =============================================================================
-- INICIO ARCHIVO: seed.sql
-- =============================================================================

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

-- 11. Payments (3)
INSERT INTO "Payments" ("id_users", "id_billing_cycles", "amount", "concept", "status", "external_tx_id") VALUES
  (1, 8, 9990, 'Cobro Ciclo de Facturación Contrato #5', 'PENDIENTE', NULL),
  (1, 1, 45990, 'Adquisición de Plan Pyme', 'APROBADO', 'mock_tx_12345'),
  (4, 6, 19990, 'Cobro Ciclo de Facturación Contrato #4', 'RECHAZADO', 'mock_tx_54321');

