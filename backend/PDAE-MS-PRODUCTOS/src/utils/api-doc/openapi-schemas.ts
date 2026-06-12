export { respuestaErrorValidacion, respuestaErrorServidor } from 'shared';

const idBigint = {
  type: 'string' as const,
  pattern: '^[0-9]+$',
  description: 'Identificador numerico (BIGINT / BIGSERIAL en PostgreSQL). En JSON va como cadena, ej. "1".',
};

export const productoFilaProperties = {
  id_products: { ...idBigint, description: 'Identificador del producto (BIGSERIAL).' },
  name: {
    type: 'string',
    description: 'Nombre del producto (VARCHAR 255).',
  },
  description: {
    type: 'string',
    description: 'Descripcion del producto (TEXT).',
  },
  type: {
    type: 'string',
    description: 'Tipo del producto (VARCHAR 255).',
  },
  quantity: {
    type: 'integer',
    description: 'Cantidad disponible (INTEGER).',
  },
  price: {
    type: 'string',
    description: 'Precio DECIMAL(12,2). En JSON suele llegar como string.',
  },
  isActive: {
    type: 'boolean',
    description: 'Indica si el producto esta activo.',
  },
} as const;

export const productoFilaListadoProperties = {
  ...productoFilaProperties,
  total_count: {
    type: 'integer',
    description: 'Total de filas que coinciden con el filtro (misma en cada fila de la pagina)',
  },
} as const;

export const respuestaExitoListaProductos = {
  description: 'Lista paginada de productos',
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'array',
      items: {
        type: 'object',
        properties: productoFilaListadoProperties,
      },
    },
  },
} as const;

export const respuestaExitoProducto = {
  description: 'Una fila por llamada al procedimiento (normalmente un solo elemento)',
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'array',
      items: {
        type: 'object',
        properties: productoFilaProperties,
      },
    },
  },
} as const;
