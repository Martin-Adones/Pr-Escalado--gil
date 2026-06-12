export { respuestaErrorValidacion, respuestaErrorServidor } from 'shared';

const idBigint = {
  type: 'string' as const,
  pattern: '^[0-9]+$',
  description: 'Identificador numerico (BIGINT / BIGSERIAL en PostgreSQL). En JSON va como cadena, ej. "1".',
};

export const planFilaProperties = {
  id_plans: { ...idBigint, description: 'Identificador del plan (BIGSERIAL).' },
  name: {
    type: 'string',
    description: 'Nombre del plan (VARCHAR 255).',
  },
  billing_cycle: {
    type: 'string',
    description: 'Ciclo de facturacion almacenado en la base de datos.',
  },
  amount: {
    type: 'string',
    description: 'Monto DECIMAL(12,2). En JSON suele llegar como string.',
  },
  isActive: {
    type: 'boolean',
    description: 'Indica si el plan esta activo.',
  },
} as const;

export const planProductoProperties = {
  id_plans: { ...idBigint, description: 'Plan asociado; FK a Plans.id_plans.' },
  id_products: { ...idBigint, description: 'Producto asociado; FK a Products.id_products.' },
} as const;

export const planFilaListadoProperties = {
  ...planFilaProperties,
  total_count: {
    type: 'integer',
    description: 'Total de filas que coinciden con el filtro (misma en cada fila de la pagina)',
  },
} as const;

export const respuestaExitoListaPlanes = {
  description: 'Lista paginada de planes',
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'array',
      items: {
        type: 'object',
        properties: planFilaListadoProperties,
      },
    },
  },
} as const;

export const respuestaExitoPlan = {
  description: 'Una fila por llamada al procedimiento (normalmente un solo elemento)',
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'array',
      items: {
        type: 'object',
        properties: planFilaProperties,
      },
    },
  },
} as const;

export const respuestaExitoPlanProductos = {
  description: 'Filas insertadas en la relacion Planes_Products',
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'array',
      items: {
        type: 'object',
        properties: planProductoProperties,
      },
    },
  },
} as const;
