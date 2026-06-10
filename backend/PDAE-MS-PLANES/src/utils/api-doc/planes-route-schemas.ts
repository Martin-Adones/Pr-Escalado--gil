/**
 * Esquemas JSON Schema por ruta (validacion Fastify + documentacion Swagger).
 */
import {
  respuestaErrorServidor,
  respuestaErrorValidacion,
  respuestaExitoPlan,
  respuestaExitoListaPlanes,
  respuestaExitoPlanProductos,
} from './openapi-schemas';

const CICLOS_FACTURACION = [
  'daily',
  'weekly',
  'biweekly',
  'monthly',
  'bimonthly',
  'quarterly',
  'semiannual',
  'yearly',
] as const;

const idPlan = {
  type: 'string' as const,
  pattern: '^[0-9]+$',
  description: 'ID del plan (Plans.id_plans, BIGSERIAL)',
};

const idProducto = {
  type: 'string' as const,
  pattern: '^[0-9]+$',
  description: 'ID del producto (Products.id_products, BIGSERIAL)',
};

export const esquemaPostCrearPlan = {
  operationId: 'crearPlan',
  summary: 'Crear plan',
  description: 'Registra un plan con nombre, ciclo de facturacion y monto.',
  tags: ['Planes'],
  body: {
    type: 'object',
    required: ['name', 'billing_cycle', 'amount'],
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 255,
        description: 'Nombre del plan',
      },
      billing_cycle: {
        type: 'string',
        enum: CICLOS_FACTURACION,
        description: 'Ciclo de facturacion del plan',
      },
      amount: {
        type: 'number',
        minimum: 0.01,
        description: 'Monto del plan (DECIMAL 12,2)',
      },
      isActive: {
        type: 'boolean',
        description: 'Indica si el plan inicia activo (por defecto true)',
      },
    },
  },
  response: {
    200: respuestaExitoPlan,
    400: respuestaErrorValidacion,
    500: respuestaErrorServidor,
  },
} as const;

export const esquemaGetListarPlanes = {
  operationId: 'listarPlanes',
  summary: 'Listar planes',
  description:
    'Listado con filtros opcionales y paginacion (`page_size`, `page_number`). Cada fila incluye total_count.',
  tags: ['Planes'],
  querystring: {
    type: 'object',
    properties: {
      id_plans: {
        type: 'string',
        pattern: '^[0-9]+$',
        description: 'Filtrar por ID de plan',
      },
      name: {
        type: 'string',
        maxLength: 255,
        description: 'Filtrar por nombre (ILIKE)',
      },
      billing_cycle: {
        type: 'string',
        enum: CICLOS_FACTURACION,
        description: 'Filtrar por ciclo de facturacion',
      },
      isActive: {
        type: 'boolean',
        description: 'Filtrar por planes activos/inactivos',
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
    200: respuestaExitoListaPlanes,
    400: respuestaErrorValidacion,
    500: respuestaErrorServidor,
  },
} as const;

export const esquemaPostActualizarPlan = {
  operationId: 'actualizarPlan',
  summary: 'Actualizar plan',
  description: 'Actualiza nombre, ciclo de facturacion y/o monto. Solo id_plans es obligatorio.',
  tags: ['Planes'],
  body: {
    type: 'object',
    required: ['id_plans'],
    properties: {
      id_plans: { ...idPlan, description: 'Plan a modificar' },
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 255,
        description: 'Nuevo nombre (opcional)',
      },
      billing_cycle: {
        type: 'string',
        enum: CICLOS_FACTURACION,
        description: 'Nuevo ciclo de facturacion (opcional)',
      },
      amount: {
        type: 'number',
        minimum: 0.01,
        description: 'Nuevo monto (opcional)',
      },
    },
  },
  response: {
    200: respuestaExitoPlan,
    400: respuestaErrorValidacion,
    500: respuestaErrorServidor,
  },
} as const;

export const esquemaPostDesactivarPlan = {
  operationId: 'desactivarPlan',
  summary: 'Desactivar plan',
  description: 'Marca el plan como inactivo sin borrar el registro.',
  tags: ['Planes'],
  body: {
    type: 'object',
    required: ['id_plans'],
    properties: {
      id_plans: idPlan,
    },
  },
  response: {
    200: respuestaExitoPlan,
    400: respuestaErrorValidacion,
    500: respuestaErrorServidor,
  },
} as const;

export const esquemaPostRegistrarProductosPlan = {
  operationId: 'registrarProductosPlan',
  summary: 'Registrar productos en plan',
  description: 'Asocia uno o mas productos a un plan existente.',
  tags: ['Planes'],
  body: {
    type: 'object',
    required: ['id_plans', 'id_products'],
    properties: {
      id_plans: idPlan,
      id_products: {
        type: 'array',
        minItems: 1,
        items: idProducto,
        description: 'Lista de IDs de productos a asociar',
      },
    },
  },
  response: {
    200: respuestaExitoPlanProductos,
    400: respuestaErrorValidacion,
    500: respuestaErrorServidor,
  },
} as const;
