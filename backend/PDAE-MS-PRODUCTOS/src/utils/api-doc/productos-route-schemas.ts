/**
 * Esquemas JSON Schema por ruta (validacion Fastify + documentacion Swagger).
 */
import {
  respuestaErrorServidor,
  respuestaErrorValidacion,
  respuestaExitoProducto,
  respuestaExitoListaProductos,
} from './openapi-schemas';

const idProducto = {
  type: 'string' as const,
  pattern: '^[0-9]+$',
  description: 'ID del producto (Products.id_products, BIGSERIAL)',
};

export const esquemaPostCrearProducto = {
  operationId: 'crearProducto',
  summary: 'Crear producto',
  description: 'Registra un producto con nombre, tipo, precio y datos opcionales.',
  tags: ['Productos'],
  body: {
    type: 'object',
    required: ['name', 'type', 'price'],
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 255,
        description: 'Nombre del producto',
      },
      description: {
        type: 'string',
        description: 'Descripcion del producto (opcional)',
      },
      type: {
        type: 'string',
        minLength: 1,
        maxLength: 255,
        description: 'Tipo del producto',
      },
      quantity: {
        type: 'integer',
        minimum: 0,
        description: 'Cantidad disponible (opcional)',
      },
      price: {
        type: 'number',
        minimum: 0.01,
        description: 'Precio del producto (DECIMAL 12,2)',
      },
      isActive: {
        type: 'boolean',
        description: 'Indica si el producto inicia activo (por defecto true)',
      },
    },
  },
  response: {
    200: respuestaExitoProducto,
    400: respuestaErrorValidacion,
    500: respuestaErrorServidor,
  },
} as const;

export const esquemaGetListarProductos = {
  operationId: 'listarProductos',
  summary: 'Listar productos',
  description:
    'Listado con filtros opcionales y paginacion (`page_size`, `page_number`). Cada fila incluye total_count.',
  tags: ['Productos'],
  querystring: {
    type: 'object',
    properties: {
      id_products: {
        type: 'string',
        pattern: '^[0-9]+$',
        description: 'Filtrar por ID de producto',
      },
      name: {
        type: 'string',
        maxLength: 255,
        description: 'Filtrar por nombre (ILIKE)',
      },
      type: {
        type: 'string',
        maxLength: 255,
        description: 'Filtrar por tipo (ILIKE)',
      },
      isActive: {
        type: 'boolean',
        description: 'Filtrar por productos activos/inactivos',
      },
      page_size: {
        type: 'integer',
        minimum: 1,
        default: 10,
        description: 'Tamano de pagina',
      },
      page_number: {
        type: 'integer',
        minimum: 1,
        default: 1,
        description: 'Numero de pagina (base 1)',
      },
    },
  },
  response: {
    200: respuestaExitoListaProductos,
    400: respuestaErrorValidacion,
    500: respuestaErrorServidor,
  },
} as const;

export const esquemaPostActualizarProducto = {
  operationId: 'actualizarProducto',
  summary: 'Actualizar producto',
  description: 'Actualiza nombre, descripcion, tipo, cantidad y/o precio. Solo id_products es obligatorio.',
  tags: ['Productos'],
  body: {
    type: 'object',
    required: ['id_products'],
    properties: {
      id_products: { ...idProducto, description: 'Producto a modificar' },
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 255,
        description: 'Nuevo nombre (opcional)',
      },
      description: {
        type: 'string',
        description: 'Nueva descripcion (opcional)',
      },
      type: {
        type: 'string',
        minLength: 1,
        maxLength: 255,
        description: 'Nuevo tipo (opcional)',
      },
      quantity: {
        type: 'integer',
        minimum: 0,
        description: 'Nueva cantidad (opcional)',
      },
      price: {
        type: 'number',
        minimum: 0.01,
        description: 'Nuevo precio (opcional)',
      },
    },
  },
  response: {
    200: respuestaExitoProducto,
    400: respuestaErrorValidacion,
    500: respuestaErrorServidor,
  },
} as const;

export const esquemaPostDesactivarProducto = {
  operationId: 'desactivarProducto',
  summary: 'Desactivar producto',
  description: 'Marca el producto como inactivo sin borrar el registro.',
  tags: ['Productos'],
  body: {
    type: 'object',
    required: ['id_products'],
    properties: {
      id_products: idProducto,
    },
  },
  response: {
    200: respuestaExitoProducto,
    400: respuestaErrorValidacion,
    500: respuestaErrorServidor,
  },
} as const;
