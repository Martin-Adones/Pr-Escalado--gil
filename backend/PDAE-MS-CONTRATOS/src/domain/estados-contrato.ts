/**
 * Estados posibles del ciclo de vida de un contrato (alineados con PostgreSQL: fn_es_estado_contrato_valido).
 * Ver también database/contratos/contratos_funciones.sql
 */
export const CONTRATO_ESTADOS = [
  'DRAFT',
  'ACTIVE',
  'SUSPENDED',
  'TERMINATED',
  'CANCELLED',
] as const;

export type EstadoContrato = (typeof CONTRATO_ESTADOS)[number];

/** Solo estos valores se pueden enviar al crear un contrato nuevo */
export const CONTRATO_ESTADOS_INICIAL = ['DRAFT', 'ACTIVE'] as const;
