-- Ejemplo de cómo simular un "Package" usando Schemas en PostgreSQL
-- El Schema actúa como el Package y las funciones como sus procedimientos.

CREATE SCHEMA IF NOT EXISTS pkg_PDAE-MS-CONTRATOS-1;

-- Ejemplo de procedimiento almacenado (función que retorna tabla/registros)
CREATE OR REPLACE FUNCTION pkg_PDAE-MS-CONTRATOS-1.get_service_status(p_service_name TEXT)
RETURNS TABLE(status TEXT, check_time TIMESTAMP) AS $$
BEGIN
    RETURN QUERY 
    SELECT 'ACTIVE'::TEXT, NOW()::TIMESTAMP;
END;
$$ LANGUAGE plpgsql;
