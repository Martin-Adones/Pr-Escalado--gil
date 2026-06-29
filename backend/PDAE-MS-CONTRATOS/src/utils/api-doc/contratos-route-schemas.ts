/**
 * Esquemas JSON Schema por ruta (validación Fastify + documentación Swagger).
 * Mantenerlos aquí deja `contratos.routes.ts` enfocado solo en el registro HTTP.
 */
import {
  DESCRIPCION_ESTADOS,
  respuestaErrorServidor,
  respuestaErrorValidacion,
  respuestaExitoContrato,
  respuestaExitoListaContratos,
} from './openapi-schemas';

const idUsuario = {
  type: 'string' as const,
  format: 'uuid',
  description: 'ID del usuario (Users.id_users, UUID)',
};

const idPlan = {
  type: 'string' as const,
  pattern: '^[0-9]+$',
  description: 'ID del plan (Plans.id_plans, BIGSERIAL)',
};

const idContrato = {
  type: 'string' as const,
  pattern: '^[0-9]+$',
  description: 'ID del contrato (Contracts.id_contracts, BIGSERIAL)',
};

export const esquemaPostCrearContrato = {
  operationId: 'crearContrato',
  summary: 'Crear contrato',
  description: [
    'Registra un contrato entre un usuario y un plan ya existentes en base de datos.',
    'Si no envías `start_date`, usa la fecha actual. Si no envías `end_date`, la calcula según el `billing_cycle` del plan.',
    '',
    DESCRIPCION_ESTADOS,
  ].join('\n'),
  tags: ['Contratos'],
  body: {
    type: 'object',
    required: ['id_users', 'id_plans', 'status'],
    properties: {
      id_users: idUsuario,
      id_plans: idPlan,
      status: {
        type: 'string',
        enum: ['DRAFT', 'ACTIVE'],
        description: 'Solo valores iniciales permitidos al crear',
      },
      start_date: {
        type: 'string',
        format: 'date',
        description: 'Opcional. Inicio de vigencia (YYYY-MM-DD)',
      },
      end_date: {
        type: 'string',
        format: 'date',
        description: 'Opcional. Fin de vigencia; si no se envía se calcula con el plan',
      },
    },
  },
  response: {
    200: respuestaExitoContrato,
    400: respuestaErrorValidacion,
    500: respuestaErrorServidor,
  },
} as const;

export const esquemaPostFinalizarContrato = {
  operationId: 'finalizarContrato',
  summary: 'Finalizar contrato',
  description: [
    'Pone el contrato en estado **TERMINATED** sin borrar el registro.',
    'Si la fecha de fin era futura, la ajusta a la fecha actual.',
    'No aplica si el contrato ya está en TERMINATED o CANCELLED.',
  ].join('\n'),
  tags: ['Contratos'],
  body: {
    type: 'object',
    required: ['id_contracts'],
    properties: {
      id_contracts: idContrato,
    },
  },
  response: {
    200: respuestaExitoContrato,
    400: respuestaErrorValidacion,
    500: respuestaErrorServidor,
  },
} as const;

export const esquemaGetListarContratos = {
  operationId: 'listarContratos',
  summary: 'Listar contratos',
  description: [
    'Listado con filtros opcionales y paginación (`page_size`, `page_number`).',
    'Cada fila incluye `total_count`: total de registros que cumplen el filtro.',
    'El filtro `status` es coincidencia exacta (el servidor normaliza mayúsculas/minúsculas).',
  ].join('\n'),
  tags: ['Contratos'],
  querystring: {
    type: 'object',
    properties: {
      id_contracts: {
        type: 'string',
        pattern: '^[0-9]+$',
        description: 'Filtrar por ID de contrato',
      },
      id_users: {
        type: 'string',
        pattern: '^[0-9]+$',
        description: 'Filtrar por usuario',
      },
      id_plans: {
        type: 'string',
        pattern: '^[0-9]+$',
        description: 'Filtrar por plan',
      },
      status: {
        type: 'string',
        enum: ['DRAFT', 'ACTIVE', 'SUSPENDED', 'TERMINATED', 'CANCELLED'],
        description: 'Estado exacto',
      },
      start_date_from: {
        type: 'string',
        format: 'date',
        description: 'Inicio de vigencia desde (inclusive)',
      },
      start_date_to: {
        type: 'string',
        format: 'date',
        description: 'Inicio de vigencia hasta (inclusive)',
      },
      end_date_from: {
        type: 'string',
        format: 'date',
        description: 'Fin de vigencia desde (inclusive)',
      },
      end_date_to: {
        type: 'string',
        format: 'date',
        description: 'Fin de vigencia hasta (inclusive)',
      },
      page_size: {
        type: 'integer',
        minimum: 1,
        default: 10,
        description: 'Tamaño de página',
      },
      page_number: {
        type: 'integer',
        minimum: 1,
        default: 1,
        description: 'Número de página (base 1)',
      },
    },
  },
  response: {
    200: respuestaExitoListaContratos,
    400: respuestaErrorValidacion,
    500: respuestaErrorServidor,
  },
} as const;

export const esquemaPostActualizarContrato = {
  operationId: 'actualizarContrato',
  summary: 'Actualizar contrato',
  description: [
    'Actualiza usuario, plan, fechas y/o estado del contrato.',
    'Solo `id_contracts` es obligatorio; el resto son parches (lo omitido no cambia).',
    'Si envías `status`, la base valida que la transición sea permitida.',
    '',
    DESCRIPCION_ESTADOS,
  ].join('\n'),
  tags: ['Contratos'],
  body: {
    type: 'object',
    required: ['id_contracts'],
    properties: {
      id_contracts: { ...idContrato, description: 'Contrato a modificar' },
      id_users: { ...idUsuario, description: 'Nuevo titular (opcional)' },
      id_plans: { ...idPlan, description: 'Nuevo plan (opcional)' },
      status: {
        type: 'string',
        enum: ['DRAFT', 'ACTIVE', 'SUSPENDED', 'TERMINATED', 'CANCELLED'],
        description: 'Nuevo estado si la transición es válida',
      },
      start_date: {
        type: 'string',
        format: 'date',
        description: 'Nueva fecha de inicio (opcional)',
      },
      end_date: {
        type: 'string',
        format: 'date',
        description: 'Nueva fecha de fin (opcional)',
      },
    },
  },
  response: {
    200: respuestaExitoContrato,
    400: respuestaErrorValidacion,
    500: respuestaErrorServidor,
  },
} as const;
