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
