export {
  respuestaErrorValidacion,
  respuestaErrorServidor,
} from 'shared';

const idBigint = {
  type: 'string' as const,
  pattern: '^[0-9]+$',
  description: 'Identificador numérico (BIGINT / BIGSERIAL en PostgreSQL). En JSON va como cadena, ej. "1".',
};

export const soporteFilaProperties = {
  id_support: { ...idBigint, description: 'Identificador del ticket de soporte (BIGSERIAL).' },
  id_contracts: { ...idBigint, description: 'Identificador del contrato asociado (BIGINT).' },
  id_users: { type: 'string' as const, format: 'uuid', description: 'Identificador del usuario dueño del contrato (UUID).' },
  description: {
    type: 'string',
    description: 'Descripción detallada del ticket.',
  },
  status: {
    type: 'string',
    description: 'Estado del ticket: open, in_progress, resolved, closed.',
  },
  created_at: {
    type: 'string',
    format: 'date-time',
    description: 'Fecha de creación.',
  },
  updated_at: {
    type: 'string',
    format: 'date-time',
    description: 'Fecha de última actualización.',
  },
} as const;

export const soporteFilaListadoProperties = {
  ...soporteFilaProperties,
  total_count: {
    type: 'integer',
    description: 'Total de filas que coinciden con el filtro (misma en cada fila de la página)',
  },
} as const;

export const respuestaExitoListaSoporte = {
  description: 'Lista paginada de tickets de soporte',
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'array',
      items: {
        type: 'object',
        properties: soporteFilaListadoProperties,
      },
    },
  },
} as const;

export const respuestaExitoSoporte = {
  description: 'Una fila por llamada al procedimiento (normalmente un solo elemento)',
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'array',
      items: {
        type: 'object',
        properties: soporteFilaProperties,
      },
    },
  },
} as const;
