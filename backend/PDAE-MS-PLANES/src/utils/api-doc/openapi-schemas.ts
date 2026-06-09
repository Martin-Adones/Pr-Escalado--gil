/**
 * Fragmentos de JSON Schema reutilizables para OpenAPI y validacion en Fastify.
 * Nota: no usar la keyword `example` aqui; AJV en modo estricto de Fastify la rechaza.
 * IDs numericos como string (BIGINT/BIGSERIAL en BD; `pg` suele devolverlos como string).
 */

const idBigint = {
  type: 'string' as const,
  pattern: '^[0-9]+$',
  description: 'Identificador numerico (BIGINT / BIGSERIAL en PostgreSQL). En JSON va como cadena, ej. "1".',
};

/** Propiedades de una fila de plan devuelta por los SP */
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

export const respuestaErrorValidacion = {
  description: 'Cuerpo enviado invalido o reglas de class-validator',
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    message: { type: 'string' },
  },
} as const;

export const respuestaErrorServidor = {
  description: 'Error no controlado o fallo al ejecutar el procedimiento en base de datos',
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    message: { type: 'string' },
  },
} as const;
