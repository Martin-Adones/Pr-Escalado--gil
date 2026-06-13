/**
 * Esquemas JSON Schema por ruta (validación Fastify + documentación Swagger).
 */
import {
  respuestaErrorServidor,
  respuestaErrorValidacion,
  respuestaExitoSoporte,
  respuestaExitoListaSoporte,
} from './openapi-schemas';

const idSupport = {
  type: 'string' as const,
  pattern: '^[0-9]+$',
  description: 'ID del ticket de soporte (Support.id_support, BIGSERIAL)',
};

const idContract = {
  type: 'string' as const,
  pattern: '^[0-9]+$',
  description: 'ID del contrato (Contracts.id_contracts, BIGINT)',
};

const idUser = {
  type: 'string' as const,
  pattern: '^[0-9]+$',
  description: 'ID del usuario (Users.id_users, BIGINT)',
};

const SOPORTE_ESTADOS = ['open', 'in_progress', 'resolved', 'closed'] as const;

const ticketObjetoSchema = {
  type: 'object' as const,
  required: ['id_contracts', 'description'],
  properties: {
    id_contracts: idContract,
    description: {
      type: 'string',
      minLength: 1,
      description: 'Descripción detallada de la solicitud de soporte',
    },
    status: {
      type: 'string',
      enum: SOPORTE_ESTADOS,
      description: 'Estado inicial del ticket (por defecto "open")',
    },
  },
};

export const esquemaPostCrearTicket = {
  operationId: 'crearTicket',
  summary: 'Crear ticket de soporte',
  description: 'Registra un ticket de soporte asociado a un contrato activo. Soporta objeto individual, array o un objeto con campo "tickets".',
  tags: ['Soporte'],
  body: {
    anyOf: [
      ticketObjetoSchema,
      {
        type: 'array',
        items: ticketObjetoSchema,
      },
      {
        type: 'object',
        required: ['tickets'],
        properties: {
          tickets: {
            type: 'array',
            items: ticketObjetoSchema,
          },
        },
      },
    ],
  },
  response: {
    200: respuestaExitoSoporte,
    400: respuestaErrorValidacion,
    500: respuestaErrorServidor,
  },
} as const;

export const esquemaGetListarTickets = {
  operationId: 'listarTickets',
  summary: 'Listar tickets de soporte',
  description:
    'Listado de tickets con filtros opcionales (id_support, id_contracts, id_users, status) y paginación.',
  tags: ['Soporte'],
  querystring: {
    type: 'object',
    properties: {
      id_support: {
        ...idSupport,
        description: 'Filtrar por ID de ticket de soporte',
      },
      id_contracts: {
        ...idContract,
        description: 'Filtrar por ID de contrato',
      },
      id_users: {
        ...idUser,
        description: 'Filtrar por ID de usuario dueño del contrato',
      },
      status: {
        type: 'string',
        enum: SOPORTE_ESTADOS,
        description: 'Filtrar por estado del ticket',
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
    200: respuestaExitoListaSoporte,
    400: respuestaErrorValidacion,
    500: respuestaErrorServidor,
  },
} as const;

export const esquemaPostActualizarTicket = {
  operationId: 'actualizarTicket',
  summary: 'Actualizar ticket de soporte',
  description: 'Actualiza el contrato asociado, descripción y/o estado de un ticket. Solo id_support es requerido.',
  tags: ['Soporte'],
  body: {
    type: 'object',
    required: ['id_support'],
    properties: {
      id_support: idSupport,
      id_contracts: {
        ...idContract,
        description: 'Nuevo ID del contrato asociado (opcional)',
      },
      description: {
        type: 'string',
        minLength: 1,
        description: 'Nueva descripción detallada (opcional)',
      },
      status: {
        type: 'string',
        enum: SOPORTE_ESTADOS,
        description: 'Nuevo estado del ticket (opcional)',
      },
    },
  },
  response: {
    200: respuestaExitoSoporte,
    400: respuestaErrorValidacion,
    500: respuestaErrorServidor,
  },
} as const;
