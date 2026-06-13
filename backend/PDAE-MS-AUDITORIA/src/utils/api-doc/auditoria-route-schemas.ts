import {
  respuestaErrorServidor,
  respuestaErrorValidacion,
  respuestaExitoListaLogsAuditoria,
} from './openapi-schemas';

export const esquemaGetListarLogsAuditoria = {
  operationId: 'listarLogsAuditoria',
  summary: 'Listar logs de auditoría',
  description:
    'Filtros opcionales: id_audit_logs, id_contracts, action, assigned_to, rango de fechas created_at. Paginación: page_size, page_number.',
  tags: ['Auditoría'],
  querystring: {
    type: 'object',
    properties: {
      id_audit_logs: {
        type: 'string',
        pattern: '^[0-9]+$',
        description: 'Filtrar por ID exacto del log',
      },
      id_contracts: {
        type: 'string',
        pattern: '^[0-9]+$',
        description: 'Filtrar por ID del contrato',
      },
      action: {
        type: 'string',
        description: 'Texto contenido en action (búsqueda parcial)',
      },
      assigned_to: {
        type: 'string',
        description: 'Texto contenido en assigned_to (búsqueda parcial)',
      },
      created_at_from: {
        type: 'string',
        format: 'date-time',
        description: 'Fecha inicial (ISO-8601) para filtrar por created_at',
      },
      created_at_to: {
        type: 'string',
        format: 'date-time',
        description: 'Fecha final (ISO-8601) para filtrar por created_at',
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
    200: respuestaExitoListaLogsAuditoria,
    400: respuestaErrorValidacion,
    500: respuestaErrorServidor,
  },
} as const;
