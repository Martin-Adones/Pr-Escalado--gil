export {
  respuestaErrorValidacion,
  respuestaErrorServidor,
} from 'shared';

export const DESCRIPCION_ESTADOS = `Estados posibles: **DRAFT** (borrador), **ACTIVE** (vigente), **SUSPENDED** (suspendido), **TERMINATED** (finalizado con la operación de finalizar), **CANCELLED** (cancelado). Al **crear** solo se permiten DRAFT o ACTIVE. Las transiciones al **actualizar** las valida PostgreSQL.`;

const idBigint = {
  type: 'string' as const,
  pattern: '^[0-9]+$',
  description: 'Identificador numérico (BIGINT / BIGSERIAL en PostgreSQL). En JSON va como cadena, ej. "1".',
};

export const contratoFilaProperties = {
  id_contracts: { ...idBigint, description: 'Identificador del contrato (BIGSERIAL).' },
  id_users: { type: 'string' as const, format: 'uuid', description: 'Usuario titular; FK a Users.id_users (UUID).' },
  id_plans: { ...idBigint, description: 'Plan asociado; FK a Plans.id_plans.' },
  status: {
    type: 'string',
    enum: ['DRAFT', 'ACTIVE', 'SUSPENDED', 'TERMINATED', 'CANCELLED'],
    description:
      'Estado actual. Detalle de significados y transiciones en la descripción de cada operación.',
  },
  start_date: {
    type: 'string',
    format: 'date',
    description: 'Inicio de vigencia (YYYY-MM-DD)',
  },
  end_date: {
    type: 'string',
    format: 'date',
    description: 'Fin de vigencia (YYYY-MM-DD)',
  },
  updated_at: {
    type: 'string',
    format: 'date-time',
    description: 'Última modificación',
  },
} as const;

export const contratoFilaListadoProperties = {
  ...contratoFilaProperties,
  total_count: {
    type: 'integer',
    description: 'Total de filas que coinciden con el filtro (misma en cada fila de la página)',
  },
} as const;

export const respuestaExitoListaContratos = {
  description: 'Lista paginada de contratos',
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'array',
      items: {
        type: 'object',
        properties: contratoFilaListadoProperties,
      },
    },
  },
} as const;

export const respuestaExitoContrato = {
  description: 'Una fila por llamada al procedimiento (normalmente un solo elemento)',
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'array',
      items: {
        type: 'object',
        properties: contratoFilaProperties,
      },
    },
  },
} as const;
