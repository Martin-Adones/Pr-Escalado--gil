-- Reinicia el esquema (borra datos). Ejecutar antes de CREATE si ya existían las tablas.
DROP TABLE IF EXISTS "Plans_Products" CASCADE;
DROP TABLE IF EXISTS "Contracts_Products" CASCADE;
DROP TABLE IF EXISTS "Support" CASCADE;
DROP TABLE IF EXISTS "audit_logs" CASCADE;
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
    "type" VARCHAR(255) NOT NULL
);

CREATE TABLE "Plans" (
    "id_plans" BIGSERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "billing_cycle" VARCHAR(255) NOT NULL,
    "amount" DECIMAL(12, 2) NOT NULL
);

CREATE TABLE "Products" (
    "id_products" BIGSERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(255) NOT NULL,
    "quantity" INTEGER,
    "price" DECIMAL(12, 2) NOT NULL
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

CREATE TABLE "audit_logs" (
    "id_audit_logs" BIGSERIAL PRIMARY KEY,
    "id_contracts" BIGINT REFERENCES "Contracts"("id_contracts") ON DELETE SET NULL,
    "action" VARCHAR(255) NOT NULL,
    "assignet_to" VARCHAR(255),
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
